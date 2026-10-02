import React, { useState } from 'react';
import { Plane, AlertTriangle, ShieldCheck, Compass, Clock, MapPin, X } from 'lucide-react';

export default function EmergencyModal({ isOpen, onClose, onExecuteDiversion, diversionResult, isCalculating }) {
  const [callsign, setCallsign] = useState('UAE-841');
  const [lat, setLat] = useState('34.2');
  const [lon, setLon] = useState('49.5');

  if (!isOpen) return null;

  const handleSimulate = () => {
    onExecuteDiversion({
      flight_callsign: callsign,
      current_lat: parseFloat(lat),
      current_lon: parseFloat(lon),
      original_destination_id: 'AIRPORT_IST'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div className="glass-panel" style={{
        width: '540px',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>
                SCENARIO 2: AIRSPACE INTERDICTION & DIVERSION
              </h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Automated Collision Engine & Certified Safe Haven Emergency Landing
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              FLIGHT CALLSIGN:
            </label>
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glow)',
                color: 'white',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              LATITUDE (°N):
            </label>
            <input
              type="number"
              step="0.1"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glow)',
                color: 'white',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              LONGITUDE (°E):
            </label>
            <input
              type="number"
              step="0.1"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-glow)',
                color: 'white',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={isCalculating}
          className="cyber-btn cyber-btn-danger"
          style={{ width: '100%', padding: '10px' }}
        >
          <Plane size={16} /> INTERCEPT & COMPUTE SAFE HAVEN VECTOR
        </button>

        {/* Results Card */}
        {diversionResult && (
          <div style={{
            background: 'rgba(10, 15, 29, 0.95)',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                <ShieldCheck size={18} /> SAFE HAVEN IDENTIFIED: {diversionResult.nearest_safe_haven.name}
              </div>
              <span className="badge badge-emerald">{diversionResult.nearest_safe_haven.iata}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>BEARING / HEADING</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {diversionResult.divert_heading_degrees}°
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>DISTANCE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>
                  {diversionResult.distance_km} km
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>EST. TOUCHDOWN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>
                  {diversionResult.estimated_divert_time_min} min
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '0.74rem',
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '8px 10px',
              borderRadius: '6px',
              lineHeight: 1.4
            }}>
              <strong>DIRECTIVE:</strong> {diversionResult.action_directive}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
