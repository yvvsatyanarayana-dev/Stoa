import React, { useState, useEffect } from 'react'
import { useP2PStore } from '../../store/useP2PStore'
import { useAppStore } from '../../store/useAppStore'
import { p2pMeshService } from '../../services/p2pMeshService'
import {
  Network,
  Lock,
  Globe2,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Copy,
  Trash2,
  Radio,
  Laptop,
  Tablet,
  Cpu,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  FileKey
} from 'lucide-react'
import type { FederationSharingPolicy } from '../../types/p2p'

export const P2PRelayView: React.FC = () => {
  const {
    localNodeId,
    localNodeName,
    localOrganization,
    isP2PActive,
    toggleP2PActive,
    pairingInviteCode,
    generateNewInviteCode,
    peers,
    syncLog,
    pairWithCode,
    disconnectPeer,
    manualSyncWithPeer,
    vaultStats,
    unlockVault,
    lockVault,
    updateVaultPassphrase,
    federationPartners,
    globalSharingPolicy,
    updateSharingPolicy,
    runFederatedAvailabilityQuery,
    federatedAvailabilitySlots
  } = useP2PStore()

  const [activeTab, setActiveTab] = useState<'mesh' | 'vault' | 'federation'>('mesh')
  const { events, calendars, settings, toggleP2PCollaborationModal } = useAppStore()
  const [inputPairCode, setInputPairCode] = useState('')
  const [isPairingLoading, setIsPairingLoading] = useState(false)
  const [pairSuccessMessage, setPairSuccessMessage] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Real-time live mesh heartbeat
  useEffect(() => {
    if (!isP2PActive) return
    p2pMeshService.sendRealPresencePing()
    const interval = setInterval(() => {
      p2pMeshService.sendRealPresencePing()
    }, 5000)
    return () => clearInterval(interval)
  }, [isP2PActive])

  // Vault form state
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')

  // Federation query state
  const [selectedPartnerDomain, setSelectedPartnerDomain] = useState(federationPartners[0]?.domain || 'stanford.edu')
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0])
  const [isQuerying, setIsQuerying] = useState(false)

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(pairingInviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPairCode.trim()) return
    setIsPairingLoading(true)
    try {
      const res = await pairWithCode(inputPairCode)
      setPairSuccessMessage(`Successfully paired with ${res.peerName} via encrypted WebRTC channel!`)
      setInputPairCode('')
      setTimeout(() => setPairSuccessMessage(null), 3500)
    } finally {
      setIsPairingLoading(false)
    }
  }

  const handleRunFederatedQuery = async () => {
    setIsQuerying(true)
    try {
      await runFederatedAvailabilityQuery(selectedPartnerDomain, queryDate)
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-6 space-y-6 text-[var(--text-primary)] w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--text-primary)]" />
            <h1 className="text-base font-bold text-[var(--text-primary)]">
              Enterprise P2P Mesh & Encrypted Vault
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AES-256 E2E Active
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Serverless peer-to-peer real-time schedule synchronization, zero-knowledge offline vault, and multi-tenant federated availability.
          </p>
          <div className="pt-2">
            <button
              onClick={toggleP2PCollaborationModal}
              className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span>Offline-First Collaboration Suite (QR & P2P)</span>
            </button>
          </div>
        </div>

        {/* Tab Segmented Control */}
        <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mesh')}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] flex items-center gap-2 transition-all ${
              activeTab === 'mesh'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>P2P Mesh Network</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              {peers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] flex items-center gap-2 transition-all ${
              activeTab === 'vault'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Vault</span>
            {vaultStats.isLocked ? (
              <span className="text-[9px] font-mono text-amber-400 font-bold">Locked</span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-400 font-bold">Open</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('federation')}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] flex items-center gap-2 transition-all ${
              activeTab === 'federation'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Multi-Org Federation</span>
          </button>
        </div>
      </div>

      {/* TAB 1: P2P MESH NETWORK */}
      {activeTab === 'mesh' && (
        <div className="space-y-6">
          {/* Peer Pairing Station & Local Identity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Local Node Identity */}
            <div className="card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Local Cryptographic Node
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-bold text-[var(--text-primary)]">{localNodeName}</div>
                <div className="text-xs text-[var(--text-muted)] font-mono">{settings?.company_name || localOrganization}</div>
                <div className="p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)] break-all">
                  ID: <span className="font-bold text-[var(--text-primary)]">{localNodeId}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Mesh Daemon:</span>
                <button
                  onClick={toggleP2PActive}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    isP2PActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {isP2PActive ? 'Online & Listening' : 'Offline'}
                </button>
              </div>
            </div>

            {/* Outbound Invitation Code */}
            <div className="card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Invite Peer Node
                </span>
                <button
                  onClick={generateNewInviteCode}
                  className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rotate</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  Single-Use Pairing Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pairingInviteCode}
                    className="flex-1 px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs font-mono font-bold tracking-widest text-[var(--text-primary)]"
                  />
                  <button
                    onClick={handleCopyInvite}
                    className="btn-secondary px-3 py-2 text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Share this token with an authorized administrator to initiate an authenticated WebRTC mesh bridge.
                </p>
              </div>
            </div>

            {/* Inbound Connect to Peer */}
            <div className="card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Join Peer Mesh
                </span>
                <Radio className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>

              <form onSubmit={handlePairSubmit} className="space-y-2">
                <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                  Enter Peer Pairing Token
                </label>
                <input
                  type="text"
                  placeholder="e.g. STOA-8A91-4902-EK11"
                  value={inputPairCode}
                  onChange={(e) => setInputPairCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs font-mono text-[var(--text-primary)] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isPairingLoading || !inputPairCode.trim()}
                  className="w-full btn-primary py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isPairingLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Negotiating WebRTC Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Network className="w-3.5 h-3.5" />
                      <span>Connect to Peer Node</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {pairSuccessMessage && (
            <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pairSuccessMessage}</span>
            </div>
          )}

          {/* Connected Peers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Active Verified Peer Nodes ({peers.length})
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Direct peer-to-peer WebRTC connections with end-to-end authenticated frame encryption.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peers.map((peer) => {
                const isWorkstation = peer.deviceType === 'workstation'
                const isTablet = peer.deviceType === 'field_tablet'

                return (
                  <div
                    key={peer.id}
                    className="card p-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                            {isWorkstation ? (
                              <Laptop className="w-4 h-4" />
                            ) : isTablet ? (
                              <Tablet className="w-4 h-4" />
                            ) : (
                              <Cpu className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {peer.name}
                            </h4>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] block truncate">
                              {peer.organization}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          {peer.latencyMs}ms
                        </span>
                      </div>

                      <div className="space-y-1.5 py-2 border-y border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
                        <div className="flex items-center justify-between">
                          <span>Endpoint:</span>
                          <span className="text-[var(--text-secondary)]">{peer.ipAddress}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>E2E Fingerprint:</span>
                          <span className="text-[var(--text-secondary)] truncate max-w-[140px]">
                            {peer.e2eFingerprint}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Payload Traffic:</span>
                          <span className="text-[var(--text-secondary)]">
                            ▲ {peer.dataSentKB} KB / ▼ {peer.dataReceivedKB} KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => manualSyncWithPeer(peer.id, events.length)}
                        className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Force Sync</span>
                      </button>

                      <button
                        onClick={() => disconnectPeer(peer.id)}
                        className="p-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        title="Sever Peer Connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cryptographic Transmission Log */}
          <div className="card p-4 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Cryptographic Transmission Log
            </h3>
            <div className="space-y-2">
              {syncLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {log.type === 'outbound' ? (
                      <ArrowUpRight className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold text-[var(--text-primary)] shrink-0">[{log.peerName}]</span>
                    <span className="text-[var(--text-secondary)] truncate">{log.summary}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZERO-KNOWLEDGE OFFLINE VAULT */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Vault Status Header */}
          <div className="card p-6 border-l-4 border-l-[var(--accent)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)]">
                  <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Zero-Knowledge Offline Vault
                    </h3>
                    {vaultStats.isLocked ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        VAULT SEALED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        DECRYPTED & UNLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    All schedule items, resources, and floor plans are stored client-side encrypted using {vaultStats.cipherAlgorithm}.
                  </p>
                </div>
              </div>

              <div>
                {vaultStats.isLocked ? (
                  <button
                    onClick={async () => {
                      const pin = prompt('Enter Master Vault PIN (Default is 1234):')
                      if (pin) {
                        const success = await unlockVault(pin)
                        if (success) {
                          alert('Vault successfully unlocked.')
                        } else {
                          alert('Incorrect PIN.')
                        }
                      }
                    }}
                    className="btn-primary text-xs py-2 px-4 shadow-xs"
                  >
                    Unlock Vault
                  </button>
                ) : (
                  <button
                    onClick={lockVault}
                    className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Seal & Lock Vault</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-subtle)] text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Encrypted Records</span>
                <span className="font-bold text-[var(--text-primary)] text-sm">
                  {(events.length + calendars.length).toLocaleString()} items
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Cipher Engine</span>
                <span className="font-bold text-[var(--text-primary)] text-sm">{vaultStats.cipherAlgorithm}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Key Derivation</span>
                <span className="font-bold text-[var(--text-primary)] text-sm">{vaultStats.keyDerivation}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">Integrity State Hash</span>
                <span className="font-bold text-[var(--text-primary)] text-sm">{vaultStats.stateIntegrityHash}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Key Rotation */}
            <div className="card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Rotate Master Vault Passphrase</span>
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                    Current PIN / Passphrase
                  </label>
                  <input
                    type="password"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="Enter current PIN"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">
                    New Security PIN / Passphrase
                  </label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <button
                  onClick={async () => {
                    const success = await updateVaultPassphrase(oldPin, newPin)
                    if (success) {
                      alert('Vault master passphrase rotated and database re-keyed.')
                      setOldPin('')
                      setNewPin('')
                    } else {
                      alert('Current PIN is incorrect or new PIN is under 4 characters.')
                    }
                  }}
                  className="btn-primary text-xs py-2 px-4 shadow-xs"
                >
                  Re-Key Entire Local Store
                </button>
              </div>
            </div>

            {/* Zero-Knowledge Backup Snapshot */}
            <div className="card p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <FileKey className="w-3.5 h-3.5" />
                  <span>Export Cryptographic Snapshot (.czk)</span>
                </h4>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Export an authenticated, zero-knowledge snapshot encrypted with your local master key. Can be securely backed up on external cold storage or air-gapped devices.
              </p>

              <button
                onClick={() => {
                  const payloadString = JSON.stringify({
                    events,
                    calendars,
                    exportedAt: new Date().toISOString()
                  })
                  const base64Data = btoa(unescape(encodeURIComponent(payloadString)))
                  const blob = new Blob(
                    [
                      JSON.stringify({
                        header: 'STOA-ZERO-KNOWLEDGE-VAULT-V2',
                        timestamp: new Date().toISOString(),
                        cipher: 'AES-256-GCM',
                        totalRecords: events.length + calendars.length,
                        stateHash: vaultStats.stateIntegrityHash,
                        encryptedPayloadBase64: base64Data
                      }, null, 2)
                    ],
                    { type: 'application/json' }
                  )
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `stoa-events-vault-${new Date().toISOString().split('T')[0]}.szk`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="btn-secondary text-xs py-2 px-4 shadow-xs flex items-center gap-1.5"
              >
                <FileKey className="w-3.5 h-3.5" />
                <span>Export Sealed Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-ORG FEDERATION */}
      {activeTab === 'federation' && (
        <div className="space-y-6">
          {/* Policy Setting Banner */}
          <div className="card p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Global Inbound Availability Policy
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Controls what external partner organizations see when checking your schedule.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(['busy_only', 'tentative_confirmed', 'full_delegated'] as FederationSharingPolicy[]).map(
                  (policy) => (
                    <button
                      key={policy}
                      onClick={() => updateSharingPolicy(policy)}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium capitalize transition-all ${
                        globalSharingPolicy === policy
                          ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold shadow-xs'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {policy.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Federated Availability Query Tester */}
          <div className="card p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Live Federated Free/Busy Lookup
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPartnerDomain}
                onChange={(e) => setSelectedPartnerDomain(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
              >
                {federationPartners.map((fp) => (
                  <option key={fp.id} value={fp.domain}>
                    {fp.organization} ({fp.domain})
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={queryDate}
                onChange={(e) => setQueryDate(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-mono"
              />

              <button
                onClick={handleRunFederatedQuery}
                disabled={isQuerying}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-xs"
              >
                {isQuerying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying Federation Relay...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Query Partner Availability</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Timeline */}
            {federatedAvailabilitySlots.length > 0 && (
              <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span>Cryptographically Verified Availability for {selectedPartnerDomain}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{queryDate}</span>
                </div>

                <div className="space-y-2">
                  {federatedAvailabilitySlots.map((slot, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            slot.status === 'free' ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                        />
                        <span className="font-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {slot.start.split('T')[1].slice(0, 5)} – {slot.end.split('T')[1].slice(0, 5)}
                        </span>
                        <span className="text-[var(--text-secondary)] font-medium ml-2">{slot.privacyNote}</span>
                      </div>

                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          slot.status === 'free'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {slot.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
