import React, { useState, useRef } from 'react'
import { X, Camera, Upload } from 'lucide-react'
import { StoaIcon } from '../common/StoaIcon'
import { useAuthStore } from '../../store/useAuthStore'
import {
  readFileAsDataUrl,
  optimizeProfileImage,
  getGoogleProfileImageUrl
} from '../../utils/imageUtils'

export const AuthGatewayView: React.FC = () => {
  const { loginWithGoogle, registerAccount, loginWithCredentials } = useAuthStore()

  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')

  // Interactive Google Sign-In prompt modal
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false)
  const [googleName, setGoogleName] = useState('')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleWorkspace, setGoogleWorkspace] = useState('')
  const [googleAvatar, setGoogleAvatar] = useState('')
  const googleFileInputRef = useRef<HTMLInputElement>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    const finalWorkspace = workspaceName.trim() || `${name.trim()}'s Workspace`
    await registerAccount(name.trim(), email.trim(), password, finalWorkspace)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    await loginWithCredentials(email.trim(), password)
  }

  const handleGoogleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        const raw = await readFileAsDataUrl(file)
        const optimized = await optimizeProfileImage(raw, 256, 0.88)
        setGoogleAvatar(optimized)
      } catch {}
    }
  }

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = googleName.trim() || 'Google User'
    const cleanEmail = googleEmail.trim() || 'user@gmail.com'
    const cleanWs = googleWorkspace.trim() || `${cleanName}'s Workspace`
    const finalAvatar = googleAvatar || getGoogleProfileImageUrl(cleanEmail, cleanName)
    await loginWithGoogle(cleanEmail, cleanName, finalAvatar, cleanWs)
  }

  const handleDemoAccess = async () => {
    await registerAccount('Demo User', 'demo@stoa.local', 'demo123', 'My Workspace')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[var(--bg-app)] text-[var(--text-primary)] select-none">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center mx-auto shadow-xs">
            <StoaIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Stoa
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account and workspace'}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-xs space-y-5">
          {/* Google Login */}
          <button
            type="button"
            onClick={() => setIsGoogleModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] transition-all cursor-pointer"
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

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border-subtle)] w-full" />
            <span className="bg-[var(--bg-elevated)] px-2.5 text-[10px] text-[var(--text-muted)] shrink-0">
              or
            </span>
          </div>

          {/* Form */}
          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Name
                </label>
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
                  placeholder="Full name"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. My Workspace"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-medium hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mt-2"
              >
                Create Account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-medium hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer mt-2"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Toggle Mode */}
          <div className="pt-2 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            {mode === 'signin' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[var(--text-primary)] font-medium hover:underline cursor-pointer"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[var(--text-primary)] font-medium hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Demo Option */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>

      {/* Google Sign-In Dialog */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                Google Account Sign-In
              </h3>
              <button
                onClick={() => setIsGoogleModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleGoogleSubmit} className="space-y-3">
              {/* Profile Photo Preview & Upload */}
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                <input
                  ref={googleFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGoogleImagePick}
                />

                <div
                  onClick={() => googleFileInputRef.current?.click()}
                  className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 cursor-pointer group border border-[var(--border-subtle)]"
                  title="Click to upload custom photo"
                >
                  <img
                    src={googleAvatar || getGoogleProfileImageUrl(googleEmail, googleName)}
                    alt="Google Profile Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[var(--text-primary)]">Google Photo</span>
                    <button
                      type="button"
                      onClick={() => googleFileInputRef.current?.click()}
                      className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>{googleAvatar ? 'Replace' : 'Upload'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {googleAvatar ? 'Custom image loaded' : 'Will sync from Google profile'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Name
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
                  placeholder="user@gmail.com"
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
                  placeholder="e.g. My Workspace"
                  className="w-full px-3 py-1.5 text-xs rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-1.5 px-3 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
