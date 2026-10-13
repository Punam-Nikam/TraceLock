import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import axiosInstance from '../../api/axiosInstance';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#f59e0b','#22d3ee','#10b981','#ef4444'];

function StatCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:'#1e293b', padding:'22px 24px', borderRadius:16,
      borderLeft:`4px solid ${color}`, flex:1, minWidth:160,
      cursor: onClick ? 'pointer' : 'default',
      transition:'transform 0.2s, box-shadow 0.2s',
      position:'relative', overflow:'hidden'
    }}
      onMouseEnter={e => { if(onClick) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${color}20`; }}}
      onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{
        position:'absolute', right:16, top:16, fontSize:32, opacity:0.1
      }}>{icon}</div>
      <p style={{ color:'#64748b', fontSize:12, margin:0, textTransform:'uppercase', letterSpacing:1 }}>{label}</p>
      <h2 style={{ color:'#fff', margin:'8px 0 0', fontSize:36, fontWeight:800 }}>{value ?? 0}</h2>
      {sub && <p style={{ color:'#64748b', fontSize:12, margin:'6px 0 0' }}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/dashboard'),
      axiosInstance.get('/approval/pending'),
    ]).then(([dash, pending]) => {
      setData({ ...dash.data.data, pendingCount: pending.data.employees?.length || 0 });
    }).catch(err => {
      console.error('Dashboard load error:', err);
      toast.error('Failed to load dashboard data');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
        <div style={{ width:48, height:48, border:'3px solid #6366f1', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
        <p style={{ color:'#64748b' }}>Loading dashboard...</p>
      </div>
    </Layout>
  );

  const taskPie = [
    { name:'Todo',        value: parseInt(data?.taskStats?.todo)          || 0 },
    { name:'In Progress', value: parseInt(data?.taskStats?.inProgress)    || 0 },
    { name:'In Review',   value: parseInt(data?.taskStats?.pendingReview) || 0 },
    { name:'Completed',   value: parseInt(data?.taskStats?.completed)     || 0 },
    { name:'Rejected',    value: parseInt(data?.taskStats?.rejected)      || 0 },
  ].filter(d => d.value > 0);

  return (
    <Layout>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>Dashboard Overview</h1>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        {data?.pendingCount > 0 && (
          <button onClick={() => navigate('/admin/approvals')} style={{
            background:'#ef444420', color:'#ef4444',
            border:'1px solid #ef444440', padding:'10px 20px',
            borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:14,
            display:'flex', alignItems:'center', gap:8
          }}>
            ⏳ {data.pendingCount} Pending Approval{data.pendingCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
        <StatCard icon="👥" label="Active Employees"  value={data?.totalEmployees}              color="#6366f1"
          sub={data?.pendingCount > 0 ? `+${data.pendingCount} pending` : 'All active'}
          onClick={() => navigate('/admin/employees')} />
        <StatCard icon="📁" label="Files This Month"  value={data?.filesShared}                 color="#22d3ee"
          onClick={() => navigate('/admin/files')} />
        <StatCard icon="⚠️" label="Open Alerts"       value={data?.openAlerts}                  color="#ef4444"
          sub={data?.openAlerts > 0 ? 'Requires attention' : 'All clear'}
          onClick={() => navigate('/admin/alerts')} />
        <StatCard icon="📋" label="Pending Reviews"   value={data?.taskStats?.pendingReview}    color="#f59e0b"
          onClick={() => navigate('/admin/tasks')} />
        <StatCard icon="✅" label="Tasks Completed"   value={data?.taskStats?.completed}        color="#10b981" />
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
        {/* Downloads Line Chart */}
        <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>📥 File Downloads — Last 7 Days</h3>
          </div>
          {data?.downloadTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.downloadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill:'#64748b', fontSize:11 }}
                  tickFormatter={v => new Date(v).toLocaleDateString('en',{month:'short',day:'numeric'})} />
                <YAxis tick={{ fill:'#64748b', fontSize:11 }} />
                <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#fff' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill:'#6366f1', r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ color:'#475569' }}>No download data yet. Share files to see activity.</p>
            </div>
          )}
        </div>

        {/* Task Pie */}
        <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
          <h3 style={{ margin:'0 0 20px', fontSize:15, fontWeight:600 }}>📊 Task Status</h3>
          {taskPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={taskPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {taskPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#fff' }} />
                <Legend formatter={v => <span style={{ color:'#94a3b8', fontSize:12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ color:'#475569' }}>No tasks yet. Create tasks to see stats.</p>
            </div>
          )}
        </div>
      </div>

      {/* Department Bar Chart */}
      {data?.deptStats?.filter(d => d.department).length > 0 && (
        <div style={{ background:'#1e293b', padding:24, borderRadius:16, marginBottom:24 }}>
          <h3 style={{ margin:'0 0 20px', fontSize:15, fontWeight:600 }}>🏢 Task Progress by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.deptStats.filter(d => d.department)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="department" tick={{ fill:'#64748b', fontSize:12 }} />
              <YAxis tick={{ fill:'#64748b', fontSize:12 }} />
              <Tooltip contentStyle={{ background:'#0f172a', border:'1px solid #334155', borderRadius:8, color:'#fff' }} />
              <Legend formatter={v => <span style={{ color:'#94a3b8', fontSize:12 }}>{v}</span>} />
              <Bar dataKey="total"     fill="#334155" name="Total Tasks"     radius={[4,4,0,0]} />
              <Bar dataKey="completed" fill="#10b981"  name="Completed Tasks" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ background:'#1e293b', padding:24, borderRadius:16 }}>
        <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600 }}>⚡ Quick Actions</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[
            { icon:'⏳', label:'Review Pending', sub:'Approve employees', color:'#ef4444', path:'/admin/approvals' },
            { icon:'👥', label:'Add Employee',   sub:'Create new account', color:'#6366f1', path:'/admin/employees' },
            { icon:'📤', label:'Upload File',    sub:'Share securely',    color:'#22d3ee', path:'/admin/files' },
            { icon:'📋', label:'Create Task',    sub:'Assign to team',    color:'#f59e0b', path:'/admin/tasks' },
            { icon:'🔍', label:'Detect Leak',    sub:'Trace file leak',   color:'#8b5cf6', path:'/admin/leak-detection' },
            { icon:'🏢', label:'Departments',    sub:'Manage structure',  color:'#10b981', path:'/admin/employees' },
            { icon:'📜', label:'Audit Logs',     sub:'View all actions',  color:'#64748b', path:'/admin/audit' },
            { icon:'⚠️', label:'Alerts',         sub:'Security alerts',   color:'#f97316', path:'/admin/alerts' },
          ].map(a => (
            <button key={a.path+a.label} onClick={() => navigate(a.path)} style={{
              background:'#0f172a', border:`1px solid ${a.color}20`,
              borderRadius:12, padding:'16px', cursor:'pointer',
              textAlign:'left', transition:'all 0.2s'
            }}
              onMouseEnter={e => { e.currentTarget.style.border=`1px solid ${a.color}60`; e.currentTarget.style.background=`${a.color}08`; }}
              onMouseLeave={e => { e.currentTarget.style.border=`1px solid ${a.color}20`; e.currentTarget.style.background='#0f172a'; }}>
              <p style={{ fontSize:24, margin:'0 0 8px' }}>{a.icon}</p>
              <p style={{ color:'#fff', fontSize:13, fontWeight:600, margin:0 }}>{a.label}</p>
              <p style={{ color:'#64748b', fontSize:12, margin:'2px 0 0' }}>{a.sub}</p>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}