import React from 'react';
import { Activity, ShieldAlert, Database, Cpu, Navigation } from 'lucide-react';

export default function Navbar({ systemStatus, activeDangerCount, liveFlightsCount, onReset }) {
  return (
    <header className="glass-panel" style={{
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-glow)',
      zIndex: 1000,
      direction: 'rtl'
    }}>
      {/* هوية النظام والمشروع */}
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
              letterSpacing: '0.04em',
              background: 'linear-gradient(90deg, #ffffff, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              L.I.N.K.
            </h1>
            <span className="badge badge-cyan">التوأم الرقمي للشرق الأوسط</span>
          </div>
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
            margin: 0
          }}>
            نواة استخبارات شبكات الإمداد والمخاطر الجيوسياسية (Logistics Intelligence Network Kernel)
          </p>
        </div>
      </div>

      {/* مؤشرات القياس عن بعد الآنية (Live Telemetry) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="badge badge-emerald" style={{ padding: '6px 12px' }}>
          <Database size={13} />
          <span>قاعدة NEO4J: {systemStatus.neo4j ? 'متصل سحابياً' : 'توأم محلي'}</span>
        </div>

        <div className="badge badge-cyan" style={{ padding: '6px 12px' }}>
          <Cpu size={13} />
          <span>الشبكة: {systemStatus.totalNodes} عقدة / {systemStatus.totalEdges} ممر</span>
        </div>

        <div className="badge badge-cyan" style={{ padding: '6px 12px' }}>
          <Activity size={13} />
          <span>طيران OPENSKY المباشر: {liveFlightsCount} طائرة</span>
        </div>

        {activeDangerCount > 0 ? (
          <div className="badge badge-danger pulsing-danger" style={{ padding: '6px 12px' }}>
            <ShieldAlert size={14} />
            <span>إنذارات ACLED: {activeDangerCount} منطقة خطر</span>
          </div>
        ) : (
          <div className="badge badge-emerald" style={{ padding: '6px 12px' }}>
            <Activity size={13} />
            <span>المخاطر الجيوسياسية: مستقرة</span>
          </div>
        )}

        <button
          onClick={onReset}
          className="cyber-btn"
          style={{ padding: '6px 14px', fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)' }}
          title="إعادة ضبط كافة الممرات والمجالات الجوية للحالة الطبيعية"
        >
          إعادة ضبط النظام
        </button>
      </div>
    </header>
  );
}
