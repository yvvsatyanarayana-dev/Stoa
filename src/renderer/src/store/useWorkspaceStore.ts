import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useAppStore } from './useAppStore'

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
  }) => Promise<Workspace>
  updateWorkspace: (id: string, partial: Partial<Workspace>) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  initUserWorkspace: (userName: string, customWorkspaceName?: string) => Promise<Workspace>
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
      },

      createWorkspace: async (data) => {
        const id = `ws-${Date.now()}`
        const name = data.name.trim() || 'New Workspace'
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
          createdAt: new Date().toISOString()
        }

        const updated = [...get().workspaces, newWs]
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

      initUserWorkspace: async (userName, customWorkspaceName) => {
        const wsName = customWorkspaceName?.trim() || `${userName.trim()}'s Workspace`
        const ws = await get().createWorkspace({
          name: wsName,
          domain: 'Production & Live Scheduling',
          color: '#3b82f6'
        })
        return ws
      }
    }),
    {
      name: 'chronodesk-user-workspaces',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
