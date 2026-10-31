// Decentralized P2P & Zero-Knowledge Vault Types

export interface PeerNode {
  id: string
  name: string
  organization: string
  status: 'connected' | 'handshaking' | 'disconnected'
  latencyMs: number
  lastSyncAt: string | null
  dataSentKB: number
  dataReceivedKB: number
  e2eFingerprint: string
  deviceType: 'desktop_primary' | 'workstation' | 'conference_pod' | 'field_tablet'
  ipAddress: string
}

export interface ZeroKnowledgeVaultStats {
  isLocked: boolean
  totalEncryptedRecords: number
  lastEncryptedAt: string
  cipherAlgorithm: 'AES-256-GCM'
  keyDerivation: 'PBKDF2-HMAC-SHA512'
  stateIntegrityHash: string
  autoLockMinutes: number
}

export type FederationSharingPolicy = 'busy_only' | 'tentative_confirmed' | 'full_delegated'

export interface FederationPartner {
  id: string
  organization: string
  domain: string
  sharingPolicy: FederationSharingPolicy
  status: 'trusted' | 'pending' | 'revoked'
  lastQueryAt: string | null
  activeSharedCalendars: number
}

export interface FederatedAvailabilitySlot {
  start: string
  end: string
  status: 'busy' | 'tentative' | 'free'
  orgDomain: string
  privacyNote: string
}
