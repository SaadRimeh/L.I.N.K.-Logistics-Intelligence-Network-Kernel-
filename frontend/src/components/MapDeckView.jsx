import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Plane, Compass, ShieldAlert, Radio, Eye, EyeOff, Layers, AlertTriangle, X, Check } from 'lucide-react';

// Read Mapbox access token securely from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Official Mapbox Dark Vector Style with 3D terrain & global infrastructure
const MAPBOX_DARK_STYLE = 'mapbox://styles/mapbox/dark-v11';

// Quadratic Bezier Arc coordinates generator for 3D curved corridors
function generateCurvedArc(lon1, lat1, lon2, lat2, numPoints = 40, curvature = 0.22) {
  const points = [];
  const midLon = (lon1 + lon2) / 2.0;
  const midLat = (lat1 + lat2) / 2.0;

  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  const offsetLon = -dLat * curvature;
  const offsetLat = dLon * curvature;

  const ctrlLon = midLon + offsetLon;
  const ctrlLat = midLat + offsetLat;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * ctrlLon + t * t * lon2;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2;
    points.push([lon, lat]);
  }
  return points;
}

// Helper to generate circular GeoJSON polygon for blast radius
function generateCirclePolygon(centerLon, centerLat, radiusKm, numPoints = 48) {
  const coords = [];
  const earthRadius = 6371.0;
  const angularDist = radiusKm / earthRadius;
  const latRad = (centerLat * Math.PI) / 180.0;
  const lonRad = (centerLon * Math.PI) / 180.0;

  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i * 2 * Math.PI) / numPoints;
    const ptLat = Math.asin(
      Math.sin(latRad) * Math.cos(angularDist) +
      Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearing)
    );
    const ptLon = lonRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDist) * Math.cos(latRad),
      Math.cos(angularDist) - Math.sin(latRad) * Math.sin(ptLat)
    );
    coords.push([(ptLon * 180.0) / Math.PI, (ptLat * 180.0) / Math.PI]);
  }
  return {
    type: 'Polygon',
    coordinates: [coords]
  };
}

export default function MapDeckView({
  nodes = [],
  edges = [],
  optimalRoute = null,
  activeDangerZones = [],
  emergencyDiversion = null,
  liveFlights = [],
  liveVessels = [],
  energyFacilities = [],
  struckFacility = null,
  domainFilter = 'ALL', // 'ALL' | 'MARITIME' | 'AIR' | 'DEFENSE' | 'LAND' | 'ENERGY'
  flightTypeFilter: propFlightTypeFilter,
  setFlightTypeFilter: propSetFlightTypeFilter,
  selectedTrackedPath = null, // { path: [[lon, lat], ...], inDanger: boolean, title: string, data: ... }
  selectedEntity = null, // currently selected entity
  onNodeClick,
  onFlightClick,
  onVesselClick,
  onEnergyFacilityClick,
  onRouteClick
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animFrameRef = useRef(null);
  const markersRef = useRef([]);

  // Interactive Map Layer Controls
  const [showFlightTracks, setShowFlightTracks] = useState(true);
  const [showRadarTrails, setShowRadarTrails] = useState(true);
  const [localFlightTypeFilter, setLocalFlightTypeFilter] = useState('ALL'); // 'ALL' | 'DANGER' | 'COMMERCIAL' | 'CARGO' | 'MILITARY'
  
  const flightTypeFilter = propFlightTypeFilter !== undefined ? propFlightTypeFilter : localFlightTypeFilter;
  const setFlightTypeFilter = propSetFlightTypeFilter || setLocalFlightTypeFilter;

  // Selected aircraft callsign from either selectedEntity or selectedTrackedPath
  const selectedFlightCallsign = useMemo(() => {
    if (selectedEntity?.type === 'FLIGHT' && selectedEntity.data?.callsign) {
      return selectedEntity.data.callsign;
    }
    if (selectedTrackedPath?.data?.callsign) {
      return selectedTrackedPath.data.callsign;
    }
    return null;
  }, [selectedEntity, selectedTrackedPath]);

  // Initialize Mapbox GL instance with resize triggers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_DARK_STYLE,
      center: [46.5, 26.5],
      zoom: 4.9,
      pitch: 40,
      bearing: -4,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      map.resize();
    });

    map.on('style.load', () => {
      map.resize();
    });

    map.on('error', (e) => {
      console.warn('Mapbox GL event:', e?.error?.message || e);
    });

    // Clicking on empty map background deselects plane and restores all flight routes
    map.on('click', () => {
      if (onFlightClick) onFlightClick(null);
    });

    const t1 = setTimeout(() => map.resize(), 100);
    const t2 = setTimeout(() => map.resize(), 400);
    const t3 = setTimeout(() => map.resize(), 1000);

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
    };
  }, []);

  // Filter flights based on category (commercial, cargo, defense/reconnaissance, danger)
  const filteredFlights = useMemo(() => {
    return liveFlights.filter(f => {
      // If DEFENSE operations domain is selected, strictly display military & reconnaissance aircraft
      if (domainFilter === 'DEFENSE') {
        return f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE';
      }
      if (flightTypeFilter === 'DANGER') return f.in_danger;
      if (flightTypeFilter === 'COMMERCIAL') return f.flight_type === 'COMMERCIAL' || (!f.flight_type && !f.in_danger);
      if (flightTypeFilter === 'CARGO') return f.flight_type === 'CARGO';
      if (flightTypeFilter === 'MILITARY') return f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE';
      return true;
    });
  }, [liveFlights, flightTypeFilter, domainFilter]);

  const dangerFlightsCount = useMemo(() => {
    return liveFlights.filter(f => f.in_danger).length;
  }, [liveFlights]);

  const militaryFlightsCount = useMemo(() => {
    return liveFlights.filter(f => f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE').length;
  }, [liveFlights]);

  // Update GeoJSON layers and live HTML markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous live markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // --- 1. Filter Network Edges by Domain Mode ---
    const optimalEdgeKeys = new Set(
      optimalRoute?.segments ? optimalRoute.segments.map(s => `${s.source_id}->${s.target_id}`) : []
    );

    const openRoutesFeatures = [];
    const closedRoutesFeatures = [];
    const optimalRouteFeatures = [];

    edges.forEach(e => {
      if (domainFilter === 'MARITIME' && e.mode !== 'MARITIME') return;
      if (domainFilter === 'AIR' && e.mode !== 'AIR') return;
      if (domainFilter === 'LAND' && e.mode !== 'LAND' && e.mode !== 'TRANSFER') return;

      const s = nodes.find(n => n.id === e.source);
      const t = nodes.find(n => n.id === e.target);
      if (!s || !t) return;

      const isCurved = e.mode === 'AIR' || e.mode === 'MARITIME';
      const coordinates = isCurved ?
        generateCurvedArc(s.lon, s.lat, t.lon, t.lat, 35, e.mode === 'AIR' ? 0.26 : 0.14) :
        [[s.lon, s.lat], [t.lon, t.lat]];

      const feat = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {
          route_code: e.route_code || `${e.source} -> ${e.target}`,
          mode: e.mode,
          status: e.status,
          distance_km: e.distance_km,
          color: e.mode === 'AIR' ? '#38bdf8' : e.mode === 'MARITIME' ? '#00f2fe' : '#f59e0b'
        }
      };

      const key = `${e.source}->${e.target}`;
      if (optimalEdgeKeys.has(key)) {
        optimalRouteFeatures.push(feat);
      } else if (e.status === 'CLOSED') {
        closedRoutesFeatures.push(feat);
      } else {
        openRoutesFeatures.push(feat);
      }
    });

    // --- 2. ACLED Hazard Zones GeoJSON ---
    const hazardFeatures = (activeDangerZones || []).map(dz => ({
      type: 'Feature',
      geometry: dz.polygon,
      properties: {
        id: dz.event_id,
        location: dz.location,
        country: dz.country,
        radius_km: dz.radius_km
      }
    }));

    // If an energy facility was struck, add its blast polygon
    if (struckFacility && struckFacility.lat && struckFacility.lon) {
      hazardFeatures.push({
        type: 'Feature',
        geometry: generateCirclePolygon(
          struckFacility.lon,
          struckFacility.lat,
          struckFacility.evacuation_and_safety_radius_km || 45.0
        ),
        properties: {
          id: `STRIKE-${struckFacility.facility_id}`,
          location: struckFacility.facility_name_ar,
          country: struckFacility.country,
          radius_km: struckFacility.evacuation_and_safety_radius_km || 45.0
        }
      });
    }

    // --- 3. ALL Flight Tracks & Radar Trails across Middle East ---
    // User Requirement:
    // "I want to have - - - - - - - - - - - - for each root plane and when I click on one every -------- for another plane I do not want to see it and when I reclick on in I want to see the all root of all the olane"
    const allFlightTrackFeatures = [];
    const flightTrailFeatures = [];
    const dangerDivertVectors = [];
    const focusedFlightTrackFeatures = [];

    if ((domainFilter === 'ALL' || domainFilter === 'AIR' || domainFilter === 'DEFENSE') && showFlightTracks) {
      filteredFlights.forEach(f => {
        const isThisSelected = selectedFlightCallsign === f.callsign;

        // CRITICAL: If any plane is clicked/selected, HIDE all OTHER planes' dashed routes!
        // When NO plane is selected (or when reclicked), show ALL planes' dashed routes!
        if (selectedFlightCallsign && !isThisSelected) {
          return;
        }

        const isMilitary = f.flight_type === 'MILITARY' || f.flight_type === 'DEFENSE';
        const isVip = f.flight_type === 'VIP';
        const trackColor = f.in_danger ? '#ff2a5f' :
          f.flight_type === 'CARGO' ? '#fbbf24' :
          isMilitary ? '#c084fc' :
          isVip ? '#34d399' : '#38bdf8';

        // 1. Full Dashed Flight Path Arc (- - - - - - - - - - - -)
        const coords = (f.flight_path && f.flight_path.length >= 2) ? f.flight_path :
          (f.origin_coords && f.dest_coords) ? generateCurvedArc(f.origin_coords[0], f.origin_coords[1], f.dest_coords[0], f.dest_coords[1], 26, 0.16) : null;

        if (coords) {
          allFlightTrackFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            },
            properties: {
              callsign: f.callsign,
              operator: f.operator,
              color: trackColor,
              inDanger: f.in_danger,
              flightType: f.flight_type,
              isSelected: isThisSelected
            }
          });
        }

        // 2. Dynamic Radar Trail behind aircraft
        if (showRadarTrails && f.trail && f.trail.length >= 2) {
          flightTrailFeatures.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: f.trail
            },
            properties: {
              callsign: f.callsign,
              color: trackColor
            }
          });
        }

        // 3. Threatened Aircraft Emergency Divert Vectors to Safe Haven
        if (f.in_danger && f.safe_haven?.vector_coordinates) {
          dangerDivertVectors.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: generateCurvedArc(
                f.safe_haven.vector_coordinates[0][0],
                f.safe_haven.vector_coordinates[0][1],
                f.safe_haven.vector_coordinates[1][0],
                f.safe_haven.vector_coordinates[1][1],
                30,
                -0.22
              )
            },
            properties: {
              callsign: f.callsign,
              haven: f.safe_haven.iata
            }
          });
        }
      });
    }

    // Threatened vessels emergency vectors
    if (domainFilter === 'ALL' || domainFilter === 'MARITIME') {
      liveVessels.forEach(v => {
        if (v.in_danger && v.emergency_berth_coords) {
          dangerDivertVectors.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: generateCurvedArc(
                v.lon,
                v.lat,
                v.emergency_berth_coords[0],
                v.emergency_berth_coords[1],
                30,
                0.16
              )
            },
            properties: { callsign: v.name }
          });
        }
      });
    }

    // Single simulated aircraft divert vector
    if (emergencyDiversion?.flight_vector_coordinates) {
      dangerDivertVectors.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: generateCurvedArc(
            emergencyDiversion.flight_vector_coordinates[0][0],
            emergencyDiversion.flight_vector_coordinates[0][1],
            emergencyDiversion.flight_vector_coordinates[1][0],
            emergencyDiversion.flight_vector_coordinates[1][1],
            30,
            -0.2
          )
        },
        properties: { callsign: emergencyDiversion.flight_callsign }
      });
    }

    // Safely update or add GeoJSON sources
    const updateSource = (id, data) => {
      const src = map.getSource(id);
      if (src) {
        src.setData(data);
      } else {
        map.addSource(id, { type: 'geojson', data });
      }
    };

    updateSource('src-hazards', { type: 'FeatureCollection', features: hazardFeatures });
    updateSource('src-open-routes', { type: 'FeatureCollection', features: openRoutesFeatures });
    updateSource('src-closed-routes', { type: 'FeatureCollection', features: closedRoutesFeatures });
    updateSource('src-optimal-route', { type: 'FeatureCollection', features: optimalRouteFeatures });
    updateSource('src-all-flight-tracks', { type: 'FeatureCollection', features: allFlightTrackFeatures });
    updateSource('src-flight-trails', { type: 'FeatureCollection', features: flightTrailFeatures });
    updateSource('src-danger-vectors', { type: 'FeatureCollection', features: dangerDivertVectors });

    // Add Visual Layers if not present
    if (!map.getLayer('layer-hazard-fill')) {
      map.addLayer({
        id: 'layer-hazard-fill',
        type: 'fill',
        source: 'src-hazards',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.28 }
      });
      map.addLayer({
        id: 'layer-hazard-stroke',
        type: 'line',
        source: 'src-hazards',
        paint: { 'line-color': '#ff2a5f', 'line-width': 2.8, 'line-dasharray': [2, 2] }
      });

      // Regular open routes
      map.addLayer({
        id: 'layer-open-routes',
        type: 'line',
        source: 'src-open-routes',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.0, 'line-opacity': 0.65 }
      });

      // --- ALL FLIGHT TRACKS LAYERS: DASHED LINES (- - - - - - - - - - - -) ---
      map.addLayer({
        id: 'layer-flight-tracks-glow',
        type: 'line',
        source: 'src-all-flight-tracks',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['boolean', ['get', 'isSelected'], false], 7.5, 3.2],
          'line-blur': 2.5,
          'line-opacity': ['case', ['boolean', ['get', 'isSelected'], false], 0.85, 0.4]
        }
      });
      map.addLayer({
        id: 'layer-flight-tracks-core',
        type: 'line',
        source: 'src-all-flight-tracks',
        paint: {
          'line-color': ['case', ['boolean', ['get', 'isSelected'], false], '#ffffff', ['get', 'color']],
          'line-width': ['case', ['boolean', ['get', 'isSelected'], false], 2.8, 1.6],
          'line-opacity': 0.95,
          'line-dasharray': [4, 3] // DASHED LINE: - - - - - - - - - - - -
        }
      });

      // --- RADAR BREADCRUMB TRAILS BEHIND AIRPLANES ---
      map.addLayer({
        id: 'layer-flight-trails',
        type: 'line',
        source: 'src-flight-trails',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.2,
          'line-opacity': 0.7,
          'line-dasharray': [1, 2]
        }
      });

      // Closed routes: Flashing Red Neon Glow
      map.addLayer({
        id: 'layer-closed-routes-glow',
        type: 'line',
        source: 'src-closed-routes',
        paint: { 'line-color': '#ff2a5f', 'line-width': 7, 'line-blur': 4, 'line-opacity': 0.85 }
      });
      map.addLayer({
        id: 'layer-closed-routes-core',
        type: 'line',
        source: 'src-closed-routes',
        paint: { 'line-color': '#ffffff', 'line-width': 2.2, 'line-opacity': 0.95 }
      });

      // Optimal Route: Glowing Emerald
      map.addLayer({
        id: 'layer-optimal-glow',
        type: 'line',
        source: 'src-optimal-route',
        paint: { 'line-color': '#10b981', 'line-width': 8, 'line-blur': 4, 'line-opacity': 0.85 }
      });
      map.addLayer({
        id: 'layer-optimal-core',
        type: 'line',
        source: 'src-optimal-route',
        paint: { 'line-color': '#34d399', 'line-width': 3.5, 'line-opacity': 1.0 }
      });

      // Emergency Escape Vectors
      map.addLayer({
        id: 'layer-danger-vectors',
        type: 'line',
        source: 'src-danger-vectors',
        paint: { 'line-color': '#ff2a5f', 'line-width': 3.5, 'line-dasharray': [3, 2] }
      });
    }

    // --- 4. Render Strategic Nodes as Interactive HTML Markers ---
    nodes.forEach(node => {
      // Filter nodes based on domain
      if (domainFilter === 'MARITIME' && node.type !== 'PORT' && node.type !== 'CHOKEPOINT') return;
      if (domainFilter === 'AIR' && node.type !== 'AIRPORT') return;
      if (domainFilter === 'LAND' && node.type !== 'LOGISTICS_HUB' && node.type !== 'PORT') return;

      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.cursor = 'pointer';
      el.style.zIndex = '50';

      const dot = document.createElement('div');
      const isClosed = node.status === 'CLOSED';
      const color = isClosed ? '#ef4444' :
                    node.safe_haven ? '#10b981' :
                    node.type === 'CHOKEPOINT' ? '#f43f5e' :
                    node.type === 'PORT' ? '#00f2fe' :
                    node.type === 'AIRPORT' ? '#38bdf8' : '#f59e0b';

      dot.style.width = node.type === 'CHOKEPOINT' || node.safe_haven ? '15px' : '12px';
      dot.style.height = node.type === 'CHOKEPOINT' || node.safe_haven ? '15px' : '12px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = color;
      dot.style.border = '2px solid #ffffff';
      dot.style.boxShadow = `0 0 10px ${color}`;

      if (isClosed || node.type === 'CHOKEPOINT') {
        dot.className = 'pulsing-danger';
      }

      const label = document.createElement('div');
      label.innerText = node.name_ar || node.name;
      label.style.fontSize = '10px';
      label.style.fontFamily = 'Chakra Petch, sans-serif';
      label.style.color = '#f8fafc';
      label.style.background = 'rgba(10, 15, 29, 0.85)';
      label.style.padding = '2px 5px';
      label.style.borderRadius = '4px';
      label.style.marginTop = '3px';
      label.style.whiteSpace = 'nowrap';
      label.style.border = '1px solid rgba(255, 255, 255, 0.15)';

      el.appendChild(dot);
      el.appendChild(label);

      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        if (onNodeClick) onNodeClick(node);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // --- 5. Render Live OpenSky Flights as AIRPLANE SILHOUETTE (NOT A DOT!) ---
    if (domainFilter === 'ALL' || domainFilter === 'AIR' || domainFilter === 'DEFENSE') {
      filteredFlights.forEach(f => {
        const isSelected = selectedFlightCallsign === f.callsign;
        const isMilitary = f.flight_type === 'MILITARY' || f.flight_type === 'DEFENSE';
        const isVip = f.flight_type === 'VIP';

        const fEl = document.createElement('div');
        fEl.style.display = 'flex';
        fEl.style.flexDirection = 'column';
        fEl.style.alignItems = 'center';
        fEl.style.cursor = 'pointer';
        fEl.style.zIndex = isSelected ? '100' : isMilitary ? '95' : f.in_danger ? '98' : '45';

        const planeColor = f.in_danger ? '#ff2a5f' :
          f.flight_type === 'CARGO' ? '#fbbf24' :
          isMilitary ? '#c084fc' :
          isVip ? '#34d399' : '#38bdf8';

        const heading = f.heading_deg || 0;

        // Custom Airplane Silhouette SVG Icon rotated to heading
        const svgContainer = document.createElement('div');
        const iconSize = isSelected ? 32 : (f.in_danger || isMilitary) ? 28 : 23;
        svgContainer.style.width = `${iconSize}px`;
        svgContainer.style.height = `${iconSize}px`;
        svgContainer.style.display = 'flex';
        svgContainer.style.alignItems = 'center';
        svgContainer.style.justifyContent = 'center';
        svgContainer.style.transition = 'transform 0.3s ease';

        if (f.in_danger || isSelected) {
          svgContainer.className = 'pulsing-danger';
        }

        svgContainer.innerHTML = `
          <svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" 
               style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 ${isSelected ? '12px #ffffff' : isMilitary ? '10px #c084fc' : '8px ' + planeColor});">
            <path fill="${isSelected ? '#ffffff' : planeColor}" stroke="${isSelected ? '#38bdf8' : '#ffffff'}" stroke-width="${isSelected ? 1.6 : 1.2}" 
                  d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        `;

        fEl.appendChild(svgContainer);

        // Callsign tag with altitude profile badge
        const callTag = document.createElement('div');
        const altStr = f.altitude_ft ? `${Math.round(f.altitude_ft / 1000)}k` : '';
        const roleIcon = isMilitary ? '🛡️' : isVip ? '👑' : f.flight_type === 'CARGO' ? '📦' : '✈️';
        callTag.innerText = f.in_danger ? `⚠️ ${f.callsign}` : `${roleIcon} ${f.callsign} ${altStr}`;
        callTag.style.fontSize = '9px';
        callTag.style.fontWeight = (f.in_danger || isSelected || isMilitary) ? '700' : '500';
        callTag.style.color = isSelected ? '#ffffff' : f.in_danger ? '#fca5a5' : isMilitary ? '#f3e8ff' : '#bae6fd';
        callTag.style.background = isSelected ? 'rgba(2, 132, 199, 0.95)' : f.in_danger ? 'rgba(69, 10, 10, 0.92)' : isMilitary ? 'rgba(46, 16, 75, 0.94)' : 'rgba(15, 23, 42, 0.88)';
        callTag.style.border = isSelected ? '1.5px solid #ffffff' : f.in_danger ? '1px solid #ef4444' : isMilitary ? '1px solid #c084fc' : '1px solid rgba(56, 189, 248, 0.35)';
        callTag.style.padding = '1px 5px';
        callTag.style.borderRadius = '3px';
        callTag.style.marginTop = '2px';
        callTag.style.whiteSpace = 'nowrap';
        if (isSelected) {
          callTag.style.boxShadow = '0 0 10px rgba(0, 242, 254, 0.8)';
        } else if (isMilitary) {
          callTag.style.boxShadow = '0 0 8px rgba(192, 132, 252, 0.4)';
        }
        fEl.appendChild(callTag);

        // Click Handler: Clicking selects, clicking again deselects!
        fEl.addEventListener('click', (evt) => {
          evt.stopPropagation();
          map.flyTo({
            center: [f.lon, f.lat],
            zoom: Math.max(map.getZoom(), 6.0),
            duration: 700,
            essential: true
          });
          if (onFlightClick) onFlightClick(f);
        });

        const flightMarker = new mapboxgl.Marker({ element: fEl })
          .setLngLat([f.lon, f.lat])
          .addTo(map);

        markersRef.current.push(flightMarker);

        // If this plane is currently selected, also place waypoint markers at its Origin and Destination!
        if (isSelected) {
          if (f.origin_coords) {
            const origEl = document.createElement('div');
            origEl.innerHTML = `
              <div style="background: rgba(16, 185, 129, 0.9); border: 1.5px solid #fff; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: 700; color: #fff; box-shadow: 0 0 10px #10b981;">
                🛫 إقلاع: ${f.origin_icao || 'ORIG'}
              </div>
            `;
            const origMarker = new mapboxgl.Marker({ element: origEl }).setLngLat(f.origin_coords).addTo(map);
            markersRef.current.push(origMarker);
          }
          if (f.dest_coords) {
            const destEl = document.createElement('div');
            destEl.innerHTML = `
              <div style="background: rgba(56, 189, 248, 0.9); border: 1.5px solid #fff; border-radius: 4px; padding: 2px 6px; font-size: 9px; font-weight: 700; color: #fff; box-shadow: 0 0 10px #38bdf8;">
                🛬 وجهة: ${f.dest_icao || 'DEST'}
              </div>
            `;
            const destMarker = new mapboxgl.Marker({ element: destEl }).setLngLat(f.dest_coords).addTo(map);
            markersRef.current.push(destMarker);
          }
        }
      });
    }

    // --- 6. Render Live Vessels as SHIP SILHOUETTE ---
    if (domainFilter === 'ALL' || domainFilter === 'MARITIME') {
      liveVessels.forEach(v => {
        const vEl = document.createElement('div');
        vEl.style.display = 'flex';
        vEl.style.flexDirection = 'column';
        vEl.style.alignItems = 'center';
        vEl.style.cursor = 'pointer';
        vEl.style.zIndex = v.in_danger ? '92' : '42';

        const shipColor = v.in_danger ? '#ff2a5f' : '#00f2fe';
        const heading = v.heading_deg || 0;

        const shipContainer = document.createElement('div');
        shipContainer.style.width = v.in_danger ? '24px' : '20px';
        shipContainer.style.height = v.in_danger ? '24px' : '20px';
        shipContainer.style.display = 'flex';
        shipContainer.style.alignItems = 'center';
        shipContainer.style.justifyContent = 'center';

        if (v.in_danger) {
          shipContainer.className = 'pulsing-danger';
        }

        shipContainer.innerHTML = `
          <svg viewBox="0 0 24 24" width="${v.in_danger ? 24 : 20}" height="${v.in_danger ? 24 : 20}" 
               style="transform: rotate(${heading}deg); filter: drop-shadow(0 0 8px ${shipColor});">
            <path fill="${shipColor}" stroke="#ffffff" stroke-width="1.2" 
                  d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.47L20 13V6c0-1.1-.9-2-2-2h-3V1h-2v3h-2V1H9v3H6c-1.1 0-2 .9-2 2v7l-1.28.27c-.26.05-.48.23-.6.47s-.14.52-.06.78L3.95 19zM6 6h12v7H6V6z"/>
          </svg>
        `;

        vEl.appendChild(shipContainer);

        const vTag = document.createElement('div');
        vTag.innerText = v.in_danger ? `⚓ ⚠️ ${v.name}` : `⚓ ${v.name}`;
        vTag.style.fontSize = '9px';
        vTag.style.fontWeight = v.in_danger ? '700' : '600';
        vTag.style.color = v.in_danger ? '#fca5a5' : '#a5f3fc';
        vTag.style.background = v.in_danger ? 'rgba(69, 10, 10, 0.92)' : 'rgba(15, 23, 42, 0.85)';
        vTag.style.border = v.in_danger ? '1px solid #ef4444' : '1px solid rgba(0, 242, 254, 0.3)';
        vTag.style.padding = '1px 4px';
        vTag.style.borderRadius = '3px';
        vTag.style.marginTop = '2px';
        vTag.style.whiteSpace = 'nowrap';
        vEl.appendChild(vTag);

        vEl.addEventListener('click', (evt) => {
          evt.stopPropagation();
          if (onVesselClick) onVesselClick(v);
        });

        const vesselMarker = new mapboxgl.Marker({ element: vEl })
          .setLngLat([v.lon, v.lat])
          .addTo(map);

        markersRef.current.push(vesselMarker);
      });
    }

    // --- 7. Render Energy Infrastructure Assets ---
    if (domainFilter === 'ALL' || domainFilter === 'ENERGY') {
      energyFacilities.forEach(eng => {
        const engEl = document.createElement('div');
        engEl.style.display = 'flex';
        engEl.style.flexDirection = 'column';
        engEl.style.alignItems = 'center';
        engEl.style.cursor = 'pointer';
        engEl.style.zIndex = '60';

        const isStruck = struckFacility?.facility_id === eng.id;
        const engColor = isStruck ? '#ef4444' : '#f59e0b';

        const iconContainer = document.createElement('div');
        iconContainer.style.width = isStruck ? '26px' : '22px';
        iconContainer.style.height = isStruck ? '26px' : '22px';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';

        if (isStruck) {
          iconContainer.className = 'pulsing-danger';
        }

        iconContainer.innerHTML = `
          <svg viewBox="0 0 24 24" width="${isStruck ? 26 : 22}" height="${isStruck ? 26 : 22}" 
               style="filter: drop-shadow(0 0 10px ${engColor});">
            <path fill="${engColor}" stroke="#ffffff" stroke-width="1.2" 
                  d="M12 2c1.1 0 2 .9 2 2v1h4c1.1 0 2 .9 2 2v13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h4V4c0-1.1.9-2 2-2zm-2 5H6v12h12V7h-4v2h-4V7zm2 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
          </svg>
        `;

        engEl.appendChild(iconContainer);

        const engLabel = document.createElement('div');
        engLabel.innerText = isStruck ? `💥 استهداف: ${eng.name_ar}` : `⚡ ${eng.name_ar}`;
        engLabel.style.fontSize = '9px';
        engLabel.style.fontWeight = '700';
        engLabel.style.color = isStruck ? '#fca5a5' : '#fde68a';
        engLabel.style.background = isStruck ? 'rgba(69, 10, 10, 0.95)' : 'rgba(20, 15, 5, 0.88)';
        engLabel.style.border = isStruck ? '1px solid #ef4444' : '1px solid rgba(245, 158, 11, 0.4)';
        engLabel.style.padding = '1px 5px';
        engLabel.style.borderRadius = '3px';
        engLabel.style.marginTop = '2px';
        engLabel.style.whiteSpace = 'nowrap';
        engEl.appendChild(engLabel);

        engEl.addEventListener('click', (evt) => {
          evt.stopPropagation();
          if (onEnergyFacilityClick) onEnergyFacilityClick(eng);
        });

        const engMarker = new mapboxgl.Marker({ element: engEl })
          .setLngLat([eng.lon, eng.lat])
          .addTo(map);

        markersRef.current.push(engMarker);
      });
    }

    // Dynamic Flashing Red pulse loop
    let pulseStep = 0;
    const animatePulse = () => {
      pulseStep = (pulseStep + 0.08) % (Math.PI * 2);
      const glowOpacity = 0.4 + Math.sin(pulseStep) * 0.4;
      const strokeWidth = 5.5 + Math.sin(pulseStep) * 2.5;

      if (map.getLayer('layer-closed-routes-glow')) {
        map.setPaintProperty('layer-closed-routes-glow', 'line-opacity', glowOpacity);
        map.setPaintProperty('layer-closed-routes-glow', 'line-width', strokeWidth);
      }
      animFrameRef.current = requestAnimationFrame(animatePulse);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animatePulse);

  }, [
    mapLoaded,
    nodes,
    edges,
    optimalRoute,
    activeDangerZones,
    emergencyDiversion,
    filteredFlights,
    liveVessels,
    energyFacilities,
    struckFacility,
    domainFilter,
    selectedTrackedPath,
    selectedFlightCallsign,
    showFlightTracks,
    showRadarTrails
  ]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Mapbox Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          background: '#080c16'
        }}
      />

      {/* TACTICAL AIRSPACE & FLIGHT TRACKS HUD OVERLAY */}
      {(domainFilter === 'ALL' || domainFilter === 'AIR') && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          background: 'rgba(10, 20, 36, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '10px',
          padding: '10px 14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          direction: 'rtl',
          textAlign: 'right',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '290px'
        }}>
          {/* Header Title with live flight count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8' }}>
              <Plane size={16} />
              <span>رادار أجواء الشرق الأوسط</span>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              {filteredFlights.length} / {liveFlights.length} بالجو
            </span>
          </div>

          {/* Quick Toggle Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowFlightTracks(!showFlightTracks)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: showFlightTracks ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                border: showFlightTracks ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                color: showFlightTracks ? '#38bdf8' : 'var(--text-muted)'
              }}
            >
              {showFlightTracks ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>مسارات (- - - -)</span>
            </button>

            <button
              onClick={() => setShowRadarTrails(!showRadarTrails)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: showRadarTrails ? 'rgba(0, 242, 254, 0.25)' : 'rgba(0, 0, 0, 0.4)',
                border: showRadarTrails ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.15)',
                color: showRadarTrails ? '#00f2fe' : 'var(--text-muted)'
              }}
            >
              <Radio size={13} />
              <span>آثار الرادار</span>
            </button>
          </div>

          {/* SINGLE FLIGHT FOCUS BANNER (If a plane is clicked) */}
          {selectedFlightCallsign && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: '#ffffff'
            }}>
              <div>
                مسار محدد: <strong>{selectedFlightCallsign}</strong>
              </div>
              <button
                onClick={() => { if (onFlightClick) onFlightClick(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '0.66rem',
                  fontWeight: 600
                }}
              >
                عرض الكل ✕
              </button>
            </div>
          )}

          {/* Filter Chips by Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button
              onClick={() => setFlightTypeFilter('ALL')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                background: flightTypeFilter === 'ALL' ? '#38bdf8' : 'rgba(0,0,0,0.3)',
                color: flightTypeFilter === 'ALL' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600
              }}
            >
              الكل ({liveFlights.length})
            </button>
            <button
              onClick={() => setFlightTypeFilter('DANGER')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                background: flightTypeFilter === 'DANGER' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                color: flightTypeFilter === 'DANGER' ? '#fff' : '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 600
              }}
            >
              ⚠️ في خطر ({dangerFlightsCount})
            </button>
            <button
              onClick={() => setFlightTypeFilter('COMMERCIAL')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                background: flightTypeFilter === 'COMMERCIAL' ? '#38bdf8' : 'rgba(0,0,0,0.3)',
                color: flightTypeFilter === 'COMMERCIAL' ? '#000' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600
              }}
            >
              تجاري
            </button>
            <button
              onClick={() => setFlightTypeFilter('CARGO')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                background: flightTypeFilter === 'CARGO' ? '#fbbf24' : 'rgba(0,0,0,0.3)',
                color: flightTypeFilter === 'CARGO' ? '#000' : '#fde68a',
                border: 'none',
                fontWeight: 600
              }}
            >
              شحن
            </button>
            <button
              onClick={() => setFlightTypeFilter('MILITARY')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                background: flightTypeFilter === 'MILITARY' ? '#c084fc' : 'rgba(0,0,0,0.3)',
                color: flightTypeFilter === 'MILITARY' ? '#000' : '#e9d5ff',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                fontWeight: 700
              }}
            >
              🛡️ دفاع واستطلاع ({militaryFlightsCount})
            </button>
          </div>

          {/* Quick Legend Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '5px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span> تجاري
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span> شحن
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc', display: 'inline-block' }}></span> دفاع
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff2a5f', display: 'inline-block' }}></span> تحويل طارئ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
