import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// 100% Resilient Self-Contained Dark Raster Map Style (Never fails, zero token, no external JSON)
const BULLETPROOF_DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark-matter': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark-matter',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

// توليد إحداثيات مقوسة للمسارات ثلاثية الأبعاد
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

  // تهيئة الخريطة وضمان استقرار العرض
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: BULLETPROOF_DARK_STYLE,
      center: [45.0, 26.5],
      zoom: 4.8,
      pitch: 45,
      bearing: -6,
      attributionControl: false
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');

    map.on('load', () => {
      mapRef.current = map;
      setMapLoaded(true);
      map.resize();
    });

    // Handle container resize
    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
    };
  }, []);

  // تحديث الطبقات والبيانات الجيومكانية والنبضات الحمراء
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // 1. العقد اللوجستية (الموانئ والمطارات والمراكز)
    const nodesGeoJson = {
      type: 'FeatureCollection',
      features: nodes.map(n => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [n.lon, n.lat] },
        properties: {
          id: n.id,
          name_ar: n.name_ar || n.name,
          country: n.country,
          type: n.type,
          iata: n.iata || '',
          safe_haven: n.safe_haven ? 'نعم' : 'لا',
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

    // 2. الممرات اللوجستية (المسارات المفتوحة vs المغلقة vs المسار الأمثل)
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

    // 3. مناطق النزاع والخطر (ACLED Hazard Polygons)
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

    // 4. طائرات رادار OpenSky اللحظية
    const safeFlightFeatures = [];
    const dangerFlightFeatures = [];
    const dangerDivertVectors = [];

    if (showLiveFlights && liveFlights && liveFlights.length > 0) {
      liveFlights.forEach(f => {
        const feat = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [f.lon, f.lat] },
          properties: {
            callsign: f.callsign,
            country: f.country,
            altitude_ft: f.altitude_ft,
            speed_kmh: f.speed_kmh,
            heading_deg: f.heading_deg,
            in_danger: f.in_danger,
            threat_desc: f.threat_description || '',
            safe_haven_name: f.safe_haven?.name_ar || ''
          }
        };

        if (f.in_danger) {
          dangerFlightFeatures.push(feat);
          if (f.safe_haven?.vector_coordinates) {
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
                  -0.2
                )
              },
              properties: {
                callsign: f.callsign,
                directive: f.safe_haven.directive_ar
              }
            });
          }
        } else {
          safeFlightFeatures.push(feat);
        }
      });
    }

    // 5. ناقل الهروب الفردي التفاعلي (Scenario 2 Emergency Diversion)
    const singleDivertFeatures = [];
    if (emergencyDiversion && emergencyDiversion.flight_vector_coordinates) {
      singleDivertFeatures.push({
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
          directive: emergencyDiversion.action_directive
        }
      });
    }

    // دالة تحديث المصادر
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
    updateSource('src-single-divert', { type: 'FeatureCollection', features: singleDivertFeatures });
    updateSource('src-safe-flights', { type: 'FeatureCollection', features: safeFlightFeatures });
    updateSource('src-danger-flights', { type: 'FeatureCollection', features: dangerFlightFeatures });
    updateSource('src-danger-vectors', { type: 'FeatureCollection', features: dangerDivertVectors });
    updateSource('src-nodes', nodesGeoJson);

    // إضافة الطبقات للمرة الأولى
    if (!map.getLayer('layer-hazard-fill')) {
      // طبقة مضلعات الخطر
      map.addLayer({
        id: 'layer-hazard-fill',
        type: 'fill',
        source: 'src-hazards',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.22 }
      });
      map.addLayer({
        id: 'layer-hazard-stroke',
        type: 'line',
        source: 'src-hazards',
        paint: { 'line-color': '#ff2a5f', 'line-width': 3, 'line-dasharray': [2, 2] }
      });

      // المسارات الطبيعية
      map.addLayer({
        id: 'layer-open-routes',
        type: 'line',
        source: 'src-open-routes',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.4, 'line-opacity': 0.75 }
      });

      // المسارات المغلقة: توهج أحمر نابض
      map.addLayer({
        id: 'layer-closed-routes-glow',
        type: 'line',
        source: 'src-closed-routes',
        paint: { 'line-color': '#ff2a5f', 'line-width': 7, 'line-blur': 4, 'line-opacity': 0.9 }
      });
      map.addLayer({
        id: 'layer-closed-routes-core',
        type: 'line',
        source: 'src-closed-routes',
        paint: { 'line-color': '#ffffff', 'line-width': 2.2, 'line-opacity': 0.95 }
      });

      // المسار الأمثل الأخضر الزمردي
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

      // متجهات الهبوط الاضطراري للطائرات المهددة
      map.addLayer({
        id: 'layer-danger-vectors',
        type: 'line',
        source: 'src-danger-vectors',
        paint: { 'line-color': '#ff2a5f', 'line-width': 3.5, 'line-dasharray': [3, 2] }
      });
      map.addLayer({
        id: 'layer-single-divert',
        type: 'line',
        source: 'src-single-divert',
        paint: { 'line-color': '#f43f5e', 'line-width': 5, 'line-dasharray': [3, 2] }
      });

      // طائرات آمنة (Sky Blue)
      map.addLayer({
        id: 'layer-safe-flights',
        type: 'circle',
        source: 'src-safe-flights',
        paint: {
          'circle-radius': 4.5,
          'circle-color': '#38bdf8',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.2
        }
      });

      // طائرات في منطقة خطر (FLASHING NEON RED)
      map.addLayer({
        id: 'layer-danger-flights-glow',
        type: 'circle',
        source: 'src-danger-flights',
        paint: {
          'circle-radius': 13,
          'circle-color': '#ff2a5f',
          'circle-opacity': 0.45,
          'circle-blur': 0.8
        }
      });
      map.addLayer({
        id: 'layer-danger-flights-core',
        type: 'circle',
        source: 'src-danger-flights',
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#ff2a5f',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // كتابة اسم نداء الطائرة المهددة
      map.addLayer({
        id: 'layer-danger-flights-label',
        type: 'symbol',
        source: 'src-danger-flights',
        layout: {
          'text-field': ['concat', '⚠️ ', ['get', 'callsign']],
          'text-size': 11,
          'text-offset': [0, -1.5],
          'text-anchor': 'bottom'
        },
        paint: {
          'text-color': '#fca5a5',
          'text-halo-color': '#450a0a',
          'text-halo-width': 2.5
        }
      });

      // العقد اللوجستية والموانئ
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

      // النقر على العقد
      map.on('click', 'layer-nodes-core', (e) => {
        if (e.features && e.features[0] && onNodeClick) {
          const props = e.features[0].properties;
          onNodeClick({ id: props.id, name_ar: props.name_ar, type: props.type });
        }
      });

      // النقر على الطائرة المهددة
      map.on('click', 'layer-danger-flights-core', (e) => {
        if (e.features && e.features[0] && onFlightClick) {
          onFlightClick(e.features[0].properties);
        }
      });

      map.on('mouseenter', 'layer-nodes-core', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-nodes-core', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'layer-danger-flights-core', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'layer-danger-flights-core', () => { map.getCanvas().style.cursor = ''; });
    }

    // حلقة النبض الأحمر الديناميكية للخطوط المغلقة والطائرات المهددة
    let pulseStep = 0;
    const animatePulse = () => {
      pulseStep = (pulseStep + 0.08) % (Math.PI * 2);
      const glowOpacity = 0.4 + Math.sin(pulseStep) * 0.4;
      const strokeWidth = 5.5 + Math.sin(pulseStep) * 2.5;
      const flightHaloRadius = 12 + Math.sin(pulseStep) * 4;

      if (map.getLayer('layer-closed-routes-glow')) {
        map.setPaintProperty('layer-closed-routes-glow', 'line-opacity', glowOpacity);
        map.setPaintProperty('layer-closed-routes-glow', 'line-width', strokeWidth);
      }
      if (map.getLayer('layer-danger-flights-glow')) {
        map.setPaintProperty('layer-danger-flights-glow', 'circle-radius', flightHaloRadius);
        map.setPaintProperty('layer-danger-flights-glow', 'circle-opacity', glowOpacity);
      }
      animFrameRef.current = requestAnimationFrame(animatePulse);
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animatePulse);

  }, [nodes, edges, optimalRoute, activeDangerZones, emergencyDiversion, liveFlights, showLiveFlights, mapLoaded, onNodeClick, onFlightClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 64px)', direction: 'rtl' }}>
      {/* خريطة Mapbox المقاومة للأعطال */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* دليل الرادار الاستراتيجي (عربي بالكامل) */}
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
