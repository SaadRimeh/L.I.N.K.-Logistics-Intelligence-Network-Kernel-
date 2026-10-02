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
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';

export default function ControlPanel({
  nodes,
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
  activeScenario
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const getNodeIcon = (type) => {
    switch (type) {
      case 'PORT': return <Ship size={14} color="#00f2fe" />;
      case 'AIRPORT': return <Plane size={14} color="#38bdf8" />;
      case 'LOGISTICS_HUB': return <Truck size={14} color="#f59e0b" />;
      case 'CHOKEPOINT': return <AlertTriangle size={14} color="#ef4444" />;
      default: return <Navigation size={14} color="#94a3b8" />;
    }
  };

  return (
    <aside className="glass-panel" style={{
      width: '420px',
      height: 'calc(100% - 64px)',
      position: 'absolute',
      top: '64px',
      left: '0',
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px',
      gap: '16px',
      overflowY: 'auto'
    }}>
      {/* Geopolitical Threat Simulation Deck */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '10px',
        padding: '14px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Zap size={15} /> GEOPOLITICAL SCENARIO ENGINE
          </span>
          {activeScenario && (
            <span className="badge badge-danger pulsing-danger">ACTIVE SIMULATION</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Scenario 1 Button */}
          <button
            onClick={() => onSimulateScenario('scenario_1_maritime_closure')}
            className={`cyber-btn ${activeScenario === 'scenario_1_maritime_closure' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Ship size={16} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem' }}>1. Strait of Hormuz Closure</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Auto-divert via Saudi Land Bridge</div>
            </div>
          </button>

          {/* Scenario 2 Button */}
          <button
            onClick={() => onSimulateScenario('scenario_2_airspace_hazard')}
            className={`cyber-btn ${activeScenario === 'scenario_2_airspace_hazard' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Plane size={16} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem' }}>2. Airspace Interdiction (Iran/Syria)</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Shapely Collision + Safe Haven Divert</div>
            </div>
          </button>

          {/* Scenario 3 Button */}
          <button
            onClick={() => onSimulateScenario('scenario_3_turkish_lifeline')}
            className={`cyber-btn ${activeScenario === 'scenario_3_turkish_lifeline' ? 'cyber-btn-danger pulsing-danger' : ''}`}
            style={{ justifyContent: 'flex-start', padding: '9px 12px' }}
          >
            <Truck size={16} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.78rem' }}>3. Turkish Lifeline Corridor</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Mersin Port Gateway - Zakho - Gulf</div>
            </div>
          </button>
        </div>
      </div>

      {/* Autonomous Route Dispatcher Panel */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--border-glow)',
        borderRadius: '10px',
        padding: '16px'
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'var(--accent-blue)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Compass size={16} /> MULTI-MODAL ROUTE DISPATCHER
        </div>

        {/* Origin Selector */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            ORIGIN DISPATCH POINT:
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '6px',
              background: 'rgba(10, 15, 29, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem'
            }}
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>
                [{n.type}] {n.name_ar || n.name} ({n.country})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Selector */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            DESTINATION GATEWAY:
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '6px',
              background: 'rgba(10, 15, 29, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem'
            }}
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>
                [{n.type}] {n.name_ar || n.name} ({n.country})
              </option>
            ))}
          </select>
        </div>

        {/* Priority Balancing Filter */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            OPTIMIZATION OBJECTIVE:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { id: 'balanced', label: 'Balanced', icon: <Layers size={13} /> },
              { id: 'time', label: 'Fastest', icon: <Clock size={13} /> },
              { id: 'cost', label: 'Lowest Cost', icon: <DollarSign size={13} /> },
              { id: 'risk', label: 'Max Safety', icon: <ShieldAlert size={13} /> }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className="cyber-btn"
                style={{
                  padding: '6px 8px',
                  fontSize: '0.75rem',
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
          style={{ width: '100%', padding: '11px', fontSize: '0.88rem' }}
        >
          {isLoadingRoute ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="radar-spinner" style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
              COMPUTING RESILIENT ROUTE...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} /> CALCULATE OPTIMAL PATH
            </span>
          )}
        </button>

        {/* Emergency Flight Diversion Button */}
        <button
          onClick={onOpenEmergencyModal}
          className="cyber-btn"
          style={{
            width: '100%',
            marginTop: '8px',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#f87171'
          }}
        >
          <Plane size={15} /> SIMULATE IN-FLIGHT EMERGENCY DIVERT
        </button>
      </div>

      {/* Route Details Card */}
      {routeResult && routeResult.success && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={16} /> ROUTE COMPUTED
            </span>
            {routeResult.is_multimodal ? (
              <span className="badge badge-amber">MULTI-MODAL</span>
            ) : (
              <span className="badge badge-cyan">{routeResult.modes_used[0]}</span>
            )}
          </div>

          {/* Contingency Notification Banner */}
          {routeResult.contingency_applied && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '12px',
              fontSize: '0.76rem',
              color: '#fde047',
              lineHeight: 1.3
            }}>
              <strong>⚡ TACTICAL DIVERSION:</strong> {routeResult.contingency_applied}
            </div>
          )}

          {/* Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>DISTANCE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {routeResult.total_distance_km} km
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>TRANSIT TIME</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {routeResult.total_time_hours} hrs
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ESTIMATED COST</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${routeResult.total_cost_usd}
              </div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>RISK FACTOR</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: routeResult.aggregate_risk > 0.1 ? '#ef4444' : '#10b981' }}>
                {routeResult.aggregate_risk}
              </div>
            </div>
          </div>

          {/* Waypoints Flow */}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>WAYPOINT SEQUENCE:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {routeResult.segments.map((seg, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  {getNodeIcon(seg.mode === 'MARITIME' ? 'PORT' : seg.mode === 'AIR' ? 'AIRPORT' : 'LOGISTICS_HUB')}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{seg.source_name}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>➔</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>{seg.target_name}</span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{seg.mode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
