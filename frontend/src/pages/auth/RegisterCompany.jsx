import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerCompany } from '../../api/authAPI';
import toast from 'react-hot-toast';

function RegisterCompany() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '', companyEmail: '', companyPhone: '', companyAddress: '',
    adminName: '', adminEmail: '', adminPassword: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await registerCompany(form);
      if (data.success) {
        toast.success('Company registered! You can now login.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = { width:'100%', padding:'10px 14px', borderRadius:8,
                border:'1px solid #334155', background:'#0f172a',
                color:'#fff', fontSize:14, boxSizing:'border-box', marginTop:4 };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
                  justifyContent:'center', background:'#0f172a' }}>
      <div style={{ background:'#1e293b', padding:40, borderRadius:12,
                    width:440, boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
        <h1 style={{ color:'#fff', textAlign:'center' }}>🔐 Register Company</h1>
        <form onSubmit={handleSubmit}>
          {[
            { label:'Company Name',    name:'companyName',    type:'text' },
            { label:'Company Email',   name:'companyEmail',   type:'email' },
            { label:'Company Phone',   name:'companyPhone',   type:'text' },
            { label:'Company Address', name:'companyAddress', type:'text' },
            { label:'Your Name',       name:'adminName',      type:'text' },
            { label:'Your Email',      name:'adminEmail',     type:'email' },
            { label:'Password',        name:'adminPassword',  type:'password' },
          ].map(({ label, name, type }) => (
            <div key={name} style={{ marginBottom:14 }}>
              <label style={{ color:'#94a3b8', fontSize:13 }}>{label}</label>
              <input type={type} name={name} value={form[name]}
                     onChange={handleChange} required style={inp} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:12, background:'#6366f1', color:'#fff',
                     border:'none', borderRadius:8, fontSize:15, cursor:'pointer', marginTop:8 }}>
            {loading ? 'Registering...' : 'Register Company'}
          </button>
        </form>
        <p style={{ color:'#94a3b8', textAlign:'center', marginTop:16, fontSize:13 }}>
          Already registered? <a href="/login" style={{ color:'#6366f1' }}>Login</a>
        </p>
      </div>
    </div>
  );
}

export default RegisterCompany;