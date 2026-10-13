import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';

import { LineChart, Line, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import toast from 'react-hot-toast';

const riskStyle = {
  HIGH:   { color:'#ef4444', bg:'#ef444420', label:'🔴 HIGH' },
  MEDIUM: { color:'#f59e0b', bg:'#f59e0b20', label:'🟡 MEDIUM' },
  LOW:    { color:'#10b981', bg:'#10b98120', label:'🟢 LOW' },
};

export default function EmployeeTracking() {
  const [employees,  setEmployees]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [dashboard,  setDashboard]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('overview');
  const { on } = useSocket();

  const load = async () => {
    try {
      const [empRes, dashRes] = await Promise.all([
        axiosInstance.get('/tracking/employees'),
        axiosInstance.get('/tracking/dashboard'),
      ]);
      setEmployees(empRes.data.employees   || []);
      setDashboard(dashRes.data            || {});
    } catch (err) {
      toast.error('Failed to load tracking data');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Real-time: when activity happens, refresh
  useEffect(() => {
    const cleanup = on('audit_update', () => {
      load(); // refresh tracking when any action happens
    });
    return cleanup;
  }, [on]);

  const loadDetail = async (empId) => {
    setSelected(empId);
    setDetail(null);
    try {
      const { data } = await axiosInstance.get(`/tracking/employee/${empId}`);
      setDetail(data);
    } catch { toast.error('Failed to load employee detail'); }
  };

  const RiskBadge = ({ level }) => {
    const s = riskStyle[level] || riskStyle.LOW;
    return (
      <span style={{
        background:s.bg, color:s.color, padding:'3px 10px',
        borderRadius:20, fontSize:12, fontWeight:700
      }}>{s.label}</span>
    );
  };

  const RiskBar = ({ score }) => {
    const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';
    return (
      <div style={{ width:'100%', background:'#0f172a', borderRadius:6, height:8 }}>
        <div style={{
          width:`${score}%`, background:color,
          height:8, borderRadius:6, transition:'width 0.5s'
        }}/>
      </div>
    );
  };

  if (loading) return (
    <Layout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <p style={{ color:'#64748b' }}>Loading tracking data...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>📊 Employee Tracking</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Real-time activity monitoring and risk assessment
          </p>
        </div>
        <button onClick={load} style={{
          background:'#334155', color:'#fff', border:'none',
          padding:'9px 18px', borderRadius:10, cursor:'pointer', fontSize:14
        }}>🔄 Refresh</button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid #1e293b', paddingBottom:0 }}>
        {[
          { key:'overview', label:'📊 Overview' },
          { key:'employees', label:`👥 Employees (${employees.length})` },
          { key:'suspicious', label:`⚠️ Suspicious (${dashboard?.suspicious?.length||0})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background:'none', border:'none',
            color: tab===t.key ? '#6366f1' : '#64748b',
            padding:'10px 16px', cursor:'pointer', fontSize:14, fontWeight:600,
            borderBottom: tab===t.key ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom:-1
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════ OVERVIEW TAB ══════ */}
      {tab === 'overview' && dashboard && (
        <div>
          {/* High Risk Employees */}
          {dashboard.highRisk?.length > 0 && (
            <div style={{
              background:'#ef444410', border:'1px solid #ef444430',
              borderRadius:16, padding:20, marginBottom:20
            }}>
              <h3 style={{ margin:'0 0 16px', color:'#ef4444', fontSize:16 }}>
                🔴 High Risk Employees
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                {dashboard.highRisk.map(emp => (
                  <div key={emp.id} onClick={() => { setTab('employees'); loadDetail(emp.id); }}
                    style={{
                      background:'#1e293b', padding:14, borderRadius:10,
                      cursor:'pointer', border:'1px solid #ef444430'
                    }}>
                    <p style={{ margin:0, fontWeight:600 }}>{emp.full_name}</p>
                    <p style={{ color:'#64748b', fontSize:12, margin:'4px 0 8px' }}>{emp.employee_uid}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <RiskBadge level={emp.riskScore >= 60 ? 'HIGH' : 'MEDIUM'} />
                      <span style={{ color:'#ef4444', fontWeight:700 }}>{emp.riskScore}/100</span>
                    </div>
                    <RiskBar score={emp.riskScore} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Most Active Today */}
            <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15 }}>🏃 Most Active Today</h3>
              {dashboard.topUsers?.length === 0 ? (
                <p style={{ color:'#64748b' }}>No activity today yet</p>
              ) : dashboard.topUsers?.map((u,i) => (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid #0f172a'
                }}>
                  <div>
                    <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{u.full_name}</p>
                    <p style={{ margin:0, color:'#64748b', fontSize:12 }}>{u.employee_uid}</p>
                  </div>
                  <span style={{
                    background:'#6366f120', color:'#818cf8',
                    padding:'3px 10px', borderRadius:20, fontSize:12
                  }}>{u.actions} actions</span>
                </div>
              ))}
            </div>

            {/* Download Trend */}
            <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
              <h3 style={{ margin:'0 0 16px', fontSize:15 }}>📥 Downloads (7 Days)</h3>
              {dashboard.dlTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={dashboard.dlTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:10 }}
                      tickFormatter={v => new Date(v).toLocaleDateString('en',{month:'short',day:'numeric'})} />
                    <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                    <Tooltip contentStyle={{ background:'#0f172a', border:'none', color:'#fff' }} />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r:3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:'#64748b', textAlign:'center' }}>No download data</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════ EMPLOYEES TAB ══════ */}
      {tab === 'employees' && (
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:20 }}>
          {/* Employee List */}
          <div>
            {employees.length === 0 ? (
              <p style={{ color:'#64748b' }}>No active employees to track</p>
            ) : employees.map(emp => (
              <div key={emp.id} onClick={() => loadDetail(emp.id)} style={{
                background: selected===emp.id ? '#6366f115' : '#1e293b',
                border: selected===emp.id ? '1px solid #6366f150' : '1px solid #334155',
                borderRadius:14, padding:18, marginBottom:12,
                cursor:'pointer', transition:'all 0.2s'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{
                      width:42, height:42, borderRadius:'50%',
                      background: emp.riskLevel==='HIGH' ? '#ef4444' :
                                  emp.riskLevel==='MEDIUM' ? '#f59e0b' : '#10b981',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:16, fontWeight:700, color:'#fff', flexShrink:0
                    }}>{emp.full_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:15 }}>{emp.full_name}</p>
                      <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:12 }}>
                        {emp.employee_uid} · {emp.department_name || 'No dept'}
                      </p>
                    </div>
                  </div>
                  <RiskBadge level={emp.riskLevel} />
                </div>

                <div style={{ marginTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12 }}>
                    <span style={{ color:'#64748b' }}>Risk Score</span>
                    <span style={{
                      fontWeight:700,
                      color: emp.riskLevel==='HIGH' ? '#ef4444' :
                             emp.riskLevel==='MEDIUM' ? '#f59e0b' : '#10b981'
                    }}>{emp.riskScore}/100</span>
                  </div>
                  <RiskBar score={emp.riskScore} />
                </div>

                <div style={{ display:'flex', gap:16, marginTop:12, fontSize:12, color:'#64748b' }}>
                  <span>⚡ {emp.total_actions || 0} actions (7d)</span>
                  <span>⚠️ {emp.suspicious_actions || 0} suspicious</span>
                  <span>🌐 {emp.unique_ips || 0} IPs</span>
                  {emp.last_active && (
                    <span>🕐 {new Date(emp.last_active).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Employee Detail */}
          {selected && (
            <div style={{ background:'#1e293b', borderRadius:16, padding:24, height:'fit-content', maxHeight:'80vh', overflowY:'auto' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h3 style={{ margin:0, fontSize:16 }}>📊 Detailed View</h3>
                <button onClick={() => { setSelected(null); setDetail(null); }} style={{
                  background:'#334155', border:'none', color:'#fff',
                  width:28, height:28, borderRadius:6, cursor:'pointer', fontSize:14
                }}>✕</button>
              </div>

              {!detail ? (
                <p style={{ color:'#64748b', textAlign:'center' }}>Loading...</p>
              ) : (
                <>
                  {/* Risk Score */}
                  <div style={{
                    background:'#0f172a', padding:16, borderRadius:12, marginBottom:20,
                    border:`1px solid ${riskStyle[detail.riskLevel]?.color}30`
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{ color:'#94a3b8', fontSize:14 }}>Risk Score</span>
                      <RiskBadge level={detail.riskLevel} />
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{
                        fontSize:36, fontWeight:800,
                        color: detail.riskLevel==='HIGH' ? '#ef4444' :
                               detail.riskLevel==='MEDIUM' ? '#f59e0b' : '#10b981'
                      }}>{detail.riskScore}</span>
                      <div style={{ flex:1 }}>
                        <RiskBar score={detail.riskScore} />
                        <p style={{ color:'#64748b', fontSize:12, margin:'4px 0 0' }}>out of 100</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Heatmap by Hour */}
                  {detail.hourlyData?.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <h4 style={{ margin:'0 0 12px', fontSize:14, color:'#94a3b8' }}>
                        Activity by Hour (Last 30 Days)
                      </h4>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={detail.hourlyData}>
                          <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:10 }}
                            tickFormatter={h => `${h}:00`} />
                          <YAxis tick={{ fill:'#64748b', fontSize:10 }} />
                          <Tooltip contentStyle={{ background:'#0f172a', border:'none', color:'#fff' }}
                            formatter={(v,n,p) => [v, `${p.payload.hour}:00`]} />
                          <Bar dataKey="count" fill="#6366f1" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recent Downloads */}
                  <div style={{ marginBottom:20 }}>
                    <h4 style={{ margin:'0 0 12px', fontSize:14, color:'#94a3b8' }}>
                      📥 Recent Downloads
                    </h4>
                    {detail.downloads?.length === 0 ? (
                      <p style={{ color:'#64748b', fontSize:13 }}>No downloads yet</p>
                    ) : detail.downloads?.slice(0,5).map((d,i) => (
                      <div key={i} style={{
                        display:'flex', justifyContent:'space-between',
                        padding:'8px 0', borderBottom:'1px solid #0f172a', fontSize:13
                      }}>
                        <span style={{ color:'#94a3b8' }}>📄 {d.original_name}</span>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, color:'#64748b', fontSize:11 }}>
                            {new Date(d.accessed_at).toLocaleString()}
                          </p>
                          <p style={{ margin:0, color:'#475569', fontSize:11 }}>
                            🌐 {d.ip_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Login History */}
                  <div style={{ marginBottom:20 }}>
                    <h4 style={{ margin:'0 0 12px', fontSize:14, color:'#94a3b8' }}>
                      🔑 Login History
                    </h4>
                    {detail.logins?.length === 0 ? (
                      <p style={{ color:'#64748b', fontSize:13 }}>No login history</p>
                    ) : detail.logins?.map((l,i) => (
                      <div key={i} style={{
                        display:'flex', justifyContent:'space-between',
                        padding:'6px 0', borderBottom:'1px solid #0f172a', fontSize:12
                      }}>
                        <span style={{ color:'#10b981' }}>✓ Login</span>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:0, color:'#64748b' }}>
                            {new Date(l.created_at).toLocaleString()}
                          </p>
                          <p style={{ margin:0, color:'#475569' }}>🌐 {l.ip_address}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activities */}
                  <div>
                    <h4 style={{ margin:'0 0 12px', fontSize:14, color:'#94a3b8' }}>
                      ⚡ Recent Activities
                    </h4>
                    {detail.activities?.slice(0,10).map((a,i) => (
                      <div key={i} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'7px 0', borderBottom:'1px solid #0f172a'
                      }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          {a.is_suspicious && (
                            <span style={{ color:'#ef4444', fontSize:12 }}>⚠️</span>
                          )}
                          <span style={{ color: a.is_suspicious ? '#ef4444' : '#94a3b8', fontSize:12 }}>
                            {a.action?.replace(/_/g,' ')}
                          </span>
                        </div>
                        <span style={{ color:'#475569', fontSize:11 }}>
                          {new Date(a.created_at).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════ SUSPICIOUS TAB ══════ */}
      {tab === 'suspicious' && (
        <div>
          {!dashboard?.suspicious || dashboard.suspicious.length === 0 ? (
            <div style={{ background:'#1e293b', borderRadius:16, padding:60, textAlign:'center', border:'2px dashed #334155' }}>
              <p style={{ fontSize:40, margin:0 }}>✅</p>
              <h3 style={{ margin:'12px 0 8px' }}>No suspicious activity!</h3>
              <p style={{ color:'#64748b' }}>All employee behavior looks normal.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {dashboard.suspicious.map((act, i) => (
                <div key={i} style={{
                  background:'#ef444408', border:'1px solid #ef444425',
                  borderRadius:14, padding:18
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <div style={{
                        width:40, height:40, borderRadius:10, background:'#ef444420',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
                      }}>⚠️</div>
                      <div>
                        <p style={{ margin:0, fontWeight:600 }}>{act.full_name}</p>
                        <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>
                          {act.employee_uid}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ background:'#ef444420', color:'#ef4444', padding:'3px 10px', borderRadius:20, fontSize:12 }}>
                        {act.action?.replace(/_/g,' ')}
                      </span>
                      <p style={{ color:'#64748b', fontSize:12, margin:'6px 0 0' }}>
                        {new Date(act.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p style={{ color:'#94a3b8', fontSize:13, margin:'10px 0 0' }}>
                    🌐 IP: {act.ip_address || 'Unknown'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}