import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from:'', to:'', action:'' });
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const limit = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page:p, limit, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await axiosInstance.get('/audit', { params });
      setLogs(data.logs   || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [filters]);

  const handleExport = async () => {
    try {
      const res = await axiosInstance.get('/audit/export', { responseType:'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `tracelock-audit-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Audit log exported!');
    } catch { toast.error('Export failed'); }
  };

  const actionColor = (action) => {
    if (action?.includes('LOGIN'))    return '#22d3ee';
    if (action?.includes('DELETE'))   return '#ef4444';
    if (action?.includes('CREATED'))  return '#10b981';
    if (action?.includes('APPROVED')) return '#10b981';
    if (action?.includes('REJECTED')) return '#ef4444';
    if (action?.includes('UPLOAD'))   return '#6366f1';
    if (action?.includes('DOWNLOAD')) return '#f59e0b';
    return '#94a3b8';
  };

  const actionIcon = (action) => {
    if (action?.includes('LOGIN'))       return '🔑';
    if (action?.includes('REGISTERED'))  return '🏢';
    if (action?.includes('CREATED'))     return '✅';
    if (action?.includes('APPROVED'))    return '✅';
    if (action?.includes('REJECTED'))    return '❌';
    if (action?.includes('UPLOAD'))      return '📤';
    if (action?.includes('DOWNLOAD'))    return '⬇';
    if (action?.includes('TASK'))        return '📋';
    if (action?.includes('DEPARTMENT'))  return '🏢';
    return '⚡';
  };

  const inp = {
    padding:'9px 12px', borderRadius:8, border:'1px solid #334155',
    background:'#0f172a', color:'#fff', fontSize:13
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>📜 Audit Logs</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Complete record of all system actions. Append-only — cannot be deleted.
          </p>
        </div>
        <button onClick={handleExport} style={{
          background:'#334155', color:'#fff', border:'none',
          padding:'10px 20px', borderRadius:10, cursor:'pointer', fontSize:14
        }}>📥 Export CSV</button>
      </div>

      {/* Filters */}
      <div style={{
        background:'#1e293b', padding:20, borderRadius:16,
        marginBottom:20, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end'
      }}>
        <div>
          <label style={{ color:'#64748b', fontSize:12, display:'block', marginBottom:6 }}>
            FROM DATE
          </label>
          <input type="date" value={filters.from}
            onChange={e => setFilters(p=>({...p, from:e.target.value}))}
            style={inp} />
        </div>
        <div>
          <label style={{ color:'#64748b', fontSize:12, display:'block', marginBottom:6 }}>
            TO DATE
          </label>
          <input type="date" value={filters.to}
            onChange={e => setFilters(p=>({...p, to:e.target.value}))}
            style={inp} />
        </div>
        <div>
          <label style={{ color:'#64748b', fontSize:12, display:'block', marginBottom:6 }}>
            ACTION TYPE
          </label>
          <select value={filters.action}
            onChange={e => setFilters(p=>({...p, action:e.target.value}))}
            style={inp}>
            <option value="">All Actions</option>
            <option value="LOGIN">Logins</option>
            <option value="UPLOAD">File Uploads</option>
            <option value="DOWNLOAD">Downloads</option>
            <option value="TASK">Tasks</option>
            <option value="EMPLOYEE">Employee Actions</option>
            <option value="DEPARTMENT">Departments</option>
            <option value="APPROVED">Approvals</option>
          </select>
        </div>
        <button onClick={() => setFilters({ from:'', to:'', action:'' })} style={{
          background:'#334155', color:'#94a3b8', border:'none',
          padding:'9px 16px', borderRadius:8, cursor:'pointer', fontSize:13
        }}>Clear</button>
        <p style={{ color:'#64748b', fontSize:13, margin:'0 0 0 auto', alignSelf:'center' }}>
          {total} total records
        </p>
      </div>

      {/* Logs Table */}
      <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <p style={{ fontSize:40, margin:0 }}>📜</p>
            <p style={{ color:'#64748b', marginTop:12 }}>
              {filters.from || filters.to || filters.action
                ? 'No logs match your filters'
                : 'No audit logs yet. Actions will appear here as users interact with the system.'}
            </p>
          </div>
        ) : (
          <>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#0f172a' }}>
                  {['Action','Employee','Resource','IP Address','Timestamp'].map(h => (
                    <th key={h} style={{
                      padding:'12px 16px', color:'#64748b', fontSize:12,
                      textAlign:'left', textTransform:'uppercase', letterSpacing:0.5
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i} style={{ borderTop:'1px solid #0f172a' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:16 }}>{actionIcon(log.action)}</span>
                        <span style={{
                          background:`${actionColor(log.action)}15`,
                          color: actionColor(log.action),
                          padding:'3px 10px', borderRadius:20,
                          fontSize:12, fontWeight:600
                        }}>{log.action?.replace(/_/g,' ')}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{log.full_name}</p>
                      <p style={{ margin:0, color:'#64748b', fontSize:12 }}>{log.employee_uid}</p>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#94a3b8', fontSize:13 }}>
                      {log.resource || '—'}
                    </td>
                    <td style={{ padding:'12px 16px', color:'#64748b', fontSize:13 }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={{ padding:'12px 16px', color:'#64748b', fontSize:12 }}>
                      {new Date(log.created_at).toLocaleString('en-US',{
                        month:'short', day:'numeric', year:'numeric',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding:'16px 20px', borderTop:'1px solid #0f172a',
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <p style={{ color:'#64748b', fontSize:13, margin:0 }}>
                  Page {page} of {totalPages} ({total} records)
                </p>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => { setPage(p => p-1); load(page-1); }} disabled={page === 1} style={{
                    background:'#334155', color: page===1 ? '#475569' : '#fff',
                    border:'none', padding:'7px 14px', borderRadius:8,
                    cursor: page===1 ? 'not-allowed' : 'pointer', fontSize:13
                  }}>← Prev</button>
                  <button onClick={() => { setPage(p => p+1); load(page+1); }} disabled={page === totalPages} style={{
                    background:'#334155', color: page===totalPages ? '#475569' : '#fff',
                    border:'none', padding:'7px 14px', borderRadius:8,
                    cursor: page===totalPages ? 'not-allowed' : 'pointer', fontSize:13
                  }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}