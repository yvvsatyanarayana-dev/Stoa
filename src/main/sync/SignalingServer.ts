// Signaling Server - Embedded WebSocket server for development P2P signaling

import WebSocket, { WebSocketServer } from 'ws'
import { app } from 'electron'
import { randomUUID } from 'crypto'

interface ConnectedClient {
  ws: WebSocket
  id: string
  documentTypes: string[]
  joinedAt: number
  lastPing: number
}

const clients = new Map<string, ConnectedClient>()
let wss: WebSocketServer | null = null

export function startSignalingServer(port: number = 8765): Promise<void> {
  return new Promise((resolve, reject) => {
    wss = new WebSocketServer({ port })

    wss.on('listening', () => {
      console.log(`[SignalingServer] Started on ws://localhost:${port}`)
      resolve()
    })

    wss.on('error', (error) => {
      console.error('[SignalingServer] Error:', error)
      reject(error)
    })

    wss.on('connection', (ws, req) => {
      const clientId = `client-${Date.now()}-${randomUUID().slice(0, 8)}`
      console.log(`[SignalingServer] New connection: ${clientId} from ${req.socket.remoteAddress}`)

      const client: ConnectedClient = {
        ws,
        id: clientId,
        documentTypes: [],
        joinedAt: Date.now(),
        lastPing: Date.now()
      }
      clients.set(clientId, client)

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          handleClientMessage(clientId, message)
        } catch (error) {
          console.error('[SignalingServer] Failed to parse message:', error)
        }
      })

      ws.on('close', () => {
        handleClientDisconnect(clientId)
      })

      ws.on('error', (error) => {
        console.error(`[SignalingServer] Client ${clientId} error:`, error)
      })

      // Send welcome
      ws.send(JSON.stringify({
        type: 'welcome',
        senderId: 'server',
        timestamp: Date.now(),
        messageId: `welcome-${Date.now()}`,
        payload: { clientId, serverTime: Date.now() }
      }))
    })
  })
}

function handleClientMessage(clientId: string, message: any): void {
  const client = clients.get(clientId)
  if (!client) return

  switch (message.type) {
    case 'join':
      client.documentTypes = message.payload?.documentTypes || []
      broadcastToOthers(clientId, {
        type: 'join',
        senderId: clientId,
        timestamp: Date.now(),
        messageId: `join-${Date.now()}`,
        payload: { documentTypes: client.documentTypes }
      })
      break

    case 'leave':
      broadcastToOthers(clientId, {
        type: 'leave',
        senderId: clientId,
        timestamp: Date.now(),
        messageId: `leave-${Date.now()}`
      })
      break

    case 'sync':
      broadcastToOthers(clientId, message)
      break

    case 'request':
      if (message.targetId) {
        sendToClient(message.targetId, message)
      } else {
        broadcastToOthers(clientId, message)
      }
      break

    case 'response':
      if (message.targetId) {
        sendToClient(message.targetId, message)
      }
      break

    case 'presence':
      client.documentTypes = message.payload?.documentIds || []
      broadcastToOthers(clientId, message)
      break

    case 'ping':
      client.lastPing = Date.now()
      sendToClient(clientId, {
        type: 'pong',
        senderId: 'server',
        targetId: clientId,
        timestamp: Date.now(),
        messageId: `pong-${Date.now()}`
      })
      break
  }
}

function handleClientDisconnect(clientId: string): void {
  const client = clients.get(clientId)
  if (client) {
    broadcastToOthers(clientId, {
      type: 'leave',
      senderId: clientId,
      timestamp: Date.now(),
      messageId: `leave-${Date.now()}`
    })
    clients.delete(clientId)
    console.log(`[SignalingServer] Client disconnected: ${clientId}`)
  }
}

function broadcastToOthers(excludeId: string, message: any): void {
  for (const [id, client] of clients) {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }
}

function sendToClient(targetId: string, message: any): void {
  const client = clients.get(targetId)
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message))
  }
}

export function broadcastToAll(message: any): void {
  for (const [, client] of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }
}

export function getConnectedClients(): Array<{ id: string; documentTypes: string[]; joinedAt: number }> {
  return Array.from(clients.values()).map(c => ({
    id: c.id,
    documentTypes: c.documentTypes,
    joinedAt: c.joinedAt
  }))
}

export function stopSignalingServer(): void {
  if (wss) {
    for (const client of clients.values()) {
      client.ws.close()
    }
    clients.clear()
    wss.close()
    wss = null
    console.log('[SignalingServer] Stopped')
  }
}

export function isSignalingServerRunning(): boolean {
  return wss !== null
}

// Auto-start in development
if (!app.isPackaged) {
  startSignalingServer().catch(console.error)
}