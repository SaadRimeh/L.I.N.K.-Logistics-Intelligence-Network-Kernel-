import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Crosshair, 
  Plane, 
  Ship, 
  ShieldAlert, 
  Maximize2, 
  Minimize2, 
  X, 
  Volume2, 
  VolumeX, 
  Target,
  Compass,
  AlertTriangle
} from 'lucide-react';

export default function LiveRadarScope({
  isOpen,
  onClose,
  liveFlights = [],
  liveVessels = [],
  onSelectEntity,
  selectedEntity
}) {
  const [radarMode, setRadarMode] = useState('ALL'); // 'ALL' | 'AIR' | 'MARITIME'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [lockedTarget, setLockedTarget] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [sweepAngle, setSweepAngle] = useState(0);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Radar Center point: Middle East tactical center (Riyadh / Gulf center ~ 25°N, 48°E)
  const RADAR_CENTER = { lat: 25.5, lon: 49.0 };
  const MAX_RANGE_KM = 1600.0; // Radar coverage radius in km

  // Continuous radar beam sweep animation loop
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle = (angle + 1.8) % 360;
      setSweepAngle(angle);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Sync locked target if external selection changes
  useEffect(() => {
    if (selectedEntity) {
      setLockedTarget(selectedEntity);
    }
  }, [selectedEntity]);

  if (!isOpen) return null;

  const militaryFlights = liveFlights.filter(f => f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE');

  // Filter contacts based on radar mode ('ALL' | 'AIR' | 'DEFENSE' | 'MARITIME')
  const airContacts = radarMode === 'MARITIME' 
    ? [] 
    : radarMode === 'DEFENSE'
      ? militaryFlights
      : liveFlights;

  const navalContacts = (radarMode === 'AIR' || radarMode === 'DEFENSE') ? [] : liveVessels;
  const totalContacts = airContacts.length + navalContacts.length;
  const dangerContactsCount = 
    airContacts.filter(f => f.in_danger).length + 
    navalContacts.filter(v => v.in_danger).length;

  // Converts geographic (lat, lon) to radar polar relative coordinates (-1 to 1)
  const geoToRadarCoords = (lat, lon) => {
    const dLat = (lat - RADAR_CENTER.lat) * 111.0;
    const dLon = (lon - RADAR_CENTER.lon) * 111.0 * Math.cos((RADAR_CENTER.lat * Math.PI) / 180.0);
    const distKm = Math.sqrt(dLat * dLat + dLon * dLon);
    const bearingRad = Math.atan2(dLon, dLat);

    const normRadius = Math.min(0.92, distKm / MAX_RANGE_KM);
    const x = normRadius * Math.sin(bearingRad);
    const y = -normRadius * Math.cos(bearingRad);

    return { x, y, distKm: Math.round(distKm) };
  };

  const handleTargetClick = (entity) => {
    setLockedTarget(entity);
    if (onSelectEntity) onSelectEntity(entity);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: isFullScreen ? 0 : 'auto',
      bottom: isFullScreen ? 0 : '24px',
      left: isFullScreen ? 0 : '24px',
      width: isFullScreen ? '100vw' : '490px',
      height: isFullScreen ? '100vh' : '520px',
      background: 'rgba(5, 12, 22, 0.94)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0, 242, 254, 0.4)',
      borderRadius: isFullScreen ? 0 : '14px',
      boxShadow: '0 0 50px rgba(0, 242, 254, 0.35)',
      zIndex: 2200,
      display: 'flex',
      flexDirection: 'column',
      direction: 'rtl',
      textAlign: 'right',
      overflow: 'hidden'
    }}>
      {/* 1. Header Toolbar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(0, 242, 254, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 20, 36, 0.9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="radar-spinner" style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2px solid #00f2fe',
            borderTopColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={14} color="#00f2fe" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.92rem', fontWeight: 700, color: '#00f2fe' }}>
                رادار المراقبة الحربي اللحظي (Tactical Radar HUD)
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>مسح 360° نشط</span>
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              تغطية رادارية: الخليج العربي، مضيق هرمز، البحر الأحمر، وبلاد الشام
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '5px',
              cursor: 'pointer'
            }}
            title={isFullScreen ? 'تصغير' : 'ملء الشاشة'}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '5px',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Radar Modes & Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'كافة الأهداف', count: totalContacts },
            { id: 'AIR', label: 'طيران جوي', count: liveFlights.length },
            { id: 'DEFENSE', label: '🛡️ دفاع واستطلاع', count: militaryFlights.length, isDefense: true },
            { id: 'MARITIME', label: 'أهداف بحرية', count: liveVessels.length }
          ].map(tab => {
            const isActive = radarMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setRadarMode(tab.id)}
                className="cyber-btn"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  background: isActive 
                    ? (tab.isDefense ? 'rgba(192, 132, 252, 0.3)' : 'rgba(0, 242, 254, 0.25)') 
                    : 'rgba(30, 41, 59, 0.5)',
                  borderColor: isActive 
                    ? (tab.isDefense ? '#c084fc' : '#00f2fe') 
                    : 'transparent',
                  color: isActive 
                    ? (tab.isDefense ? '#e9d5ff' : '#00f2fe') 
                    : 'var(--text-secondary)'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {dangerContactsCount > 0 ? (
          <span className="badge badge-danger pulsing-danger" style={{ fontSize: '0.66rem' }}>
            <AlertTriangle size={12} /> {dangerContactsCount} هدف في خطر!
          </span>
        ) : (
          <span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>
            المجال مستقر
          </span>
        )}
      </div>

      {/* 3. Main Radar Scope & Target List Split */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isFullScreen ? '1fr 420px' : '1fr',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden'
      }}>
        {/* Radar Circular Scope */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(0, 40, 50, 0.4) 0%, rgba(3, 10, 18, 0.95) 85%)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          overflow: 'hidden'
        }}>
          {/* Circular Scope Frame */}
          <div style={{
            position: 'relative',
            width: isFullScreen ? '560px' : '330px',
            height: isFullScreen ? '560px' : '330px',
            borderRadius: '50%',
            border: '2px solid rgba(0, 242, 254, 0.6)',
            boxShadow: 'inset 0 0 40px rgba(0, 242, 254, 0.2), 0 0 30px rgba(0, 242, 254, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Range Rings */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  width: `${ratio * 100}%`,
                  height: `${ratio * 100}%`,
                  borderRadius: '50%',
                  border: '1px dashed rgba(0, 242, 254, 0.25)',
                  pointerEvents: 'none'
                }}
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '8px',
                  fontFamily: 'var(--font-mono)',
                  color: 'rgba(0, 242, 254, 0.5)'
                }}>
                  {Math.round(ratio * 800)} NM
                </span>
              </div>
            ))}

            {/* Crosshairs & Heading Axis */}
            <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(0, 242, 254, 0.25)' }} />
            <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(0, 242, 254, 0.25)' }} />
            <div style={{ position: 'absolute', width: '100%', height: '1px', transform: 'rotate(45deg)', background: 'rgba(0, 242, 254, 0.12)' }} />
            <div style={{ position: 'absolute', width: '100%', height: '1px', transform: 'rotate(-45deg)', background: 'rgba(0, 242, 254, 0.12)' }} />

            {/* Radar Sweep Line */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '50%',
                height: '2px',
                transformOrigin: '0% 0%',
                transform: `rotate(${sweepAngle}deg)`,
                background: 'linear-gradient(90deg, #00f2fe, transparent)',
                boxShadow: '0 0 14px #00f2fe',
                pointerEvents: 'none'
              }}
            />

            {/* Sector Phosphor Glow Fan behind sweep */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(from ${sweepAngle - 45}deg at 50% 50%, rgba(0, 242, 254, 0.18) 0deg, transparent 45deg)`,
                pointerEvents: 'none'
              }}
            />

            {/* Center Origin Dot */}
            <div style={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00f2fe',
              boxShadow: '0 0 8px #00f2fe'
            }} />

            {/* Compass Cardinal Marks */}
            <span style={{ position: 'absolute', top: '6px', fontSize: '9px', fontWeight: 700, color: '#00f2fe' }}>N (000°)</span>
            <span style={{ position: 'absolute', bottom: '6px', fontSize: '9px', fontWeight: 700, color: 'rgba(0, 242, 254, 0.6)' }}>S (180°)</span>
            <span style={{ position: 'absolute', left: '8px', fontSize: '9px', fontWeight: 700, color: 'rgba(0, 242, 254, 0.6)' }}>W (270°)</span>
            <span style={{ position: 'absolute', right: '8px', fontSize: '9px', fontWeight: 700, color: 'rgba(0, 242, 254, 0.6)' }}>E (090°)</span>

            {/* PLOT AIRCRAFT CONTACTS */}
            {airContacts.map(flight => {
              const { x, y } = geoToRadarCoords(flight.lat, flight.lon);
              const isLocked = lockedTarget?.data?.callsign === flight.callsign;
              const isThreat = flight.in_danger;
              const color = isThreat ? '#ff2a5f' : '#38bdf8';

              // Convert normalized (-1 to 1) to percentage (0 to 100%)
              const leftPct = (x + 1) * 50;
              const topPct = (y + 1) * 50;

              return (
                <div
                  key={flight.callsign}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTargetClick({ type: 'FLIGHT', data: flight });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isLocked ? 50 : 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {/* Lock-on Reticle */}
                  {isLocked && (
                    <div className="pulsing-danger" style={{
                      position: 'absolute',
                      width: '26px',
                      height: '26px',
                      border: '1.5px solid #00f2fe',
                      borderRadius: '3px',
                      transform: 'translate(-50%, -50%)',
                      top: '50%',
                      left: '50%',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {/* Airplane Blip Symbol with Heading */}
                  <svg viewBox="0 0 24 24" width="16" height="16" 
                       style={{ transform: `rotate(${flight.heading_deg}deg)`, filter: `drop-shadow(0 0 6px ${color})` }}>
                    <path fill={color} stroke="#ffffff" strokeWidth="1"
                          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>

                  {/* Target Tag */}
                  <span style={{
                    fontSize: '7.5px',
                    fontFamily: 'var(--font-mono)',
                    color: isThreat ? '#fca5a5' : '#bae6fd',
                    background: 'rgba(5, 12, 22, 0.85)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isThreat ? '#ef4444' : 'rgba(56, 189, 248, 0.4)'}`
                  }}>
                    {isThreat ? `⚠️ ${flight.callsign}` : flight.callsign}
                  </span>
                </div>
              );
            })}

            {/* PLOT NAVAL VESSEL CONTACTS */}
            {navalContacts.map(vessel => {
              const { x, y } = geoToRadarCoords(vessel.lat, vessel.lon);
              const isLocked = lockedTarget?.data?.mmsi === vessel.mmsi;
              const isThreat = vessel.in_danger;
              const color = isThreat ? '#ff2a5f' : '#00f2fe';

              const leftPct = (x + 1) * 50;
              const topPct = (y + 1) * 50;

              return (
                <div
                  key={vessel.mmsi}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTargetClick({ type: 'VESSEL', data: vessel });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: isLocked ? 50 : 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  {isLocked && (
                    <div className="pulsing-danger" style={{
                      position: 'absolute',
                      width: '26px',
                      height: '26px',
                      border: '1.5px solid #ff2a5f',
                      borderRadius: '3px',
                      transform: 'translate(-50%, -50%)',
                      top: '50%',
                      left: '50%',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {/* Ship Diamond Symbol */}
                  <svg viewBox="0 0 24 24" width="14" height="14" 
                       style={{ transform: `rotate(${vessel.heading_deg}deg)`, filter: `drop-shadow(0 0 6px ${color})` }}>
                    <path fill={color} stroke="#ffffff" strokeWidth="1"
                          d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.47L20 13V6c0-1.1-.9-2-2-2h-3V1h-2v3h-2V1H9v3H6c-1.1 0-2 .9-2 2v7l-1.28.27c-.26.05-.48.23-.6.47s-.14.52-.06.78L3.95 19zM6 6h12v7H6V6z"/>
                  </svg>

                  <span style={{
                    fontSize: '7.5px',
                    fontFamily: 'var(--font-mono)',
                    color: isThreat ? '#fca5a5' : '#a5f3fc',
                    background: 'rgba(5, 12, 22, 0.85)',
                    padding: '1px 3px',
                    borderRadius: '2px',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isThreat ? '#ef4444' : 'rgba(0, 242, 254, 0.4)'}`
                  }}>
                    ⚓ {vessel.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Target Contact Stream (Shown in full screen or toggle) */}
        {isFullScreen && (
          <div style={{
            background: 'rgba(10, 18, 32, 0.85)',
            border: '1px solid var(--border-glow)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                سجل الأهداف الجوية والبحرية المتتبعة ({totalContacts})
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>تحديث لحظي</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
              {airContacts.map(f => (
                <div
                  key={f.callsign}
                  onClick={() => handleTargetClick({ type: 'FLIGHT', data: f })}
                  style={{
                    background: f.in_danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                    border: f.in_danger ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: f.in_danger ? '#fca5a5' : '#38bdf8' }}>
                      ✈️ {f.callsign} ({f.country})
                    </span>
                    <span className={`badge ${f.in_danger ? 'badge-danger pulsing-danger' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                      {f.in_danger ? 'خطر حظر جوي' : `${f.speed_kmh} كم/س`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    الارتفاع: {f.altitude_ft.toLocaleString()} قدم • زاوية المسار: {f.heading_deg}° • المشغل: {f.operator}
                  </div>
                </div>
              ))}

              {navalContacts.map(v => (
                <div
                  key={v.mmsi}
                  onClick={() => handleTargetClick({ type: 'VESSEL', data: v })}
                  style={{
                    background: v.in_danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                    border: v.in_danger ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: v.in_danger ? '#fca5a5' : '#00f2fe' }}>
                      ⚓ {v.name_ar || v.name}
                    </span>
                    <span className={`badge ${v.in_danger ? 'badge-danger pulsing-danger' : 'badge-emerald'}`} style={{ fontSize: '0.62rem' }}>
                      {v.in_danger ? 'خطر اعتراض' : `${v.speed_knots} عقدة`}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    الوجهة: {v.destination} • {v.flag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Locked Target Telemetry Bar at Bottom */}
      {lockedTarget && (
        <div style={{
          padding: '8px 14px',
          background: 'rgba(5, 15, 28, 0.95)',
          borderTop: '1px solid rgba(0, 242, 254, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="#00f2fe" />
            <span>
              <strong>هدف مقفل (Lock-on):</strong> {lockedTarget.type === 'FLIGHT' ? lockedTarget.data.callsign : lockedTarget.data.name}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              ({lockedTarget.data.lat}°N, {lockedTarget.data.lon}°E)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>
              السرعة: {lockedTarget.data.speed_kmh ? `${lockedTarget.data.speed_kmh} كم/س` : `${lockedTarget.data.speed_knots} عقدة`}
            </span>
            <span style={{ color: 'var(--accent-blue)' }}>
              الاتجاه: {lockedTarget.data.heading_deg}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
