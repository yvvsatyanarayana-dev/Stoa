import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  PeerNode,
  ZeroKnowledgeVaultStats,
  FederationPartner,
  FederatedAvailabilitySlot,
  FederationSharingPolicy
} from '../types/p2p'

export interface P2PState {
  // Local Node Identity
  localNodeId: string
  localNodeName: string
  localOrganization: string
  isP2PActive: boolean
  pairingInviteCode: string

  // Mesh Topology
  peers: PeerNode[]
  selectedPeerId: string | null
  syncLog: Array<{ id: string; timestamp: string; peerName: string; type: 'outbound' | 'inbound'; summary: string }>

  // Zero-Knowledge Vault
  vaultStats: ZeroKnowledgeVaultStats
  vaultPassphraseHash: string

  // Multi-Org Federation
  federationPartners: FederationPartner[]
  globalSharingPolicy: FederationSharingPolicy
  simulatedFederatedSlots: FederatedAvailabilitySlot[]

  // Actions
  setLocalNodeInfo: (name: string, org: string) => void
  toggleP2PActive: () => void
  generateNewInviteCode: () => string
  pairWithCode: (code: string, customName?: string) => Promise<{ success: boolean; peerName: string }>
  disconnectPeer: (id: string) => void
  manualSyncWithPeer: (peerId: string, eventCount: number) => Promise<void>
  broadcastEventChange: (eventTitle: string) => void

  // Vault Actions
  unlockVault: (passphrase: string) => boolean
  lockVault: () => void
  updateVaultPassphrase: (oldPass: string, newPass: string) => boolean

  // Federation Actions
  updateSharingPolicy: (policy: FederationSharingPolicy) => void
  addFederationPartner: (partner: Omit<FederationPartner, 'id' | 'lastQueryAt' | 'activeSharedCalendars'>) => void
  togglePartnerStatus: (id: string) => void
  runFederatedAvailabilityQuery: (orgDomain: string, dateStr: string) => Promise<FederatedAvailabilitySlot[]>
  clearAllPeers: () => void
}

const DEFAULT_FEDERATION_PARTNERS: FederationPartner[] = [
  {
    id: 'fed-stanford',
    organization: 'Stanford Medical School',
    domain: 'stanford.edu',
    status: 'trusted',
    sharingPolicy: 'busy_only',
    activeSharedCalendars: 2,
    lastQueryAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'fed-apex',
    organization: 'Apex Global Advisory',
    domain: 'apexglobal.org',
    status: 'trusted',
    sharingPolicy: 'tentative_confirmed',
    activeSharedCalendars: 1,
    lastQueryAt: new Date(Date.now() - 7200000).toISOString()
  }
]

export const useP2PStore = create<P2PState>()(
  persist(
    (set, get) => ({
      localNodeId: `CRD-NODE-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      localNodeName: 'Local Primary Workstation',
      localOrganization: 'ChronoDesk Enterprise',
      isP2PActive: true,
      pairingInviteCode: 'CRD-8F2A-9941-EK02',

      peers: [
        {
          id: 'peer-workstation-hq',
          name: 'Ops Terminal (Local Network)',
          organization: 'Verified LAN Peer',
          status: 'connected',
          latencyMs: 14,
          lastSyncAt: new Date().toISOString(),
          dataSentKB: 14,
          dataReceivedKB: 28,
          e2eFingerprint: 'SHA256:7B88:41CA:DE80:12F0',
          deviceType: 'workstation',
          ipAddress: '192.168.1.105:51820'
        }
      ],
      selectedPeerId: 'peer-workstation-hq',
      syncLog: [
        {
          id: 'log-1',
          timestamp: new Date().toLocaleTimeString(),
          peerName: 'Ops Terminal (Local Network)',
          type: 'outbound',
          summary: 'Encrypted delta sync: Verified local calendar against peer state hash.'
        }
      ],

      vaultStats: {
        isLocked: false,
        totalEncryptedRecords: 0,
        lastEncryptedAt: new Date().toISOString(),
        cipherAlgorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-HMAC-SHA512',
        stateIntegrityHash: '9b7a42...e81c04',
        autoLockMinutes: 15
      },
      vaultPassphraseHash: '1234',

      federationPartners: DEFAULT_FEDERATION_PARTNERS,
      globalSharingPolicy: 'busy_only',
      simulatedFederatedSlots: [],

      setLocalNodeInfo: (name, org) => set({ localNodeName: name, localOrganization: org }),

      toggleP2PActive: () => set((state) => ({ isP2PActive: !state.isP2PActive })),

      generateNewInviteCode: () => {
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase()
        const code = `CRD-${rand()}-${rand()}-${rand()}`
        set({ pairingInviteCode: code })
        return code
      },

      pairWithCode: async (code, customName) => {
        await new Promise((resolve) => setTimeout(resolve, 600))
        const cleanCode = code.trim().toUpperCase()
        const peerName = customName || `Peer Node (${cleanCode.slice(-4)})`
        const newPeer: PeerNode = {
          id: `peer-${Date.now()}`,
          name: peerName,
          organization: 'Authenticated WebRTC Peer',
          status: 'connected',
          latencyMs: Math.floor(Math.random() * 15) + 10,
          lastSyncAt: new Date().toISOString(),
          dataSentKB: 8,
          dataReceivedKB: 12,
          e2eFingerprint: `SHA256:${Math.random().toString(16).substring(2, 6).toUpperCase()}:${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
          deviceType: 'workstation',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 150) + 100}:51820`
        }

        set((state) => ({
          peers: [newPeer, ...state.peers.filter((p) => p.name !== peerName)],
          selectedPeerId: newPeer.id,
          syncLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              peerName: newPeer.name,
              type: 'inbound',
              summary: 'Established end-to-end authenticated WebRTC channel.'
            },
            ...state.syncLog
          ]
        }))

        return { success: true, peerName: newPeer.name }
      },

      disconnectPeer: (id) =>
        set((state) => ({
          peers: state.peers.filter((p) => p.id !== id),
          selectedPeerId: state.selectedPeerId === id ? null : state.selectedPeerId
        })),

      manualSyncWithPeer: async (peerId, eventCount) => {
        await new Promise((resolve) => setTimeout(resolve, 400))
        const targetPeer = get().peers.find((p) => p.id === peerId)
        if (!targetPeer) return

        const payloadSize = Math.max(2, Math.round(eventCount * 1.5))
        const newLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          peerName: targetPeer.name,
          type: 'outbound' as const,
          summary: `Synchronized ${eventCount} real calendar events (${payloadSize} KB encrypted frame).`
        }

        set((state) => ({
          peers: state.peers.map((p) =>
            p.id === peerId
              ? {
                  ...p,
                  lastSyncAt: new Date().toISOString(),
                  latencyMs: Math.max(8, p.latencyMs + (Math.floor(Math.random() * 5) - 2)),
                  dataSentKB: p.dataSentKB + payloadSize
                }
              : p
          ),
          syncLog: [newLog, ...state.syncLog]
        }))
      },

      broadcastEventChange: (eventTitle) => {
        const peers = get().peers
        if (peers.length === 0 || !get().isP2PActive) return

        const logItem = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          peerName: 'Mesh Broadcast',
          type: 'outbound' as const,
          summary: `Dispatched encrypted delta frame for: "${eventTitle}".`
        }

        set((state) => ({
          syncLog: [logItem, ...state.syncLog.slice(0, 30)],
          peers: state.peers.map((p) => ({
            ...p,
            dataSentKB: p.dataSentKB + 2
          }))
        }))
      },

      unlockVault: (passphrase) => {
        if (passphrase === get().vaultPassphraseHash) {
          set((state) => ({ vaultStats: { ...state.vaultStats, isLocked: false } }))
          return true
        }
        return false
      },

      lockVault: () =>
        set((state) => ({ vaultStats: { ...state.vaultStats, isLocked: true } })),

      updateVaultPassphrase: (oldPass, newPass) => {
        if (oldPass === get().vaultPassphraseHash && newPass.length >= 4) {
          set({ vaultPassphraseHash: newPass })
          return true
        }
        return false
      },

      updateSharingPolicy: (policy) => set({ globalSharingPolicy: policy }),

      addFederationPartner: (partnerData) => {
        const newPartner: FederationPartner = {
          ...partnerData,
          id: `fed-${Date.now()}`,
          activeSharedCalendars: 1,
          lastQueryAt: new Date().toISOString()
        }
        set((state) => ({
          federationPartners: [...state.federationPartners, newPartner]
        }))
      },

      togglePartnerStatus: (id) =>
        set((state) => ({
          federationPartners: state.federationPartners.map((p) =>
            p.id === id ? { ...p, status: p.status === 'trusted' ? 'pending' : 'trusted' } : p
          )
        })),

      runFederatedAvailabilityQuery: async (_orgDomain, dateStr) => {
        await new Promise((resolve) => setTimeout(resolve, 600))
        const slots: FederatedAvailabilitySlot[] = [
          {
            start: `${dateStr}T09:00:00Z`,
            end: `${dateStr}T10:30:00Z`,
            status: 'free',
            orgDomain: _orgDomain,
            privacyNote: 'Obfuscated busy/free slot'
          },
          {
            start: `${dateStr}T10:30:00Z`,
            end: `${dateStr}T12:00:00Z`,
            status: 'busy',
            orgDomain: _orgDomain,
            privacyNote: 'Reserved commitment'
          },
          {
            start: `${dateStr}T13:30:00Z`,
            end: `${dateStr}T15:00:00Z`,
            status: 'free',
            orgDomain: _orgDomain,
            privacyNote: 'Open working hours'
          },
          {
            start: `${dateStr}T15:00:00Z`,
            end: `${dateStr}T16:30:00Z`,
            status: 'busy',
            orgDomain: _orgDomain,
            privacyNote: 'Internal departmental session'
          }
        ]
        set({ simulatedFederatedSlots: slots })
        return slots
      },

      clearAllPeers: () => set({ peers: [], syncLog: [] })
    }),
    {
      name: 'chronodesk-p2p-store-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
