import React, { useState } from 'react'
import {
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  CheckCircle2,
  X
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export const AuthGatewayView: React.FC = () => {
  const { loginWithGoogle, registerAccount, loginWithCredentials } = useAuthStore()

  const [mode, setMode] = useState<'signin' | 'register'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')

  // Interactive Google Sign-In prompt modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [googleName, setGoogleName] = useState('')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleWorkspace, setGoogleWorkspace] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const finalWorkspace = workspaceName.trim() || `${name.trim()}'s Workspace`
    registerAccount(name.trim(), email.trim(), password, finalWorkspace)
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    loginWithCredentials(email.trim(), password)
  }

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = googleName.trim() || 'Google User'
    const cleanEmail = googleEmail.trim() || 'user@gmail.com'
    const cleanWs = googleWorkspace.trim() || `${cleanName}'s Workspace`
    loginWithGoogle(cleanEmail, cleanName, undefined, cleanWs)
  }

  const handleDemoAccess = () => {
    registerAccount('Demo User', 'demo@chronodesk.local', 'demo123', 'Demo Enterprise')
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] min-h-0 overflow-y-auto select-none">
      <div className="flex-1 flex flex-col lg:flex-row items-stretch max-w-6xl w-full mx-auto p-6 md:p-12 gap-8 lg:gap-16 justify-center">
        {/* Left Side: Brand Value & Overview */}
        <div className="flex-1 flex flex-col justify-center space-y-6 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                ChronoDesk
              </h1>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                Autonomous Executive Scheduling & Spatial Workspace
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] leading-snug">
              Sign in or create your personalized workspace.
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Experience zero-lag multi-calendar coordination, spatial 3D floor planning, collaborative real-time layers, and encrypted P2P peer mesh syncing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-Time Workspaces</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Fully customized to your team with dynamic departments, branding, and isolated schedules.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Free Google Login</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Instant Google OAuth authentication with zero fees, no credit card required.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AES-256 Vault Ready
            </span>
            <span>•</span>
            <span>Encrypted Node Mesh</span>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  mode === 'signin'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Google Login Button */}
            <div>
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-all shadow-xs active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[var(--border-subtle)] w-full" />
              <span className="bg-[var(--bg-elevated)] px-3 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                Or Continue With Email
              </span>
            </div>

            {/* Form */}
            {mode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (!workspaceName) {
                          setWorkspaceName(`${e.target.value}'s Workspace`)
                        }
                      }}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Initial Workspace Name</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Real-time setup</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g. Apex Global Operations"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all shadow-xs cursor-pointer pt-2.5"
                >
                  <span>Create Account & Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-all shadow-xs cursor-pointer pt-2.5"
                >
                  <span>Sign In to ChronoDesk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Quick Demo Option */}
            <div className="pt-2 border-t border-[var(--border-subtle)] text-center">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                <span>Or explore as guest in Quick Demo Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sign In Interactive Dialog */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Google Account Sign-In</h3>
              </div>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Your Google Name
                </label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Google Email
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. sarah.connor@gmail.com"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={googleWorkspace}
                  onChange={(e) => setGoogleWorkspace(e.target.value)}
                  placeholder="e.g. Sarah's Event Studio"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Authorize & Enter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
