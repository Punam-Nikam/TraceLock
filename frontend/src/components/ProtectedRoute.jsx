// frontend/src/components/ProtectedRoute.jsx
// FIX: super_admin and dept_head both redirect to /admin
// FIX: team_lead and employee both redirect to /employee

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    const roleRoutes = {
      super_admin: '/admin',
      dept_head:   '/admin',
      team_lead:   '/employee',
      employee:    '/employee'
    };
    return <Navigate to={roleRoutes[user?.role] || '/login'} replace />;
  }

  return children;
}