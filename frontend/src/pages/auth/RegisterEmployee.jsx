// frontend/src/pages/auth/JoinAsEmployee.jsx
// NEW PAGE: Employee self-registration
// Employee just needs: full name, email, password, company email (to find their company)
// After submitting → status = 'pending' → super_admin approves → then they can login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerEmployee } from '../../api/authAPI';
import toast from 'react-hot-toast';

export default function JoinAsEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', companyEmail: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setLoading(true);
    try {
      const data = await registerEmployee({
        fullName:     form.fullName,
        email:        form.email,
        password:     form.password,
        companyEmail: form.companyEmail
      });
      if (data.success) {
        setDone(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid #334155', background: '#0f172a',
    color: '#fff', fontSize: 14, boxSizing: 'border-box', marginTop: 4, outline: 'none'
  };

  // Success screen — shown after registration
  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ background: '#1e293b', padding: 40, borderRadius: 16,
                      width: 420, textAlign: 'center', border: '1px solid #10b98140' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#10b981', margin: '0 0 12px' }}>Registration Successful!</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
            Your account has been created and is <b style={{ color: '#f59e0b' }}>pending approval</b>.
            Your company's Super Admin will review and activate your account.
            You'll receive an email when approved.
          </p>
          <button onClick={() => navigate('/login')} style={{
            width: '100%', padding: 12, background: '#6366f1', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15
          }}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: '#0f172a', padding: 20 }}>
      <div style={{ background: '#1e293b', padding: 36, borderRadius: 16,
                    width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>👤</span>
          <h1 style={{ color: '#fff', fontSize: 24, margin: '8px 0 4px' }}>Join as Employee</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
            Create your account to join your company on TraceLock
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Full Name</label>
            <input name="fullName" type="text" placeholder="John Doe"
              value={form.fullName} onChange={handleChange} required style={inp} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Your Email</label>
            <input name="email" type="email" placeholder="john@example.com"
              value={form.email} onChange={handleChange} required style={inp} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Password</label>
            <input name="password" type="password" placeholder="Min 8 characters"
              value={form.password} onChange={handleChange} required style={inp} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Confirm Password</label>
            <input name="confirmPassword" type="password" placeholder="Repeat password"
              value={form.confirmPassword} onChange={handleChange} required style={inp} />
          </div>

          {/* Company Email — to find which company to join */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>
              Company Email <span style={{ color: '#475569' }}>(ask your admin for this)</span>
            </label>
            <input name="companyEmail" type="email" placeholder="company@example.com"
              value={form.companyEmail} onChange={handleChange} required style={inp} />
            <p style={{ color: '#475569', fontSize: 12, margin: '6px 0 0' }}>
              💡 This is the email your company used when registering on TraceLock.
            </p>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 13, background: '#10b981',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: 'pointer'
          }}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: 13, marginTop: 20 }}>
          Already approved?{' '}
          <span onClick={() => navigate('/login')}
            style={{ color: '#6366f1', cursor: 'pointer' }}>Login here</span>
          {' · '}
          <span onClick={() => navigate('/')}
            style={{ color: '#475569', cursor: 'pointer' }}>← Back</span>
        </p>
      </div>
    </div>
  );
}