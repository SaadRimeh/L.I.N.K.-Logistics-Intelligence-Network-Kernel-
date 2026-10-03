import React, { useState } from 'react';
import { 
  Navigation, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Truck, 
  Plane, 
  Ship, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Sparkles,
  Zap,
  Radio,
  BrainCircuit,
  Flame,
  Anchor,
  MapPin,
  Eye,
  Crosshair,
  Activity
} from 'lucide-react';


export default function ControlPanel({
  nodes = [],
  edges = [],
  routesAnalysis = [],
  origin,
  setOrigin,
  destination,
  setDestination,
  priority,
  setPriority,
  onCalculateRoute,
  routeResult,
  isLoadingRoute,
  onSimulateScenario,
  onOpenEmergencyModal,
  onOpenDecisionDeck,
  onOpenEnergyDeck,
  activeScenario,
  domainFilter,
  setDomainFilter,
  flightTypeFilter = 'ALL',
  setFlightTypeFilter,
  liveFlights = [],
  liveVessels = [],
  energyFacilities = [],
  militaryThreats = [],
  onSelectEntity,
  selectedEntity
}) {
  const [activeTab, setActiveTab] = useState('DOMAIN_VIEW'); // 'DOMAIN_VIEW' | 'ROUTING_ENGINE' | 'SCENARIOS'
  const [flightSearchQuery, setFlightSearchQuery] = useState('');

  const militaryFlights = liveFlights.filter(f => f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE');

  const getNodeIcon = (type) => {
    switch (type) {
      case 'PORT': return <Ship size={13} color="#00f2fe" />;
      case 'AIRPORT': return <Plane size={13} color="#38bdf8" />;
      case 'LOGISTICS_HUB': return <Truck size={13} color="#f59e0b" />;
      case 'CHOKEPOINT': return <AlertTriangle size={13} color="#ef4444" />;
      default: return <Navigation size={13} color="#94a3b8" />;
    }
  };

  const getModeLabelAr = (mode) => {
    switch (mode) {
      case 'MARITIME': return 'نقل بحري (بواخر)';
      case 'LAND': return 'جسر بري (شاحنات)';
      case 'AIR': return 'ممر جوي (طيران)';
      case 'TRANSFER': return 'تحويل متعدد الوسائط';
      default: return mode;
    }
  };

  // Filtered routes based on selected domain
  const filteredRoutes = routesAnalysis.filter(r => {
    if (domainFilter === 'MARITIME') return r.mode === 'MARITIME';
    if (domainFilter === 'AIR') return r.mode === 'AIR';
    if (domainFilter === 'LAND') return r.mode === 'LAND' || r.mode === 'TRANSFER';
    return true;
  });

  const dangerFlights = liveFlights.filter(f => f.in_danger);
  const dangerVessels = liveVessels.filter(v => v.in_danger);

  return (
    <aside className="glass-panel" style={{
      width: '450px',
      maxWidth: '92vw',
      height: 'calc(100% - 64px)',
      position: 'absolute',
      top: '64px',
      right: '0',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '12px',
      overflowY: 'auto',
      direction: 'rtl',
      textAlign: 'right'
    }}>
      {/* 1. DOMAIN FILTER SELECTOR (المسارات المائية، الجوية، البرية، الطاقة) */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid var(--border-glow)',
        borderRadius: '10px',
        padding: '10px'
      }}>
        <div style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>تصنيف ومجال العمليات الميدانية:</span>
          <span className="badge badge-cyan" style={{ fontSize: '0.64rem' }}>
            {domainFilter === 'MARITIME' ? 'المسارات المائية' :
             domainFilter === 'AIR' ? 'المسارات الجوية' :
             domainFilter === 'DEFENSE' ? 'دفاع واستطلاع 🛡️' :
             domainFilter === 'LAND' ? 'النقل البري' :
             domainFilter === 'ENERGY' ? 'قطاع الطاقة' : 'الشبكة الموحدة'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
          {[
            { id: 'MARITIME', label: 'مائي', icon: <Ship size={14} />, badge: liveVessels.length },
            { id: 'AIR', label: 'طيران', icon: <Plane size={14} />, badge: liveFlights.length },
            { id: 'DEFENSE', label: 'دفاع', icon: <ShieldAlert size={14} />, badge: militaryFlights.length, isDefense: true },
            { id: 'LAND', label: 'بري', icon: <Truck size={14} /> },
            { id: 'ENERGY', label: 'طاقة', icon: <Flame size={14} />, badge: energyFacilities.length },
            { id: 'ALL', label: 'الكل', icon: <Layers size={14} /> }
          ].map(d => {
            const isActive = domainFilter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setDomainFilter(d.id);
                  if (d.id === 'DEFENSE' && setFlightTypeFilter) {
                    setFlightTypeFilter('MILITARY');
                  }
                }}
                className="cyber-btn"
                style={{
                  padding: '7px 2px',
                  fontSize: '0.67rem',
                  flexDirection: 'column',
                  gap: '2px',
                  background: isActive 
                    ? (d.isDefense ? 'rgba(192, 132, 252, 0.3)' : 'rgba(0, 242, 254, 0.25)')
                    : 'rgba(30, 41, 59, 0.6)',
                  borderColor: isActive 
                    ? (d.isDefense ? '#c084fc' : 'var(--accent-cyan)')
                    : 'var(--border-subtle)',
                  color: isActive 
                    ? (d.isDefense ? '#e9d5ff' : 'var(--accent-cyan)')
                    : 'var(--text-secondary)',
                  boxShadow: isActive 
                    ? (d.isDefense ? '0 0 12px rgba(192, 132, 252, 0.4)' : '0 0 12px rgba(0, 242, 254, 0.3)')
                    : 'none'
                }}
              >
                {d.icon}
                <span>{d.label}</span>
                {d.badge !== undefined && (
                  <span style={{ fontSize: '0.58rem', opacity: 0.85 }}>({d.badge})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MILITARY THREAT & DANGER ALERT TICKER */}
      {(militaryThreats.length > 0 || dangerFlights.length > 0 || dangerVessels.length > 0) && (
        <div className="glass-panel-danger pulsing-danger" style={{
          padding: '10px 12px',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '0.74rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontWeight: 700 }}>
            <ShieldAlert size={16} color="#ef4444" />
            <span>إنذار أمني عسكري مباشر من السيرفر:</span>
          </div>
          {dangerFlights.length > 0 && (
            <div style={{ color: '#fecaca' }}>
              • رصد <strong>{dangerFlights.length} طائرة</strong> ضمن مجال حظر جوي نشط (محددة بالأحمر والاتجاه لمطار بديل).
            </div>
          )}
          {dangerVessels.length > 0 && (
            <div style={{ color: '#fecaca' }}>
              • رصد <strong>{dangerVessels.length} سفينة/ناقلة نفط</strong> بمضيق مهدد (توجيه فوري للرسو الاضطراري).
            </div>
          )}
          {militaryThreats.map((t, idx) => (
            <div key={idx} style={{ color: '#fee2e2' }}>
              • {t.title}
            </div>
          ))}
        </div>
      )}

      {/* 3. PRIMARY ACTION MODAL SHORTCUTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <button
          onClick={onOpenEnergyDeck}
          className="cyber-btn"
          style={{
            padding: '9px 10px',
            fontSize: '0.74rem',
            borderColor: 'rgba(245, 158, 11, 0.6)',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.15)'
          }}
        >
          <Flame size={15} color="#f59e0b" />
          قسم الطاقة والاستهداف الحربي
        </button>

        <button
          onClick={onOpenDecisionDeck}
          className="cyber-btn"
          style={{
            padding: '9px 10px',
            fontSize: '0.74rem',
            borderColor: 'var(--accent-cyan)',
            color: 'var(--accent-cyan)'
          }}
        >
          <BrainCircuit size={15} />
          لوحة الذكاء والبدائل
        </button>
      </div>

      {/* 4. MODE TABS: Domain List vs. Route Generator vs. Scenarios */}
      <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('DOMAIN_VIEW')}
          className="cyber-btn"
          style={{
            flex: 1,
            padding: '7px',
            fontSize: '0.72rem',
            background: activeTab === 'DOMAIN_VIEW' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
            borderColor: activeTab === 'DOMAIN_VIEW' ? '#38bdf8' : 'transparent',
            color: activeTab === 'DOMAIN_VIEW' ? '#bae6fd' : 'var(--text-secondary)'
          }}
        >
          بيانات الممرات ({domainFilter})
        </button>

        <button
          onClick={() => setActiveTab('ROUTING_ENGINE')}
          className="cyber-btn"
          style={{
            flex: 1,
            padding: '7px',
            fontSize: '0.72rem',
            background: activeTab === 'ROUTING_ENGINE' ? 'rgba(0, 242, 254, 0.25)' : 'transparent',
            borderColor: activeTab === 'ROUTING_ENGINE' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'ROUTING_ENGINE' ? 'var(--accent-cyan)' : 'var(--text-secondary)'
          }}
        >
          محرك التوجيه الذكي
        </button>

        <button
          onClick={() => setActiveTab('SCENARIOS')}
          className="cyber-btn"
          style={{
            flex: 1,
            padding: '7px',
            fontSize: '0.72rem',
            background: activeTab === 'SCENARIOS' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
            borderColor: activeTab === 'SCENARIOS' ? '#ef4444' : 'transparent',
            color: activeTab === 'SCENARIOS' ? '#fca5a5' : 'var(--text-secondary)'
          }}
        >
          محاكاة الأزمات
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION A: DOMAIN VIEW (Vessels / Flights / Corridors / Risk) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'DOMAIN_VIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* MARITIME DOMAIN: Vessels & Ports */}
          {(domainFilter === 'ALL' || domainFilter === 'MARITIME') && (
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ship size={15} /> البواخر والناقلات النشطة بالباك ({liveVessels.length})
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>AIS لايف</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {liveVessels.map(v => (
                  <div
                    key={v.mmsi}
                    onClick={() => onSelectEntity({ type: 'VESSEL', data: v })}
                    style={{
                      background: v.in_danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                      border: v.in_danger ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: v.in_danger ? '#fca5a5' : '#f8fafc' }}>
                        {v.name_ar || v.name}
                      </span>
                      <span className={`badge ${v.in_danger ? 'badge-danger pulsing-danger' : 'badge-emerald'}`} style={{ fontSize: '0.62rem' }}>
                        {v.in_danger ? 'إنذار اعتراض' : `${v.speed_knots} عقدة`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      الوجهة: <span style={{ color: 'var(--accent-cyan)' }}>{v.destination}</span> • {v.flag}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEFENSE & RECON DOMAIN: Military Reconnaissance, AWACS & Air Patrol */}
          {(domainFilter === 'ALL' || domainFilter === 'DEFENSE') && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 16, 50, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(192, 132, 252, 0.45)',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 0 15px rgba(192, 132, 252, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} color="#c084fc" /> أسطول الدفاع والاستطلاع والإنذار المبكر ({militaryFlights.length})
                </span>
                <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#e9d5ff', border: '1px solid #c084fc', fontSize: '0.62rem' }}>
                  AWACS & دوريات تكتيكية
                </span>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginBottom: '8px' }}>
                طائرات استطلاع إلكتروني، إنذار مبكر، ومراقبة بحرية وجوية ترسم مسارات متقطعة (- - - - -) بالخريطة:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                {militaryFlights.map((f, idx) => {
                  const isSelected = selectedEntity?.type === 'FLIGHT' && selectedEntity.data?.callsign === f.callsign;
                  return (
                    <div
                      key={f.icao || idx}
                      onClick={() => onSelectEntity({ type: 'FLIGHT', data: f })}
                      style={{
                        background: isSelected ? 'rgba(192, 132, 252, 0.3)' : 'rgba(0, 0, 0, 0.45)',
                        border: isSelected ? '1.5px solid #c084fc' : '1px solid rgba(192, 132, 252, 0.25)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 0 12px rgba(192, 132, 252, 0.4)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isSelected ? '#ffffff' : '#e9d5ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          🛡️ {f.callsign}
                          <span style={{ fontSize: '0.64rem', color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                            {f.country}
                          </span>
                        </span>
                        <span className="badge" style={{ background: 'rgba(192, 132, 252, 0.25)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.4)', fontSize: '0.62rem' }}>
                          {isSelected ? 'تتبع المسار 🎯' : `${f.speed_kmh} كم/س`}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.70rem', color: '#ddd6fe', marginTop: '3px', fontWeight: 500 }}>
                        {f.operator}
                      </div>

                      {(f.origin_name || f.dest_name) && (
                        <div style={{ fontSize: '0.66rem', color: '#c084fc', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{f.origin_icao || f.origin_name}</span>
                          <span style={{ letterSpacing: '1px' }}>- - -➔- - -</span>
                          <span>{f.dest_icao || f.dest_name}</span>
                          {f.aircraft_model && <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>• {f.aircraft_model}</span>}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <span>الارتفاع: {(f.altitude_ft || 0).toLocaleString()} قدم</span>
                        <span>شفرة الرادار: <strong style={{ color: '#c084fc' }}>{f.squawk || '7777'}</strong></span>
                        <span>الاتجاه: {f.heading_deg}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AIR DOMAIN: Flights & Airports */}
          {(domainFilter === 'ALL' || domainFilter === 'AIR') && (
            <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plane size={15} /> الطائرات النشطة بأجواء الشرق الأوسط
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{liveFlights.length} طائرة</span>
              </div>

              {/* Flight Search & Filter Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="بحث برقم الرحلة، الناقل الجوي، أو الدولة..."
                  value={flightSearchQuery}
                  onChange={(e) => setFlightSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '5px',
                    padding: '6px 10px',
                    fontSize: '0.72rem',
                    color: '#f8fafc',
                    outline: 'none',
                    direction: 'rtl'
                  }}
                />

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['ALL', 'DANGER', 'COMMERCIAL', 'CARGO', 'MILITARY'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        if (setFlightTypeFilter) setFlightTypeFilter(tab);
                      }}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '3px',
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: 'none',
                        background: flightTypeFilter === tab ? (tab === 'MILITARY' ? '#c084fc' : '#38bdf8') : 'rgba(255,255,255,0.06)',
                        color: flightTypeFilter === tab ? '#000' : 'var(--text-secondary)'
                      }}
                    >
                      {tab === 'ALL' && `الكل (${liveFlights.length})`}
                      {tab === 'DANGER' && `⚠️ في خطر (${dangerFlights.length})`}
                      {tab === 'COMMERCIAL' && 'تجاري'}
                      {tab === 'CARGO' && 'شحن'}
                      {tab === 'MILITARY' && `🛡️ دفاع واستطلاع (${militaryFlights.length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list of matching flights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                {liveFlights
                  .filter(f => {
                    if (flightTypeFilter === 'DANGER') return f.in_danger;
                    if (flightTypeFilter === 'COMMERCIAL') return f.flight_type === 'COMMERCIAL' || (!f.flight_type && !f.in_danger);
                    if (flightTypeFilter === 'CARGO') return f.flight_type === 'CARGO';
                    if (flightTypeFilter === 'MILITARY') return f.flight_type === 'MILITARY' || f.flight_type === 'VIP' || f.flight_type === 'DEFENSE';
                    return true;
                  })
                  .filter(f => {
                    if (!flightSearchQuery.trim()) return true;
                    const q = flightSearchQuery.toLowerCase();
                    return (
                      (f.callsign || '').toLowerCase().includes(q) ||
                      (f.operator || '').toLowerCase().includes(q) ||
                      (f.country || '').toLowerCase().includes(q) ||
                      (f.origin_name || '').toLowerCase().includes(q) ||
                      (f.dest_name || '').toLowerCase().includes(q)
                    );
                  })
                  .map((f, idx) => (
                    <div
                      key={f.icao || idx}
                      onClick={() => onSelectEntity({ type: 'FLIGHT', data: f })}
                      style={{
                        background: f.in_danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                        border: f.in_danger ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: f.in_danger ? '#fca5a5' : '#f8fafc' }}>
                          ✈️ {f.callsign} <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>({f.operator || f.country})</span>
                        </span>
                        <span className={`badge ${f.in_danger ? 'badge-danger pulsing-danger' : 'badge-cyan'}`} style={{ fontSize: '0.62rem' }}>
                          {f.in_danger ? 'خطر حظر جوي' : `${f.speed_kmh} كم/س`}
                        </span>
                      </div>
                      
                      {/* Origin -> Destination Line */}
                      {(f.origin_icao || f.origin_name) && (
                        <div style={{ fontSize: '0.66rem', color: '#7dd3fc', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{f.origin_icao || f.origin_name}</span>
                          <span>➔</span>
                          <span>{f.dest_icao || f.dest_name}</span>
                          {f.aircraft_model && <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>• {f.aircraft_model}</span>}
                        </div>
                      )}

                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        الارتفاع: {(f.altitude_ft || 0).toLocaleString()} قدم • زاوية المسار: {f.heading_deg}°
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ROUTE RISK ANALYSIS FROM BACKEND */}
          <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-glow)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} /> تحليل نسب المخاطر للممرات ({filteredRoutes.length} ممر)
              </span>
              <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>مؤشر الأمان</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
              {filteredRoutes.map((r, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectEntity({ type: 'ROUTE', data: r })}
                  style={{
                    background: r.status === 'CLOSED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.4)',
                    border: r.status === 'CLOSED' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.source_name} ➔ {r.target_name}
                    </span>
                    <span className={`badge ${r.risk_percentage > 40 ? 'badge-danger' : 'badge-emerald'}`} style={{ fontSize: '0.64rem' }}>
                      نسبة الخطر: {r.risk_percentage}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    <span>{getModeLabelAr(r.mode)} • {r.distance_km} كم</span>
                    <span style={{ color: r.status === 'CLOSED' ? '#ef4444' : '#10b981' }}>
                      {r.status === 'CLOSED' ? 'مغلق عسكرياً' : 'مفتوح وآمن'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION B: MULTI-MODAL ROUTING ENGINE                          */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ROUTING_ENGINE' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-glow)',
          borderRadius: '10px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={16} /> اقتراح أفضل مسار (سرعة، أمان، تكلفة)
          </div>

          {/* Origin */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              نقطة الانطلاق:
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(10, 15, 29, 0.95)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name_ar || n.name} ({n.country}) - [{n.type}]
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
              بوابة الوصول والوجهة النهائية:
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'rgba(10, 15, 29, 0.95)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: 'var(--text-primary)',
                fontSize: '0.8rem'
              }}
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name_ar || n.name} ({n.country}) - [{n.type}]
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              معيار الأولوية بالسيرفر:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {[
                { id: 'balanced', label: 'متوازن', icon: <Layers size={12} /> },
                { id: 'time', label: 'الأسرع زمناً', icon: <Clock size={12} /> },
                { id: 'cost', label: 'الأقل تكلفة', icon: <DollarSign size={12} /> },
                { id: 'risk', label: 'تجنب المخاطر', icon: <ShieldAlert size={12} /> }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPriority(p.id)}
                  className="cyber-btn"
                  style={{
                    padding: '6px 8px',
                    fontSize: '0.7rem',
                    background: priority === p.id ? 'rgba(0, 242, 254, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                    borderColor: priority === p.id ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    color: priority === p.id ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={onCalculateRoute}
            disabled={isLoadingRoute}
            className="cyber-btn cyber-btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.84rem' }}
          >
            {isLoadingRoute ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="radar-spinner" style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                جاري حساب المسار المقاوم للمخاطر...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> توليد وتأكيد المسار المقترح
              </span>
            )}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION C: CRISIS SIMULATION SCENARIOS                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'SCENARIOS' && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
            محاكاة أحداث النزاع الإقليمي الحقيقي:
          </div>

          <button
            onClick={() => onSimulateScenario('scenario_1_maritime_closure')}
            className={`cyber-btn ${activeScenario === 'scenario_1_maritime_closure' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Ship size={16} />
            <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.78rem' }}>1. اعتراض بحري وإغلاق مضيق هرمز</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>تحويل فوري وتفريغ بالجسر البري السعودي</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateScenario('scenario_2_airspace_hazard')}
            className={`cyber-btn ${activeScenario === 'scenario_2_airspace_hazard' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Plane size={16} />
            <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.78rem' }}>2. إغلاق مفاجئ للأجواء (طيران حربي/صواريخ)</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>رسم مسار الخطر بالأحمر وتوجيه لمطار عمّان/بغداد</div>
            </div>
          </button>

          <button
            onClick={() => onSimulateScenario('scenario_3_turkish_lifeline')}
            className={`cyber-btn ${activeScenario === 'scenario_3_turkish_lifeline' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Truck size={16} />
            <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.78rem' }}>3. الجسر المنقذ (ميناء مرسين التركي)</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>تفعيل ممر مرسين ➔ معبر زاخو ➔ الرياض</div>
            </div>
          </button>
        </div>
      )}

      {/* 5. ROUTE OPTIMIZATION RESULT CARD */}
      {routeResult && routeResult.success && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> المسار المقترح المعتمد
            </span>
            {routeResult.is_multimodal ? (
              <span className="badge badge-amber">متعدد الوسائط</span>
            ) : (
              <span className="badge badge-cyan">{getModeLabelAr(routeResult.modes_used[0])}</span>
            )}
          </div>

          {routeResult.contingency_applied && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              padding: '6px 8px',
              marginBottom: '10px',
              fontSize: '0.72rem',
              color: '#fde047',
              lineHeight: 1.3
            }}>
              <strong>⚡ توجيه السيرفر:</strong> {routeResult.contingency_applied}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>المسافة</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{routeResult.total_distance_km} كم</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>الزمن</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{routeResult.total_time_hours} س</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>التكلفة</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>${routeResult.total_cost_usd}</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>الخطورة</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: routeResult.aggregate_risk > 0.1 ? '#ef4444' : '#10b981' }}>
                {Math.round(routeResult.aggregate_risk * 100)}%
              </div>
            </div>
          </div>

          {/* Waypoints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {routeResult.segments.map((seg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '5px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem'
              }}>
                {getNodeIcon(seg.mode === 'MARITIME' ? 'PORT' : seg.mode === 'AIR' ? 'AIRPORT' : 'LOGISTICS_HUB')}
                <div style={{ flex: 1 }}>
                  <span>{seg.source_name}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>➔</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{seg.target_name}</span>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{getModeLabelAr(seg.mode)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
