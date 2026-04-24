import { Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { LandingPage } from './landingPage';
import Sigin from './sigin';
import SignUp from './signup';
import { Dashboard } from './dashboard';
import { Tournaments } from './pages/Tournaments';
import { TeamsPlayers } from './pages/TeamsPlayers';
import { LiveScoring } from './pages/LiveScoring';
import { Scoreboard } from './pages/Scoreboard';
import './css/app.css';

/* ── Page meta ──────────────────────────────────────────────── */
const PAGE_META = {
  '/dashboard':    { title: 'Dashboard',        subtitle: "Welcome back — here's your overview" },
  '/tournaments':  { title: 'Tournaments',       subtitle: 'Manage and join cricket tournaments' },
  '/teams':        { title: 'Teams & Players',   subtitle: 'Roster and player management' },
  '/live-scoring': { title: 'Live Scoring',      subtitle: 'Record ball-by-ball deliveries' },
  '/scoreboard':   { title: 'Scoreboard',        subtitle: 'Full match scorecards & stats' },
};

/* ── Loading spinner ────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f1f5f9' }}>
      <div className="spinner" />
    </div>
  );
}

/* ── Private route guard ─────────────────────────────────────
   Uses <Outlet /> — the ONLY correct React Router v6 pattern.
   Conditional fragment rendering inside <Routes> silently
   drops nested routes, which was causing LiveScoring/Scoreboard
   to never register.
────────────────────────────────────────────────────────────── */
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}

/* ── Public-only route (redirect authed users away) ─────────── */
function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/* ── Wraps every protected page in the sidebar Layout ────────── */
function ProtectedPage({ path, children }) {
  const { title, subtitle } = PAGE_META[path] || {};
  return <Layout title={title} subtitle={subtitle}>{children}</Layout>;
}

/* ── Root app ───────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      {/* Landing page — accessible to everyone */}
      <Route path="/" element={<LandingPage />} />

      {/* Public-only routes (redirect to dashboard if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/signin"  element={<Sigin />} />
        <Route path="/signup"  element={<SignUp />} />
      </Route>

      {/* Protected routes — all rendered inside the sidebar Layout */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard"    element={<ProtectedPage path="/dashboard">   <Dashboard />   </ProtectedPage>} />
        <Route path="/tournaments"  element={<ProtectedPage path="/tournaments"> <Tournaments /> </ProtectedPage>} />
        <Route path="/teams"        element={<ProtectedPage path="/teams">       <TeamsPlayers /></ProtectedPage>} />
        <Route path="/live-scoring" element={<ProtectedPage path="/live-scoring"><LiveScoring /> </ProtectedPage>} />
        <Route path="/scoreboard"   element={<ProtectedPage path="/scoreboard">  <Scoreboard />  </ProtectedPage>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
