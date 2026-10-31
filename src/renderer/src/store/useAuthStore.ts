import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserAccount, AuthState } from '../types/auth'

function extractInitials(name: string): string {
  if (!name.trim()) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const DEFAULT_USER: UserAccount = {
  id: 'usr-primary',
  name: 'Workspace Admin',
  email: 'admin@chronodesk.local',
  role: 'Administrator',
  provider: 'local',
  initials: 'WA',
  createdAt: new Date().toISOString()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: DEFAULT_USER,
      isAuthModalOpen: false,

      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

      loginWithGoogle: (email = 'user@gmail.com', name = 'Google User', avatarUrl) => {
        const initials = extractInitials(name)
        const account: UserAccount = {
          id: `goog-${Date.now()}`,
          name,
          email,
          avatarUrl: avatarUrl || undefined,
          role: 'Workspace Member',
          provider: 'google',
          initials,
          createdAt: new Date().toISOString()
        }
        set({ currentUser: account, isAuthModalOpen: false })
      },

      registerAccount: (name, email, role = 'Member') => {
        const initials = extractInitials(name)
        const account: UserAccount = {
          id: `usr-${Date.now()}`,
          name: name.trim() || 'My User',
          email: email.trim() || 'user@local.domain',
          role,
          provider: 'local',
          initials,
          createdAt: new Date().toISOString()
        }
        set({ currentUser: account, isAuthModalOpen: false })
      },

      updateProfile: (partial) =>
        set((state) => {
          const updatedName = partial.name ?? state.currentUser.name
          const initials = extractInitials(updatedName)
          return {
            currentUser: {
              ...state.currentUser,
              ...partial,
              initials
            }
          }
        }),

      logout: () =>
        set({
          currentUser: {
            id: `guest-${Date.now()}`,
            name: 'Guest User',
            email: 'guest@chronodesk.local',
            role: 'Guest',
            provider: 'local',
            initials: 'GU',
            createdAt: new Date().toISOString()
          }
        })
    }),
    {
      name: 'chronodesk-user-auth',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
