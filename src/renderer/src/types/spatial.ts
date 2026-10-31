// Spatial Canvas & 3D Floor Plan Types
export type SpatialZoneType = 'stage' | 'booth' | 'hall' | 'lounge' | 'breakout' | 'room'

export interface SpatialZone {
  id: string
  floorPlanId: string
  name: string
  type: SpatialZoneType
  x: number // grid units or px
  y: number
  width: number
  height: number
  rotation?: number // in degrees: 0, 90, 180, 270
  capacity: number
  maxPowerKw?: number
  avSpecs: string[] // e.g. ['4K LED Wall', 'Wireless Mic x4', 'Live Streaming Rig', 'VR Headsets']
  color?: string
  assignedEventIds: string[]
  assignedExhibitor?: string
  notes?: string
}

export interface FloorPlan {
  id: string
  name: string
  venue: string
  level: string
  gridWidth: number
  gridHeight: number
  backgroundGrid: boolean
  ambientLighting: 'studio_neutral' | 'warm_expo' | 'cyber_monochrome' | 'dark_oled'
}

export interface WhiteboardNode {
  id: string
  title: string
  type: 'session' | 'milestone' | 'cue' | 'tech_check' | 'sticky'
  x: number
  y: number
  width: number
  height: number
  color?: string
  description?: string
  timeStart?: string
  timeEnd?: string
  speaker?: string
  trackId?: string
  linkedEventId?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed'
}

export interface WhiteboardConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label?: string
  type: 'dependency' | 'handover' | 'stream'
}
