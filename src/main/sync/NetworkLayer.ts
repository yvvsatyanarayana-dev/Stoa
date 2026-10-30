// Network Layer - WebSocket client for P2P signaling and sync

import WebSocket from 'ws'
import { getDeviceId, getRepo } from './AutomergeRepo'
import { syncMetadataDb, syncQueueDb } from '../db'
import { getChangesSince, applyAutomergeToSqlite } from './DocumentMappers'
import type { NetworkMessage, PeerInfo } from './types'
import { SYNC_TABLE_TYPES } from './types'

let ws: WebSocket | null = null
let reconnectAttempts = 0
let reconnectTimer: NodeJS.Timeout | null = null
let pingInterval: NodeJS.Timeout | null = null
const peers = new Map<string, PeerInfo>()
let messageHandlers: ((msg: NetworkMessage) => void)[] = []
let onStatusChange: ((status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) | null = null
let signalingUrl: string
let isShuttingDown = false

export function initializeNetworkLayer(url: string, statusCallback?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void): void {
  signalingUrl = url
  onStatusChange = statusCallback ?? null
  connect()
}

function connect(): void {
  if (isShuttingDown) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  setStatus('connecting')
  console.log('[NetworkLayer] Connecting to signaling server:', signalingUrl)

  ws = new WebSocket(signalingUrl)

  ws.on('open', () => {
    console.log('[NetworkLayer] Connected to signaling server')
    reconnectAttempts = 0
    setStatus('connected')
    sendJoin()
    startPing()
  })

  ws.on('message', (data: Buffer) => {
    try {
      const message: NetworkMessage = JSON.parse(data.toString())
      handleMessage(message)
    } catch (error) {
      console.error('[NetworkLayer] Failed to parse message:', error)
    }
  })

  ws.on('close', (code, reason) => {
    console.log('[NetworkLayer] Disconnected:', code, reason.toString())
    stopPing()
    setStatus('disconnected')
    scheduleReconnect()
  })

  ws.on('error', (error) => {
    console.error('[NetworkLayer] WebSocket error:', error)
    setStatus('error')
  })
}

function scheduleReconnect(): void {
  if (isShuttingDown) return
  if (reconnectTimer) clearTimeout(reconnectTimer)

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) + Math.random() * 1000
  reconnectAttempts++
  console.log(`[NetworkLayer] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)

  reconnectTimer = setTimeout(() => {
    connect()
  }, delay)
}

function startPing(): void {
  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      send({ type: 'ping', senderId: getDeviceId(), timestamp: Date.now(), messageId: `ping-${Date.now()}` })
    }
  }, 25000)
}

function stopPing(): void {
  if (pingInterval) {
    clearInterval(pingInterval)
    pingInterval = null
  }
}

function sendJoin(): void {
  send({
    type: 'join',
    senderId: getDeviceId(),
    timestamp: Date.now(),
    messageId: `join-${Date.now()}`,
    payload: {
      deviceId: getDeviceId(),
      documentTypes: SYNC_TABLE_TYPES
    }
  })
}

export function send(message: NetworkMessage): boolean {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
    return true
  }
  return false
}

function handleMessage(message: NetworkMessage): void {
  // Don't process our own messages
  if (message.senderId === getDeviceId()) return

  switch (message.type) {
    case 'join':
      handlePeerJoin(message)
      break
    case 'leave':
      handlePeerLeave(message)
      break
    case 'sync':
      handleSync(message)
      break
    case 'ack':
      handleAck(message)
      break
    case 'request':
      handleRequest(message)
      break
    case 'response':
      handleResponse(message)
      break
    case 'presence':
      handlePresence(message)
      break
    case 'ping':
      send({ type: 'pong', senderId: getDeviceId(), targetId: message.senderId, timestamp: Date.now(), messageId: `pong-${Date.now()}` })
      break
    case 'pong':
      // Peer is alive
      updatePeerLastSeen(message.senderId)
      break
  }

  // Call registered handlers
  for (const handler of messageHandlers) {
    handler(message)
  }
}

function handlePeerJoin(message: NetworkMessage): void {
  const peerId = message.senderId
  peers.set(peerId, {
    id: peerId,
    connectedAt: Date.now(),
    lastSeen: Date.now(),
    documentIds: message.payload?.documentTypes || []
  })
  console.log('[NetworkLayer] Peer joined:', peerId)

  // Request full sync from new peer
  requestFullSync(peerId)
}

function handlePeerLeave(message: NetworkMessage): void {
  const peerId = message.senderId
  peers.delete(peerId)
  console.log('[NetworkLayer] Peer left:', peerId)
}

function handleSync(message: NetworkMessage): void {
  // Received a sync message - apply changes from peer
  if (message.payload?.docId && message.payload?.changes) {
    applyRemoteChanges(message.payload.docId, message.payload.changes)
  }
}

function handleAck(message: NetworkMessage): void {
  // Our sync was acknowledged
  if (message.payload?.syncedQueueIds) {
    for (const id of message.payload.syncedQueueIds) {
      syncQueueDb.markSynced(id)
    }
  }
}

function handleRequest(message: NetworkMessage): void {
  if (message.payload?.type === 'fullSync') {
    sendFullSync(message.senderId)
  } else if (message.payload?.type === 'changesSince') {
    sendChangesSince(message.senderId, message.payload.since)
  }
}

function handleResponse(message: NetworkMessage): void {
  if (message.payload?.type === 'fullSync' && message.payload?.data) {
    applyAutomergeToSqlite(message.payload.data)
    syncMetadataDb.set('lastSyncTime', new Date().toISOString())
  } else if (message.payload?.type === 'changesSince' && message.payload?.data) {
    applyAutomergeToSqlite(message.payload.data)
    syncMetadataDb.set('lastSyncTime', new Date().toISOString())
  }
}

function handlePresence(message: NetworkMessage): void {
  const peer = peers.get(message.senderId)
  if (peer) {
    peer.lastSeen = Date.now()
    peer.documentIds = message.payload?.documentIds || []
  }
}

function updatePeerLastSeen(peerId: string): void {
  const peer = peers.get(peerId)
  if (peer) {
    peer.lastSeen = Date.now()
  }
}

function applyRemoteChanges(docId: string, changes: any): void {
  // Apply changes to Automerge repo
  const repo = getRepo()
  if (!repo) return

  // repo.find returns Promise<DocHandle>, need to await
  const handlePromise = repo.find(docId as any)
  handlePromise.then(handle => {
    handle.change((doc: any) => {
      // Apply the changes - this is simplified, real implementation would use Automerge.applyChanges
      Object.assign(doc, changes)
    })
  }).catch(err => {
    console.error('[NetworkLayer] Failed to apply remote changes:', err)
  })
}

function requestFullSync(peerId: string): void {
  send({
    type: 'request',
    senderId: getDeviceId(),
    targetId: peerId,
    timestamp: Date.now(),
    messageId: `req-${Date.now()}`,
    payload: { type: 'fullSync' }
  })
}

function sendFullSync(targetId: string): void {
  const data = getChangesSince('1970-01-01T00:00:00.000Z') // Full sync
  send({
    type: 'response',
    senderId: getDeviceId(),
    targetId,
    timestamp: Date.now(),
    messageId: `resp-${Date.now()}`,
    payload: { type: 'fullSync', data }
  })
}

function sendChangesSince(targetId: string, since: string): void {
  const data = getChangesSince(since)
  send({
    type: 'response',
    senderId: getDeviceId(),
    targetId,
    timestamp: Date.now(),
    messageId: `resp-${Date.now()}`,
    payload: { type: 'changesSince', data }
  })
}

export function broadcastSync(docId: string, changes: any): void {
  send({
    type: 'sync',
    senderId: getDeviceId(),
    timestamp: Date.now(),
    messageId: `sync-${Date.now()}`,
    payload: { docId, changes }
  })
}

export function broadcastPresence(documentIds: string[]): void {
  send({
    type: 'presence',
    senderId: getDeviceId(),
    timestamp: Date.now(),
    messageId: `presence-${Date.now()}`,
    payload: { documentIds }
  })
}

export function onMessage(handler: (msg: NetworkMessage) => void): () => void {
  messageHandlers.push(handler)
  return () => {
    const idx = messageHandlers.indexOf(handler)
    if (idx >= 0) messageHandlers.splice(idx, 1)
  }
}

function setStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
  if (onStatusChange) {
    onStatusChange(status)
  }
}

export function getPeers(): PeerInfo[] {
  return Array.from(peers.values())
}

export function getPeerCount(): number {
  return peers.size
}

export function isConnected(): boolean {
  return ws?.readyState === WebSocket.OPEN
}

export function forceSync(): void {
  if (isConnected()) {
    requestFullSync('broadcast')
  }
}

export async function flushSyncQueue(): Promise<number> {
  const pending = syncQueueDb.list(true)
  let flushed = 0

  for (const item of pending) {
    try {
      // Apply to local SQLite first
      applyQueueItemToSqlite(item)
      syncQueueDb.markSynced(item.id)
      flushed++
    } catch (error) {
      console.error('[NetworkLayer] Failed to flush queue item:', item.id, error)
      syncQueueDb.incrementRetry(item.id, String(error))
    }
  }

  return flushed
}

function applyQueueItemToSqlite(item: any): void {
  const db = require('../db').getDb()
  const payload = item.payload

  switch (item.type) {
    case 'create':
    case 'update':
      // Upsert
      const columns = Object.keys(payload).filter(k => k !== 'id').join(', ')
      const placeholders = Object.keys(payload).filter(k => k !== 'id').map(() => '?').join(', ')
      const values = Object.keys(payload).filter(k => k !== 'id').map(k => payload[k])

      db.prepare(`
        INSERT OR REPLACE INTO ${item.table} (${columns}) VALUES (${placeholders})
      `).run(...values)
      break
    case 'delete':
      db.prepare(`DELETE FROM ${item.table} WHERE id = ?`).run(item.entityId)
      break
  }
}

export function shutdown(): void {
  isShuttingDown = true
  stopPing()
  if (reconnectTimer) clearTimeout(reconnectTimer)
  if (ws) {
    ws.close()
    ws = null
  }
  peers.clear()
}