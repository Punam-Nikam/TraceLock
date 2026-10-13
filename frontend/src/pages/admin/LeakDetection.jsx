// frontend/src/pages/admin/LeakDetection.jsx
// Shows full employee profile when leak is detected:
// name, email, department, role, exact download time, IP, all download history

import { useState } from 'react';
import Layout from '../../components/Layout';
import { detectLeak } from '../../api/fileAPI';
import toast from 'react-hot-toast';

export default function LeakDetection() {
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async () => {
    if (!file) return toast.error('Please select a file to analyze');
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await detectLeak(formData);
      setResult(data);
      toast.success('Watermark extracted and decoded!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed';
      const detail = err.response?.data?.detail || '';
      toast.error(msg, { duration: 6000 });
      setResult({ failed: true, message: msg, detail });
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    color: '#fff', marginBottom: 16, display: 'block',
    background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, padding: '10px 12px', width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <Layout>
      <h2 style={{ margin: '0 0 8px' }}>🔍 Data Leak Detection</h2>
      <p style={{ color: '#94a3b8', margin: '0 0 28px', fontSize: 14 }}>
        Upload a file you suspect was leaked outside your company.
        TraceLock will extract the invisible watermark and identify exactly who downloaded it.
      </p>

      {/* Upload Card */}
      <div style={{ background: '#1e293b', padding: 28, borderRadius: 16,
                    maxWidth: 540, marginBottom: 32, border: '1px solid #334155' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>📤 Upload Suspected Leaked File</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 6 }}>
            Supported: PDF, JPG, PNG
          </label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => { setFile(e.target.files[0]); setResult(null); }}
            style={inp} />
        </div>

        {file && (
          <div style={{ background: '#0f172a', padding: '10px 14px', borderRadius: 8,
                        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{file.name.endsWith('.pdf') ? '📄' : '🖼️'}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{file.name}</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        <button onClick={handleDetect} disabled={loading || !file} style={{
          background: loading ? '#334155' : '#ef4444',
          color: '#fff', border: 'none', padding: '12px 28px',
          borderRadius: 10, cursor: loading || !file ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700, width: '100%',
          opacity: !file ? 0.5 : 1
        }}>
          {loading ? '🔄 Analyzing watermark...' : '🔍 Analyze & Detect Leak'}
        </button>
      </div>

      {/* Failed Result */}
      {result?.failed && (
        <div style={{ background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 16, padding: 28, maxWidth: 540 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>🔎</span>
            <div>
              <h3 style={{ margin: 0, color: '#f59e0b' }}>No Watermark Found</h3>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>{result.message}</p>
            </div>
          </div>
          {result.detail && (
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{result.detail}</p>
          )}
        </div>
      )}

      {/* Success Result */}
      {result && !result.failed && (
        <div style={{ maxWidth: 780 }}>

          {/* Alert Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #ef444415, #ef444408)',
            border: '2px solid #ef444450', borderRadius: 16,
            padding: '20px 24px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <span style={{ fontSize: 40 }}>🚨</span>
            <div>
              <h2 style={{ margin: 0, color: '#ef4444', fontSize: 20 }}>Leak Source Identified!</h2>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
                Employee UID: <b style={{ color: '#fff', fontFamily: 'monospace' }}>{result.employeeUID}</b>
              </p>
            </div>
          </div>

          {/* Employee Profile Card */}
          {result.employee ? (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 24,
                          marginBottom: 20, border: '1px solid #ef444430' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, color: '#ef4444' }}>
                👤 Leaker Profile
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                {/* Avatar */}
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 700, flexShrink: 0, color: '#fff'
                }}>
                  {result.employee.full_name?.[0]?.toUpperCase()}
                </div>
                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', flex: 1 }}>
                  {[
                    { label: 'Full Name',   value: result.employee.full_name },
                    { label: 'Email',       value: result.employee.email },
                    { label: 'Employee ID', value: result.employee.employee_uid },
                    { label: 'Role',        value: result.employee.role?.replace('_', ' ') },
                    { label: 'Department',  value: result.employee.department_name || '—' },
                    { label: 'Status',      value: result.employee.status },
                    { label: 'Last Login',  value: result.employee.last_login
                        ? new Date(result.employee.last_login).toLocaleString() : '—' },
                    { label: 'Joined',      value: new Date(result.employee.created_at).toLocaleDateString() },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {item.label}
                      </p>
                      <p style={{ color: '#fff', fontSize: 14, margin: 0, fontWeight: 500 }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20,
                          marginBottom: 20, border: '1px solid #f59e0b30' }}>
              <p style={{ color: '#f59e0b', margin: 0 }}>
                ⚠️ Employee UID <b>{result.employeeUID}</b> was found in watermark but no matching user exists.
                This employee may have been deleted from the system.
              </p>
            </div>
          )}

          {/* Exact Download Match */}
          {result.exactMatch && (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20,
                          marginBottom: 20, border: '1px solid #6366f130' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#6366f1' }}>
                🎯 Exact Download Event
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
                {[
                  { label: 'File Name', value: result.exactMatch.original_name },
                  { label: 'File Type', value: result.exactMatch.file_type?.toUpperCase() },
                  { label: 'Downloaded At', value: new Date(result.exactMatch.accessed_at).toLocaleString() },
                  { label: 'IP Address', value: result.exactMatch.ip_address || 'Unknown' },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {item.label}
                    </p>
                    <p style={{ color: '#fff', fontSize: 14, margin: 0, fontFamily: item.label === 'IP Address' ? 'monospace' : 'inherit' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Summary */}
          {result.activitySummary && (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20,
                          marginBottom: 20, border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>📊 Activity Summary</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Actions',  value: result.activitySummary.total_actions,  color: '#6366f1' },
                  { label: 'Total Downloads',value: result.activitySummary.total_downloads, color: '#22d3ee' },
                  { label: 'Flagged Events', value: result.activitySummary.suspicious_count, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#0f172a', padding: '12px 20px', borderRadius: 10,
                    borderLeft: `3px solid ${s.color}`, flex: 1, minWidth: 120
                  }}>
                    <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{s.label}</p>
                    <h3 style={{ color: s.color, margin: '4px 0 0', fontSize: 22 }}>{s.value ?? 0}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Download History */}
          {result.downloadHistory?.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: 16, padding: 20,
                          border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>
                📜 Full Download History ({result.downloadHistory.length} events)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                {result.downloadHistory.map((log, i) => (
                  <div key={i} style={{
                    background: '#0f172a', padding: '12px 16px', borderRadius: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>
                        {log.file_type === 'pdf' ? '📄' : '📎'} {log.original_name}
                      </p>
                      <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
                        {log.ip_address || 'Unknown IP'}
                      </p>
                    </div>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>
                      {new Date(log.accessed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </Layout>
  );
}