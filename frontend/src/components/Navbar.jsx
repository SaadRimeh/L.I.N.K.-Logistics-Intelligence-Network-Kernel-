import React from 'react';
import { Activity, ShieldAlert, Database, Cpu, Navigation, Ship, Radio } from 'lucide-react';

export default function Navbar({ 
  systemStatus, 
  activeDangerCount, 
  liveFlightsCount, 
  liveVesselsCount = 0, 
  onReset,
  onToggleRadar,
  radarOpen
}) {
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

      {/* مؤشرات القياس عن بعد الآنية وزر تشغيل الرادار */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleRadar}
          className={`cyber-btn ${radarOpen ? 'cyber-btn-primary pulsing-danger' : ''}`}
          style={{
            padding: '7px 12px',
            fontSize: '0.76rem',
            borderColor: '#00f2fe',
            color: radarOpen ? '#fff' : '#00f2fe'
          }}
        >
          <Radio size={14} className="radar-spinner" />
          <span>شاشة الرادار الحربي ({liveFlightsCount + liveVesselsCount} هدف)</span>
        </button>

        <div className="badge badge-cyan" style={{ padding: '6px 10px' }}>
          <Ship size={13} color="#00f2fe" />
          <span>البحر: {liveVesselsCount}</span>
        </div>

        <div className="badge badge-cyan" style={{ padding: '6px 10px' }}>
          <Activity size={13} />
          <span>الجو: {liveFlightsCount}</span>
        </div>

        {activeDangerCount > 0 ? (
          <div className="badge badge-danger pulsing-danger" style={{ padding: '6px 12px' }}>
            <ShieldAlert size={14} />
            <span>إنذارات: {activeDangerCount}</span>
          </div>
        ) : (
          <div className="badge badge-emerald" style={{ padding: '6px 12px' }}>
            <Activity size={13} />
            <span>مستقر</span>
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

