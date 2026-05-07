import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { OverviewPage } from './pages/OverviewPage.jsx'
import { FaultsPage } from './pages/FaultsPage.jsx'
import { ToolsPage } from './pages/ToolsPage.jsx'
import { AuditPage } from './pages/AuditPage.jsx'
import { SecurityPage } from './pages/SecurityPage.jsx'

// ─────────────────────────────────────────────────
// Protected route wrapper — redirects to login if
// the user isn't authenticated.
// ─────────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />

  return children
}

// ─────────────────────────────────────────────────
// The main layout shell shown when logged in
// ─────────────────────────────────────────────────
function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute><OverviewPage /></ProtectedRoute>
          } />
          <Route path="/faults" element={
            <ProtectedRoute><FaultsPage /></ProtectedRoute>
          } />
          <Route path="/tools" element={
            <ProtectedRoute><ToolsPage /></ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute adminOnly><AuditPage /></ProtectedRoute>
          } />
          <Route path="/security" element={
            <ProtectedRoute adminOnly><SecurityPage /></ProtectedRoute>
          } />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// Root — handles login vs app routing
// ─────────────────────────────────────────────────
function RootRouter() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={user ? <AppShell /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  )
}
