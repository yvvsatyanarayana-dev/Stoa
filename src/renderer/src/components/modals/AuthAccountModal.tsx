import React, { useState } from 'react'
import {
  X,
  User,
  Mail,
  Shield,
  CheckCircle2,
  LogOut,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export const AuthAccountModal: React.FC = () => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGoogle,
    registerAccount,
    updateProfile,
    logout
  } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'profile' | 'create' | 'google'>('profile')
  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [role, setRole] = useState(currentUser.role)
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '')

  // Google Sign-In state
  const [googleEmailInput, setGoogleEmailInput] = useState('')
  const [googleNameInput, setGoogleNameInput] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  if (!isAuthModalOpen) return null

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      name: name.trim() || 'User',
      email: email.trim(),
      role: role.trim(),
      avatarUrl: avatarUrl.trim() || undefined
    })
    setFeedbackMsg('Profile updated successfully!')
    setTimeout(() => {
      setFeedbackMsg(null)
      setIsAuthModalOpen(false)
    }, 1200)
  }

  const handleRegisterNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    registerAccount(name.trim(), email.trim(), role.trim() || 'Member')
    setFeedbackMsg('Account created & active!')
    setTimeout(() => {
      setFeedbackMsg(null)
      setIsAuthModalOpen(false)
    }, 1200)
  }

  const handleGoogleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    const finalEmail = googleEmailInput.trim() || 'user@gmail.com'
    const finalName = googleNameInput.trim() || finalEmail.split('@')[0]
    loginWithGoogle(finalEmail, finalName)
    setFeedbackMsg(`Signed in with Google as ${finalEmail}!`)
    setTimeout(() => {
      setFeedbackMsg(null)
      setIsAuthModalOpen(false)
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
              {currentUser.initials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                User Account & Authentication
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {currentUser.provider === 'google' ? 'Google Account Connected' : 'Local User Profile'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-1 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 rounded-[var(--radius-sm)] transition-all ${
              activeTab === 'profile'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-1.5 rounded-[var(--radius-sm)] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>Google Login</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('create')
              setName('')
              setEmail('')
              setRole('Administrator')
            }}
            className={`flex-1 py-1.5 rounded-[var(--radius-sm)] transition-all ${
              activeTab === 'create'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            New Account
          </button>
        </div>

        {/* Tab 1: View / Edit Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Full Display Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name (e.g. John Doe)"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                    Role / Position
                  </label>
                  <div className="relative">
                    <Shield className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Lead Planner"
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                    Avatar Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  logout()
                  setName('Guest User')
                  setEmail('guest@chronodesk.local')
                }}
                className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded-[var(--radius-sm)] flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs hover:opacity-90 transition-opacity"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Google Login */}
        {activeTab === 'google' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-[var(--text-primary)]">Is Google Login Free?</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--text-primary)]">Yes, 100% Free!</strong> Google Identity Services (Google Sign-In / OAuth 2.0) has <strong>no cost or billing requirement</strong> for standard user sign-in and authentication.
              </p>
            </div>

            {/* Official Google Button Style */}
            <form onSubmit={handleGoogleSignIn} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Your Google Account Email
                </label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-[var(--radius-md)] bg-white text-zinc-900 font-semibold border border-zinc-300 hover:bg-zinc-100 flex items-center justify-center gap-2.5 transition-all shadow-xs"
                >
                  {/* Google Multicolor "G" Logo */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            </form>
          </div>
        )}

        {/* Tab 3: Create New Account */}
        {activeTab === 'create' && (
          <form onSubmit={handleRegisterNew} className="p-5 space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@domain.com"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Lead Planner">Lead Planner</option>
                  <option value="Team Member">Team Member</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
