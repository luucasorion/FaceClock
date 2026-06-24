// Route guards for FaceClock (FE-SHARED-3), react-router-dom v6.
//
// Usage: wrap routes either as a layout route (renders <Outlet/>) or around a
// single element via children:
//
//   <Route element={<RequireAuth />}>            // layout form
//     <Route path="/home" element={<Home />} />
//   </Route>
//
//   <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />  // child form
//
// RequireManager gates on the `gerente` claim surfaced by AUTHZ-1
// (ColaboradorResponse.gerente + JWT `gerente` claim). Managers only; an
// authenticated non-manager is bounced to the employee home.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/**
 * Requires an authenticated session. Unauthenticated users are sent to /login,
 * preserving the intended path in location state so login can return them.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children ?? <Outlet />;
}

/**
 * Managers only. Unauthenticated → /login; authenticated non-managers → /home
 * (the employee punch home). Relies on `gerente` from useAuth(), which derives
 * from the AUTHZ-1 `gerente` claim/field.
 */
export function RequireManager({ children }) {
  const { isAuthenticated, gerente } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!gerente) {
    return <Navigate to="/home" replace />;
  }
  return children ?? <Outlet />;
}
