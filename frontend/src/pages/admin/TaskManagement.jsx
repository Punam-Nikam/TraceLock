import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAllTasks, createTask, reviewTask, getTaskDetail } from '../../api/taskAPI';
import { getActiveEmployees } from '../../api/employeeAPI';
import toast from 'react-hot-toast';

const statusColor    = { todo:'#94a3b8', in_progress:'#f59e0b', submitted:'#6366f1', approved:'#10b981', rejected:'#ef4444' };
const priorityColor  = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' };
const statusLabel    = { todo:'Todo', in_progress:'In Progress', submitted:'In Review', approved:'Approved', rejected:'Rejected' };

export default function TaskManagement() {
  const [tasks,      setTasks]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detail,     setDetail]     = useState(null);
  const [filterStatus, setFilter]   = useState('');
  const [search,       setSearch]   = useState('');
  const [reviewForm, setReviewForm] = useState({ decision:'approved', feedback:'' });
  const [creating,   setCreating]   = useState(false);
  const [form, setForm] = useState({
    title:'', description:'', priority:'medium',
    assignedTo:'', deadline:'', attachment:null
  });

  const load = async () => {
    try {
      const [t, e] = await Promise.all([
        getAllTasks({ status: filterStatus }),
        getActiveEmployees()
      ]);
      setTasks(t.tasks       || []);
      setEmployees(e.employees || []);
    } catch (err) {
      console.error('TaskManagement load error:', err);
      toast.error('Failed to load tasks');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.assignedTo) return toast.error('Please select an employee');
    setCreating(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if(v) fd.append(k,v); });
    try {
      await createTask(fd);
      toast.success('Task created and assigned!');
      setShowCreate(false);
      setForm({ title:'', description:'', priority:'medium', assignedTo:'', deadline:'', attachment:null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally { setCreating(false); }
  };

  const handleViewDetail = async (taskId) => {
    setShowDetail(taskId);
    setDetail(null);
    try {
      const data = await getTaskDetail(taskId);
      setDetail(data);
    } catch { toast.error('Failed to load task details'); }
  };

  const handleReview = async (taskId) => {
    try {
      await reviewTask(taskId, reviewForm);
      toast.success(`Task ${reviewForm.decision.replace('_',' ')}!`);
      setShowDetail(null);
      setDetail(null);
      load();
    } catch { toast.error('Review failed'); }
  };

  const filteredTasks = tasks.filter(t =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.assigned_to_name?.toLowerCase().includes(search.toLowerCase())
  );

  const taskCounts = {
    all:         tasks.length,
    todo:        tasks.filter(t=>t.status==='todo').length,
    in_progress: tasks.filter(t=>t.status==='in_progress').length,
    submitted:   tasks.filter(t=>t.status==='submitted').length,
    approved:    tasks.filter(t=>t.status==='approved').length,
    rejected:    tasks.filter(t=>t.status==='rejected').length,
  };

  const inp = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    border:'1px solid #334155', background:'#0f172a',
    color:'#fff', fontSize:14, boxSizing:'border-box', marginTop:4
  };

  return (
    <Layout>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>📋 Task Management</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Create, assign, and review tasks for your team
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
          border:'none', padding:'11px 22px', borderRadius:10,
          cursor:'pointer', fontSize:14, fontWeight:600
        }}>+ Create Task</button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { key:'',           label:`All (${taskCounts.all})` },
          { key:'todo',       label:`Todo (${taskCounts.todo})` },
          { key:'in_progress',label:`In Progress (${taskCounts.in_progress})` },
          { key:'submitted',  label:`In Review (${taskCounts.submitted})` },
          { key:'approved',   label:`Approved (${taskCounts.approved})` },
          { key:'rejected',   label:`Rejected (${taskCounts.rejected})` },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            background: filterStatus === s.key ? '#6366f1' : '#1e293b',
            color: filterStatus === s.key ? '#fff' : '#94a3b8',
            border:'1px solid #334155', padding:'7px 16px',
            borderRadius:20, cursor:'pointer', fontSize:13,
            fontWeight: filterStatus === s.key ? 600 : 400
          }}>{s.label}</button>
        ))}
      </div>

      {/* Search */}
      <input placeholder="🔍 Search tasks or employee name..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inp, marginBottom:16, marginTop:0, padding:'12px 16px' }} />

      {/* Tasks Grid */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'#64748b' }}>Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background:'#1e293b', borderRadius:16, padding:60,
          textAlign:'center', border:'2px dashed #334155'
        }}>
          <p style={{ fontSize:48, margin:0 }}>📋</p>
          <h3 style={{ color:'#fff', margin:'12px 0 8px' }}>No tasks found</h3>
          <p style={{ color:'#64748b' }}>
            {employees.length === 0
              ? 'No active employees yet. Approve employees first, then assign tasks.'
              : 'Create your first task and assign it to a team member.'}
          </p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:16 }}>
          {filteredTasks.map(task => (
            <div key={task.id} style={{
              background:'#1e293b', borderRadius:16, padding:20,
              borderLeft:`4px solid ${priorityColor[task.priority]}`,
              border:`1px solid #334155`,
              borderLeft:`4px solid ${priorityColor[task.priority]}`
            }}>
              {/* Status + Priority */}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{
                  background:`${statusColor[task.status]}20`, color:statusColor[task.status],
                  padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600
                }}>{statusLabel[task.status]}</span>
                <span style={{
                  background:`${priorityColor[task.priority]}20`, color:priorityColor[task.priority],
                  padding:'3px 10px', borderRadius:20, fontSize:12
                }}>{task.priority}</span>
              </div>

              <h3 style={{ margin:'0 0 8px', fontSize:15, fontWeight:700 }}>{task.title}</h3>
              <p style={{ color:'#64748b', fontSize:13, margin:'0 0 14px',
                          overflow:'hidden', display:'-webkit-box',
                          WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                {task.description || 'No description'}
              </p>

              {/* Employee */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', background:'#6366f1',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, flexShrink:0
                }}>{task.assigned_to_name?.[0]?.toUpperCase()}</div>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:600 }}>{task.assigned_to_name}</p>
                  <p style={{ margin:0, fontSize:11, color:'#64748b' }}>{task.employee_uid}</p>
                </div>
              </div>

              {task.deadline && (
                <p style={{
                  fontSize:12, margin:'0 0 14px',
                  color: new Date(task.deadline) < new Date() && task.status !== 'approved' ? '#ef4444' : '#f59e0b'
                }}>
                  ⏰ {new Date(task.deadline) < new Date() && task.status !== 'approved' ? '🔴 Overdue: ' : 'Due: '}
                  {new Date(task.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                </p>
              )}

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => handleViewDetail(task.id)} style={{
                  flex:1, background:'#334155', color:'#fff', border:'none',
                  padding:'8px', borderRadius:8, cursor:'pointer', fontSize:13
                }}>👁 View Details</button>
                {task.status === 'submitted' && (
                  <button onClick={() => handleViewDetail(task.id)} style={{
                    flex:1, background:'#6366f1', color:'#fff', border:'none',
                    padding:'8px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600
                  }}>✅ Review Now</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE TASK MODAL ── */}
      {showCreate && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:520,
            maxHeight:'90vh', overflowY:'auto', border:'1px solid #334155'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>📋 Create New Task</h3>
              <button onClick={() => setShowCreate(false)} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding:24 }}>
              <div style={{ marginBottom:16 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>
                  Task Title <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <input type="text" required placeholder="e.g. Design homepage mockup"
                  value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))}
                  style={inp} />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>Description</label>
                <textarea rows={3} placeholder="Describe what needs to be done..."
                  value={form.description}
                  onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  style={{ ...inp, resize:'vertical' }} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                <div>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Priority</label>
                  <select value={form.priority}
                    onChange={e => setForm(p=>({...p,priority:e.target.value}))} style={inp}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Deadline</label>
                  <input type="datetime-local" value={form.deadline}
                    onChange={e => setForm(p=>({...p,deadline:e.target.value}))} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>
                  Assign To <span style={{ color:'#ef4444' }}>*</span>
                </label>
                {employees.length === 0 ? (
                  <div style={{
                    background:'#0f172a', border:'1px solid #f59e0b40',
                    borderRadius:10, padding:14, marginTop:4
                  }}>
                    <p style={{ color:'#f59e0b', margin:0, fontSize:13 }}>
                      ⚠️ No active employees available.
                    </p>
                    <p style={{ color:'#64748b', margin:'6px 0 0', fontSize:12 }}>
                      Go to Approvals to approve employees, then come back to assign tasks.
                    </p>
                  </div>
                ) : (
                  <select required value={form.assignedTo}
                    onChange={e => setForm(p=>({...p,assignedTo:e.target.value}))}
                    style={inp}>
                    <option value="">— Select Employee —</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.full_name} ({e.employee_uid}){e.department_name ? ` · ${e.department_name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>Attachment (optional)</label>
                <input type="file"
                  onChange={e => setForm(p=>({...p,attachment:e.target.files[0]}))}
                  style={{ ...inp, padding:'8px 12px' }} />
              </div>

              <button type="submit" disabled={creating || employees.length === 0} style={{
                width:'100%', padding:13,
                background: employees.length === 0 ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', border:'none', borderRadius:10,
                cursor: employees.length === 0 || creating ? 'not-allowed' : 'pointer',
                fontSize:15, fontWeight:600
              }}>{creating ? '⏳ Creating...' : '📋 Create & Assign Task'}</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TASK DETAIL MODAL ── */}
      {showDetail && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:560,
            maxHeight:'90vh', overflowY:'auto', border:'1px solid #334155'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>📋 Task Details</h3>
              <button onClick={() => { setShowDetail(null); setDetail(null); }} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              {!detail ? (
                <p style={{ color:'#64748b', textAlign:'center' }}>Loading...</p>
              ) : (
                <>
                  {/* Task Info */}
                  <div style={{ background:'#0f172a', padding:16, borderRadius:12, marginBottom:20 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <span style={{
                        background:`${statusColor[detail.task?.status]}20`,
                        color:statusColor[detail.task?.status],
                        padding:'3px 10px', borderRadius:20, fontSize:12
                      }}>{statusLabel[detail.task?.status]}</span>
                      <span style={{
                        background:`${priorityColor[detail.task?.priority]}20`,
                        color:priorityColor[detail.task?.priority],
                        padding:'3px 10px', borderRadius:20, fontSize:12
                      }}>{detail.task?.priority} priority</span>
                    </div>
                    <h3 style={{ margin:'0 0 8px', fontSize:17 }}>{detail.task?.title}</h3>
                    <p style={{ color:'#94a3b8', margin:'0 0 12px', fontSize:14 }}>
                      {detail.task?.description}
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
                      <p style={{ color:'#64748b', margin:0 }}>
                        👤 <b style={{ color:'#94a3b8' }}>{detail.task?.assigned_to_name}</b>
                      </p>
                      <p style={{ color:'#64748b', margin:0 }}>
                        📌 By: <b style={{ color:'#94a3b8' }}>{detail.task?.assigned_by_name}</b>
                      </p>
                      {detail.task?.deadline && (
                        <p style={{ color:'#f59e0b', margin:0 }}>
                          ⏰ Due: {new Date(detail.task.deadline).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submissions */}
                  {detail.submissions?.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <h4 style={{ margin:'0 0 12px', color:'#94a3b8', fontSize:14 }}>
                        📤 Submissions ({detail.submissions.length})
                      </h4>
                      {detail.submissions.map((s,i) => (
                        <div key={i} style={{
                          background:'#0f172a', padding:14, borderRadius:10, marginBottom:8
                        }}>
                          <p style={{ margin:0, fontSize:14 }}>{s.submission_note || 'No note'}</p>
                          <p style={{ margin:'6px 0 0', color:'#475569', fontSize:12 }}>
                            Submitted {new Date(s.submitted_at).toLocaleString()}
                          </p>
                          {s.file_url && (
                            <a href={`http://localhost:5000/uploads/${s.file_url}`}
                               target="_blank" rel="noreferrer"
                               style={{ color:'#6366f1', fontSize:13, display:'block', marginTop:6 }}>
                              📎 View Attachment
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Review Panel */}
                  {detail.task?.status === 'submitted' && (
                    <div style={{ background:'#0f172a', padding:20, borderRadius:12, marginBottom:20 }}>
                      <h4 style={{ margin:'0 0 16px', color:'#f59e0b' }}>✅ Review Submission</h4>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                        {[
                          { v:'approved',          label:'✅ Approve',          color:'#10b981' },
                          { v:'rejected',          label:'❌ Reject',           color:'#ef4444' },
                          { v:'changes_requested', label:'🔄 Request Changes',  color:'#f59e0b' },
                        ].map(d => (
                          <div key={d.v} onClick={() => setReviewForm(p=>({...p,decision:d.v}))} style={{
                            padding:'10px', borderRadius:10, cursor:'pointer', textAlign:'center',
                            border:`2px solid ${reviewForm.decision===d.v ? d.color : '#334155'}`,
                            background: reviewForm.decision===d.v ? `${d.color}15` : 'transparent',
                            fontSize:13, fontWeight:600, color: d.color
                          }}>{d.label}</div>
                        ))}
                      </div>
                      <div style={{ marginBottom:14 }}>
                        <label style={{ color:'#94a3b8', fontSize:13 }}>Feedback (optional)</label>
                        <textarea rows={3} placeholder="Write feedback for the employee..."
                          value={reviewForm.feedback}
                          onChange={e => setReviewForm(p=>({...p,feedback:e.target.value}))}
                          style={{
                            width:'100%', padding:'10px 12px', borderRadius:8,
                            border:'1px solid #334155', background:'#1e293b',
                            color:'#fff', fontSize:14, marginTop:4,
                            resize:'vertical', boxSizing:'border-box'
                          }} />
                      </div>
                      <button onClick={() => handleReview(detail.task.id)} style={{
                        width:'100%', padding:12,
                        background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        color:'#fff', border:'none', borderRadius:10,
                        cursor:'pointer', fontSize:14, fontWeight:600
                      }}>Submit Review</button>
                    </div>
                  )}

                  {/* Review History */}
                  {detail.reviews?.length > 0 && (
                    <div>
                      <h4 style={{ margin:'0 0 12px', color:'#94a3b8', fontSize:14 }}>
                        📝 Review History
                      </h4>
                      {detail.reviews.map((r,i) => (
                        <div key={i} style={{
                          background:'#0f172a', padding:12, borderRadius:10, marginBottom:8
                        }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span style={{ color:statusColor[r.decision]||'#fff', fontSize:13, fontWeight:600 }}>
                              {r.decision.replace('_',' ')}
                            </span>
                            <span style={{ color:'#64748b', fontSize:12 }}>
                              by {r.reviewer_name}
                            </span>
                          </div>
                          {r.feedback && (
                            <p style={{ margin:'6px 0 0', color:'#94a3b8', fontSize:13 }}>{r.feedback}</p>
                          )}
                          <p style={{ margin:'4px 0 0', color:'#475569', fontSize:12 }}>
                            {new Date(r.reviewed_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}