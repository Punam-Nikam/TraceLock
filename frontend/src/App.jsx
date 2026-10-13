import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Home              from './pages/Home';
import Login             from './pages/auth/Login';
import RegisterCompany   from './pages/auth/RegisterCompany';
import RegisterEmployee  from './pages/auth/RegisterEmployee';
import AdminDashboard    from './pages/admin/AdminDashboard';
import EmployeeApproval  from './pages/admin/EmployeeApproval';
import EmployeeMgmt      from './pages/admin/EmployeeManagement';
import FileManagement    from './pages/admin/FileManagement';
import TaskManagement    from './pages/admin/TaskManagement';
import LeakDetection     from './pages/admin/LeakDetection';
import AuditLogs         from './pages/admin/AuditLogs';
import Alerts            from './pages/admin/Alerts';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

const NotFound = () => (
  <div style={{
    minHeight:'100vh', background:'#0a0f1e', color:'#fff',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16
  }}>
    <p style={{ fontSize:80, margin:0, color:'#1e293b', fontWeight:800 }}>404</p>
    <h2 style={{ margin:0 }}>Page Not Found</h2>
    <a href="/" style={{ color:'#6366f1', fontSize:16 }}>← Go Home</a>
  </div>
);

// SmartRedirect — sends logged-in user to their correct dashboard
// FIXED: dept_head → /admin, team_lead → /employee (not Coming Soon pages)
function SmartRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const map = {
    super_admin: '/admin',
    dept_head:   '/admin',
    team_lead:   '/employee',
    employee:    '/employee'
  };
  return <Navigate to={map[user?.role] || '/employee'} replace />;
}

// FIXED: A includes dept_head — your DB has no 'admin' role, only super_admin/dept_head
const A = ({ children }) => (
  <ProtectedRoute allowedRoles={['super_admin', 'dept_head']}>{children}</ProtectedRoute>
);
// FIXED: E includes team_lead so they can reach the employee dashboard
const E = ({ children }) => (
  <ProtectedRoute allowedRoles={['employee', 'team_lead']}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background:'#1e293b', color:'#fff', border:'1px solid #334155' },
          duration: 4000
        }}
      />
      <BrowserRouter>
        <Routes>

          {/* ── PUBLIC ────────────────────────────────────────────── */}
          <Route path="/"          element={<Home />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/dashboard" element={<SmartRedirect />} />
          <Route path="/super-admin" element={<Navigate to="/admin" replace />} />

          {/* Company registration
              Your Home.jsx navigates to '/register' — that is the real route.
              '/register-company' kept as alias so nothing breaks. */}
          <Route path="/register"         element={<RegisterCompany />} />
          <Route path="/register-company" element={<RegisterCompany />} />

          {/* Employee self-registration
              Your Home.jsx navigates to '/join' — that is the real route.
              '/register-employee' kept as alias so nothing breaks. */}
          <Route path="/join"              element={<RegisterEmployee />} />
          <Route path="/register-employee" element={<RegisterEmployee />} />

          {/* ── ADMIN / SUPER_ADMIN / DEPT_HEAD ──────────────────── */}
          <Route path="/admin"                element={<A><AdminDashboard /></A>} />
          <Route path="/admin/approvals"      element={<A><EmployeeApproval /></A>} />
          <Route path="/admin/employees"      element={<A><EmployeeMgmt /></A>} />
          <Route path="/admin/files"          element={<A><FileManagement /></A>} />
          <Route path="/admin/tasks"          element={<A><TaskManagement /></A>} />
          <Route path="/admin/leak-detection" element={<A><LeakDetection /></A>} />
          <Route path="/admin/audit"          element={<A><AuditLogs /></A>} />
          <Route path="/admin/alerts"         element={<A><Alerts /></A>} />

          {/* ── EMPLOYEE / TEAM_LEAD ─────────────────────────────── */}
          <Route path="/employee" element={<E><EmployeeDashboard /></E>} />

          {/* Redirect old role paths to real dashboards */}
          <Route path="/dept-head" element={<Navigate to="/admin"    replace />} />
          <Route path="/team-lead" element={<Navigate to="/employee" replace />} />

          {/* ── 404 ──────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}