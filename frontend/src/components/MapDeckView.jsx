import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

export default function MapDeckView({
  nodes,
  edges,
  optimalRoute,
  activeDangerZones,
  emergencyDiversion,
  liveFlights,
  showLiveFlights,
  onNodeClick,
  onFlightClick
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const animFrameRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Mapbox GL instance with resize triggers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_DARK_STYLE,
      center: [45.0, 26.5],
      zoom: 4.8,
      pitch: 42,
      bearing: -6,
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

    // Resize triggers to guarantee canvas fits parent container on all screens
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

  // Update GeoJSON layers and live HTML markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous live markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // --- 1. Lines GeoJSON (Open, Closed, and Optimal Route) ---
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

    // --- 3. Emergency Flight Diversion Vectors (OpenSky threatened planes) ---
    const dangerDivertVectors = [];
    if (showLiveFlights && liveFlights && liveFlights.length > 0) {
      liveFlights.forEach(f => {
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
            properties: { callsign: f.callsign }
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
    updateSource('src-danger-vectors', { type: 'FeatureCollection', features: dangerDivertVectors });

    // Add Visual Layers if not present
    if (!map.getLayer('layer-hazard-fill')) {
      map.addLayer({
        id: 'layer-hazard-fill',
        type: 'fill',
        source: 'src-hazards',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.25 }
      });
      map.addLayer({
        id: 'layer-hazard-stroke',
        type: 'line',
        source: 'src-hazards',
        paint: { 'line-color': '#ff2a5f', 'line-width': 2.8, 'line-dasharray': [2, 2] }
      });

      map.addLayer({
        id: 'layer-open-routes',
        type: 'line',
        source: 'src-open-routes',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.2, 'line-opacity': 0.7 }
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

      el.addEventListener('click', () => {
        if (onNodeClick) onNodeClick(node);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // --- 5. Render Live OpenSky Flights as HTML Radar Icons ---
    if (showLiveFlights && liveFlights && liveFlights.length > 0) {
      liveFlights.forEach(f => {
        const fEl = document.createElement('div');
        fEl.style.display = 'flex';
        fEl.style.flexDirection = 'column';
        fEl.style.alignItems = 'center';
        fEl.style.cursor = 'pointer';
        fEl.style.zIndex = f.in_danger ? '90' : '40';

        const planeIcon = document.createElement('div');
        const planeColor = f.in_danger ? '#ff2a5f' : '#38bdf8';
        planeIcon.style.width = f.in_danger ? '16px' : '10px';
        planeIcon.style.height = f.in_danger ? '16px' : '10px';
        planeIcon.style.borderRadius = '50%';
        planeIcon.style.backgroundColor = planeColor;
        planeIcon.style.border = '1.5px solid #ffffff';
        planeIcon.style.boxShadow = `0 0 12px ${planeColor}`;

        if (f.in_danger) {
          planeIcon.className = 'pulsing-danger';
        }

        fEl.appendChild(planeIcon);

        // Show callsign tag on threatened aircraft
        if (f.in_danger) {
          const callTag = document.createElement('div');
          callTag.innerText = `⚠️ ${f.callsign}`;
          callTag.style.fontSize = '9px';
          callTag.style.fontWeight = '700';
          callTag.style.color = '#fca5a5';
          callTag.style.background = 'rgba(69, 10, 10, 0.9)';
          callTag.style.border = '1px solid #ef4444';
          callTag.style.padding = '1px 4px';
          callTag.style.borderRadius = '3px';
          callTag.style.marginTop = '2px';
          callTag.style.whiteSpace = 'nowrap';
          fEl.appendChild(callTag);
        }

        fEl.addEventListener('click', () => {
          if (onFlightClick) onFlightClick(f);
        });

        const flightMarker = new mapboxgl.Marker({ element: fEl })
          .setLngLat([f.lon, f.lat])
          .addTo(map);

        markersRef.current.push(flightMarker);
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

  }, [nodes, edges, optimalRoute, activeDangerZones, emergencyDiversion, liveFlights, showLiveFlights, mapLoaded, onNodeClick, onFlightClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 64px)', direction: 'rtl' }}>
      {/* Mapbox Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />

      {/* Cybernetic Legend Overlay */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        padding: '14px 18px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '0.74rem',
        fontFamily: 'var(--font-mono)',
        zIndex: 800,
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        textAlign: 'right'
      }}>
        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.04em', marginBottom: '2px' }}>
          دليل الرادار والملاحة اللوجستية
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
          <span>ميناء بحري استراتيجي (Sea Port)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
          <span>مطار وممر جوي تجاري (Airport)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>ملاذ هبوط آمن معتمد (عمّان / بغداد)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
          <span>جسر بري / شاحنات وسكك حديدية</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff2a5f', boxShadow: '0 0 10px #ff2a5f' }} />
          <span style={{ color: '#fca5a5', fontWeight: 600 }}>مسار مغلق / طائرة بخطر مباشر (أحمر وامض)</span>
        </div>
      </div>
    </div>
  );
}
