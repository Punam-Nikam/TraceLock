import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { getMyTasks, updateStatus, submitTask } from '../../api/taskAPI';
import { getMyFiles, downloadFile } from '../../api/fileAPI';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const statusColor = {
  todo:'#94a3b8', in_progress:'#f59e0b',
  submitted:'#6366f1', approved:'#10b981', rejected:'#ef4444'
};
const statusLabel = {
  todo:'Todo', in_progress:'In Progress',
  submitted:'In Review', approved:'Approved', rejected:'Rejected'
};
const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [tasks,      setTasks]      = useState([]);
  const [files,      setFiles]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [activity,   setActivity]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [showSubmit, setShowSubmit] = useState(null);
  const [submitForm, setSubmitForm] = useState({ note:'', file:null });
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const load = async () => {
    try {
      const [dash, t, f, act] = await Promise.all([
        axiosInstance.get('/dashboard'),
        getMyTasks(),
        getMyFiles(),
        axiosInstance.get('/activity/my').catch(() => ({ data: { activities: [] } })),
      ]);
      setStats(dash.data.data);
      setTasks(t.tasks           || []);
      setFiles(f.files           || []);
      setActivity(act.data.activities || []);
    } catch (err) {
      console.error('Employee dashboard error:', err);
      toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await updateStatus(taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      toast.success(status === 'in_progress' ? '▶ Task started!' : 'Status updated!');
    } catch { toast.error('Failed to update status'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitForm.note.trim()) return toast.error('Please write a submission note');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('note', submitForm.note);
    if (submitForm.file) fd.append('submission_file', submitForm.file);
    try {
      await submitTask(showSubmit, fd);
      toast.success('✅ Work submitted for review!');
      setShowSubmit(null);
      setSubmitForm({ note:'', file:null });
      load();
    } catch { toast.error('Failed to submit work'); }
    finally { setSubmitting(false); }
  };

  const handleDownload = async (fileId, fileName) => {
    setDownloading(fileId);
    try {
      toast.loading('Preparing download with watermark...', { id:'dl' });
      await downloadFile(fileId, fileName);
      toast.success('File downloaded!', { id:'dl' });
    } catch {
      toast.error('Download failed', { id:'dl' });
    } finally { setDownloading(null); }
  };

  const myTaskStats = {
    total:       tasks.length,
    todo:        tasks.filter(t=>t.status==='todo').length,
    inProgress:  tasks.filter(t=>t.status==='in_progress').length,
    submitted:   tasks.filter(t=>t.status==='submitted').length,
    approved:    tasks.filter(t=>t.status==='approved').length,
    rejected:    tasks.filter(t=>t.status==='rejected').length,
  };

  const upcomingDeadlines = tasks
    .filter(t => t.deadline && new Date(t.deadline) > new Date() && !['approved'].includes(t.status))
    .sort((a,b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0,3);

  const recentTasks = tasks.slice(0,3);

  const fileIcon = (type) => {
    if (!type) return '📎';
    if (type === 'pdf') return '📄';
    if (['jpg','jpeg','png','gif'].includes(type)) return '🖼️';
    if (['doc','docx'].includes(type)) return '📝';
    if (['xls','xlsx'].includes(type)) return '📊';
    return '📎';
  };

  const inp = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    border:'1px solid #334155', background:'#0f172a',
    color:'#fff', fontSize:14, boxSizing:'border-box', marginTop:4
  };

  if (loading) return (
    <Layout>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
        <div style={{ width:48, height:48, border:'3px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%' }}/>
        <p style={{ color:'#64748b' }}>Loading your dashboard...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* ── HEADER ── */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>
          👋 Welcome back, {user?.full_name?.split(' ')[0]}!
        </h1>
        <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
          <span style={{ color:'#64748b', fontSize:14 }}>
            🆔 {user?.employee_uid}
          </span>
          <span style={{ color:'#64748b', fontSize:14 }}>
            🏢 {user?.company_name || 'Your Company'}
          </span>
          {user?.department_name && (
            <span style={{ color:'#64748b', fontSize:14 }}>
              📂 {user.department_name}
            </span>
          )}
          <span style={{
            background:'#6366f120', color:'#818cf8',
            padding:'2px 10px', borderRadius:20, fontSize:12, textTransform:'capitalize'
          }}>{user?.role?.replace('_',' ')}</span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:24 }}>
        {[
          { icon:'📋', label:'Total Tasks',   value:myTaskStats.total,      color:'#6366f1' },
          { icon:'▶️', label:'In Progress',   value:myTaskStats.inProgress,  color:'#f59e0b' },
          { icon:'⏳', label:'In Review',     value:myTaskStats.submitted,   color:'#8b5cf6' },
          { icon:'✅', label:'Completed',     value:myTaskStats.approved,    color:'#10b981' },
          { icon:'📁', label:'Files Shared',  value:files.length,            color:'#22d3ee' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#1e293b', padding:'18px 22px', borderRadius:14,
            borderLeft:`4px solid ${s.color}`, flex:1, minWidth:130,
            position:'relative', overflow:'hidden'
          }}>
            <div style={{ position:'absolute', right:12, top:12, fontSize:28, opacity:0.1 }}>{s.icon}</div>
            <p style={{ color:'#64748b', fontSize:12, margin:0, textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</p>
            <h2 style={{ color:'#fff', margin:'8px 0 0', fontSize:30, fontWeight:800 }}>{s.value}</h2>
          </div>
        ))}
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid #1e293b', paddingBottom:0 }}>
        {[
          { key:'overview',  label:'📊 Overview' },
          { key:'tasks',     label:`📋 My Tasks (${tasks.length})` },
          { key:'files',     label:`📁 My Files (${files.length})` },
          { key:'activity',  label:'📈 Activity' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background:'none', border:'none', color: activeTab===tab.key ? '#6366f1' : '#64748b',
            padding:'10px 16px', cursor:'pointer', fontSize:14, fontWeight:600,
            borderBottom: activeTab===tab.key ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom:-1
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Upcoming Deadlines */}
          <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
            <h3 style={{ margin:'0 0 16px', fontSize:16, display:'flex', alignItems:'center', gap:8 }}>
              ⏰ Upcoming Deadlines
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <p style={{ color:'#64748b', fontSize:14 }}>No upcoming deadlines. You're all clear! 🎉</p>
            ) : upcomingDeadlines.map(task => {
              const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000*60*60*24));
              return (
                <div key={task.id} style={{
                  background:'#0f172a', padding:'12px 14px', borderRadius:10,
                  marginBottom:10, borderLeft:`3px solid ${daysLeft <= 1 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#10b981'}`
                }}>
                  <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{task.title}</p>
                  <p style={{ margin:'4px 0 0', fontSize:12, color: daysLeft <= 1 ? '#ef4444' : '#f59e0b' }}>
                    {daysLeft <= 0 ? '🔴 Overdue!' : daysLeft === 1 ? '🟡 Due tomorrow!' : `🟢 ${daysLeft} days left`}
                    {' — '}{new Date(task.deadline).toLocaleDateString()}
                  </p>
                  <span style={{
                    background:`${statusColor[task.status]}20`, color:statusColor[task.status],
                    padding:'2px 8px', borderRadius:20, fontSize:11, display:'inline-block', marginTop:4
                  }}>{statusLabel[task.status]}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Tasks */}
          <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16 }}>📋 Recent Tasks</h3>
              <button onClick={() => setActiveTab('tasks')} style={{
                background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:13
              }}>View all →</button>
            </div>
            {recentTasks.length === 0 ? (
              <p style={{ color:'#64748b', fontSize:14 }}>No tasks assigned yet.</p>
            ) : recentTasks.map(task => (
              <div key={task.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom:'1px solid #0f172a'
              }}>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{task.title}</p>
                  <p style={{ margin:'3px 0 0', color:'#64748b', fontSize:12 }}>
                    {task.assigned_by_name}
                  </p>
                </div>
                <span style={{
                  background:`${statusColor[task.status]}20`, color:statusColor[task.status],
                  padding:'3px 10px', borderRadius:20, fontSize:12
                }}>{statusLabel[task.status]}</span>
              </div>
            ))}
          </div>

          {/* Recent Files */}
          <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16 }}>📁 Recent Files</h3>
              <button onClick={() => setActiveTab('files')} style={{
                background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:13
              }}>View all →</button>
            </div>
            {files.length === 0 ? (
              <p style={{ color:'#64748b', fontSize:14 }}>No files shared with you yet.</p>
            ) : files.slice(0,4).map(f => (
              <div key={f.id} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom:'1px solid #0f172a'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>{fileIcon(f.file_type)}</span>
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:600,
                                maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {f.original_name}
                    </p>
                    <p style={{ margin:0, color:'#64748b', fontSize:12 }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {f.permission === 'download' && (
                  <button onClick={() => handleDownload(f.id, f.original_name)} style={{
                    background:'#6366f115', color:'#6366f1', border:'1px solid #6366f130',
                    padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:12
                  }}>⬇</button>
                )}
              </div>
            ))}
          </div>

          {/* Task Progress */}
          <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
            <h3 style={{ margin:'0 0 20px', fontSize:16 }}>📊 My Progress</h3>
            {myTaskStats.total === 0 ? (
              <p style={{ color:'#64748b', fontSize:14 }}>No tasks yet.</p>
            ) : (
              <>
                {[
                  { label:'Completed', value:myTaskStats.approved, color:'#10b981' },
                  { label:'In Review', value:myTaskStats.submitted, color:'#6366f1' },
                  { label:'In Progress', value:myTaskStats.inProgress, color:'#f59e0b' },
                  { label:'Todo', value:myTaskStats.todo, color:'#64748b' },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ color:'#94a3b8', fontSize:13 }}>{s.label}</span>
                      <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>
                        {s.value}/{myTaskStats.total}
                      </span>
                    </div>
                    <div style={{ background:'#0f172a', borderRadius:6, height:8 }}>
                      <div style={{
                        background:s.color, height:8, borderRadius:6,
                        width:`${myTaskStats.total > 0 ? (s.value/myTaskStats.total)*100 : 0}%`,
                        transition:'width 0.5s'
                      }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:12, background:'#0f172a', borderRadius:10 }}>
                  <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>
                    Completion Rate:{' '}
                    <b style={{ color:'#10b981', fontSize:16 }}>
                      {myTaskStats.total > 0 ? Math.round((myTaskStats.approved/myTaskStats.total)*100) : 0}%
                    </b>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TASKS TAB ══════════════ */}
      {activeTab === 'tasks' && (
        <div>
          {tasks.length === 0 ? (
            <div style={{ background:'#1e293b', borderRadius:16, padding:60, textAlign:'center', border:'2px dashed #334155' }}>
              <p style={{ fontSize:48, margin:0 }}>📋</p>
              <h3 style={{ margin:'12px 0 8px' }}>No tasks yet</h3>
              <p style={{ color:'#64748b' }}>Your manager will assign tasks to you. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
              {tasks.map(task => (
                <div key={task.id} style={{
                  background:'#1e293b', borderRadius:16, padding:22,
                  border:`1px solid #334155`,
                  borderTop:`4px solid ${priorityColor[task.priority]}`
                }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{
                      background:`${statusColor[task.status]}20`, color:statusColor[task.status],
                      padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600
                    }}>{statusLabel[task.status]}</span>
                    <span style={{
                      background:`${priorityColor[task.priority]}15`, color:priorityColor[task.priority],
                      padding:'3px 10px', borderRadius:20, fontSize:12
                    }}>{task.priority}</span>
                  </div>

                  <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700 }}>{task.title}</h3>
                  <p style={{ color:'#64748b', fontSize:13, margin:'0 0 14px', lineHeight:1.6 }}>
                    {task.description || 'No description provided'}
                  </p>

                  <p style={{ fontSize:12, color:'#475569', margin:'0 0 6px' }}>
                    📌 Assigned by: <b style={{ color:'#94a3b8' }}>{task.assigned_by_name}</b>
                  </p>

                  {task.deadline && (
                    <p style={{
                      fontSize:13, margin:'0 0 16px',
                      color: new Date(task.deadline) < new Date() && task.status !== 'approved' ? '#ef4444' : '#f59e0b'
                    }}>
                      ⏰ {new Date(task.deadline) < new Date() && task.status !== 'approved'
                        ? '🔴 OVERDUE: '
                        : 'Due: '}
                      {new Date(task.deadline).toLocaleDateString('en-US',{
                        month:'short', day:'numeric', year:'numeric',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {task.status === 'todo' && (
                    <button onClick={() => handleStatusUpdate(task.id, 'in_progress')} style={{
                      width:'100%', background:'#f59e0b15', color:'#f59e0b',
                      border:'1px solid #f59e0b40', padding:'10px', borderRadius:10,
                      cursor:'pointer', fontSize:14, fontWeight:600
                    }}>▶ Start Working</button>
                  )}

                  {task.status === 'in_progress' && (
                    <button onClick={() => setShowSubmit(task.id)} style={{
                      width:'100%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color:'#fff', border:'none', padding:'10px', borderRadius:10,
                      cursor:'pointer', fontSize:14, fontWeight:600
                    }}>📤 Submit Work for Review</button>
                  )}

                  {task.status === 'submitted' && (
                    <div style={{ background:'#6366f115', border:'1px solid #6366f130',
                                  borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <p style={{ color:'#818cf8', margin:0, fontSize:14 }}>
                        ⏳ Submitted — Waiting for review
                      </p>
                    </div>
                  )}

                  {task.status === 'approved' && (
                    <div style={{ background:'#10b98115', border:'1px solid #10b98130',
                                  borderRadius:10, padding:'10px', textAlign:'center' }}>
                      <p style={{ color:'#10b981', margin:0, fontSize:14, fontWeight:600 }}>
                        ✅ Completed & Approved!
                      </p>
                    </div>
                  )}

                  {task.status === 'rejected' && (
                    <div>
                      <div style={{ background:'#ef444415', border:'1px solid #ef444430',
                                    borderRadius:10, padding:'10px', marginBottom:10 }}>
                        <p style={{ color:'#ef4444', margin:0, fontSize:13 }}>
                          ❌ Rejected — Please redo this task
                        </p>
                      </div>
                      <button onClick={() => handleStatusUpdate(task.id, 'in_progress')} style={{
                        width:'100%', background:'#f59e0b15', color:'#f59e0b',
                        border:'1px solid #f59e0b40', padding:'10px', borderRadius:10,
                        cursor:'pointer', fontSize:14, fontWeight:600
                      }}>🔄 Start Again</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ FILES TAB ══════════════ */}
      {activeTab === 'files' && (
        <div>
          {/* Info Banner */}
          <div style={{
            background:'#6366f110', border:'1px solid #6366f130',
            borderRadius:12, padding:'14px 18px', marginBottom:20,
            display:'flex', alignItems:'center', gap:12
          }}>
            <span style={{ fontSize:24 }}>💧</span>
            <p style={{ margin:0, color:'#94a3b8', fontSize:14 }}>
              <b style={{ color:'#fff' }}>Watermark Protection:</b> Every file you download is
              invisibly watermarked with your Employee ID (<b style={{ color:'#6366f1' }}>{user?.employee_uid}</b>).
              This helps your company trace any unauthorized sharing.
            </p>
          </div>

          {files.length === 0 ? (
            <div style={{ background:'#1e293b', borderRadius:16, padding:60, textAlign:'center', border:'2px dashed #334155' }}>
              <p style={{ fontSize:48, margin:0 }}>📁</p>
              <h3 style={{ margin:'12px 0 8px' }}>No files shared with you yet</h3>
              <p style={{ color:'#64748b' }}>Files shared by your admin will appear here.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {files.map(file => (
                <div key={file.id} style={{
                  background:'#1e293b', padding:20, borderRadius:16,
                  border:'1px solid #334155',
                  display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{
                      width:52, height:52, borderRadius:12,
                      background:'#334155', display:'flex',
                      alignItems:'center', justifyContent:'center', fontSize:26
                    }}>{fileIcon(file.file_type)}</div>
                    <div>
                      <p style={{ margin:0, fontWeight:700, fontSize:15 }}>{file.original_name}</p>
                      <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:13 }}>
                        Shared by <b style={{ color:'#94a3b8' }}>{file.uploaded_by_name}</b>
                        {' · '}
                        {file.file_size ? `${(file.file_size/1024).toFixed(1)} KB` : ''}
                        {' · '}
                        {new Date(file.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </p>
                      {file.expires_at && (
                        <p style={{ margin:'4px 0 0', fontSize:12,
                                    color: new Date(file.expires_at) < new Date() ? '#ef4444' : '#f59e0b' }}>
                          ⏰ {new Date(file.expires_at) < new Date() ? '🔴 Expired' : `Expires ${new Date(file.expires_at).toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <span style={{
                      background: file.permission==='download' ? '#10b98120' : '#6366f120',
                      color:      file.permission==='download' ? '#10b981'   : '#6366f1',
                      padding:'4px 12px', borderRadius:20, fontSize:12
                    }}>
                      {file.permission==='download' ? '⬇ Downloadable' : '👁 View Only'}
                    </span>

                    {file.permission === 'download' && (
                      <button
                        onClick={() => handleDownload(file.id, file.original_name)}
                        disabled={downloading === file.id}
                        style={{
                          background: downloading===file.id ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          color:'#fff', border:'none', padding:'10px 20px',
                          borderRadius:10, cursor: downloading===file.id ? 'not-allowed' : 'pointer',
                          fontSize:14, fontWeight:600, minWidth:120
                        }}>
                        {downloading === file.id ? '⏳ Preparing...' : '⬇ Download'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ ACTIVITY TAB ══════════════ */}
      {activeTab === 'activity' && (
        <div>
          <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #0f172a' }}>
              <h3 style={{ margin:0, fontSize:15 }}>📈 My Recent Activity</h3>
            </div>
            {activity.length === 0 ? (
              <div style={{ padding:40, textAlign:'center' }}>
                <p style={{ color:'#64748b' }}>No activity logged yet. Start working on tasks!</p>
              </div>
            ) : (
              <div>
                {activity.map((act, i) => (
                  <div key={i} style={{
                    padding:'14px 20px', borderBottom:'1px solid #0f172a',
                    display:'flex', justifyContent:'space-between', alignItems:'center'
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10,
                        background: act.is_suspicious ? '#ef444420' : '#6366f120',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:16
                      }}>
                        {act.action.includes('LOGIN') ? '🔑' :
                         act.action.includes('DOWNLOAD') ? '⬇' :
                         act.action.includes('TASK') ? '📋' :
                         act.action.includes('PAGE') ? '👁' : '⚡'}
                      </div>
                      <div>
                        <p style={{ margin:0, fontSize:14, fontWeight:600 }}>
                          {act.action.replace(/_/g,' ')}
                          {act.is_suspicious && (
                            <span style={{ color:'#ef4444', fontSize:12, marginLeft:8 }}>⚠️ Flagged</span>
                          )}
                        </p>
                        {act.resource && (
                          <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:12 }}>{act.resource}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ margin:0, color:'#64748b', fontSize:12 }}>
                        {new Date(act.created_at).toLocaleString()}
                      </p>
                      {act.ip_address && (
                        <p style={{ margin:'2px 0 0', color:'#475569', fontSize:11 }}>
                          🌐 {act.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBMIT WORK MODAL ── */}
      {showSubmit && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:460,
            border:'1px solid #334155', boxShadow:'0 25px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>📤 Submit Your Work</h3>
              <button onClick={() => setShowSubmit(null)} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding:24 }}>
              <div style={{ marginBottom:16 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>
                  What did you complete? <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <textarea rows={5} required
                  placeholder="Describe what you completed, what approach you took, any issues faced..."
                  value={submitForm.note}
                  onChange={e => setSubmitForm(p=>({...p,note:e.target.value}))}
                  style={{
                    width:'100%', padding:'10px 12px', borderRadius:10,
                    border:'1px solid #334155', background:'#0f172a',
                    color:'#fff', fontSize:14, marginTop:4,
                    resize:'vertical', boxSizing:'border-box', minHeight:100
                  }} />
              </div>
              <div style={{ marginBottom:24 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>
                  Attach File (optional)
                </label>
                <div style={{
                  border:`2px dashed ${submitForm.file ? '#10b981' : '#334155'}`,
                  borderRadius:10, padding:20, textAlign:'center',
                  marginTop:4, cursor:'pointer',
                  background: submitForm.file ? '#10b98110' : '#0f172a'
                }} onClick={() => document.getElementById('submit-file').click()}>
                  {submitForm.file ? (
                    <>
                      <p style={{ color:'#10b981', margin:0, fontWeight:600 }}>✅ {submitForm.file.name}</p>
                      <p style={{ color:'#64748b', fontSize:12, margin:'4px 0 0' }}>
                        Click to change file
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ color:'#64748b', margin:0 }}>📎 Click to attach a file</p>
                      <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>
                        PDF, images, documents
                      </p>
                    </>
                  )}
                  <input id="submit-file" type="file"
                    onChange={e => setSubmitForm(p=>({...p,file:e.target.files[0]}))}
                    style={{ display:'none' }} />
                </div>
              </div>
              <button type="submit" disabled={submitting} style={{
                width:'100%', padding:13,
                background: submitting ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', border:'none', borderRadius:10,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize:15, fontWeight:600
              }}>{submitting ? '⏳ Submitting...' : '📤 Submit for Review'}</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}