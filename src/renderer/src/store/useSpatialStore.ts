import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SpatialZone, FloorPlan, WhiteboardNode, WhiteboardConnection } from '../types/spatial'

interface SpatialState {
  // Floor Plans
  floorPlans: FloorPlan[]
  activeFloorPlanId: string
  zones: SpatialZone[]
  viewMode: '2d' | 'isometric' | 'whiteboard'
  zoom: number
  pan: { x: number; y: number }
  selectedZoneId: string | null
  selectedWhiteboardNodeId: string | null
  gridSnap: boolean
  isDraggingElement: boolean

  // Whiteboard Timeline Nodes & Connections
  whiteboardNodes: WhiteboardNode[]
  whiteboardConnections: WhiteboardConnection[]

  // Actions
  setActiveFloorPlanId: (id: string) => void
  setViewMode: (mode: '2d' | 'isometric' | 'whiteboard') => void
  setZoom: (zoom: number | ((prev: number) => number)) => void
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void
  resetViewport: () => void
  setSelectedZoneId: (id: string | null) => void
  setSelectedWhiteboardNodeId: (id: string | null) => void
  setGridSnap: (enabled: boolean) => void

  // Zone CRUD
  addZone: (zone: Omit<SpatialZone, 'id'>) => string
  updateZone: (id: string, updates: Partial<SpatialZone>) => void
  deleteZone: (id: string) => void
  assignEventToZone: (zoneId: string, eventId: string) => void
  unassignEventFromZone: (zoneId: string, eventId: string) => void

  // FloorPlan CRUD
  addFloorPlan: (plan: Omit<FloorPlan, 'id'>) => string
  updateFloorPlan: (id: string, updates: Partial<FloorPlan>) => void

  // Whiteboard CRUD
  addWhiteboardNode: (node: Omit<WhiteboardNode, 'id'>) => string
  updateWhiteboardNode: (id: string, updates: Partial<WhiteboardNode>) => void
  deleteWhiteboardNode: (id: string) => void
  addConnection: (conn: Omit<WhiteboardConnection, 'id'>) => string
  deleteConnection: (id: string) => void
  autoAlignNodes: () => void
}

const DEFAULT_FLOOR_PLANS: FloorPlan[] = [
  {
    id: 'fp-convention-main',
    name: 'Metropolitan Convention Grand Hall',
    venue: 'San Francisco Tech Center',
    level: 'Ground Level - Hall A',
    gridWidth: 1200,
    gridHeight: 800,
    backgroundGrid: true,
    ambientLighting: 'cyber_monochrome'
  },
  {
    id: 'fp-innovation-pavilion',
    name: 'Executive Innovation Pavilion',
    venue: 'Silicon Valley Campus',
    level: 'Level 2 - South Wing',
    gridWidth: 1000,
    gridHeight: 700,
    backgroundGrid: true,
    ambientLighting: 'dark_oled'
  }
]

const DEFAULT_ZONES: SpatialZone[] = [
  {
    id: 'zone-main-stage',
    floorPlanId: 'fp-convention-main',
    name: 'Main Keynote Stage (Orion)',
    type: 'stage',
    x: 80,
    y: 60,
    width: 420,
    height: 220,
    rotation: 0,
    capacity: 650,
    maxPowerKw: 45,
    avSpecs: ['4K Ultra-Wide LED Wall', 'Line Array Audio', 'Dual 4K PTZ Stream Cams', 'Live Teleprompters'],
    assignedEventIds: [],
    assignedExhibitor: 'Apex Global Keynote Series',
    notes: 'Primary plenary stage with direct backstage green room access.'
  },
  {
    id: 'zone-breakout-1',
    floorPlanId: 'fp-convention-main',
    name: 'Breakout Hall Alpha',
    type: 'breakout',
    x: 540,
    y: 60,
    width: 280,
    height: 180,
    rotation: 0,
    capacity: 120,
    maxPowerKw: 15,
    avSpecs: ['Dual 85-inch Monitors', 'Wireless Handheld Mics', 'Direct Zoom Room Bridge'],
    assignedEventIds: [],
    assignedExhibitor: 'Technical Workshops & Roundtables',
    notes: 'Sound-isolated acoustic partition walls.'
  },
  {
    id: 'zone-breakout-2',
    floorPlanId: 'fp-convention-main',
    name: 'Breakout Hall Beta',
    type: 'breakout',
    x: 860,
    y: 60,
    width: 280,
    height: 180,
    rotation: 0,
    capacity: 100,
    maxPowerKw: 12,
    avSpecs: ['Laser Projector 10k Lumens', 'Lavalier Wireless Mic Kit'],
    assignedEventIds: [],
    assignedExhibitor: 'Product Strategy & Architecture Labs',
    notes: 'Equipped with movable whiteboard partitions.'
  },
  {
    id: 'zone-booth-101',
    floorPlanId: 'fp-convention-main',
    name: 'Exhibition Booth #101',
    type: 'booth',
    x: 80,
    y: 340,
    width: 180,
    height: 160,
    rotation: 0,
    capacity: 25,
    maxPowerKw: 5,
    avSpecs: ['Single 55-inch Demo Display', 'Dedicated Gigabit LAN drop'],
    assignedEventIds: [],
    assignedExhibitor: 'CloudScale Infrastructure Labs',
    notes: 'Corner premium booth location with dual aisle frontage.'
  },
  {
    id: 'zone-booth-102',
    floorPlanId: 'fp-convention-main',
    name: 'Exhibition Booth #102',
    type: 'booth',
    x: 300,
    y: 340,
    width: 180,
    height: 160,
    rotation: 0,
    capacity: 25,
    maxPowerKw: 5,
    avSpecs: ['55-inch Demo Display', 'Gigabit Ethernet Drop'],
    assignedEventIds: [],
    assignedExhibitor: 'NeuralEngine AI Research',
    notes: 'Adjacent to main catering passage.'
  },
  {
    id: 'zone-vip-lounge',
    floorPlanId: 'fp-convention-main',
    name: 'Executive & Speaker Green Room',
    type: 'lounge',
    x: 520,
    y: 340,
    width: 320,
    height: 200,
    rotation: 0,
    capacity: 40,
    maxPowerKw: 8,
    avSpecs: ['Private Confidence Monitor', 'Quiet Audio Feeds', 'Catering Station'],
    assignedEventIds: [],
    assignedExhibitor: 'VIP Delegation & Press Briefings',
    notes: 'Access restricted via keycard security.'
  },
  {
    id: 'zone-networking-hall',
    floorPlanId: 'fp-convention-main',
    name: 'Central Networking & Coffee Commons',
    type: 'hall',
    x: 880,
    y: 280,
    width: 260,
    height: 280,
    rotation: 0,
    capacity: 200,
    maxPowerKw: 20,
    avSpecs: ['Background Ambient Audio System', 'Digital Schedule Kiosk'],
    assignedEventIds: [],
    assignedExhibitor: 'Barista Bar & Sponsor Lounge',
    notes: 'Open social atrium.'
  }
]

const DEFAULT_WHITEBOARD_NODES: WhiteboardNode[] = [
  {
    id: 'wb-node-1',
    title: 'Registration & Badge Collection',
    type: 'milestone',
    x: 60,
    y: 120,
    width: 200,
    height: 90,
    color: '#a1a1aa',
    timeStart: '08:00',
    timeEnd: '09:00',
    description: 'Welcome reception, NFC lanyard distribution and morning coffee.',
    status: 'completed'
  },
  {
    id: 'wb-node-2',
    title: 'AV & Technical Soundcheck',
    type: 'tech_check',
    x: 60,
    y: 260,
    width: 200,
    height: 90,
    color: '#71717a',
    timeStart: '08:15',
    timeEnd: '08:45',
    description: 'Verify wireless frequency spectrum, teleprompter feed and stream uplink.',
    status: 'completed'
  },
  {
    id: 'wb-node-3',
    title: 'Opening Vision Keynote',
    type: 'session',
    x: 340,
    y: 150,
    width: 260,
    height: 120,
    color: '#ffffff',
    timeStart: '09:00',
    timeEnd: '10:15',
    speaker: 'Dr. Evelyn Vance & Leadership',
    description: 'Strategic roadmap, breakthrough AI runtime and operational milestones.',
    status: 'in_progress'
  },
  {
    id: 'wb-node-4',
    title: 'Stage Audio Handover & Video Roll',
    type: 'cue',
    x: 680,
    y: 80,
    width: 220,
    height: 85,
    color: '#d4d4d8',
    timeStart: '10:15',
    timeEnd: '10:20',
    description: 'Play intro stinger video while mic pack transition takes place.',
    status: 'pending'
  },
  {
    id: 'wb-node-5',
    title: 'Deep-Dive Architecture Panels',
    type: 'session',
    x: 680,
    y: 220,
    width: 250,
    height: 110,
    color: '#e4e4e7',
    timeStart: '10:30',
    timeEnd: '11:45',
    speaker: 'Engineering Core Team',
    description: 'Zero-latency sync protocol, peer topologies and security model.',
    status: 'pending'
  },
  {
    id: 'wb-node-6',
    title: 'Note: VIP Press Briefing at 11:00',
    type: 'sticky',
    x: 980,
    y: 130,
    width: 180,
    height: 100,
    color: '#27272a',
    description: 'Remember to reserve Green Room 2 for private Q&A embargo interviews.',
    status: 'pending'
  }
]

const DEFAULT_CONNECTIONS: WhiteboardConnection[] = [
  {
    id: 'conn-1',
    sourceNodeId: 'wb-node-1',
    targetNodeId: 'wb-node-3',
    label: 'Attendees Seated',
    type: 'dependency'
  },
  {
    id: 'conn-2',
    sourceNodeId: 'wb-node-2',
    targetNodeId: 'wb-node-3',
    label: 'Stage Ready',
    type: 'dependency'
  },
  {
    id: 'conn-3',
    sourceNodeId: 'wb-node-3',
    targetNodeId: 'wb-node-4',
    label: 'Immediate Stinger',
    type: 'cue' as any
  },
  {
    id: 'conn-4',
    sourceNodeId: 'wb-node-4',
    targetNodeId: 'wb-node-5',
    label: 'Next Track Cue',
    type: 'handover'
  }
]

export const useSpatialStore = create<SpatialState>()(
  persist(
    (set, get) => ({
      floorPlans: DEFAULT_FLOOR_PLANS,
      activeFloorPlanId: 'fp-convention-main',
      zones: DEFAULT_ZONES,
      viewMode: '2d',
      zoom: 1,
      pan: { x: 0, y: 0 },
      selectedZoneId: null,
      selectedWhiteboardNodeId: null,
      gridSnap: true,
      isDraggingElement: false,

      whiteboardNodes: DEFAULT_WHITEBOARD_NODES,
      whiteboardConnections: DEFAULT_CONNECTIONS,

      setActiveFloorPlanId: (id) => set({ activeFloorPlanId: id, selectedZoneId: null }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setZoom: (zoom) =>
        set((state) => ({
          zoom: Math.min(2.5, Math.max(0.4, typeof zoom === 'function' ? zoom(state.zoom) : zoom))
        })),
      setPan: (pan) =>
        set((state) => ({
          pan: typeof pan === 'function' ? pan(state.pan) : pan
        })),
      resetViewport: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
      setSelectedZoneId: (id) => set({ selectedZoneId: id }),
      setSelectedWhiteboardNodeId: (id) => set({ selectedWhiteboardNodeId: id }),
      setGridSnap: (enabled) => set({ gridSnap: enabled }),

      addZone: (zoneData) => {
        const id = `zone-${Date.now()}`
        const newZone: SpatialZone = { ...zoneData, id }
        set((state) => ({ zones: [...state.zones, newZone], selectedZoneId: id }))
        return id
      },

      updateZone: (id, updates) => {
        set((state) => ({
          zones: state.zones.map((z) => (z.id === id ? { ...z, ...updates } : z))
        }))
      },

      deleteZone: (id) => {
        set((state) => ({
          zones: state.zones.filter((z) => z.id !== id),
          selectedZoneId: state.selectedZoneId === id ? null : state.selectedZoneId
        }))
      },

      assignEventToZone: (zoneId, eventId) => {
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === zoneId && !z.assignedEventIds.includes(eventId)
              ? { ...z, assignedEventIds: [...z.assignedEventIds, eventId] }
              : z
          )
        }))
      },

      unassignEventFromZone: (zoneId, eventId) => {
        set((state) => ({
          zones: state.zones.map((z) =>
            z.id === zoneId
              ? { ...z, assignedEventIds: z.assignedEventIds.filter((id) => id !== eventId) }
              : z
          )
        }))
      },

      addFloorPlan: (planData) => {
        const id = `fp-${Date.now()}`
        const newPlan: FloorPlan = { ...planData, id }
        set((state) => ({
          floorPlans: [...state.floorPlans, newPlan],
          activeFloorPlanId: id
        }))
        return id
      },

      updateFloorPlan: (id, updates) => {
        set((state) => ({
          floorPlans: state.floorPlans.map((fp) => (fp.id === id ? { ...fp, ...updates } : fp))
        }))
      },

      addWhiteboardNode: (nodeData) => {
        const id = `wb-${Date.now()}`
        const newNode: WhiteboardNode = { ...nodeData, id }
        set((state) => ({
          whiteboardNodes: [...state.whiteboardNodes, newNode],
          selectedWhiteboardNodeId: id
        }))
        return id
      },

      updateWhiteboardNode: (id, updates) => {
        set((state) => ({
          whiteboardNodes: state.whiteboardNodes.map((n) => (n.id === id ? { ...n, ...updates } : n))
        }))
      },

      deleteWhiteboardNode: (id) => {
        set((state) => ({
          whiteboardNodes: state.whiteboardNodes.filter((n) => n.id !== id),
          whiteboardConnections: state.whiteboardConnections.filter(
            (c) => c.sourceNodeId !== id && c.targetNodeId !== id
          ),
          selectedWhiteboardNodeId: state.selectedWhiteboardNodeId === id ? null : state.selectedWhiteboardNodeId
        }))
      },

      addConnection: (connData) => {
        const id = `conn-${Date.now()}`
        const newConn: WhiteboardConnection = { ...connData, id }
        set((state) => ({
          whiteboardConnections: [...state.whiteboardConnections, newConn]
        }))
        return id
      },

      deleteConnection: (id) => {
        set((state) => ({
          whiteboardConnections: state.whiteboardConnections.filter((c) => c.id !== id)
        }))
      },

      autoAlignNodes: () => {
        const nodes = [...get().whiteboardNodes]
        nodes.sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''))
        let currentX = 60
        const updated = nodes.map((node, idx) => {
          const y = 140 + (idx % 2 === 0 ? 0 : 160)
          const nodeWithPos = { ...node, x: currentX, y }
          currentX += (node.width || 220) + 70
          return nodeWithPos
        })
        set({ whiteboardNodes: updated })
      }
    }),
    {
      name: 'chronodesk_spatial_store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
