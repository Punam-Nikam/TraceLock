import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const goToDashboard = () => {
    const map = {
      super_admin: '/admin',
      dept_head:   '/admin',
      team_lead:   '/employee',
      employee:    '/employee'
    };
    navigate(map[user?.role] || '/login');
  };

  return (
    <div style={{ background:'#0a0f1e', minHeight:'100vh', color:'#fff', fontFamily:'system-ui, -apple-system, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        padding:'0 60px', height:64, display:'flex', justifyContent:'space-between',
        alignItems:'center', borderBottom:'1px solid #1a2744',
        position:'sticky', top:0, zIndex:100,
        background:'rgba(10,15,30,0.95)', backdropFilter:'blur(20px)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18
          }}>🔐</div>
          <span style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.5px' }}>TraceLock</span>
          <span style={{
            background:'#6366f115', color:'#818cf8', fontSize:11,
            padding:'2px 8px', borderRadius:20, border:'1px solid #6366f130',
            marginLeft:4
          }}>Enterprise</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:32 }}>
          {['Features','How it Works','Security','Pricing'].map(item => (
            <span key={item} style={{ color:'#64748b', fontSize:14, cursor:'pointer' }}
              onMouseEnter={e => e.target.style.color='#fff'}
              onMouseLeave={e => e.target.style.color='#64748b'}>
              {item}
            </span>
          ))}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          {isAuthenticated ? (
            <button onClick={goToDashboard} style={{
              background:'#6366f1', color:'#fff', border:'none',
              padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600
            }}>Go to Dashboard →</button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{
                background:'transparent', color:'#94a3b8',
                border:'1px solid #1e293b', padding:'9px 22px',
                borderRadius:8, cursor:'pointer', fontSize:14
              }}>Login</button>
              {/* FIXED: was /register-company → now /register */}
              <button onClick={() => navigate('/register')} style={{
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
                border:'none', padding:'9px 22px',
                borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600
              }}>Get Started Free</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        padding:'100px 60px 80px', textAlign:'center',
        background:'radial-gradient(ellipse 80% 50% at 50% -10%, #1e1b4b, transparent)'
      }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'#6366f110', border:'1px solid #6366f130',
          padding:'6px 16px', borderRadius:100, marginBottom:28
        }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#22d3ee', display:'inline-block' }}/>
          <span style={{ color:'#94a3b8', fontSize:13 }}>Trusted by 500+ companies worldwide</span>
        </div>

        <h1 style={{ fontSize:64, fontWeight:800, lineHeight:1.1, margin:'0 0 24px', letterSpacing:'-2px' }}>
          Enterprise Data Security<br/>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Built for Teams
          </span>
        </h1>

        <p style={{ color:'#64748b', fontSize:20, maxWidth:600, margin:'0 auto 48px', lineHeight:1.7 }}>
          TraceLock secures your company's data, tracks every action,
          watermarks every file, and detects leaks before they become disasters.
        </p>

        <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:60 }}>
          {/* FIXED: was /register-company → now /register */}
          <button onClick={() => navigate('/register')} style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
            border:'none', padding:'16px 36px', borderRadius:12,
            cursor:'pointer', fontSize:16, fontWeight:700,
            boxShadow:'0 0 40px #6366f150'
          }}>🏢 Register Your Company</button>
          {/* FIXED: was /register-employee → now /join */}
          <button onClick={() => navigate('/join')} style={{
            background:'transparent', color:'#fff',
            border:'2px solid #1e293b', padding:'16px 36px',
            borderRadius:12, cursor:'pointer', fontSize:16, fontWeight:600
          }}>👤 Join as Employee</button>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', justifyContent:'center', gap:64 }}>
          {[
            { num:'500+', label:'Companies' },
            { num:'50K+', label:'Employees' },
            { num:'99.9%', label:'Uptime' },
            { num:'0',     label:'Data Breaches' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <p style={{ fontSize:32, fontWeight:800, margin:0, color:'#6366f1' }}>{s.num}</p>
              <p style={{ fontSize:13, color:'#64748b', margin:'4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ padding:'80px 60px', background:'#0f172a' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ color:'#6366f1', fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            FEATURES
          </p>
          <h2 style={{ fontSize:40, fontWeight:700, margin:0, letterSpacing:'-1px' }}>
            Everything your enterprise needs
          </h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, maxWidth:1200, margin:'0 auto' }}>
          {[
            { icon:'🔒', color:'#6366f1', title:'AES-256 File Encryption',
              desc:'Every file encrypted at rest and in transit. Military-grade security for your sensitive documents.' },
            { icon:'💧', color:'#22d3ee', title:'Invisible Watermarking',
              desc:'Each download embeds an encrypted employee ID as an invisible watermark. Trace any leak instantly.' },
            { icon:'🔍', color:'#f59e0b', title:'Leak Detection',
              desc:'Upload any suspected leaked file. Our system extracts the watermark and identifies the source in seconds.' },
            { icon:'📋', color:'#10b981', title:'Task Management',
              desc:'Assign tasks, set deadlines, track progress, review submissions. Full audit trail included.' },
            { icon:'👁', color:'#8b5cf6', title:'Activity Monitoring',
              desc:'Real-time tracking of every login, download, and action. Suspicious behavior triggers instant alerts.' },
            { icon:'🏢', color:'#ef4444', title:'Role-Based Access',
              desc:'Super Admin, Dept Head, Team Lead, Employee — each role sees exactly what they need, nothing more.' },
          ].map(f => (
            <div key={f.title} style={{
              background:'#1e293b', padding:28, borderRadius:16,
              border:`1px solid ${f.color}20`, transition:'all 0.3s', cursor:'default'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.border=`1px solid ${f.color}50`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.border=`1px solid ${f.color}20`; }}>
              <div style={{
                width:48, height:48, borderRadius:12,
                background:`${f.color}15`, display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:24, marginBottom:16
              }}>{f.icon}</div>
              <h3 style={{ margin:'0 0 10px', fontSize:17, fontWeight:700 }}>{f.title}</h3>
              <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, margin:0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ padding:'80px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <p style={{ color:'#6366f1', fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>
            HOW IT WORKS
          </p>
          <h2 style={{ fontSize:40, fontWeight:700, margin:0, letterSpacing:'-1px' }}>
            Up and running in minutes
          </h2>
        </div>

        <div style={{ display:'flex', alignItems:'flex-start', gap:0, maxWidth:1000, margin:'0 auto', position:'relative' }}>
          <div style={{
            position:'absolute', top:28, left:'12.5%', right:'12.5%',
            height:2, background:'linear-gradient(90deg,#6366f1,#22d3ee,#10b981,#f59e0b)',
            zIndex:0
          }}/>
          {[
            { n:'1', icon:'🏢', color:'#6366f1', title:'Register Company',
              desc:'Super Admin registers the company at /register. Account is immediately active.' },
            { n:'2', icon:'👤', color:'#22d3ee', title:'Employees Join',
              desc:'Employees go to /join, enter their details and the company email. Status: Pending.' },
            { n:'3', icon:'✅', color:'#10b981', title:'Admin Approves',
              desc:'Super Admin reviews pending accounts in the Approvals tab, assigns role and department.' },
            { n:'4', icon:'🚀', color:'#f59e0b', title:'Work Begins',
              desc:'Everyone logs in to their role-specific dashboard. Files, tasks, and tracking go live.' },
          ].map(s => (
            <div key={s.n} style={{ flex:1, textAlign:'center', padding:'0 20px', position:'relative', zIndex:1 }}>
              <div style={{
                width:56, height:56, borderRadius:'50%',
                background:`linear-gradient(135deg,${s.color},${s.color}99)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:24, margin:'0 auto 20px',
                boxShadow:`0 0 20px ${s.color}50`
              }}>{s.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:700, margin:'0 0 8px' }}>{s.title}</h3>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.7, margin:0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROLE CARDS ── */}
      <div style={{ padding:'80px 60px', background:'#0f172a' }}>
        <div style={{ textAlign:'center', marginBottom:60 }}>
          <h2 style={{ fontSize:40, fontWeight:700, margin:0, letterSpacing:'-1px' }}>
            Built for every role
          </h2>
          <p style={{ color:'#64748b', marginTop:12 }}>Each role has tailored permissions — controlled only by Super Admin</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, maxWidth:1100, margin:'0 auto' }}>
          {[
            { role:'Super Admin', icon:'👑', color:'#ef4444',
              perms:['Full system access','Approve employees','Assign roles','View all data','Export audit logs'] },
            { role:'Dept Head',   icon:'🏢', color:'#f59e0b',
              perms:['Manage department','Upload files','Assign tasks','View team activity','Review submissions'] },
            { role:'Team Lead',   icon:'👨‍💼', color:'#6366f1',
              perms:['Manage team','Assign tasks','Review work','Track progress','View team files'] },
            { role:'Employee',    icon:'👤', color:'#10b981',
              perms:['View my tasks','Download files','Submit work','View my activity','Receive notifications'] },
          ].map(r => (
            <div key={r.role} style={{
              background:'#1e293b', borderRadius:16, overflow:'hidden',
              border:`1px solid ${r.color}20`
            }}>
              <div style={{
                padding:'20px', borderBottom:`1px solid ${r.color}20`,
                background:`${r.color}08`
              }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{r.icon}</div>
                <h3 style={{ margin:0, color:r.color, fontSize:18 }}>{r.role}</h3>
              </div>
              <div style={{ padding:'16px 20px' }}>
                {r.perms.map(p => (
                  <div key={p} style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'6px 0', borderBottom:'1px solid #0f172a',
                    color:'#94a3b8', fontSize:13
                  }}>
                    <span style={{ color:r.color, fontSize:10 }}>✓</span> {p}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        padding:'100px 60px', textAlign:'center',
        background:'radial-gradient(ellipse 80% 60% at 50% 50%, #1e1b4b, transparent)'
      }}>
        <h2 style={{ fontSize:48, fontWeight:800, margin:'0 0 16px', letterSpacing:'-1.5px' }}>
          Ready to secure your company?
        </h2>
        <p style={{ color:'#64748b', fontSize:18, margin:'0 0 40px' }}>
          Set up TraceLock in under 5 minutes. No credit card required.
        </p>
        <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
          {/* FIXED: was /register-company → now /register */}
          <button onClick={() => navigate('/register')} style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
            border:'none', padding:'16px 40px', borderRadius:12,
            cursor:'pointer', fontSize:18, fontWeight:700,
            boxShadow:'0 0 50px #6366f160'
          }}>Start For Free →</button>
          <button onClick={() => navigate('/login')} style={{
            background:'transparent', color:'#94a3b8',
            border:'2px solid #1e293b', padding:'16px 40px',
            borderRadius:12, cursor:'pointer', fontSize:18
          }}>Login to Dashboard</button>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        borderTop:'1px solid #1e293b', padding:'24px 60px',
        display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color:'#6366f1', fontWeight:700 }}>🔐 TraceLock</span>
          <span style={{ color:'#334155', fontSize:13 }}>— Enterprise Data Security Platform</span>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          {['Privacy Policy','Terms of Service','Security'].map(l => (
            <span key={l} style={{ color:'#475569', fontSize:13, cursor:'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}