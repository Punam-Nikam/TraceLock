import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [open,    setOpen]    = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetch = () => {
      axiosInstance.get('/notifications')
        .then(r => { setNotifications(r.data.notifications || []); setUnread(r.data.unread || 0); })
        .catch(() => {});
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, []);

  const markAll = async () => {
    await axiosInstance.patch('/notifications/read-all');
    setUnread(0);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  const icons = { task:'📋', file:'📁', alert:'⚠️', system:'🔔' };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        background:'#334155', border:'none', color:'#fff',
        padding:'8px 12px', borderRadius:8, cursor:'pointer',
        position:'relative', fontSize:18
      }}>
        🔔
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4, background:'#ef4444',
            color:'#fff', borderRadius:'50%', width:18, height:18,
            fontSize:11, display:'flex', alignItems:'center', justifyContent:'center'
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute', right:0, top:44, width:320,
          background:'#1e293b', borderRadius:12,
          boxShadow:'0 10px 40px rgba(0,0,0,0.5)',
          zIndex:999, maxHeight:400, overflowY:'auto'
        }}>
          <div style={{
            padding:'12px 16px', borderBottom:'1px solid #334155',
            display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <span style={{ fontWeight:600, color:'#fff' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{
                background:'none', border:'none', color:'#6366f1',
                cursor:'pointer', fontSize:12
              }}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p style={{ padding:16, color:'#94a3b8', textAlign:'center', fontSize:13 }}>
              No notifications
            </p>
          ) : notifications.map(n => (
            <div key={n.id} style={{
              padding:'12px 16px', borderBottom:'1px solid #0f172a',
              background: n.is_read ? 'transparent' : '#0f172a20'
            }}>
              <p style={{ margin:0, fontSize:13, color:'#fff' }}>
                {icons[n.type] || '🔔'} <b>{n.title}</b>
              </p>
              <p style={{ margin:'4px 0 0', color:'#94a3b8', fontSize:12 }}>{n.message}</p>
              <p style={{ margin:'4px 0 0', color:'#475569', fontSize:11 }}>
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}