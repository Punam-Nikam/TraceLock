import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function EmployeeApproval() {
  const [pending,      setPending]      = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [teams,        setTeams]        = useState([]);
  const [tab,          setTab]          = useState('pending');
  const [selected,     setSelected]     = useState(null);
  const [reassigning,  setReassigning]  = useState(null);
  const [form, setForm] = useState({ role:'employee', departmentId:'', teamId:'' });
  const [newDept,  setNewDept]  = useState('');
  const [newTeam,  setNewTeam]  = useState({ name:'', departmentId:'' });
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [p, a, d, t] = await Promise.all([
        axiosInstance.get('/approval/pending'),
        axiosInstance.get('/approval/all'),
        axiosInstance.get('/employees/departments'),
        axiosInstance.get('/approval/teams'),
      ]);
      setPending(p.data.employees     || []);
      setAllEmployees(a.data.employees || []);
      setDepartments(d.data.departments || []);
      setTeams(t.data.teams           || []);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Please select a role');
    setLoadingAction(true);
    try {
      await axiosInstance.post(`/approval/approve/${selected.id}`, form);
      toast.success(`✅ ${selected.full_name} approved as ${form.role.replace('_',' ')}!`);
      setSelected(null);
      setForm({ role:'employee', departmentId:'', teamId:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally { setLoadingAction(false); }
  };

  const handleReject = async (emp) => {
    if (!window.confirm(`Reject ${emp.full_name}'s registration? This cannot be undone.`)) return;
    try {
      await axiosInstance.post(`/approval/reject/${emp.id}`);
      toast.success(`${emp.full_name} rejected`);
      load();
    } catch { toast.error('Failed to reject'); }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    try {
      await axiosInstance.patch(`/approval/reassign/${reassigning.id}`, form);
      toast.success(`${reassigning.full_name} reassigned!`);
      setReassigning(null);
      setForm({ role:'employee', departmentId:'', teamId:'' });
      load();
    } catch { toast.error('Reassignment failed'); }
    finally { setLoadingAction(false); }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/employees/departments', { name: newDept });
      toast.success('Department created!');
      setShowDeptModal(false);
      setNewDept('');
      load();
    } catch { toast.error('Failed to create department'); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/approval/teams', newTeam);
      toast.success('Team created!');
      setShowTeamModal(false);
      setNewTeam({ name:'', departmentId:'' });
      load();
    } catch { toast.error('Failed to create team'); }
  };

  const filteredTeams = form.departmentId
    ? teams.filter(t => t.department_id === parseInt(form.departmentId))
    : teams;

  const filteredEmployees = allEmployees.filter(e =>
    !search || e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor  = { employee:'#22d3ee', team_lead:'#6366f1', dept_head:'#f59e0b', super_admin:'#10b981' };
  const statusColor = { active:'#10b981', pending:'#f59e0b', inactive:'#ef4444' };

  const inp = {
    width:'100%', padding:'10px 12px', borderRadius:8,
    border:'1px solid #334155', background:'#0f172a',
    color:'#fff', fontSize:14, boxSizing:'border-box', marginTop:4
  };

  const Modal = ({ title, onClose, onSubmit, children, loading }) => (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{
        background:'#1e293b', borderRadius:20, width:480,
        maxHeight:'90vh', overflowY:'auto',
        boxShadow:'0 25px 60px rgba(0,0,0,0.5)',
        border:'1px solid #334155'
      }}>
        <div style={{
          padding:'20px 24px', borderBottom:'1px solid #334155',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <h3 style={{ margin:0, fontSize:17 }}>{title}</h3>
          <button onClick={onClose} style={{
            background:'#334155', border:'none', color:'#94a3b8',
            width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:18,
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>✕</button>
        </div>
        <div style={{ padding:24 }}>
          <form onSubmit={onSubmit}>
            {children}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:13, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color:'#fff', border:'none', borderRadius:10,
              cursor:loading?'not-allowed':'pointer', fontSize:15, fontWeight:600
            }}>{loading ? '⏳ Processing...' : 'Confirm'}</button>
          </form>
        </div>
      </div>
    </div>
  );

  const RoleSelect = () => (
    <div style={{ marginBottom:16 }}>
      <label style={{ color:'#94a3b8', fontSize:13, display:'block', marginBottom:8 }}>
        Assign Role <span style={{ color:'#ef4444' }}>*</span>
      </label>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { value:'employee',  label:'👤 Employee',      color:'#22d3ee', desc:'Basic access' },
          { value:'team_lead', label:'👨‍💼 Team Lead',    color:'#6366f1', desc:'Manages team' },
          { value:'dept_head', label:'🏢 Dept Head',     color:'#f59e0b', desc:'Manages dept' },
        ].map(r => (
          <div key={r.value} onClick={() => setForm(p => ({ ...p, role:r.value }))} style={{
            padding:'12px', borderRadius:10, cursor:'pointer',
            border:`2px solid ${form.role === r.value ? r.color : '#334155'}`,
            background: form.role === r.value ? `${r.color}10` : 'transparent',
            transition:'all 0.2s'
          }}>
            <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{r.label}</p>
            <p style={{ margin:'2px 0 0', fontSize:12, color:'#64748b' }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const DeptTeamSelect = () => (
    <>
      <div style={{ marginBottom:16 }}>
        <label style={{ color:'#94a3b8', fontSize:13 }}>Department</label>
        <select value={form.departmentId}
          onChange={e => setForm(p => ({ ...p, departmentId:e.target.value, teamId:'' }))}
          style={inp}>
          <option value="">— No Department —</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {departments.length === 0 && (
          <p style={{ color:'#64748b', fontSize:12, marginTop:4 }}>
            No departments yet.{' '}
            <span onClick={() => setShowDeptModal(true)}
              style={{ color:'#6366f1', cursor:'pointer', textDecoration:'underline' }}>
              Create one first
            </span>
          </p>
        )}
      </div>
      <div style={{ marginBottom:24 }}>
        <label style={{ color:'#94a3b8', fontSize:13 }}>Team (optional)</label>
        <select value={form.teamId}
          onChange={e => setForm(p => ({ ...p, teamId:e.target.value }))}
          style={inp} disabled={!form.departmentId}>
          <option value="">— No Team —</option>
          {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
    </>
  );

  return (
    <Layout>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>👥 Employee Management</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Approve registrations, assign roles, manage departments and teams
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setShowTeamModal(true)} style={{
            background:'#334155', color:'#fff', border:'none',
            padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:13
          }}>+ New Team</button>
          <button onClick={() => setShowDeptModal(true)} style={{
            background:'#334155', color:'#fff', border:'none',
            padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:13
          }}>+ New Department</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        {[
          { label:'Pending Approval', value:pending.length,                                     color:'#f59e0b', tab:'pending' },
          { label:'Active Employees', value:allEmployees.filter(e=>e.status==='active').length,  color:'#10b981', tab:'all' },
          { label:'Inactive',         value:allEmployees.filter(e=>e.status==='inactive').length,color:'#ef4444', tab:'all' },
          { label:'Departments',      value:departments.length,                                  color:'#6366f1', tab:'all' },
          { label:'Teams',            value:teams.length,                                        color:'#22d3ee', tab:'all' },
        ].map(s => (
          <div key={s.label} onClick={() => setTab(s.tab)} style={{
            background:'#1e293b', padding:'14px 20px', borderRadius:12,
            borderLeft:`3px solid ${s.color}`, cursor:'pointer', flex:1
          }}>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>{s.label}</p>
            <h3 style={{ color:'#fff', margin:'6px 0 0', fontSize:22 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[
          { key:'pending', label:`⏳ Pending Approval (${pending.length})` },
          { key:'all',     label:`👥 All Employees (${allEmployees.length})` },
          { key:'structure', label:'🏢 Org Structure' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? '#6366f1' : '#1e293b',
            color:'#fff', border:'none', padding:'9px 20px',
            borderRadius:10, cursor:'pointer', fontSize:14,
            fontWeight: tab === t.key ? 600 : 400
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div>
          {pending.length === 0 ? (
            <div style={{
              background:'#1e293b', borderRadius:16, padding:60,
              textAlign:'center', border:'2px dashed #334155'
            }}>
              <p style={{ fontSize:48, margin:'0 0 12px' }}>✅</p>
              <h3 style={{ color:'#fff', margin:'0 0 8px' }}>All caught up!</h3>
              <p style={{ color:'#64748b' }}>
                No pending approvals right now. When employees register, they'll appear here.
              </p>
              <p style={{ color:'#475569', fontSize:13, marginTop:16 }}>
                Share your company email <b style={{ color:'#6366f1' }}>(from your .env)</b> with employees so they can register at{' '}
                <b>localhost:5173/register-employee</b>
              </p>
            </div>
          ) : (
            <div style={{ display:'grid', gap:12 }}>
              {pending.map(emp => (
                <div key={emp.id} style={{
                  background:'#1e293b', padding:20, borderRadius:16,
                  border:'1px solid #f59e0b20',
                  display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{
                      width:50, height:50, borderRadius:'50%',
                      background:'linear-gradient(135deg,#f59e0b,#ef4444)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20, fontWeight:800, color:'#0f172a', flexShrink:0
                    }}>{emp.full_name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ margin:0, fontWeight:700, fontSize:16 }}>{emp.full_name}</p>
                        <span style={{
                          background:'#f59e0b20', color:'#f59e0b',
                          padding:'2px 8px', borderRadius:20, fontSize:11
                        }}>PENDING</span>
                      </div>
                      <p style={{ margin:'3px 0 0', color:'#94a3b8', fontSize:14 }}>{emp.email}</p>
                      <p style={{ margin:'3px 0 0', color:'#64748b', fontSize:12 }}>
                        🆔 {emp.employee_uid} · Registered {new Date(emp.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                    <button onClick={() => {
                      setSelected(emp);
                      setForm({ role:'employee', departmentId:'', teamId:'' });
                    }} style={{
                      background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color:'#fff', border:'none', padding:'10px 20px',
                      borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600
                    }}>✅ Approve & Assign Role</button>
                    <button onClick={() => handleReject(emp)} style={{
                      background:'#ef444415', color:'#ef4444',
                      border:'1px solid #ef444430', padding:'10px 20px',
                      borderRadius:10, cursor:'pointer', fontSize:14
                    }}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL EMPLOYEES TAB ── */}
      {tab === 'all' && (
        <div>
          <input
            placeholder="🔍 Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, marginBottom:16, padding:'12px 16px', marginTop:0 }}
          />
          <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#0f172a' }}>
                  {['Employee','Role','Department','Team','Status','Last Login','Actions'].map(h => (
                    <th key={h} style={{
                      padding:'12px 16px', color:'#64748b',
                      fontSize:12, textAlign:'left', fontWeight:600,
                      textTransform:'uppercase', letterSpacing:0.5
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding:40, textAlign:'center', color:'#64748b' }}>
                      {search ? 'No employees match your search' : 'No employees yet. Approve pending registrations to see them here.'}
                    </td>
                  </tr>
                ) : filteredEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderTop:'1px solid #0f172a' }}
                    onMouseEnter={e => e.currentTarget.style.background='#0f172a'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{
                          width:38, height:38, borderRadius:'50%',
                          background:`linear-gradient(135deg,${roleColor[emp.role]||'#6366f1'},${roleColor[emp.role]||'#6366f1'}80)`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:15, fontWeight:700, color:'#0f172a', flexShrink:0
                        }}>{emp.full_name?.[0]?.toUpperCase()}</div>
                        <div>
                          <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{emp.full_name}</p>
                          <p style={{ margin:0, color:'#64748b', fontSize:12 }}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{
                        background:`${roleColor[emp.role]||'#6366f1'}20`,
                        color: roleColor[emp.role]||'#6366f1',
                        padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600
                      }}>{emp.role?.replace('_',' ')}</span>
                    </td>
                    <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                      {emp.department_name || <span style={{ color:'#334155' }}>—</span>}
                    </td>
                    <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                      {emp.team_name || <span style={{ color:'#334155' }}>—</span>}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <span style={{
                        background:`${statusColor[emp.status]}20`,
                        color: statusColor[emp.status],
                        padding:'3px 10px', borderRadius:20, fontSize:12
                      }}>{emp.status}</span>
                    </td>
                    <td style={{ padding:'14px 16px', color:'#64748b', fontSize:12 }}>
                      {emp.last_login
                        ? new Date(emp.last_login).toLocaleDateString('en-US',{month:'short',day:'numeric'})
                        : 'Never'}
                    </td>
                    <td style={{ padding:'14px 16px' }}>
                      <button onClick={() => {
                        setReassigning(emp);
                        setForm({ role:emp.role, departmentId:'', teamId:'' });
                      }} style={{
                        background:'#334155', color:'#fff', border:'none',
                        padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12
                      }}>🔄 Reassign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ORG STRUCTURE TAB ── */}
      {tab === 'structure' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Departments */}
          <div style={{ background:'#1e293b', borderRadius:16, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16 }}>🏢 Departments ({departments.length})</h3>
              <button onClick={() => setShowDeptModal(true)} style={{
                background:'#6366f1', color:'#fff', border:'none',
                padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:13
              }}>+ Add</button>
            </div>
            {departments.length === 0 ? (
              <p style={{ color:'#64748b', textAlign:'center', padding:'20px 0' }}>
                No departments yet. Create one to organize your team.
              </p>
            ) : departments.map(d => (
              <div key={d.id} style={{
                background:'#0f172a', padding:'12px 16px', borderRadius:10, marginBottom:8,
                display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:14 }}>🏢 {d.name}</p>
                  <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:12 }}>
                    {teams.filter(t => t.department_id === d.id).length} teams ·{' '}
                    {allEmployees.filter(e => e.department_name === d.name).length} employees
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Teams */}
          <div style={{ background:'#1e293b', borderRadius:16, padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0, fontSize:16 }}>👥 Teams ({teams.length})</h3>
              <button onClick={() => setShowTeamModal(true)} style={{
                background:'#6366f1', color:'#fff', border:'none',
                padding:'7px 14px', borderRadius:8, cursor:'pointer', fontSize:13
              }}>+ Add</button>
            </div>
            {teams.length === 0 ? (
              <p style={{ color:'#64748b', textAlign:'center', padding:'20px 0' }}>
                No teams yet. Create departments first, then add teams.
              </p>
            ) : teams.map(t => (
              <div key={t.id} style={{
                background:'#0f172a', padding:'12px 16px', borderRadius:10, marginBottom:8
              }}>
                <p style={{ margin:0, fontWeight:600, fontSize:14 }}>👥 {t.name}</p>
                <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:12 }}>
                  🏢 {t.department_name} {t.lead_name ? `· Lead: ${t.lead_name}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── APPROVE MODAL ── */}
      {selected && (
        <Modal title={`✅ Approve — ${selected.full_name}`}
          onClose={() => setSelected(null)}
          onSubmit={handleApprove}
          loading={loadingAction}>
          <div style={{ background:'#0f172a', padding:16, borderRadius:12, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{
                width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:18, fontWeight:700, color:'#fff'
              }}>{selected.full_name?.[0]?.toUpperCase()}</div>
              <div>
                <p style={{ margin:0, fontWeight:700 }}>{selected.full_name}</p>
                <p style={{ margin:'2px 0 0', color:'#94a3b8', fontSize:13 }}>{selected.email}</p>
                <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:12 }}>🆔 {selected.employee_uid}</p>
              </div>
            </div>
          </div>
          <RoleSelect />
          <DeptTeamSelect />
        </Modal>
      )}

      {/* ── REASSIGN MODAL ── */}
      {reassigning && (
        <Modal title={`🔄 Reassign — ${reassigning.full_name}`}
          onClose={() => setReassigning(null)}
          onSubmit={handleReassign}
          loading={loadingAction}>
          <div style={{ background:'#0f172a', padding:14, borderRadius:10, marginBottom:20 }}>
            <p style={{ margin:0, fontSize:13, color:'#94a3b8' }}>
              Current: <b style={{ color:'#fff' }}>{reassigning.role?.replace('_',' ')}</b>
              {reassigning.department_name && ` · ${reassigning.department_name}`}
              {reassigning.team_name && ` · ${reassigning.team_name}`}
            </p>
          </div>
          <RoleSelect />
          <DeptTeamSelect />
        </Modal>
      )}

      {/* ── CREATE DEPARTMENT MODAL ── */}
      {showDeptModal && (
        <Modal title="🏢 Create Department"
          onClose={() => setShowDeptModal(false)}
          onSubmit={handleCreateDept} loading={false}>
          <div style={{ marginBottom:20 }}>
            <label style={{ color:'#94a3b8', fontSize:13 }}>Department Name</label>
            <input type="text" placeholder="e.g. Engineering, HR, Marketing"
              value={newDept} onChange={e => setNewDept(e.target.value)}
              required style={{ ...inp, marginBottom:0 }} />
          </div>
        </Modal>
      )}

      {/* ── CREATE TEAM MODAL ── */}
      {showTeamModal && (
        <Modal title="👥 Create Team"
          onClose={() => setShowTeamModal(false)}
          onSubmit={handleCreateTeam} loading={false}>
          <div style={{ marginBottom:16 }}>
            <label style={{ color:'#94a3b8', fontSize:13 }}>Team Name</label>
            <input type="text" placeholder="e.g. Frontend Team, Data Science"
              value={newTeam.name}
              onChange={e => setNewTeam(p => ({ ...p, name:e.target.value }))}
              required style={inp} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ color:'#94a3b8', fontSize:13 }}>Department <span style={{ color:'#ef4444' }}>*</span></label>
            <select value={newTeam.departmentId}
              onChange={e => setNewTeam(p => ({ ...p, departmentId:e.target.value }))}
              required style={inp}>
              <option value="">— Select Department —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </Modal>
      )}
    </Layout>
  );
}