import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getEmployees, createEmployee, toggleEmployee, getDepartments, createDepartment } from '../../api/employeeAPI';
import toast from 'react-hot-toast';

export default function EmployeeManagement() {
  const [employees,    setEmployees]    = useState([]);
  const [departments,  setDepartments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showAdd,      setShowAdd]      = useState(false);
  const [showDept,     setShowDept]     = useState(false);
  const [creating,     setCreating]     = useState(false);
  const [newDeptName,  setNewDeptName]  = useState('');
  const [form, setForm] = useState({
    fullName: '', email: '', role: 'employee', departmentId: ''
  });

  const load = async (q = search) => {
    try {
      const [empRes, deptRes] = await Promise.all([
        getEmployees({ search: q }),
        getDepartments(),
      ]);
      setEmployees(empRes.employees   || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => load(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createEmployee(form);
      toast.success(res.message || 'Employee created!');
      setShowAdd(false);
      setForm({ fullName:'', email:'', role:'employee', departmentId:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally { setCreating(false); }
  };

  const handleToggle = async (emp) => {
    const newStatus = emp.status === 'active' ? false : true;
    const action    = newStatus ? 'Activate' : 'Deactivate';
    if (!window.confirm(`${action} ${emp.full_name}?`)) return;
    try {
      await toggleEmployee(emp.id, newStatus);
      toast.success(`${emp.full_name} ${newStatus ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return toast.error('Enter department name');
    try {
      await createDepartment(newDeptName.trim());
      toast.success('Department created!');
      setShowDept(false);
      setNewDeptName('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const stats = {
    total:    employees.length,
    active:   employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    pending:  employees.filter(e => e.status === 'pending').length,
  };

  const roleColor   = { employee:'#22d3ee', team_lead:'#6366f1', dept_head:'#f59e0b', super_admin:'#10b981' };
  const statusStyle = {
    active:   { bg:'#10b98120', color:'#10b981' },
    inactive: { bg:'#ef444420', color:'#ef4444' },
    pending:  { bg:'#f59e0b20', color:'#f59e0b' },
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
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>👥 Employee Management</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Manage all employees in your company
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setShowDept(true)} style={{
            background:'#334155', color:'#fff', border:'none',
            padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:14
          }}>🏢 New Department</button>
          <button onClick={() => setShowAdd(true)} style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
            border:'none', padding:'10px 18px', borderRadius:10,
            cursor:'pointer', fontSize:14, fontWeight:600
          }}>+ Add Employee</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Total',    value:stats.total,    color:'#6366f1' },
          { label:'Active',   value:stats.active,   color:'#10b981' },
          { label:'Pending',  value:stats.pending,  color:'#f59e0b' },
          { label:'Inactive', value:stats.inactive, color:'#ef4444' },
          { label:'Departments', value:departments.length, color:'#22d3ee' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#1e293b', padding:'14px 20px',
            borderRadius:12, borderLeft:`3px solid ${s.color}`, flex:1, minWidth:100
          }}>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>{s.label}</p>
            <h3 style={{ color:'#fff', margin:'6px 0 0', fontSize:22, fontWeight:700 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Departments Preview */}
      {departments.length > 0 && (
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {departments.map(d => (
            <span key={d.id} style={{
              background:'#6366f115', color:'#818cf8',
              border:'1px solid #6366f130', padding:'4px 12px',
              borderRadius:20, fontSize:13
            }}>🏢 {d.name} ({d.employee_count || 0})</span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        placeholder="🔍 Search by name, email, or employee ID..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inp, marginBottom:16, marginTop:0, padding:'12px 16px' }}
      />

      {/* Table */}
      <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>
            <p>Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <p style={{ fontSize:48, margin:0 }}>👥</p>
            <h3 style={{ color:'#fff', margin:'12px 0 8px' }}>
              {search ? 'No employees match your search' : 'No employees yet'}
            </h3>
            <p style={{ color:'#64748b', marginBottom:20 }}>
              {search
                ? 'Try a different search term'
                : 'Add employees directly or wait for self-registrations in the Approvals section'}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} style={{
                background:'#6366f1', color:'#fff', border:'none',
                padding:'10px 24px', borderRadius:10, cursor:'pointer', fontSize:14
              }}>+ Add First Employee</button>
            )}
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#0f172a' }}>
                {['Employee','Email','Department','Role','Status','Last Login','Actions'].map(h => (
                  <th key={h} style={{
                    padding:'12px 16px', color:'#64748b', fontSize:12,
                    textAlign:'left', textTransform:'uppercase', letterSpacing:0.5
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderTop:'1px solid #0f172a' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:38, height:38, borderRadius:'50%',
                        background:`linear-gradient(135deg,${roleColor[emp.role]||'#6366f1'},${roleColor[emp.role]||'#6366f1'}80)`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:15, fontWeight:700, color:'#0f172a', flexShrink:0
                      }}>{emp.full_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{emp.full_name}</p>
                        <p style={{ margin:0, color:'#64748b', fontSize:12 }}>{emp.employee_uid}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                    {emp.email}
                  </td>
                  <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                    {emp.department_name
                      ? <span style={{ background:'#334155', padding:'2px 8px', borderRadius:6, fontSize:12 }}>
                          {emp.department_name}
                        </span>
                      : <span style={{ color:'#334155' }}>—</span>
                    }
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      background:`${roleColor[emp.role]||'#6366f1'}20`,
                      color: roleColor[emp.role]||'#6366f1',
                      padding:'3px 10px', borderRadius:20,
                      fontSize:12, fontWeight:600, textTransform:'capitalize'
                    }}>{emp.role?.replace('_',' ')}</span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      background: statusStyle[emp.status]?.bg || '#33445520',
                      color:      statusStyle[emp.status]?.color || '#64748b',
                      padding:'3px 10px', borderRadius:20, fontSize:12
                    }}>{emp.status}</span>
                  </td>
                  <td style={{ padding:'14px 16px', color:'#64748b', fontSize:12 }}>
                    {emp.last_login
                      ? new Date(emp.last_login).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
                      : 'Never'}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <button onClick={() => handleToggle(emp)} style={{
                      background: emp.status === 'active' ? '#ef444415' : '#10b98115',
                      color:      emp.status === 'active' ? '#ef4444'   : '#10b981',
                      border:     emp.status === 'active' ? '1px solid #ef444430' : '1px solid #10b98130',
                      padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600
                    }}>
                      {emp.status === 'active' ? '🚫 Deactivate' : '✅ Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── ADD EMPLOYEE MODAL ── */}
      {showAdd && (
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
              <h3 style={{ margin:0 }}>➕ Add Employee Directly</h3>
              <button onClick={() => setShowAdd(false)} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              <div style={{
                background:'#10b98110', border:'1px solid #10b98130',
                borderRadius:10, padding:12, marginBottom:20
              }}>
                <p style={{ color:'#64748b', fontSize:13, margin:0 }}>
                  ✅ Employee added this way gets <b style={{ color:'#10b981' }}>immediate access</b>.
                  A temporary password will be emailed to them.
                </p>
              </div>
              <form onSubmit={handleCreate}>
                {[
                  { label:'Full Name', name:'fullName', type:'text', placeholder:'John Doe' },
                  { label:'Email',     name:'email',    type:'email', placeholder:'john@company.com' },
                ].map(f => (
                  <div key={f.name} style={{ marginBottom:16 }}>
                    <label style={{ color:'#94a3b8', fontSize:13 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} required
                      value={form[f.name]}
                      onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                      style={inp} />
                  </div>
                ))}

                <div style={{ marginBottom:16 }}>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Role</label>
                  <select value={form.role}
                    onChange={e => setForm(p => ({ ...p, role:e.target.value }))}
                    style={inp}>
                    <option value="employee">👤 Employee</option>
                    <option value="team_lead">👨‍💼 Team Lead</option>
                    <option value="dept_head">🏢 Department Head</option>
                  </select>
                </div>

                <div style={{ marginBottom:24 }}>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Department (optional)</label>
                  <select value={form.departmentId}
                    onChange={e => setForm(p => ({ ...p, departmentId:e.target.value }))}
                    style={inp}>
                    <option value="">— No Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {departments.length === 0 && (
                    <p style={{ color:'#f59e0b', fontSize:12, marginTop:6 }}>
                      No departments yet.{' '}
                      <span onClick={() => { setShowAdd(false); setShowDept(true); }}
                        style={{ color:'#6366f1', cursor:'pointer' }}>Create one first</span>
                    </p>
                  )}
                </div>

                <button type="submit" disabled={creating} style={{
                  width:'100%', padding:13,
                  background: creating ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', border:'none', borderRadius:10,
                  cursor: creating ? 'not-allowed' : 'pointer', fontSize:15, fontWeight:600
                }}>{creating ? '⏳ Creating...' : '➕ Create Employee'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE DEPARTMENT MODAL ── */}
      {showDept && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:400,
            border:'1px solid #334155'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>🏢 Create Department</h3>
              <button onClick={() => setShowDept(false)} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              {departments.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ color:'#64748b', fontSize:13, margin:'0 0 8px' }}>
                    Existing departments:
                  </p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {departments.map(d => (
                      <span key={d.id} style={{
                        background:'#334155', color:'#94a3b8',
                        padding:'3px 10px', borderRadius:20, fontSize:12
                      }}>{d.name}</span>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handleCreateDept}>
                <div style={{ marginBottom:20 }}>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Department Name</label>
                  <input type="text" placeholder="e.g. Engineering, HR, Marketing"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    required style={inp} autoFocus />
                </div>
                <button type="submit" style={{
                  width:'100%', padding:13,
                  background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color:'#fff', border:'none', borderRadius:10,
                  cursor:'pointer', fontSize:15, fontWeight:600
                }}>Create Department</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}