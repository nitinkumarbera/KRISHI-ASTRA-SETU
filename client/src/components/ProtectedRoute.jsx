import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any route that requires a logged-in user.
 * Guests are redirected to /login with the intended path stored in state,
 * so they are automatically returned after login.
 */
export default function ProtectedRoute({ children }) {
    const { user, token } = useAuth();
    const location = useLocation();

    // If there is no token or user, redirect to login
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
