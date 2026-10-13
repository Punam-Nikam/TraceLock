import { useAuth }     from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const adminLinks = [
  { path:'/admin',                icon:'📊', label:'Dashboard' },
  { path:'/admin/approvals',      icon:'⏳', label:'Approvals' },
  { path:'/admin/employees',      icon:'👥', label:'Employees' },
  { path:'/admin/files',          icon:'📁', label:'Files' },
  { path:'/admin/tasks',          icon:'📋', label:'Tasks' },
  { path:'/admin/leak-detection', icon:'🔍', label:'Leak Detection' },
  { path:'/admin/audit',          icon:'📜', label:'Audit Logs' },
  { path:'/admin/alerts',         icon:'⚠️', label:'Alerts' },
];

const employeeLinks = [
  { path:'/employee',          icon:'🏠', label:'Dashboard' },
  { path:'/employee/tasks',    icon:'📋', label:'My Tasks' },
  { path:'/employee/files',    icon:'📁', label:'My Files' },
  { path:'/employee/activity', icon:'📈', label:'My Activity' },
];

const deptHeadLinks = [
  { path:'/dept-head',       icon:'📊', label:'Dashboard' },
  { path:'/dept-head/tasks', icon:'📋', label:'Tasks' },
  { path:'/dept-head/team',  icon:'👥', label:'My Department' },
];

const teamLeadLinks = [
  { path:'/team-lead',        icon:'📊', label:'Dashboard' },
  { path:'/team-lead/tasks',  icon:'📋', label:'Tasks' },
  { path:'/team-lead/team',   icon:'👥', label:'My Team' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const links =
    ['super_admin','admin'].includes(user?.role) ? adminLinks :
    user?.role === 'dept_head'                   ? deptHeadLinks :
    user?.role === 'team_lead'                   ? teamLeadLinks :
    employeeLinks;

  return (
    <div style={{
      width:240, minHeight:'100vh', background:'#1e293b',
      display:'flex', flexDirection:'column',
      borderRight:'1px solid #334155', flexShrink:0
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px', borderBottom:'1px solid #334155' }}>
        <h2 style={{ color:'#6366f1', margin:0, fontSize:22 }}>🔐 TraceLock</h2>
        <p style={{ color:'#94a3b8', margin:'4px 0 0', fontSize:11 }}>Secure Data Platform</p>
      </div>

      {/* User Info */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #334155' }}>
        <div style={{
          width:40, height:40, borderRadius:'50%', background:'#6366f1',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:17, fontWeight:700, marginBottom:8, color:'#fff'
        }}>{user?.full_name?.[0]?.toUpperCase()}</div>
        <p style={{ color:'#fff', margin:0, fontSize:14, fontWeight:600 }}>{user?.full_name}</p>
        <p style={{ color:'#94a3b8', margin:'2px 0 0', fontSize:11 }}>
          {user?.employee_uid}
        </p>
        <p style={{ color:'#6366f1', margin:'2px 0 0', fontSize:11, textTransform:'capitalize' }}>
          {user?.role?.replace('_',' ')}
        </p>
        {user?.department_name && (
          <p style={{ color:'#64748b', margin:'2px 0 0', fontSize:11 }}>
            🏢 {user.department_name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
        {links.map(link => {
          const isActive = location.pathname === link.path;
          return (
            <button key={link.path} onClick={() => navigate(link.path)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12,
              padding:'11px 20px', border:'none',
              background: isActive ? '#6366f1' : 'transparent',
              color: isActive ? '#fff' : '#94a3b8',
              cursor:'pointer', fontSize:14, textAlign:'left',
              borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
            }}>
              <span style={{ fontSize:16 }}>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding:'16px 20px', borderTop:'1px solid #334155' }}>
        <button onClick={logout} style={{
          width:'100%', padding:'10px', background:'#ef444415',
          color:'#ef4444', border:'1px solid #ef444430',
          borderRadius:8, cursor:'pointer', fontSize:14
        }}>🚪 Logout</button>
      </div>
    </div>
  );
}