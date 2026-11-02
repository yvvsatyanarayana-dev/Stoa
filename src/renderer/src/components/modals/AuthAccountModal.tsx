import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  User,
  Mail,
  Shield,
  CheckCircle2,
  LogOut,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import {
  readFileAsDataUrl,
  optimizeProfileImage,
  getGoogleProfileImageUrl
} from '../../utils/imageUtils'

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
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Ensure fields are synchronized with the logged-in user's details
  useEffect(() => {
    if (isAuthModalOpen && currentUser) {
      setName(currentUser.name || '')
      setEmail(currentUser.email || '')
      setRole(currentUser.role || 'Administrator')
      setAvatarUrl(currentUser.avatarUrl || '')
    }
  }, [isAuthModalOpen, currentUser])

  if (!isAuthModalOpen || !currentUser) return null

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedbackMsg('Please select a valid image file (PNG, JPG, WebP, SVG).')
      return
    }

    try {
      setIsProcessingImage(true)
      const rawDataUrl = await readFileAsDataUrl(file)
      const optimizedDataUrl = await optimizeProfileImage(rawDataUrl, 256, 0.88)
      setAvatarUrl(optimizedDataUrl)
      // Save directly to user profile immediately so it reflects in sidebar right away
      updateProfile({ avatarUrl: optimizedDataUrl })
      setFeedbackMsg('Profile photo updated successfully!')
    } catch {
      setFeedbackMsg('Failed to process image. Please try another file.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
    // Reset file input so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handleUseGoogleAvatar = () => {
    const targetEmail = email.trim() || currentUser.email
    const targetName = name.trim() || currentUser.name
    const googleImg = getGoogleProfileImageUrl(targetEmail, targetName)
    setAvatarUrl(googleImg)
    updateProfile({ avatarUrl: googleImg })
    setFeedbackMsg('Google profile image retrieved and saved!')
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl('')
    updateProfile({ avatarUrl: undefined })
    setFeedbackMsg('Photo removed. Initials restored.')
  }

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
    }, 800)
  }

  const handleSignOut = () => {
    setIsAuthModalOpen(false)
    logout()
  }

  const isGoogleUser = currentUser.provider === 'google' || email.toLowerCase().includes('@gmail.com')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-app)]">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
              Account Profile Settings
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
              {currentUser.provider === 'google' ? 'Google Auth' : 'Local Account'}
            </span>
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
          <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{feedbackMsg}</span>
          </div>
        )}

        {/* Edit Profile Form */}
        <form onSubmit={handleSaveProfile} noValidate className="p-5 space-y-4 text-xs">
          {/* Avatar Upload Hub */}
          <div className="p-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] flex items-center gap-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Circular Avatar with Camera overlay and Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative w-16 h-16 rounded-full shrink-0 cursor-pointer group transition-all overflow-hidden ${
                isDragging ? 'ring-2 ring-[var(--accent)] scale-105' : ''
              }`}
              title="Click or drag an image here to upload new photo"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full rounded-full object-cover border border-[var(--border-subtle)]"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center font-bold text-sm text-[var(--text-primary)]">
                  {currentUser.initials || 'U'}
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-medium tracking-tight">Change</span>
              </div>

              {/* Green online presence badge */}
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-app)]" />
            </div>

            {/* Avatar controls */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--bg-hover)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] border border-[var(--border-subtle)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3 h-3" />
                  <span>{isProcessingImage ? 'Optimizing...' : 'Upload Image'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Remove custom photo and use initials"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Google Profile Photo Option */}
              {isGoogleUser && (
                <button
                  type="button"
                  onClick={handleUseGoogleAvatar}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Use Google Profile Image</span>
                </button>
              )}

              <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                Drop PNG, JPG or WebP. Auto-optimized locally for instant offline rendering.
              </p>
            </div>
          </div>

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
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
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
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
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
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] block mb-1">
                  Image Source
                </label>
                <div className="relative">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={
                      avatarUrl.startsWith('data:')
                        ? 'Custom photo uploaded (Offline base64)'
                        : avatarUrl.includes('google') || avatarUrl.includes('unavatar') || avatarUrl.includes('dicebear')
                        ? 'Google profile photo'
                        : avatarUrl
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      if (!val.startsWith('Custom photo') && !val.startsWith('Google profile')) {
                        setAvatarUrl(val)
                      }
                    }}
                    placeholder="Upload above or paste web link"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-strong)] truncate text-[11px]"
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
                className="px-4 py-1.5 rounded-[var(--radius-md)] bg-white text-black font-bold shadow-xs hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer"
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
