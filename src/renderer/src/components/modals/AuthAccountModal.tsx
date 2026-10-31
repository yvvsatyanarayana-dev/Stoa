import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Shield,
  CheckCircle2,
  LogOut,
  Image as ImageIcon
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export const AuthAccountModal: React.FC = () => {
  const {
    currentUser,
    isAuthModalOpen,
    setIsAuthModalOpen,
    updateProfile,
    logout
  } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Ensure fields are always synchronized with the logged-in user's real details
  useEffect(() => {
    if (isAuthModalOpen && currentUser) {
      setName(currentUser.name || '')
      setEmail(currentUser.email || '')
      setRole(currentUser.role || 'Administrator')
      setAvatarUrl(currentUser.avatarUrl || '')
    }
  }, [isAuthModalOpen, currentUser])

  if (!isAuthModalOpen || !currentUser) return null

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    updateProfile({
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || 'Administrator',
      avatarUrl: avatarUrl.trim() || undefined
    })

    setFeedbackMsg('Profile updated successfully!')
    setTimeout(() => {
      setFeedbackMsg(null)
      setIsAuthModalOpen(false)
    }, 900)
  }

  const handleSignOut = () => {
    setIsAuthModalOpen(false)
    logout()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]">
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-9 h-9 rounded-full object-cover border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-xs text-[var(--text-primary)]">
                  {currentUser.initials || 'U'}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-app)]" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                Account Profile Settings
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                {currentUser.provider === 'google' ? 'Google Authenticated' : 'Local User Account'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-sm)] transition-colors cursor-pointer"
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

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                Full Display Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Role / Title
                </label>
                <div className="relative">
                  <Shield className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Administrator"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Avatar Image URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-[var(--border-subtle)] mt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
