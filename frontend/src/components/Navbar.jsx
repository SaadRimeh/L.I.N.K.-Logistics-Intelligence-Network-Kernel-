import React from 'react';
import { Activity, ShieldAlert, Database, Cpu, Navigation, Anchor } from 'lucide-react';

export default function Navbar({ systemStatus, activeDangerCount, onReset }) {
  return (
    <header className="glass-panel" style={{
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-glow)',
      zIndex: 1000
    }}>
      {/* Brand & Project Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #0284c7, #00f2fe)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(0, 242, 254, 0.45)'
        }}>
          <Navigation size={22} color="#080c16" strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, #ffffff, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              L.I.N.K.
            </h1>
            <span className="badge badge-cyan">DIGITAL TWIN v1.0</span>
          </div>
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
            margin: 0
          }}>
            Logistics Intelligence Network Kernel | Middle East Supply Chain Twin
          </p>
        </div>
      </div>

      {/* Real-time Telemetry Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="badge badge-emerald" style={{ padding: '6px 12px' }}>
          <Database size={13} />
          <span>NEO4J AURADB: {systemStatus.neo4j ? 'ONLINE' : 'LOCAL TWIN SEED'}</span>
        </div>

        <div className="badge badge-cyan" style={{ padding: '6px 12px' }}>
          <Cpu size={13} />
          <span>NETWORKX: {systemStatus.totalNodes} NODES / {systemStatus.totalEdges} CORRIDORS</span>
        </div>

        {activeDangerCount > 0 ? (
          <div className="badge badge-danger pulsing-danger" style={{ padding: '6px 12px' }}>
            <ShieldAlert size={14} />
            <span>ACLED ALERTS: {activeDangerCount} ACTIVE</span>
          </div>
        ) : (
          <div className="badge badge-cyan" style={{ padding: '6px 12px' }}>
            <Activity size={13} />
            <span>ACLED MONITORING: NORMAL</span>
          </div>
        )}

        <button
          onClick={onReset}
          className="cyber-btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          title="Reset entire network state to default OPEN"
        >
          RESET TWIN
        </button>
      </div>
    </header>
  );
}
