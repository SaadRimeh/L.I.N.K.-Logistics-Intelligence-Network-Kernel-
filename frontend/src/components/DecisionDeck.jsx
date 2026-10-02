import React from 'react';
import { 
  BrainCircuit, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  Plane, 
  Ship, 
  Truck, 
  CheckCircle2, 
  AlertOctagon, 
  TrendingUp, 
  ChevronRight,
  X
} from 'lucide-react';

export default function DecisionDeck({ isOpen, onClose, intelligenceData, onTriggerScenario }) {
  if (!isOpen || !intelligenceData) return null;

  const {
    overall_threat_level,
    composite_risk_index_percentage,
    active_closed_corridors_count,
    aviation_intelligence,
    maritime_intelligence,
    executive_decision_ar
  } = intelligenceData;

  const isCritical = overall_threat_level === 'CRITICAL';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      direction: 'rtl'
    }}>
      <div className="glass-panel" style={{
        width: '840px',
        maxHeight: '90vh',
        borderRadius: '14px',
        padding: '24px',
        border: `1px solid ${isCritical ? '#ef4444' : 'var(--accent-cyan)'}`,
        boxShadow: `0 0 35px ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 242, 254, 0.25)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 242, 254, 0.15)',
              border: `1px solid ${isCritical ? '#ef4444' : 'var(--accent-cyan)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BrainCircuit size={24} color={isCritical ? '#ef4444' : '#00f2fe'} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                نظام الذكاء اللوجستي ودعم القرار الاستراتيجي (L.I.N.K. AI)
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                تحليل المخاطر الجيوسياسية، تكاليف التحويل، وتوليد مسارات الطوارئ الآلية
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Executive Verdict Banner */}
        <div style={{
          background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          borderRadius: '8px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {isCritical ? <AlertOctagon size={26} color="#ef4444" style={{ flexShrink: 0 }} /> : <CheckCircle2 size={26} color="#10b981" style={{ flexShrink: 0 }} />}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isCritical ? '#fca5a5' : '#6ee7b7', marginBottom: '4px' }}>
              التوجيه التنفيذي الآلي للشبكة اللوجستية:
            </div>
            <div style={{ fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.5 }}>
              {executive_decision_ar}
            </div>
          </div>
        </div>

        {/* High-level KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>مؤشر المخاطر الإقليمي</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: composite_risk_index_percentage > 30 ? '#ef4444' : '#10b981' }}>
              {composite_risk_index_percentage}%
            </div>
            <div style={{ fontSize: '0.68rem', color: isCritical ? '#f87171' : '#38bdf8' }}>حالة: {overall_threat_level}</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>الممرات المغلقة فورياً</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b' }}>
              {active_closed_corridors_count} ممر
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>بحري وجوي وبري</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>طائرات في دائرة الخطر</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: aviation_intelligence?.threatened_flights_count > 0 ? '#ef4444' : '#38bdf8' }}>
              {aviation_intelligence?.threatened_flights_count || 0} طائرة
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>من أصل {aviation_intelligence?.total_monitored_flights || 0} بالجو</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>توفير غرامات التأخير اليومية</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
              ${maritime_intelligence?.daily_demurrage_saved_usd?.toLocaleString() || 0}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>عبر تفريغ الشحنات المبكر</div>
          </div>
        </div>

        {/* Detailed Aviation & Maritime Analysis Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          
          {/* بطاقة تحليل الطوارئ الجوية */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
              <Plane size={18} /> تحليل الطوارئ الجوية والهبوط الآمن
            </div>
            
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>مطار الملاذ الآمن الأساسي:</strong> {aviation_intelligence?.recommended_safe_haven_primary}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>مطار الملاذ البديل:</strong> {aviation_intelligence?.recommended_safe_haven_secondary}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>تكلفة انحراف الوقود التقديرية:</strong> ${aviation_intelligence?.total_estimated_divert_cost_usd?.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>ضغط الممرات البديلة:</strong> {aviation_intelligence?.estimated_air_traffic_congestion}
            </div>
            
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              lineHeight: 1.4,
              marginTop: '4px'
            }}>
              {aviation_intelligence?.systemic_flight_impact}
            </div>
          </div>

          {/* بطاقة تحليل الطوارئ البحرية والرسو الاضطراري */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontWeight: 700, fontSize: '0.9rem' }}>
              <Ship size={18} /> تحليل الرسو وتفريغ البواخر الاضطراري
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>ميناء الرسو والتفريغ الموصى به:</strong> {maritime_intelligence?.recommended_emergency_port}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>ميناء الاحتياط التكتيكي:</strong> {maritime_intelligence?.backup_emergency_port}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>الجسر البري الرابط:</strong> {maritime_intelligence?.recommended_land_bridge}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <strong>أسطول الشاحنات المطلوب يومياً:</strong> {maritime_intelligence?.truck_fleet_needed_per_day} شاحنة
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#cbd5e1',
              lineHeight: 1.4,
              marginTop: '4px'
            }}>
              {maritime_intelligence?.systemic_naval_impact}
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button onClick={onClose} className="cyber-btn cyber-btn-primary" style={{ padding: '9px 20px' }}>
            تطبيق التوجيهات وإغلاق اللوحة
          </button>
        </div>
      </div>
    </div>
  );
}
