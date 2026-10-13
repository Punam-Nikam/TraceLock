import Sidebar          from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth }      from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  return (
    <div style={{ display:'flex', background:'#0f172a', minHeight:'100vh' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding:'12px 24px', background:'#1e293b',
          borderBottom:'1px solid #334155',
          display:'flex', justifyContent:'space-between', alignItems:'center'
        }}>
          <p style={{ color:'#94a3b8', margin:0, fontSize:13 }}>
            👋 Hello, <b style={{ color:'#fff' }}>{user?.full_name}</b>
            {user?.company_name && (
              <span style={{ color:'#475569' }}> · {user.company_name}</span>
            )}
          </p>
          <NotificationBell />
        </div>
        {/* Page content */}
        <div style={{ flex:1, padding:24, overflowY:'auto', color:'#fff' }}>
          {children}
        </div>
      </div>
    </div>
  );
}