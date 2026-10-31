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
    (set, get) => ({
      currentUser: null,
      accounts: [],
      isAuthenticated: false,
      isAuthModalOpen: false,

      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),

      loginWithGoogle: async (
        email = 'user@gmail.com',
        name = 'Google User',
        avatarUrl,
        workspaceName
      ) => {
        const cleanEmail = email.trim()
        const cleanName = name.trim() || 'Google User'
        const normEmail = cleanEmail.toLowerCase()

        // 1. Look for existing registered account
        const existing = (get().accounts || []).find((a) => a.email.toLowerCase() === normEmail)

        if (existing) {
          const wsStore = useWorkspaceStore.getState()
          wsStore.sanitizeWorkspaces()

          if (existing.activeWorkspaceId && wsStore.workspaces.some((w) => w.id === existing.activeWorkspaceId)) {
            await wsStore.setActiveWorkspaceId(existing.activeWorkspaceId)
          } else {
            const userWs = wsStore.workspaces.find((w) => w.ownerEmail === normEmail) || wsStore.workspaces[0]
            if (userWs) {
              await wsStore.setActiveWorkspaceId(userWs.id)
              existing.activeWorkspaceId = userWs.id
            }
          }

          set({ currentUser: existing, isAuthenticated: true, isAuthModalOpen: false })
          return
        }

        // 2. New Google user
        const ws = await useWorkspaceStore
          .getState()
          .initUserWorkspace(cleanName, workspaceName, normEmail)
        const initials = extractInitials(cleanName)
        const account: UserAccount = {
          id: `goog-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          avatarUrl: avatarUrl || undefined,
          role: 'Workspace Owner',
          provider: 'google',
          initials,
          activeWorkspaceId: ws.id,
          createdAt: new Date().toISOString()
        }

        set((state) => ({
          accounts: [...(state.accounts || []), account],
          currentUser: account,
          isAuthenticated: true,
          isAuthModalOpen: false
        }))
      },

      registerAccount: async (name, email, _password, workspaceName, role = 'Administrator') => {
        const cleanName = name.trim() || 'New User'
        const cleanEmail = email.trim() || 'user@company.local'
        const normEmail = cleanEmail.toLowerCase()

        // 1. Check if account already exists with this email
        const existing = (get().accounts || []).find((a) => a.email.toLowerCase() === normEmail)

        if (existing) {
          const wsStore = useWorkspaceStore.getState()
          wsStore.sanitizeWorkspaces()

          if (existing.activeWorkspaceId && wsStore.workspaces.some((w) => w.id === existing.activeWorkspaceId)) {
            await wsStore.setActiveWorkspaceId(existing.activeWorkspaceId)
          } else {
            const userWs = wsStore.workspaces.find((w) => w.ownerEmail === normEmail) || wsStore.workspaces[0]
            if (userWs) {
              await wsStore.setActiveWorkspaceId(userWs.id)
              existing.activeWorkspaceId = userWs.id
            }
          }

          set({ currentUser: existing, isAuthenticated: true, isAuthModalOpen: false })
          return
        }

        // 2. New registration
        const ws = await useWorkspaceStore
          .getState()
          .initUserWorkspace(cleanName, workspaceName, normEmail)
        const initials = extractInitials(cleanName)
        const account: UserAccount = {
          id: `usr-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role,
          provider: 'local',
          initials,
          activeWorkspaceId: ws.id,
          createdAt: new Date().toISOString()
        }

        set((state) => ({
          accounts: [...(state.accounts || []), account],
          currentUser: account,
          isAuthenticated: true,
          isAuthModalOpen: false
        }))
      },

      loginWithCredentials: async (email, _password) => {
        const cleanEmail = email.trim()
        const normEmail = cleanEmail.toLowerCase()

        // 1. Look for existing account
        const existing = (get().accounts || []).find((a) => a.email.toLowerCase() === normEmail)

        if (existing) {
          const wsStore = useWorkspaceStore.getState()
          wsStore.sanitizeWorkspaces()

          if (existing.activeWorkspaceId && wsStore.workspaces.some((w) => w.id === existing.activeWorkspaceId)) {
            await wsStore.setActiveWorkspaceId(existing.activeWorkspaceId)
          } else {
            const userWs = wsStore.workspaces.find((w) => w.ownerEmail === normEmail) || wsStore.workspaces[0]
            if (userWs) {
              await wsStore.setActiveWorkspaceId(userWs.id)
              existing.activeWorkspaceId = userWs.id
            }
          }

          set({ currentUser: existing, isAuthenticated: true, isAuthModalOpen: false })
          return true
        }

        // 2. Auto-initialize account if not previously registered
        const namePart = cleanEmail.split('@')[0] || 'User'
        const cleanName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
        const initials = extractInitials(cleanName)

        const ws = await useWorkspaceStore
          .getState()
          .initUserWorkspace(cleanName, undefined, normEmail)

        const account: UserAccount = {
          id: `usr-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: 'Administrator',
          provider: 'local',
          initials,
          activeWorkspaceId: ws.id,
          createdAt: new Date().toISOString()
        }

        set((state) => ({
          accounts: [...(state.accounts || []), account],
          currentUser: account,
          isAuthenticated: true,
          isAuthModalOpen: false
        }))
        return true
      },

      updateProfile: (partial) =>
        set((state) => {
          if (!state.currentUser) return state
          const updatedName = partial.name ?? state.currentUser.name
          const initials = extractInitials(updatedName)
          const updatedUser: UserAccount = {
            ...state.currentUser,
            ...partial,
            initials
          }

          const accounts = (state.accounts || []).map((acc) =>
            acc.id === updatedUser.id || acc.email.toLowerCase() === updatedUser.email.toLowerCase()
              ? updatedUser
              : acc
          )

          return {
            currentUser: updatedUser,
            accounts
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
