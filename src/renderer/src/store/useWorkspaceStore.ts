import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAppStore } from './useAppStore'
import { useAuthStore } from './useAuthStore'

export interface Workspace {
  id: string
  name: string
  domain: string
  color: string
  icon: string
  company_name: string
  company_footer: string
  working_hours_start: string
  working_hours_end: string
  isDefault?: boolean
  ownerEmail?: string
  createdAt: string
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string
  isCreateWorkspaceModalOpen: boolean
  setIsCreateWorkspaceModalOpen: (open: boolean) => void
  getActiveWorkspace: () => Workspace
  setActiveWorkspaceId: (id: string) => Promise<void>
  createWorkspace: (data: {
    name: string
    domain?: string
    color?: string
    company_footer?: string
    working_hours_start?: string
    working_hours_end?: string
    ownerEmail?: string
  }) => Promise<Workspace>
  updateWorkspace: (id: string, partial: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  initUserWorkspace: (userName: string, customWorkspaceName?: string, ownerEmail?: string) => Promise<Workspace>
  sanitizeWorkspaces: () => void
}

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws-default',
  name: 'Primary Workspace',
  domain: 'Operations & Event Management',
  color: '#3b82f6',
  icon: 'building',
  company_name: 'Primary Workspace',
  company_footer: 'Confidential Schedule • Internal Use Only',
  working_hours_start: '09:00',
  working_hours_end: '18:00',
  isDefault: true,
  createdAt: new Date().toISOString()
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [DEFAULT_WORKSPACE],
      activeWorkspaceId: DEFAULT_WORKSPACE.id,
      isCreateWorkspaceModalOpen: false,

      setIsCreateWorkspaceModalOpen: (open) => set({ isCreateWorkspaceModalOpen: open }),

      sanitizeWorkspaces: () => {
        const { workspaces, activeWorkspaceId } = get()
        if (!workspaces || workspaces.length === 0) {
          set({ workspaces: [DEFAULT_WORKSPACE], activeWorkspaceId: DEFAULT_WORKSPACE.id })
          return
        }

        // Custom workspaces are any workspaces not having the fallback 'ws-default' id
        const customWorkspaces = workspaces.filter((w) => w.id !== 'ws-default')

        // If user already has their own custom workspace(s), drop 'ws-default' completely
        const pool = customWorkspaces.length > 0 ? customWorkspaces : workspaces

        // Deduplicate workspaces by normalized name (case-insensitive & trimmed)
        const seenNames = new Set<string>()
        const deduplicated: Workspace[] = []

        for (const ws of pool) {
          const normName = ws.name.trim().toLowerCase()
          if (!seenNames.has(normName)) {
            seenNames.add(normName)
            deduplicated.push(ws)
          }
        }

        const finalWorkspaces = deduplicated.length > 0 ? deduplicated : [DEFAULT_WORKSPACE]

        // Keep activeWorkspaceId valid
        let nextActiveId = activeWorkspaceId
        if (!finalWorkspaces.some((w) => w.id === nextActiveId)) {
          nextActiveId = finalWorkspaces[0].id
        }

        set({ workspaces: finalWorkspaces, activeWorkspaceId: nextActiveId })
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || DEFAULT_WORKSPACE
      },

      setActiveWorkspaceId: async (id: string) => {
        const { workspaces } = get()
        const target = workspaces.find((w) => w.id === id)
        if (!target) return

        set({ activeWorkspaceId: id })
        try {
          const appStore = useAppStore.getState()
          appStore.setActiveProfileId(id)
          await appStore.updateSetting('company_name', target.company_name)
          await appStore.updateSetting('company_footer', target.company_footer)
        } catch (err) {
          console.warn('[Workspace] Could not sync appStore settings:', err)
        }

        try {
          const auth = useAuthStore.getState()
          if (auth.currentUser && auth.currentUser.activeWorkspaceId !== id) {
            auth.updateProfile({ activeWorkspaceId: id })
          }
        } catch {}
      },

      createWorkspace: async (data) => {
        get().sanitizeWorkspaces()
        const current = get().workspaces
        const name = data.name.trim() || 'New Workspace'

        // Deduplicate: If workspace with exact or similar name exists, activate it
        const existing = current.find(
          (w) => w.name.trim().toLowerCase() === name.toLowerCase()
        )
        if (existing) {
          await get().setActiveWorkspaceId(existing.id)
          return existing
        }

        const id = `ws-${Date.now()}`
        const newWs: Workspace = {
          id,
          name,
          domain: data.domain?.trim() || 'General Operations',
          color: data.color || '#3b82f6',
          icon: 'building',
          company_name: name,
          company_footer: data.company_footer?.trim() || 'Corporate & Confidential • Internal Use Only',
          working_hours_start: data.working_hours_start || '09:00',
          working_hours_end: data.working_hours_end || '18:00',
          ownerEmail: data.ownerEmail?.toLowerCase(),
          createdAt: new Date().toISOString()
        }

        const hasOnlyDefault = current.length === 1 && current[0].id === 'ws-default'
        const updated = hasOnlyDefault ? [newWs] : [...current, newWs]
        set({ workspaces: updated, activeWorkspaceId: id })

        try {
          const appStore = useAppStore.getState()
          appStore.setActiveProfileId(id)
          await appStore.updateSetting('company_name', newWs.company_name)
          await appStore.updateSetting('company_footer', newWs.company_footer)
        } catch (err) {
          console.warn('[Workspace] Setting update failed:', err)
        }

        return newWs
      },

      updateWorkspace: async (id, partial) => {
        const updated = get().workspaces.map((w) => {
          if (w.id === id) {
            const merged = { ...w, ...partial }
            if (partial.name && !partial.company_name) {
              merged.company_name = partial.name
            }
            return merged
          }
          return w
        })

        set({ workspaces: updated })

        if (get().activeWorkspaceId === id) {
          const active = updated.find((w) => w.id === id)
          if (active) {
            try {
              const appStore = useAppStore.getState()
              await appStore.updateSetting('company_name', active.company_name)
              await appStore.updateSetting('company_footer', active.company_footer)
            } catch {}
          }
        }
      },

      deleteWorkspace: async (id) => {
        const { workspaces, activeWorkspaceId } = get()
        if (workspaces.length <= 1) return

        const updated = workspaces.filter((w) => w.id !== id)
        const nextActiveId = activeWorkspaceId === id ? updated[0].id : activeWorkspaceId

        set({ workspaces: updated, activeWorkspaceId: nextActiveId })

        const nextActive = updated.find((w) => w.id === nextActiveId)
        if (nextActive) {
          try {
            const appStore = useAppStore.getState()
            appStore.setActiveProfileId(nextActive.id)
            await appStore.updateSetting('company_name', nextActive.company_name)
            await appStore.updateSetting('company_footer', nextActive.company_footer)
          } catch {}
        }
      },

      initUserWorkspace: async (userName, customWorkspaceName, ownerEmail) => {
        get().sanitizeWorkspaces()
        const current = get().workspaces
        const targetName = customWorkspaceName?.trim() || `${userName.trim()}'s Workspace`
        const normTarget = targetName.toLowerCase()
        const normEmail = ownerEmail?.trim().toLowerCase()

        // 1. Look for matching workspace by ownerEmail or name
        const existing = current.find((w) => {
          if (normEmail && w.ownerEmail && w.ownerEmail.toLowerCase() === normEmail) {
            return true
          }
          return w.name.trim().toLowerCase() === normTarget
        })

        if (existing) {
          await get().setActiveWorkspaceId(existing.id)
          return existing
        }

        // 2. If no match found, create a new workspace
        const hasOnlyDefault = current.length === 1 && current[0].id === 'ws-default'
        const id = `ws-${Date.now()}`
        const newWs: Workspace = {
          id,
          name: targetName,
          domain: 'Production & Live Scheduling',
          color: '#3b82f6',
          icon: 'building',
          company_name: targetName,
          company_footer: 'Corporate & Confidential • Internal Use Only',
          working_hours_start: '09:00',
          working_hours_end: '18:00',
          ownerEmail: normEmail,
          createdAt: new Date().toISOString()
        }

        const updated = hasOnlyDefault ? [newWs] : [...current, newWs]
        set({ workspaces: updated, activeWorkspaceId: id })

        try {
          const appStore = useAppStore.getState()
          appStore.setActiveProfileId(id)
          await appStore.updateSetting('company_name', newWs.company_name)
          await appStore.updateSetting('company_footer', newWs.company_footer)
        } catch (err) {
          console.warn('[Workspace] Setting update failed:', err)
        }

        return newWs
      }
    }),
    {
      name: 'chronodesk-user-workspaces',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sanitizeWorkspaces()
        }
      }
    }
  )
)
