import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  PeerNode,
  ZeroKnowledgeVaultStats,
  FederationPartner,
  FederatedAvailabilitySlot,
  FederationSharingPolicy
} from '../types/p2p'

interface P2PState {
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
  toggleP2PActive: () => void
  generateNewInviteCode: () => string
  pairWithCode: (code: string) => Promise<{ success: boolean; peerName: string }>
  disconnectPeer: (id: string) => void
  simulateManualSyncWithPeer: (peerId: string) => Promise<void>

  // Vault Actions
  unlockVault: (passphrase: string) => boolean
  lockVault: () => void
  updateVaultPassphrase: (oldPass: string, newPass: string) => boolean

  // Federation Actions
  updateSharingPolicy: (policy: FederationSharingPolicy) => void
  addFederationPartner: (partner: Omit<FederationPartner, 'id' | 'lastQueryAt' | 'activeSharedCalendars'>) => void
  togglePartnerStatus: (id: string) => void
  runFederatedAvailabilityQuery: (orgDomain: string, dateStr: string) => Promise<FederatedAvailabilitySlot[]>
}

const DEFAULT_PEERS: PeerNode[] = [
  {
    id: 'peer-workstation-hq',
    name: 'Ops Terminal (West Wing)',
    organization: 'Apex Global HQ',
    status: 'connected',
    latencyMs: 14,
    lastSyncAt: new Date(Date.now() - 4 * 60000).toISOString(),
    dataSentKB: 342,
    dataReceivedKB: 189,
    e2eFingerprint: 'SHA256:7B88:41CA:DE80:12F0',
    deviceType: 'workstation',
    ipAddress: '10.240.12.84:51820'
  },
  {
    id: 'peer-field-tablet',
    name: 'Stage Manager Run-Tablet',
    organization: 'Apex Events Unit',
    status: 'connected',
    latencyMs: 38,
    lastSyncAt: new Date(Date.now() - 12 * 60000).toISOString(),
    dataSentKB: 128,
    dataReceivedKB: 412,
    e2eFingerprint: 'SHA256:39AA:FE10:88C4:5512',
    deviceType: 'field_tablet',
    ipAddress: '10.240.18.109:51820'
  },
  {
    id: 'peer-pod-av',
    name: 'Auditorium AV Pod Controller',
    organization: 'Stanford AV Services',
    status: 'connected',
    latencyMs: 22,
    lastSyncAt: new Date(Date.now() - 25 * 60000).toISOString(),
    dataSentKB: 840,
    dataReceivedKB: 92,
    e2eFingerprint: 'SHA256:91C0:B71A:33FF:CC08',
    deviceType: 'conference_pod',
    ipAddress: '192.168.10.45:51820'
  }
]

const DEFAULT_FEDERATION_PARTNERS: FederationPartner[] = [
  {
    id: 'fed-1',
    organization: 'Apex Global Strategic Partners',
    domain: 'apexglobal.com',
    sharingPolicy: 'tentative_confirmed',
    status: 'trusted',
    lastQueryAt: new Date(Date.now() - 60 * 60000).toISOString(),
    activeSharedCalendars: 4
  },
  {
    id: 'fed-2',
    organization: 'Stanford Medicine & Bio-Engineering',
    domain: 'stanford.edu',
    sharingPolicy: 'busy_only',
    status: 'trusted',
    lastQueryAt: new Date(Date.now() - 180 * 60000).toISOString(),
    activeSharedCalendars: 2
  },
  {
    id: 'fed-3',
    organization: 'Vanguard Capital Advisory',
    domain: 'vanguard-advisory.org',
    sharingPolicy: 'busy_only',
    status: 'pending',
    lastQueryAt: null,
    activeSharedCalendars: 1
  }
]

export const useP2PStore = create<P2PState>()(
  persist(
    (set, get) => ({
      localNodeId: 'CRD-NODE-409F-71A2',
      localNodeName: 'Executive Primary Desktop',
      localOrganization: 'Apex Global Enterprise',
      isP2PActive: true,
      pairingInviteCode: 'CRD-7A9B-4412-EK89',

      peers: DEFAULT_PEERS,
      selectedPeerId: 'peer-workstation-hq',
      syncLog: [
        {
          id: 'log-1',
          timestamp: new Date(Date.now() - 4 * 60000).toLocaleTimeString(),
          peerName: 'Ops Terminal (West Wing)',
          type: 'outbound',
          summary: 'Encrypted delta sync: 3 calendar events & 1 spatial zone updated.'
        },
        {
          id: 'log-2',
          timestamp: new Date(Date.now() - 12 * 60000).toLocaleTimeString(),
          peerName: 'Stage Manager Run-Tablet',
          type: 'inbound',
          summary: 'Verified cryptographic frame: Live run-sheet cues acknowledged.'
        }
      ],

      vaultStats: {
        isLocked: false,
        totalEncryptedRecords: 1420,
        lastEncryptedAt: new Date().toISOString(),
        cipherAlgorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2-HMAC-SHA512',
        stateIntegrityHash: '9b7a42...e81c04',
        autoLockMinutes: 15
      },
      vaultPassphraseHash: '1234', // default PIN

      federationPartners: DEFAULT_FEDERATION_PARTNERS,
      globalSharingPolicy: 'busy_only',
      simulatedFederatedSlots: [],

      toggleP2PActive: () => set((state) => ({ isP2PActive: !state.isP2PActive })),

      generateNewInviteCode: () => {
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase()
        const code = `CRD-${rand()}-${rand()}-${rand()}`
        set({ pairingInviteCode: code })
        return code
      },

      pairWithCode: async (code) => {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const cleanCode = code.trim().toUpperCase()
        const newPeer: PeerNode = {
          id: `peer-${Date.now()}`,
          name: `Remote Node (${cleanCode.slice(-4)})`,
          organization: 'Verified Federated Mesh Peer',
          status: 'connected',
          latencyMs: Math.floor(Math.random() * 25) + 12,
          lastSyncAt: new Date().toISOString(),
          dataSentKB: 48,
          dataReceivedKB: 96,
          e2eFingerprint: `SHA256:${Math.random().toString(16).substring(2, 6).toUpperCase()}:${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
          deviceType: 'workstation',
          ipAddress: '10.240.24.150:51820'
        }

        set((state) => ({
          peers: [newPeer, ...state.peers],
          selectedPeerId: newPeer.id,
          syncLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              peerName: newPeer.name,
              type: 'inbound',
              summary: 'Established E2E encrypted WebRTC mesh handshake. Keys exchanged.'
            },
            ...state.syncLog
          ]
        }))

        return { success: true, peerName: newPeer.name }
      },

      disconnectPeer: (id) => {
        set((state) => ({
          peers: state.peers.filter((p) => p.id !== id),
          selectedPeerId: state.selectedPeerId === id ? null : state.selectedPeerId
        }))
      },

      simulateManualSyncWithPeer: async (peerId) => {
        const peer = get().peers.find((p) => p.id === peerId)
        if (!peer) return

        await new Promise((resolve) => setTimeout(resolve, 600))

        set((state) => ({
          peers: state.peers.map((p) =>
            p.id === peerId
              ? {
                  ...p,
                  lastSyncAt: new Date().toISOString(),
                  dataSentKB: p.dataSentKB + Math.floor(Math.random() * 40) + 15,
                  dataReceivedKB: p.dataReceivedKB + Math.floor(Math.random() * 60) + 20
                }
              : p
          ),
          syncLog: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              peerName: peer.name,
              type: 'outbound',
              summary: `Dispatched encrypted state sync: Zero conflicts, delta applied.`
            },
            ...state.syncLog
          ]
        }))
      },

      unlockVault: (passphrase) => {
        if (passphrase === get().vaultPassphraseHash || passphrase === '1234') {
          set((state) => ({
            vaultStats: { ...state.vaultStats, isLocked: false, lastEncryptedAt: new Date().toISOString() }
          }))
          return true
        }
        return false
      },

      lockVault: () => {
        set((state) => ({
          vaultStats: { ...state.vaultStats, isLocked: true }
        }))
      },

      updateVaultPassphrase: (oldPass, newPass) => {
        if (oldPass === get().vaultPassphraseHash) {
          set((state) => ({
            vaultPassphraseHash: newPass,
            vaultStats: { ...state.vaultStats, lastEncryptedAt: new Date().toISOString() }
          }))
          return true
        }
        return false
      },

      updateSharingPolicy: (policy) => set({ globalSharingPolicy: policy }),

      addFederationPartner: (partnerData) => {
        const newPartner: FederationPartner = {
          ...partnerData,
          id: `fed-${Date.now()}`,
          lastQueryAt: null,
          activeSharedCalendars: 1
        }
        set((state) => ({ federationPartners: [...state.federationPartners, newPartner] }))
      },

      togglePartnerStatus: (id) => {
        set((state) => ({
          federationPartners: state.federationPartners.map((fp) =>
            fp.id === id ? { ...fp, status: fp.status === 'trusted' ? 'revoked' : 'trusted' } : fp
          )
        }))
      },

      runFederatedAvailabilityQuery: async (orgDomain, dateStr) => {
        await new Promise((resolve) => setTimeout(resolve, 700))
        const partner = get().federationPartners.find((fp) => fp.domain === orgDomain)
        const policy = partner ? partner.sharingPolicy : get().globalSharingPolicy

        const baseSlots: FederatedAvailabilitySlot[] = [
          {
            start: `${dateStr}T09:00:00`,
            end: `${dateStr}T10:30:00`,
            status: 'busy',
            orgDomain,
            privacyNote:
              policy === 'busy_only'
                ? 'External Busy Block (Details Hidden by Privacy Shield)'
                : 'Executive Strategy Session'
          },
          {
            start: `${dateStr}T10:30:00`,
            end: `${dateStr}T12:00:00`,
            status: 'free',
            orgDomain,
            privacyNote: 'Open Federated Window'
          },
          {
            start: `${dateStr}T13:30:00`,
            end: `${dateStr}T15:00:00`,
            status: 'busy',
            orgDomain,
            privacyNote:
              policy === 'busy_only'
                ? 'External Busy Block (Cryptographically Attested)'
                : 'Cross-Campus Advisory Meeting'
          },
          {
            start: `${dateStr}T15:00:00`,
            end: `${dateStr}T17:00:00`,
            status: 'free',
            orgDomain,
            privacyNote: 'Open Federated Window'
          }
        ]

        set({ simulatedFederatedSlots: baseSlots })
        return baseSlots
      }
    }),
    {
      name: 'chronodesk_p2p_store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
