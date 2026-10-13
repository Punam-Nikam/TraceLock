// frontend/src/pages/admin/Alerts.jsx
// Shows all alerts: suspicious downloads, data leaks
// Admin can see employee info and resolve alerts

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | unresolved | leak | suspicious

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/activity/alerts');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      toast.error('Failed to load alerts: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleResolve = async (id) => {
    try {
      await axiosInstance.patch(`/activity/alerts/${id}/resolve`);
      toast.success('Alert marked as resolved');
      load();
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  const filtered = alerts.filter(a => {
    if (filter === 'unresolved') return !a.is_resolved;
    if (filter === 'leak')       return a.type === 'data_leak';
    if (filter === 'suspicious') return a.type === 'suspicious_download';
    return true;
  });

  const unresolved = alerts.filter(a => !a.is_resolved).length;
  const leaks      = alerts.filter(a => a.type === 'data_leak').length;
  const suspicious = alerts.filter(a => a.type === 'suspicious_download').length;

  const typeConfig = {
    data_leak:            { icon: '🚨', color: '#ef4444', label: 'Data Leak' },
    suspicious_download:  { icon: '⚠️', color: '#f59e0b', label: 'Suspicious Download' },
    default:              { icon: '🔔', color: '#6366f1', label: 'Alert' },
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>⚠️ Security Alerts</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
            Real-time alerts from employee activity monitoring
          </p>
        </div>
        <button onClick={load} style={{
          background: '#334155', color: '#fff', border: 'none',
          padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13
        }}>🔄 Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Alerts',       value: alerts.length,  color: '#6366f1' },
          { label: 'Unresolved',         value: unresolved,     color: '#ef4444' },
          { label: 'Data Leaks',         value: leaks,          color: '#ef4444' },
          { label: 'Suspicious Downloads', value: suspicious,   color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#1e293b', padding: '14px 22px', borderRadius: 12,
            borderLeft: `4px solid ${s.color}`, flex: 1, minWidth: 140
          }}>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>{s.label}</p>
            <h2 style={{ color: s.value > 0 ? s.color : '#fff', margin: '6px 0 0', fontSize: 28 }}>{s.value}</h2>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'all',        label: `All (${alerts.length})` },
          { key: 'unresolved', label: `Unresolved (${unresolved})` },
          { key: 'leak',       label: `Data Leaks (${leaks})` },
          { key: 'suspicious', label: `Suspicious (${suspicious})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            background:  filter === f.key ? '#6366f1' : '#1e293b',
            color:       '#fff', border: 'none',
            padding:     '8px 18px', borderRadius: 8,
            cursor:      'pointer', fontSize: 13,
            borderBottom: filter === f.key ? '2px solid #818cf8' : '2px solid transparent'
          }}>{f.label}</button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: 40, margin: '0 0 12px' }}>✅</p>
          <h3 style={{ color: '#10b981', margin: '0 0 8px' }}>No alerts</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            {filter === 'all' ? 'All clear — no security alerts.' : `No ${filter} alerts.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(alert => {
            const cfg = typeConfig[alert.type] || typeConfig.default;
            return (
              <div key={alert.id} style={{
                background: '#1e293b', borderRadius: 14, padding: '18px 22px',
                border: `1px solid ${alert.is_resolved ? '#334155' : cfg.color + '40'}`,
                opacity: alert.is_resolved ? 0.6 : 1,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16
              }}>
                <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: cfg.color + '20', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0
                  }}>{cfg.icon}</div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{
                        background: cfg.color + '20', color: cfg.color,
                        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
                      }}>{cfg.label}</span>
                      {alert.is_resolved && (
                        <span style={{
                          background: '#10b98120', color: '#10b981',
                          padding: '2px 10px', borderRadius: 20, fontSize: 11
                        }}>✓ Resolved</span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 8px', fontSize: 14, lineHeight: 1.5 }}>
                      {alert.description}
                    </p>

                    {/* Employee Info */}
                    {alert.full_name && (
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>
                          👤 <b style={{ color: '#fff' }}>{alert.full_name}</b>
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>
                          🆔 {alert.employee_uid}
                        </span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>
                          📧 {alert.email}
                        </span>
                        <span style={{ color: '#64748b', fontSize: 12 }}>
                          🕐 {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!alert.is_resolved && (
                  <button onClick={() => handleResolve(alert.id)} style={{
                    background: '#10b98120', color: '#10b981',
                    border: '1px solid #10b98140', padding: '7px 16px',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13,
                    flexShrink: 0, whiteSpace: 'nowrap'
                  }}>✓ Resolve</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}