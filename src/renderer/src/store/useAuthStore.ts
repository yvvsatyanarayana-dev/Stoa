import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserAccount, AuthState } from '../types/auth'
import { useWorkspaceStore } from './useWorkspaceStore'

function extractInitials(name: string): string {
  if (!name.trim()) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isAuthModalOpen: false,

      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

      loginWithGoogle: (email = 'alex.chen@gmail.com', name = 'Alex Chen', avatarUrl, workspaceName) => {
        const initials = extractInitials(name)
        const account: UserAccount = {
          id: `goog-${Date.now()}`,
          name,
          email,
          avatarUrl: avatarUrl || undefined,
          role: 'Workspace Owner',
          provider: 'google',
          initials,
          createdAt: new Date().toISOString()
        }

        // Initialize user-created workspace in real-time
        useWorkspaceStore.getState().initUserWorkspace(name, workspaceName)

        set({ currentUser: account, isAuthenticated: true, isAuthModalOpen: false })
      },

      registerAccount: (name, email, _password, workspaceName, role = 'Administrator') => {
        const initials = extractInitials(name)
        const account: UserAccount = {
          id: `usr-${Date.now()}`,
          name: name.trim() || 'New User',
          email: email.trim() || 'user@company.local',
          role,
          provider: 'local',
          initials,
          createdAt: new Date().toISOString()
        }

        // Initialize user-created workspace in real-time
        useWorkspaceStore.getState().initUserWorkspace(name, workspaceName)

        set({ currentUser: account, isAuthenticated: true, isAuthModalOpen: false })
      },

      loginWithCredentials: (email, _password) => {
        const namePart = email.split('@')[0] || 'User'
        const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
        const initials = extractInitials(cleanName)

        const account: UserAccount = {
          id: `usr-${Date.now()}`,
          name: cleanName,
          email,
          role: 'Administrator',
          provider: 'local',
          initials,
          createdAt: new Date().toISOString()
        }

        // Ensure a workspace exists
        const wsStore = useWorkspaceStore.getState()
        if (wsStore.workspaces.length === 0 || wsStore.workspaces[0].id === 'ws-default') {
          wsStore.initUserWorkspace(cleanName)
        }

        set({ currentUser: account, isAuthenticated: true, isAuthModalOpen: false })
        return true
      },

      updateProfile: (partial) =>
        set((state) => {
          if (!state.currentUser) return state
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

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          isAuthModalOpen: false
        })
      }
    }),
    {
      name: 'chronodesk-user-auth-session',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
