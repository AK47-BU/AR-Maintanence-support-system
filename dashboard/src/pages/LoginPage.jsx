import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-glow" />

      <div className="login-card">
        <div className="login-logo">
          <h1>AR Maintenance</h1>
          <p>Bournemouth Transport — Control Centre</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@busdepot.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
          Access for authorised personnel only
        </p>
      </div>
    </div>
  )
}
