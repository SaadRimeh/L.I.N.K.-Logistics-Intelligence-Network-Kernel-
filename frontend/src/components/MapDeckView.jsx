import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// CARTO Dark Matter vector tile style - no token required, ultra fast & reliable
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Helper: Generates curved great-circle / bezier-like arc coordinates between two points
function generateCurvedArc(lon1, lat1, lon2, lat2, numPoints = 40, curvature = 0.25) {
  const points = [];
  const midLon = (lon1 + lon2) / 2.0;
  const midLat = (lat1 + lat2) / 2.0;

  // Offset midpoint perpendicular to line for 3D curved arc aesthetic
  const dLon = lon2 - lon1;
  const dLat = lat2 - lat1;
  const offsetLon = -dLat * curvature;
  const offsetLat = dLon * curvature;

  const ctrlLon = midLon + offsetLon;
  const ctrlLat = midLat + offsetLat;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic bezier curve formula
    const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * ctrlLon + t * t * lon2;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2;
    points.push([lon, lat]);
  }
  return points;
}

export default function MapDeckView({
  nodes,
  edges,
  optimalRoute,
  activeDangerZones,
  emergencyDiversion,
  onNodeClick
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animFrameRef = useRef(null);

  // Initialize Mapbox GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DARK_STYLE,
      center: [45.0, 26.5],
      zoom: 4.6,
      pitch: 45,
      bearing: -6,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
    };
  }, []);

  // Update GeoJSON data and layers whenever nodes, edges, route or hazards change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // --- 1. Nodes GeoJSON FeatureCollection ---
    const nodesGeoJson = {
      type: 'FeatureCollection',
      features: nodes.map(n => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [n.lon, n.lat] },
        properties: {
          id: n.id,
          name: n.name,
          name_ar: n.name_ar || n.name,
          country: n.country,
          type: n.type,
          iata: n.iata || '',
          safe_haven: n.safe_haven ? 'YES' : 'NO',
          status: n.status,
          color: n.status === 'CLOSED' ? '#ef4444' :
                 n.safe_haven ? '#10b981' :
                 n.type === 'CHOKEPOINT' ? '#f43f5e' :
                 n.type === 'PORT' ? '#00f2fe' :
                 n.type === 'AIRPORT' ? '#38bdf8' : '#f59e0b',
          radius: n.type === 'CHOKEPOINT' || n.safe_haven ? 9 : 7
        }
      }))
    };

    // --- 2. Routes GeoJSON FeatureCollections (Split into OPEN vs CLOSED) ---
    const optimalEdgeKeys = new Set(
      optimalRoute?.segments ? optimalRoute.segments.map(s => `${s.source_id}->${s.target_id}`) : []
    );

    const openRoutesFeatures = [];
    const closedRoutesFeatures = [];
    const optimalRouteFeatures = [];

    edges.forEach(e => {
      const s = nodes.find(n => n.id === e.source);
      const t = nodes.find(n => n.id === e.target);
      if (!s || !t) return;

      const isCurved = e.mode === 'AIR' || e.mode === 'MARITIME';
      const coordinates = isCurved ?
        generateCurvedArc(s.lon, s.lat, t.lon, t.lat, 40, e.mode === 'AIR' ? 0.28 : 0.15) :
        [[s.lon, s.lat], [t.lon, t.lat]];

      const feat = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {
          route_code: e.route_code || `${e.source} -> ${e.target}`,
          mode: e.mode,
          status: e.status,
          distance_km: e.distance_km,
          time_hours: e.time_hours,
          cost_usd: e.cost_usd,
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

    // --- 3. Hazard Zones (ACLED Polygons) GeoJSON ---
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

    // --- 4. Emergency Flight Diversion Vector GeoJSON ---
    const divertFeatures = [];
    if (emergencyDiversion && emergencyDiversion.flight_vector_coordinates) {
      divertFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: generateCurvedArc(
            emergencyDiversion.flight_vector_coordinates[0][0],
            emergencyDiversion.flight_vector_coordinates[0][1],
            emergencyDiversion.flight_vector_coordinates[1][0],
            emergencyDiversion.flight_vector_coordinates[1][1],
            35,
            -0.2
          )
        },
        properties: {
          callsign: emergencyDiversion.flight_callsign,
          heading: emergencyDiversion.divert_heading_degrees,
          safe_haven: emergencyDiversion.nearest_safe_haven?.name
        }
      });
    }

    // Helper to safely add or update GeoJSON source
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
    updateSource('src-divert-vector', { type: 'FeatureCollection', features: divertFeatures });
    updateSource('src-nodes', nodesGeoJson);

    // Add Layers if not already added
    if (!map.getLayer('layer-hazard-fill')) {
      map.addLayer({
        id: 'layer-hazard-fill',
        type: 'fill',
        source: 'src-hazards',
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.22
        }
      });
      map.addLayer({
        id: 'layer-hazard-stroke',
        type: 'line',
        source: 'src-hazards',
        paint: {
          'line-color': '#ff2a5f',
          'line-width': 3,
          'line-dasharray': [2, 2]
        }
      });

      // Normal Open Routes
      map.addLayer({
        id: 'layer-open-routes',
        type: 'line',
        source: 'src-open-routes',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.4,
          'line-opacity': 0.75
        }
      });

      // CLOSED Routes: Glowing Pulsing RED Stroke
      map.addLayer({
        id: 'layer-closed-routes-glow',
        type: 'line',
        source: 'src-closed-routes',
        paint: {
          'line-color': '#ff2a5f',
          'line-width': 7,
          'line-blur': 4,
          'line-opacity': 0.9
        }
      });
      map.addLayer({
        id: 'layer-closed-routes-core',
        type: 'line',
        source: 'src-closed-routes',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.2,
          'line-opacity': 0.95
        }
      });

      // Optimal Computed Route: Vivid Glowing Emerald
      map.addLayer({
        id: 'layer-optimal-glow',
        type: 'line',
        source: 'src-optimal-route',
        paint: {
          'line-color': '#10b981',
          'line-width': 8,
          'line-blur': 4,
          'line-opacity': 0.85
        }
      });
      map.addLayer({
        id: 'layer-optimal-core',
        type: 'line',
        source: 'src-optimal-route',
        paint: {
          'line-color': '#34d399',
          'line-width': 3.5,
          'line-opacity': 1.0
        }
      });

      // Emergency Divert Vector (Scenario 2)
      map.addLayer({
        id: 'layer-divert-vector',
        type: 'line',
        source: 'src-divert-vector',
        paint: {
          'line-color': '#f43f5e',
          'line-width': 5,
          'line-dasharray': [3, 2]
        }
      });

      // Nodes Circles
      map.addLayer({
        id: 'layer-nodes-halo',
        type: 'circle',
        source: 'src-nodes',
        paint: {
          'circle-radius': ['+', ['get', 'radius'], 5],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-blur': 0.8
        }
      });
      map.addLayer({
        id: 'layer-nodes-core',
        type: 'circle',
        source: 'src-nodes',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.8
        }
      });

      // Node Labels
      map.addLayer({
        id: 'layer-nodes-label',
        type: 'symbol',
        source: 'src-nodes',
        layout: {
          'text-field': ['get', 'name_ar'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': '#090d16',
          'text-halo-width': 2.5
        }
      });

      // Node click handler
      map.on('click', 'layer-nodes-core', (e) => {
        if (e.features && e.features[0] && onNodeClick) {
          const props = e.features[0].properties;
          onNodeClick({ id: props.id, name: props.name, type: props.type });
        }
      });

      // Change cursor on node hover
      map.on('mouseenter', 'layer-nodes-core', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-nodes-core', () => { map.getCanvas().style.cursor = ''; });
    }

    // Dynamic Flashing Red Animation loop for CLOSED routes
    let pulseStep = 0;
    const animateClosedPulse = () => {
      pulseStep = (pulseStep + 0.08) % (Math.PI * 2);
      const glowOpacity = 0.4 + Math.sin(pulseStep) * 0.4;
      const strokeWidth = 5.5 + Math.sin(pulseStep) * 2.5;

      if (map.getLayer('layer-closed-routes-glow')) {
        map.setPaintProperty('layer-closed-routes-glow', 'line-opacity', glowOpacity);
        map.setPaintProperty('layer-closed-routes-glow', 'line-width', strokeWidth);
      }
      animFrameRef.current = requestAnimationFrame(animateClosedPulse);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animateClosedPulse);

  }, [nodes, edges, optimalRoute, activeDangerZones, emergencyDiversion, mapLoaded, onNodeClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 64px)' }}>
      {/* Mapbox Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Cybernetic Map Legend Overlay */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        padding: '14px 18px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '0.74rem',
        fontFamily: 'var(--font-mono)',
        zIndex: 800,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.06em', marginBottom: '2px' }}>
          DIGITAL TWIN RADAR LEGEND
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
          <span>MARITIME PORT (Sea Gateway)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
          <span>AIRPORT (Flight Corridor)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>SAFE HAVEN (Divert Port: AMM/BGW)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
          <span>LAND BRIDGE (Cross-Border Trucking)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff2a5f', boxShadow: '0 0 10px #ff2a5f' }} />
          <span style={{ color: '#fca5a5', fontWeight: 600 }}>CLOSED ROUTE / CHOKEPOINT (PULSING)</span>
        </div>
      </div>
    </div>
  );
}
