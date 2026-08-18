import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allow, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  // Temporarily removed protected routing rules for video recording
  // if (!user) return <Navigate to="/login" replace />;
  // if (!user.role) return <Navigate to="/login" replace />;
  // if (allow && !allow.includes(user.role)) {
  //   return <Navigate to={`/${user.role}/dashboard`} replace />;
  // }
  
  return children;
}
