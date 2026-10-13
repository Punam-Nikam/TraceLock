import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getAllFiles, uploadFile, downloadFile, getFileLogs } from '../../api/fileAPI';
import { getActiveEmployees } from '../../api/employeeAPI';
import toast from 'react-hot-toast';

export default function FileManagement() {
  const [files,     setFiles]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showLogs,   setShowLogs]   = useState(null);
  const [logs,       setLogs]       = useState([]);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [form, setForm] = useState({
    file: null, permission: 'download',
    expiresAt: '', shareWithUsers: []
  });

  const load = async () => {
    try {
      const [f, e] = await Promise.all([getAllFiles(), getActiveEmployees()]);
      setFiles(f.files       || []);
      setEmployees(e.employees || []);
    } catch (err) {
      console.error('FileManagement load error:', err);
      toast.error('Failed to load files');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ file:null, permission:'download', expiresAt:'', shareWithUsers:[] });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return toast.error('Please select a file');
    if (form.shareWithUsers.length === 0) return toast.error('Please select at least one employee');

    setUploading(true);
    const fd = new FormData();
    fd.append('file',            form.file);
    fd.append('permission',      form.permission);
    fd.append('expiresAt',       form.expiresAt);
    fd.append('shareWithUsers',  JSON.stringify(form.shareWithUsers));

    try {
      await uploadFile(fd, setProgress);
      toast.success('File uploaded and shared successfully!');
      setShowUpload(false);
      setProgress(0);
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleViewLogs = async (file) => {
    setShowLogs(file);
    setLogs([]);
    try {
      const data = await getFileLogs(file.id);
      setLogs(data.logs || []);
    } catch { toast.error('Failed to load logs'); }
  };

  const toggleUser = (id) => {
    setForm(prev => ({
      ...prev,
      shareWithUsers: prev.shareWithUsers.includes(id)
        ? prev.shareWithUsers.filter(u => u !== id)
        : [...prev.shareWithUsers, id]
    }));
  };

  const selectAll = () => {
    if (form.shareWithUsers.length === employees.length) {
      setForm(p => ({ ...p, shareWithUsers: [] }));
    } else {
      setForm(p => ({ ...p, shareWithUsers: employees.map(e => e.id) }));
    }
  };

  const filteredFiles = files.filter(f =>
    !search || f.original_name.toLowerCase().includes(search.toLowerCase())
  );

  const sizeLabel = (b) => {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
    return (b/(1024*1024)).toFixed(1) + ' MB';
  };

  const fileIcon = (type) => {
    if (!type) return '📎';
    if (type === 'pdf')  return '📄';
    if (['jpg','jpeg','png','gif','webp'].includes(type)) return '🖼️';
    if (['doc','docx'].includes(type)) return '📝';
    if (['xls','xlsx'].includes(type)) return '📊';
    return '📎';
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
          <h2 style={{ margin:0, fontSize:22, fontWeight:700 }}>📁 File Management</h2>
          <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:14 }}>
            Upload encrypted files and share with employees. All downloads are watermarked.
          </p>
        </div>
        <button onClick={() => { setShowUpload(true); resetForm(); }} style={{
          background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff',
          border:'none', padding:'11px 22px', borderRadius:10,
          cursor:'pointer', fontSize:14, fontWeight:600
        }}>📤 Upload File</button>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Files',   value:files.length,                                    color:'#6366f1' },
          { label:'Downloadable',  value:files.filter(f=>f.permission==='download').length, color:'#10b981' },
          { label:'View Only',     value:files.filter(f=>f.permission==='view_only').length,color:'#f59e0b' },
          { label:'Active Employees', value:employees.length,                             color:'#22d3ee' },
        ].map(s => (
          <div key={s.label} style={{
            background:'#1e293b', padding:'14px 20px', borderRadius:12,
            borderLeft:`3px solid ${s.color}`, flex:1
          }}>
            <p style={{ color:'#64748b', fontSize:12, margin:0 }}>{s.label}</p>
            <h3 style={{ color:'#fff', margin:'4px 0 0', fontSize:22, fontWeight:700 }}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Search */}
      <input placeholder="🔍 Search files..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inp, marginBottom:16, marginTop:0, padding:'12px 16px' }} />

      {/* Files Table */}
      <div style={{ background:'#1e293b', borderRadius:16, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div style={{ padding:60, textAlign:'center' }}>
            <p style={{ fontSize:48, margin:0 }}>📁</p>
            <h3 style={{ color:'#fff', margin:'12px 0 8px' }}>No files yet</h3>
            <p style={{ color:'#64748b' }}>Upload your first encrypted file to share with your team</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#0f172a' }}>
                {['File','Type','Size','Permission','Shared With','Expires','Uploaded','Actions'].map(h => (
                  <th key={h} style={{
                    padding:'12px 16px', color:'#64748b', fontSize:12,
                    textAlign:'left', textTransform:'uppercase', letterSpacing:0.5
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(f => (
                <tr key={f.id} style={{ borderTop:'1px solid #0f172a' }}
                  onMouseEnter={e => e.currentTarget.style.background='#0f172a20'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:24 }}>{fileIcon(f.file_type)}</span>
                      <div>
                        <p style={{ margin:0, fontWeight:600, fontSize:14, maxWidth:180,
                                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {f.original_name}
                        </p>
                        <p style={{ margin:0, color:'#64748b', fontSize:12 }}>by {f.uploader_name}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      background:'#334155', color:'#94a3b8',
                      padding:'3px 8px', borderRadius:6, fontSize:12, textTransform:'uppercase'
                    }}>{f.file_type || '—'}</span>
                  </td>
                  <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                    {sizeLabel(f.file_size)}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      background: f.permission==='download' ? '#10b98120' : '#6366f120',
                      color:      f.permission==='download' ? '#10b981'   : '#6366f1',
                      padding:'3px 10px', borderRadius:20, fontSize:12
                    }}>
                      {f.permission==='download' ? '⬇ Download' : '👁 View Only'}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                    {f.share_count || 0} employee{f.share_count !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding:'14px 16px', color:'#94a3b8', fontSize:13 }}>
                    {f.expires_at ? (
                      <span style={{ color: new Date(f.expires_at) < new Date() ? '#ef4444' : '#f59e0b' }}>
                        {new Date(f.expires_at).toLocaleDateString()}
                      </span>
                    ) : <span style={{ color:'#334155' }}>Never</span>}
                  </td>
                  <td style={{ padding:'14px 16px', color:'#64748b', fontSize:12 }}>
                    {new Date(f.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <button onClick={() => handleViewLogs(f)} style={{
                      background:'#334155', color:'#fff', border:'none',
                      padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12
                    }}>📜 Logs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── UPLOAD MODAL ── */}
      {showUpload && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:520,
            maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 25px 60px rgba(0,0,0,0.5)',
            border:'1px solid #334155'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>📤 Upload & Share File</h3>
              <button onClick={() => { setShowUpload(false); resetForm(); }} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer', fontSize:16
              }}>✕</button>
            </div>

            <form onSubmit={handleUpload} style={{ padding:24 }}>
              {/* File Drop Zone */}
              <div style={{ marginBottom:20 }}>
                <label style={{ color:'#94a3b8', fontSize:13, display:'block', marginBottom:8 }}>
                  Select File <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <div style={{
                  border:`2px dashed ${form.file ? '#10b981' : '#334155'}`,
                  borderRadius:12, padding:24, textAlign:'center',
                  background: form.file ? '#10b98110' : '#0f172a',
                  cursor:'pointer', transition:'all 0.2s'
                }} onClick={() => document.getElementById('file-input').click()}>
                  {form.file ? (
                    <>
                      <p style={{ fontSize:32, margin:0 }}>{fileIcon(form.file.name.split('.').pop())}</p>
                      <p style={{ color:'#10b981', fontWeight:600, margin:'8px 0 0' }}>{form.file.name}</p>
                      <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>
                        {sizeLabel(form.file.size)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize:32, margin:0 }}>📂</p>
                      <p style={{ color:'#64748b', margin:'8px 0 0', fontSize:14 }}>
                        Click to select file
                      </p>
                      <p style={{ color:'#475569', fontSize:12, margin:'4px 0 0' }}>
                        PDF, Images, DOCX, XLSX (max 50MB)
                      </p>
                    </>
                  )}
                </div>
                <input id="file-input" type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt"
                  onChange={e => setForm(p => ({ ...p, file: e.target.files[0] }))}
                  style={{ display:'none' }} />
              </div>

              {/* Permission & Expiry */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                <div>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Permission</label>
                  <select value={form.permission}
                    onChange={e => setForm(p => ({ ...p, permission:e.target.value }))}
                    style={inp}>
                    <option value="download">⬇ Allow Download (watermarked)</option>
                    <option value="view_only">👁 View Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>Expiry Date (optional)</label>
                  <input type="datetime-local" value={form.expiresAt}
                    onChange={e => setForm(p => ({ ...p, expiresAt:e.target.value }))}
                    style={inp} />
                </div>
              </div>

              {/* Employee Selection */}
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <label style={{ color:'#94a3b8', fontSize:13 }}>
                    Share With Employees <span style={{ color:'#ef4444' }}>*</span>
                    <span style={{ color:'#6366f1', marginLeft:8 }}>
                      ({form.shareWithUsers.length} selected)
                    </span>
                  </label>
                  <button type="button" onClick={selectAll} style={{
                    background:'none', border:'none', color:'#6366f1',
                    cursor:'pointer', fontSize:12
                  }}>
                    {form.shareWithUsers.length === employees.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {employees.length === 0 ? (
                  <div style={{
                    background:'#0f172a', borderRadius:10, padding:20, textAlign:'center',
                    border:'1px solid #334155'
                  }}>
                    <p style={{ color:'#f59e0b', margin:0, fontSize:13 }}>
                      ⚠️ No active employees found.
                    </p>
                    <p style={{ color:'#64748b', margin:'8px 0 0', fontSize:12 }}>
                      Approve employees first in the Approvals section, then you can share files with them.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    background:'#0f172a', borderRadius:10,
                    maxHeight:200, overflowY:'auto', border:'1px solid #334155'
                  }}>
                    {employees.map(emp => (
                      <label key={emp.id} style={{
                        display:'flex', alignItems:'center', gap:12,
                        padding:'10px 14px', cursor:'pointer',
                        borderBottom:'1px solid #1e293b',
                        background: form.shareWithUsers.includes(emp.id) ? '#6366f115' : 'transparent',
                        transition:'background 0.15s'
                      }}>
                        <input type="checkbox"
                          checked={form.shareWithUsers.includes(emp.id)}
                          onChange={() => toggleUser(emp.id)}
                          style={{ width:16, height:16, accentColor:'#6366f1' }} />
                        <div style={{
                          width:32, height:32, borderRadius:'50%',
                          background:'#6366f1', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:13, fontWeight:700,
                          flexShrink:0
                        }}>{emp.full_name?.[0]?.toUpperCase()}</div>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{emp.full_name}</p>
                          <p style={{ margin:0, color:'#64748b', fontSize:12 }}>
                            {emp.employee_uid}
                            {emp.department_name && ` · ${emp.department_name}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploading && progress > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'#94a3b8', fontSize:13 }}>Uploading...</span>
                    <span style={{ color:'#6366f1', fontSize:13 }}>{progress}%</span>
                  </div>
                  <div style={{ background:'#334155', borderRadius:8, height:6 }}>
                    <div style={{
                      background:'linear-gradient(90deg,#6366f1,#22d3ee)',
                      height:6, borderRadius:8, width:`${progress}%`,
                      transition:'width 0.3s'
                    }}/>
                  </div>
                </div>
              )}

              <button type="submit" disabled={uploading || employees.length === 0} style={{
                width:'100%', padding:13,
                background: uploading ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color:'#fff', border:'none', borderRadius:10,
                cursor: uploading ? 'not-allowed' : 'pointer', fontSize:15, fontWeight:600
              }}>
                {uploading ? `⏳ Uploading ${progress}%...` : '🔐 Upload & Share Securely'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── LOGS MODAL ── */}
      {showLogs && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'#1e293b', borderRadius:20, width:560,
            maxHeight:'85vh', overflowY:'auto',
            border:'1px solid #334155'
          }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #334155',
                          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0 }}>📜 Access Logs</h3>
                <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:13 }}>
                  {showLogs.original_name}
                </p>
              </div>
              <button onClick={() => setShowLogs(null)} style={{
                background:'#334155', border:'none', color:'#fff',
                width:32, height:32, borderRadius:8, cursor:'pointer'
              }}>✕</button>
            </div>
            <div style={{ padding:24 }}>
              {logs.length === 0 ? (
                <p style={{ color:'#64748b', textAlign:'center', padding:'20px 0' }}>
                  No access logs yet for this file.
                </p>
              ) : logs.map((log, i) => (
                <div key={i} style={{
                  background:'#0f172a', padding:14, borderRadius:10,
                  marginBottom:10, display:'flex', justifyContent:'space-between'
                }}>
                  <div>
                    <p style={{ margin:0, fontWeight:600, fontSize:14 }}>{log.full_name}</p>
                    <p style={{ margin:'3px 0 0', color:'#64748b', fontSize:12 }}>
                      🆔 {log.employee_uid} · 🌐 {log.ip_address || 'Unknown'}
                    </p>
                    <p style={{ margin:'3px 0 0', color:'#475569', fontSize:12 }}>
                      🕐 {new Date(log.accessed_at).toLocaleString()}
                    </p>
                  </div>
                  <span style={{
                    background: log.action==='download' ? '#10b98120' : '#6366f120',
                    color:      log.action==='download' ? '#10b981'   : '#6366f1',
                    padding:'4px 12px', borderRadius:20, fontSize:12,
                    height:'fit-content'
                  }}>{log.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}