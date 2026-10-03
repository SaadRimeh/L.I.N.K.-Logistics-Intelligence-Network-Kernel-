import React from 'react';
import { 
  Ship, 
  Plane, 
  Navigation, 
  ShieldAlert, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Compass, 
  Anchor, 
  Gauge, 
  Package, 
  AlertTriangle,
  X,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function TelemetryDossier({
  selectedEntity, // { type: 'VESSEL' | 'FLIGHT' | 'ROUTE' | 'FACILITY', data: ... }
  onClose,
  onTrackEntity,
  isTracked
}) {
  if (!selectedEntity || !selectedEntity.data) return null;

  const { type, data } = selectedEntity;

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      bottom: '24px',
      left: '24px',
      width: '440px',
      maxWidth: 'calc(100vw - 480px)',
      borderRadius: '12px',
      padding: '18px',
      zIndex: 1200,
      direction: 'rtl',
      textAlign: 'right',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
      border: data.in_danger || data.risk_percentage > 50 || data.status === 'CLOSED'
        ? '1px solid rgba(239, 68, 68, 0.6)'
        : '1px solid var(--border-glow)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'VESSEL' && (
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(0, 242, 254, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ship size={18} color="#00f2fe" />
            </div>
          )}
          {type === 'FLIGHT' && (
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={18} color="#38bdf8" />
            </div>
          )}
          {type === 'ROUTE' && (
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={18} color="#f59e0b" />
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {type === 'VESSEL' && (data.name_ar || data.name)}
              {type === 'FLIGHT' && `رحلة: ${data.callsign} (${data.country})`}
              {type === 'ROUTE' && `ممر: ${data.route_code}`}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {type === 'VESSEL' && `MMSI: ${data.mmsi} • ${data.flag}`}
              {type === 'FLIGHT' && `ICAO-24: ${data.icao} • رادار حي OpenSky`}
              {type === 'ROUTE' && `${data.source_name} ➔ ${data.target_name}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {data.in_danger ? (
            <span className="badge badge-danger pulsing-danger">في دائرة خطر</span>
          ) : (
            <span className="badge badge-emerald">إبحار/تحليق آمن</span>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* VESSEL DETAILS */}
      {type === 'VESSEL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>السرعة</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{data.speed_knots} عقدة</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>زاوية البوصلة</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.heading_deg}°</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>الغاطس</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>{data.draft_meters} م</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>نوع السفينة</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{data.type}</div>
            </div>
          </div>

          {/* Voyage Ports */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', lineHeight: 1.4 }}>
            <div><strong style={{ color: 'var(--text-muted)' }}>ميناء الانطلاق:</strong> {data.origin}</div>
            <div><strong style={{ color: 'var(--accent-cyan)' }}>ميناء الوجهة:</strong> {data.destination}</div>
            <div style={{ marginTop: '4px', color: '#e2e8f0' }}><strong>الشحنة:</strong> {data.cargo_capacity}</div>
          </div>

          {/* Threat & Directive */}
          <div style={{
            background: data.in_danger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            border: data.in_danger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem'
          }}>
            <div style={{ fontWeight: 700, color: data.in_danger ? '#fca5a5' : '#6ee7b7', marginBottom: '2px' }}>
              {data.threat_advisory_ar}
            </div>
            <div style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
              <strong>ميناء الرسو الاضطراري / البديل:</strong> {data.recommended_berth_port}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
              {data.contingency_directive_ar}
            </div>
          </div>
        </div>
      )}

      {/* FLIGHT DETAILS */}
      {type === 'FLIGHT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Origin -> Destination Banner */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>مطار المغادرة</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                {data.origin_name || data.origin_icao || 'إقلاع إقليمي'}
              </div>
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>➔</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>مطار الوصول</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>
                {data.dest_name || data.dest_icao || 'وجهة دولية'}
              </div>
            </div>
          </div>

          {/* Progress Bar & ETA */}
          {data.progress_pct !== undefined && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>إنجاز المسار الجوي: <strong>{data.progress_pct}%</strong></span>
                <span style={{ color: '#bae6fd' }}>الزمن المتبقي: <strong>{data.estimated_remaining_mins || 45} دقيقة</strong></span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${data.progress_pct}%`,
                  height: '100%',
                  background: data.in_danger ? '#ef4444' : 'linear-gradient(90deg, #00f2fe, #38bdf8)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>الارتفاع الجوي</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{(data.altitude_ft || 32000).toLocaleString()} قدم</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>السرعة الأرضية</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.speed_kmh} كم/س</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>زاوية المسار</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>{data.heading_deg}°</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>رمز Squawk</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: data.squawk === '7700' ? '#ef4444' : '#fde68a' }}>{data.squawk || '1200'}</div>
            </div>
          </div>

          {/* Threat Advisory & Safe Haven */}
          {data.in_danger && data.safe_haven ? (
            <div className="glass-panel-danger pulsing-danger" style={{ padding: '10px', borderRadius: '6px', fontSize: '0.74rem' }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} color="#ef4444" /> {data.threat_description}
              </div>
              <div style={{ color: '#fef08a', marginTop: '4px' }}>
                <strong>الملاذ الجوي الآمن المقترح:</strong> {data.safe_haven.name_ar} ({data.safe_haven.iata})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '6px', fontSize: '0.7rem' }}>
                <div>المسافة للمطار: <strong>{data.safe_haven.distance_km} كم</strong></div>
                <div>زاوية الالتفاف: <strong>{data.safe_haven.turn_heading_deg}°</strong></div>
                <div>زمن الهبوط التقديري: <strong>{data.safe_haven.eta_minutes} دقيقة</strong></div>
                <div>تكلفة الوقود الإضافي: <strong>${data.safe_haven.estimated_cost_usd}</strong></div>
              </div>
              <div style={{ marginTop: '6px', color: '#fed7aa', fontWeight: 600 }}>
                {data.safe_haven.directive_ar}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem', color: '#6ee7b7' }}>
              ✓ الطائرة تحلق في ممر جوي دولي آمن ومستقر، ومسارها مرسوم بوضوح على الخريطة.
            </div>
          )}
        </div>
      )}

      {/* ROUTE DETAILS */}
      {type === 'ROUTE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>المسافة</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{data.distance_km} كم</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>الزمن</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{data.time_hours} س</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>التكلفة</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>${data.cost_usd}</div>
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>نسبة الخطر</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: data.risk_percentage > 40 ? '#ef4444' : '#10b981' }}>
                {data.risk_percentage}%
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem' }}>
            <div><strong>تصنيف السرعة:</strong> {data.speed_rating}</div>
            <div style={{ marginTop: '2px' }}><strong>تقييم الأمان والمخاطر:</strong> {data.threat_description}</div>
            <div style={{ marginTop: '2px', color: data.status === 'CLOSED' ? '#ef4444' : '#10b981' }}>
              <strong>حالة الممر:</strong> {data.status === 'CLOSED' ? 'مغلق عسكرياً بسبب نزاع نشط' : 'مفتوح ومتاح للشحن والعبور'}
            </div>
          </div>
        </div>
      )}

      {/* Action to draw route on map */}
      {onTrackEntity && (
        <button
          onClick={onTrackEntity}
          className="cyber-btn cyber-btn-primary"
          style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '0.76rem' }}
        >
          <Compass size={14} />
          {isTracked ? 'إلغاء تثبيت المسار على الخريطة' : 'تثبيت ورسم المسار الملاحي على الخريطة'}
        </button>
      )}
    </div>
  );
}
