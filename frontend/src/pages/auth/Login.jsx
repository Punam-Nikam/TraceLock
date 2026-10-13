// frontend/src/pages/auth/Login.jsx
// FIX 1: super_admin now correctly routes to /admin (not /super-admin which doesn't exist)
// FIX 2: Shows clear message if account is pending approval
// FIX 3: Shows clear message if account is deactivated

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../api/authAPI';
import toast from 'react-hot-toast';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(email, password);

      if (data.success) {
        login(data.user, data.token);
        toast.success(`Welcome back, ${data.user.full_name}! 👋`);

        // FIX: super_admin and dept_head both go to /admin dashboard
        // employee and team_lead go to /employee dashboard
        const routes = {
          super_admin: '/admin',
          dept_head:   '/admin',
          team_lead:   '/employee',
          employee:    '/employee'
        };
        navigate(routes[data.user.role] || '/employee');
      }
    } catch (err) {
      const resp = err.response?.data;

      // Show specific messages for different states
      if (resp?.status === 'pending') {
        toast.error('⏳ Your account is pending approval. Please wait for your admin to approve you.', {
          duration: 6000
        });
      } else if (resp?.status === 'inactive') {
        toast.error('🚫 Your account has been deactivated. Contact your administrator.', {
          duration: 6000
        });
      } else {
        toast.error(resp?.message || 'Login failed. Check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f172a', padding: 20
    }}>
      <div style={{
        background: '#1e293b', padding: 40, borderRadius: 16,
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>🔐</span>
          <h1 style={{ color: '#fff', fontSize: 26, margin: '8px 0 4px' }}>TraceLock</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Secure Data Management Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #334155', background: '#0f172a',
                color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 4 }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 8,
                border: '1px solid #334155', background: '#0f172a',
                color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#475569', fontSize: 13, margin: '0 0 8px' }}>
            New employee?{' '}
            <span onClick={() => navigate('/join')}
              style={{ color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>
              Join your company →
            </span>
          </p>
          <p style={{ color: '#475569', fontSize: 13, margin: 0 }}>
            New company?{' '}
            <span onClick={() => navigate('/register')}
              style={{ color: '#6366f1', cursor: 'pointer' }}>
              Register here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}