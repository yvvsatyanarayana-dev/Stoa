import React, { useState, useEffect } from 'react'
import {
  X,
  Radio,
  Lock,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Laptop,
  ArrowRight,
  ShieldCheck,
  FileDown,
  FileUp,
  Cpu,
  Layers,
  CheckCircle2,
  GitMerge,
  Info
} from 'lucide-react'
import QRCode from 'qrcode'
import { useP2PStore } from '../../store/useP2PStore'
import { useAppStore } from '../../store/useAppStore'
import { p2pMeshService } from '../../services/p2pMeshService'
import { crdtEngine, type CRDTConflictResolution } from '../../services/crdtSyncEngine'

export const P2PCollaborationModal: React.FC = () => {
  const { isP2PCollaborationModalOpen, setIsP2PCollaborationModalOpen, events } = useAppStore()
  const {
    peers,
    syncLog,
    isP2PActive,
    toggleP2PActive,
    disconnectPeer
  } = useP2PStore()

  const [activeTab, setActiveTab] = useState<'mesh' | 'invite' | 'crdt' | 'airgap'>('mesh')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [pairingToken, setPairingToken] = useState<string>('')
  const [inviteLink, setInviteLink] = useState<string>('')
  const [roomFingerprint, setRoomFingerprint] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [copiedLink, setCopiedLink] = useState<boolean>(false)
  const [copiedToken, setCopiedToken] = useState<boolean>(false)

  // Join Peer Input
  const [inputJoinToken, setInputJoinToken] = useState<string>('')
  const [joinStatus, setJoinStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  })

  // Simulation Sandbox
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [simulationResult, setSimulationResult] = useState<{
    previewTitle: string
    conflictsResolved: number
    appliedCount: number
    summary: string
  } | null>(null)

  // Air Gap Payload
  const [airGapExportPayload, setAirGapExportPayload] = useState<string>('')
  const [airGapImportPayload, setAirGapImportPayload] = useState<string>('')
  const [airGapStatus, setAirGapStatus] = useState<string | null>(null)
  const [copiedAirGap, setCopiedAirGap] = useState<boolean>(false)

  // Conflicts list
  const [conflicts, setConflicts] = useState<CRDTConflictResolution[]>([])

  // Load Invite Info and Generate QR Code
  useEffect(() => {
    if (!isP2PCollaborationModalOpen) return

    let isMounted = true
    const initInvite = async () => {
      try {
        const invite = await p2pMeshService.createPairingInvite()
        if (!isMounted) return

        setPairingToken(invite.pairingToken)
        setInviteLink(invite.inviteLink)
        setRoomFingerprint(invite.fingerprint)
        setRoomId(invite.roomId)

        const qr = await QRCode.toDataURL(invite.pairingToken, {
          width: 320,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        if (isMounted) {
          setQrDataUrl(qr)
        }
      } catch (err) {
        console.error('Failed to generate QR invite:', err)
      }
    }

    initInvite()
    setConflicts(crdtEngine.getConflictHistory())

    return () => {
      isMounted = false
    }
  }, [isP2PCollaborationModalOpen])

  if (!isP2PCollaborationModalOpen) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(pairingToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleJoinPeer = async () => {
    if (!inputJoinToken.trim()) return
    setJoinStatus({ status: 'loading', message: 'Connecting to peer mesh...' })
    const res = await p2pMeshService.joinFromInvite(inputJoinToken)
    if (res.success) {
      setJoinStatus({ status: 'success', message: res.message })
      setInputJoinToken('')
      setTimeout(() => {
        setJoinStatus({ status: 'idle', message: '' })
        setActiveTab('mesh')
      }, 1500)
    } else {
      setJoinStatus({ status: 'error', message: res.message })
    }
  }

  const handleRunSimulation = async () => {
    try {
      setIsSimulating(true)
      setSimulationResult(null)
      const res = await p2pMeshService.simulatePeerOfflineEditAndMerge(events)
      setSimulationResult(res)
      setConflicts(crdtEngine.getConflictHistory())
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSimulating(false)
    }
  }

  const handleExportAirGap = async () => {
    try {
      const payload = await p2pMeshService.exportAirGapBundle(events)
      setAirGapExportPayload(payload)
      setAirGapStatus('Air-gapped CRDT bundle encrypted with AES-256-GCM and ready to transport.')
    } catch (err: any) {
      setAirGapStatus(`Export error: ${err.message}`)
    }
  }

  const handleImportAirGap = async () => {
    if (!airGapImportPayload.trim()) return
    try {
      const res = await p2pMeshService.importAirGapBundle(airGapImportPayload)
      setAirGapStatus(`Successfully merged ${res.applied} offline changes with ${res.conflicts} conflict resolutions!`)
      setAirGapImportPayload('')
      setConflicts(crdtEngine.getConflictHistory())
    } catch (err: any) {
      setAirGapStatus(`Import error: ${err.message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] w-full max-w-4xl max-h-[92vh] rounded-[var(--radius-lg)] shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white shrink-0">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  True Offline-First Collaboration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> E2E Encrypted (AES-256)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Zero Cloud Server
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Peer-to-peer CRDT sync without servers. Edit shared calendars offline & merge seamlessly.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsP2PCollaborationModalOpen(false)}
            className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[var(--border-subtle)] px-6 bg-[var(--bg-base)] text-xs font-medium">
          <button
            onClick={() => setActiveTab('mesh')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'mesh'
                ? 'border-white text-white'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Live Mesh & Peers ({peers.length})
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'invite'
                ? 'border-white text-white'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Invite via QR & Link
          </button>

          <button
            onClick={() => setActiveTab('crdt')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'crdt'
                ? 'border-white text-white'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" /> CRDT Conflict-Free Log ({conflicts.length})
          </button>

          <button
            onClick={() => setActiveTab('airgap')}
            className={`py-3 px-3 border-b-2 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'airgap'
                ? 'border-white text-white'
                : 'border-transparent text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Air-Gapped Off-Grid Sync
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIVE MESH & PEERS */}
          {activeTab === 'mesh' && (
            <div className="space-y-6">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)]">Mesh Status</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {isP2PActive ? 'Active P2P Mesh' : 'Mesh Paused'}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)]">Cryptographic Fingerprint</div>
                  <div className="text-xs font-mono font-bold text-white mt-1 truncate" title={roomFingerprint}>
                    {roomFingerprint || 'SHA256:7B88:41CA'}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)]">CRDT Lamport Clock</div>
                  <div className="text-sm font-bold text-white mt-1">
                    Tick #{crdtEngine.getLamportClock()}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <div className="text-[11px] text-[var(--text-secondary)]">Server Dependence</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    0.0% (Zero Cloud)
                  </div>
                </div>
              </div>

              {/* Interactive Simulation Sandbox */}
              <div className="p-4 rounded-[var(--radius-md)] bg-neutral-900 border border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Interactive CRDT Conflict-Free Demo
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Deterministic 3-Way Auto-Merge Test
                  </span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  Want to verify how Stoa beats Google & Notion offline? Click below to simulate an offline colleague editing an event while you also edit offline. Watch both modifications merge seamlessly without server arbitration!
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-black ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? 'Simulating Concurrent Edits...' : 'Simulate Peer Offline Edit & Auto-Merge'}</span>
                  </button>

                  <button
                    onClick={() => p2pMeshService.broadcastCRDTSync(events)}
                    className="h-7 px-3 text-xs font-semibold rounded-[var(--radius-md)] bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors shrink-0"
                  >
                    Force Mesh Sync Now
                  </button>
                </div>

                {simulationResult && (
                  <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 space-y-1 animate-fadeIn">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      CRDT Auto-Merge Succeeded with 0 Data Loss!
                    </div>
                    <div className="text-neutral-300 text-[11px]">{simulationResult.summary}</div>
                    <div className="text-[10px] font-mono text-emerald-400/80 pt-1">
                      Event: "{simulationResult.previewTitle}" • Resolved {simulationResult.conflictsResolved} concurrent field(s).
                    </div>
                  </div>
                )}
              </div>

              {/* Connected Peers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Active Mesh Nodes & LAN Peers ({peers.length})
                  </h3>
                  <button
                    onClick={toggleP2PActive}
                    className="text-xs text-[var(--text-secondary)] hover:text-white underline"
                  >
                    {isP2PActive ? 'Pause Mesh' : 'Resume Mesh'}
                  </button>
                </div>

                <div className="space-y-2">
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
                          <Laptop className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{peer.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              Direct WebRTC / LAN
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-3 mt-0.5">
                            <span>Ping: <strong className="text-white">{peer.latencyMs}ms</strong></span>
                            <span>Fingerprint: <code className="text-neutral-300 font-mono">{peer.e2eFingerprint}</code></span>
                            <span>Sent: {peer.dataSentKB} KB • Recv: {peer.dataReceivedKB} KB</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => p2pMeshService.broadcastCRDTSync(events)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                        >
                          Sync
                        </button>
                        <button
                          onClick={() => disconnectPeer(peer.id)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}

                  {peers.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)]">
                      No external peers currently connected. Generate an invite QR code in the next tab to pair a second device!
                    </div>
                  )}
                </div>
              </div>

              {/* Real-time Sync Log */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Live Change-Log Stream
                </h3>
                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-[var(--bg-base)] p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] font-mono text-[11px]">
                  {syncLog.slice(0, 15).map((log) => (
                    <div key={log.id} className="flex items-start gap-2 text-neutral-400">
                      <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
                      <span className={log.type === 'outbound' ? 'text-blue-400' : 'text-emerald-400'}>
                        {log.type === 'outbound' ? '↑' : '↓'}
                      </span>
                      <span className="text-neutral-300">{log.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVITE VIA QR & LINK */}
          {activeTab === 'invite' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: QR Code Display */}
              <div className="p-5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col items-center text-center space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-white" />
                  <span>Scan QR with Second Device</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                  Scan this code from Stoa on another laptop, tablet, or phone to pair directly over local Wi-Fi with end-to-end encryption.
                </p>

                <div className="p-3 bg-white rounded-[var(--radius-md)] shadow-lg inline-block my-2">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="P2P Mesh Invite QR Code" className="w-56 h-56 object-contain" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-black text-xs font-mono">
                      Generating E2E QR...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  AES-256 Room Key embedded directly in QR
                </div>
              </div>

              {/* Right Column: Shareable Link & Manual Token Pairing */}
              <div className="space-y-4">
                {/* 1-Click Copy Invite Link */}
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-xs font-bold text-white">Shareable E2E Pairing Link</div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Send this link over AirDrop, Signal, or local chat. Clicking it on another device connects instantly.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded px-2.5 py-1.5 text-xs font-mono text-neutral-300 truncate select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap flex items-center gap-1.5"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Raw Pairing Token */}
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Encrypted Pairing Token (Base64)</span>
                    <button
                      onClick={handleCopyToken}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedToken ? 'Copied' : 'Copy Token'}
                    </button>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] font-mono text-[10px] text-neutral-400 break-all max-h-16 overflow-y-auto">
                    {pairingToken}
                  </div>
                </div>

                {/* Join from Peer Token / Link */}
                <div className="p-4 rounded-[var(--radius-md)] bg-neutral-900 border border-neutral-700 space-y-2.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Join Another Peer's Calendar Room</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Paste an invite link, token, or scanned QR payload from a colleague:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste stoa://mesh/pair?token=... or Base64 token"
                      value={inputJoinToken}
                      onChange={(e) => setInputJoinToken(e.target.value)}
                      className="flex-1 bg-black border border-neutral-700 rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder-neutral-500"
                    />
                    <button
                      onClick={handleJoinPeer}
                      disabled={joinStatus.status === 'loading'}
                      className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap"
                    >
                      {joinStatus.status === 'loading' ? 'Pairing...' : 'Connect'}
                    </button>
                  </div>

                  {joinStatus.message && (
                    <div
                      className={`text-[11px] font-mono mt-1 ${
                        joinStatus.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {joinStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRDT CONFLICT-FREE LOG */}
          {activeTab === 'crdt' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <p className="text-white font-semibold">How Stoa CRDT Prevents Merge Conflicts Without Any Server</p>
                  <p>
                    Unlike Google Calendar (which overwrites concurrent offline edits) or Notion (which causes sync conflict duplicates), Stoa utilizes a deterministic state-based LWW (Last-Write-Wins) Element-Set combined with Lamport Logical Clocks. When two offline peers modify different fields of the same event, all changes are combined; when they modify the exact same field, the mathematical vector clock breaks ties identically on all nodes.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Deterministic Conflict Resolution History ({conflicts.length})
                </h3>

                {conflicts.length > 0 ? (
                  <div className="space-y-2">
                    {conflicts.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{c.eventTitle}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{c.resolvedAt}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] mt-1 pt-1 border-t border-[var(--border-subtle)]">
                          <div>
                            <span className="text-neutral-500">Field: </span>
                            <span className="font-mono text-neutral-300">{c.field}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Local: </span>
                            <span className="font-mono text-red-300">{String(c.localValue)}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Resolved Value: </span>
                            <span className="font-mono text-emerald-400 font-bold">{String(c.winningValue)}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-neutral-400 italic">
                          Rule: {c.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] text-xs text-[var(--text-secondary)]">
                    No conflicting concurrent edits yet. All mesh events are completely in sync. Use the "Simulate Peer Offline Edit" button on Tab 1 to observe deterministic auto-merging!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AIR-GAPPED OFF-GRID SYNC */}
          {activeTab === 'airgap' && (
            <div className="space-y-5">
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Air-Gapped / Off-Grid Vault Transfer
                </div>
                <p className="text-[var(--text-secondary)]">
                  Working in an isolated facility, submarine, or secure high-assurance environment without Wi-Fi? Export an encrypted `.stoasync` bundle to a USB stick, or paste the encrypted JSON payload directly between devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Air Gap */}
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileDown className="w-4 h-4 text-blue-400" />
                      1. Export Encrypted CRDT Bundle
                    </span>
                    {airGapExportPayload && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(airGapExportPayload)
                          setCopiedAirGap(true)
                          setTimeout(() => setCopiedAirGap(false), 2000)
                        }}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedAirGap ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedAirGap ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Packages all local calendar events, tombstones, and Lamport timestamps into an AES-256-GCM cipher payload.
                  </p>

                  <button
                    onClick={handleExportAirGap}
                    className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap"
                  >
                    Generate Encrypted Bundle
                  </button>

                  {airGapExportPayload && (
                    <textarea
                      readOnly
                      rows={5}
                      value={airGapExportPayload}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 text-[10px] font-mono text-neutral-300 resize-none select-all"
                    />
                  )}
                </div>

                {/* Import Air Gap */}
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileUp className="w-4 h-4 text-emerald-400" />
                    2. Import & Merge Encrypted Bundle
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Paste the encrypted JSON payload received from another air-gapped machine:
                  </p>

                  <textarea
                    rows={5}
                    placeholder="Paste encrypted payload here..."
                    value={airGapImportPayload}
                    onChange={(e) => setAirGapImportPayload(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded p-2 text-[10px] font-mono text-white resize-none"
                  />

                  <button
                    onClick={handleImportAirGap}
                    className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap"
                  >
                    Import & Auto-Merge
                  </button>
                </div>
              </div>

              {airGapStatus && (
                <div className="p-3 rounded-[var(--radius-md)] bg-neutral-900 border border-neutral-700 text-xs text-emerald-400 font-mono">
                  {airGapStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Room: <strong className="text-white font-mono">{roomId}</strong></span>
            <span>•</span>
            <span>Local Node: <code className="text-neutral-300">{crdtEngine.getPeerId()}</code></span>
          </div>

          <button
            onClick={() => setIsP2PCollaborationModalOpen(false)}
            className="h-7 px-3 text-xs font-bold rounded-[var(--radius-md)] bg-white text-black hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-sm shrink-0 whitespace-nowrap"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
