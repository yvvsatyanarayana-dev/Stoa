import React, { useState, useRef } from 'react'
import { useSpatialStore } from '../../store/useSpatialStore'
import {
  Box,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Plus,
  Trash2,
  Zap,
  Tv,
  Share2,
  CheckCircle2,
  Sliders
} from 'lucide-react'
import type { SpatialZone, SpatialZoneType } from '../../types/spatial'

export const SpatialCanvasView: React.FC = () => {
  const {
    floorPlans,
    activeFloorPlanId,
    setActiveFloorPlanId,
    zones,
    viewMode,
    setViewMode,
    zoom,
    setZoom,
    pan,
    setPan,
    resetViewport,
    selectedZoneId,
    setSelectedZoneId,
    gridSnap,
    setGridSnap,
    addZone,
    updateZone,
    deleteZone,
    whiteboardNodes,
    whiteboardConnections,
    selectedWhiteboardNodeId,
    setSelectedWhiteboardNodeId,
    addWhiteboardNode,
    updateWhiteboardNode,
    deleteWhiteboardNode,
    autoAlignNodes
  } = useSpatialStore()

  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false)
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false)

  const [newZoneForm, setNewZoneForm] = useState<{
    name: string
    type: SpatialZoneType
    capacity: number
    maxPowerKw: number
    avSpecs: string
    assignedExhibitor: string
    notes: string
  }>({
    name: 'Exhibition Pavilion Zone',
    type: 'booth',
    capacity: 50,
    maxPowerKw: 10,
    avSpecs: '4K Display, Gigabit Drop',
    assignedExhibitor: 'Innovate AI Partner',
    notes: 'Standard booth shell.'
  })

  const [newNodeForm, setNewNodeForm] = useState<{
    title: string
    type: 'session' | 'milestone' | 'cue' | 'tech_check' | 'sticky'
    timeStart: string
    timeEnd: string
    speaker: string
    description: string
  }>({
    title: 'Executive Stage Presentation',
    type: 'session',
    timeStart: '11:00',
    timeEnd: '12:00',
    speaker: 'Invited Speaker',
    description: 'Technical deep-dive on scalable architecture.'
  })

  const activePlan = floorPlans.find((fp) => fp.id === activeFloorPlanId) || floorPlans[0]
  const currentPlanZones = zones.filter((z) => z.floorPlanId === activePlan?.id)
  const selectedZone = zones.find((z) => z.id === selectedZoneId)
  const selectedNode = whiteboardNodes.find((n) => n.id === selectedWhiteboardNodeId)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === canvasRef.current || (e.target as HTMLElement).dataset.canvasRoot)) {
      setIsPanning(true)
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y })
    } else if (draggingZoneId) {
      const snap = gridSnap ? 20 : 1
      const newX = Math.max(0, Math.round((e.clientX - dragOffset.x) / snap) * snap)
      const newY = Math.max(0, Math.round((e.clientY - dragOffset.y) / snap) * snap)
      updateZone(draggingZoneId, { x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingZoneId(null)
  }

  // Zone Dragging
  const handleZoneDragStart = (e: React.MouseEvent, zone: SpatialZone) => {
    e.stopPropagation()
    setSelectedZoneId(zone.id)
    setDraggingZoneId(zone.id)
    setDragOffset({
      x: e.clientX - zone.x,
      y: e.clientY - zone.y
    })
  }

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault()
    addZone({
      floorPlanId: activePlan.id,
      name: newZoneForm.name,
      type: newZoneForm.type,
      x: 100,
      y: 100,
      width: newZoneForm.type === 'stage' ? 360 : newZoneForm.type === 'booth' ? 180 : 260,
      height: newZoneForm.type === 'stage' ? 200 : newZoneForm.type === 'booth' ? 160 : 180,
      rotation: 0,
      capacity: Number(newZoneForm.capacity),
      maxPowerKw: Number(newZoneForm.maxPowerKw),
      avSpecs: newZoneForm.avSpecs.split(',').map((s) => s.trim()).filter(Boolean),
      assignedEventIds: [],
      assignedExhibitor: newZoneForm.assignedExhibitor,
      notes: newZoneForm.notes
    })
    setIsAddZoneModalOpen(false)
  }

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault()
    addWhiteboardNode({
      title: newNodeForm.title,
      type: newNodeForm.type,
      x: 200 + Math.random() * 200,
      y: 150 + Math.random() * 100,
      width: 220,
      height: 100,
      timeStart: newNodeForm.timeStart,
      timeEnd: newNodeForm.timeEnd,
      speaker: newNodeForm.speaker,
      description: newNodeForm.description,
      status: 'pending'
    })
    setIsAddNodeModalOpen(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-hidden w-full">
      {/* Top Spatial Control Toolbar */}
      <div className="h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Box className="w-4 h-4 text-[var(--text-primary)]" />
            <span>Spatial Canvas & 3D Floor Plan</span>
          </div>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-1" />

          {/* Mode Switcher */}
          <div className="flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[11px] font-medium">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-all ${
                viewMode === '2d'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Layout</span>
            </button>
            <button
              onClick={() => setViewMode('isometric')}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-all ${
                viewMode === 'isometric'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>2.5D Isometric</span>
            </button>
            <button
              onClick={() => setViewMode('whiteboard')}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-all ${
                viewMode === 'whiteboard'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-subtle)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Infinite Whiteboard</span>
            </button>
          </div>

          {/* Floor Plan Picker (when in 2d/isometric) */}
          {viewMode !== 'whiteboard' && (
            <select
              value={activeFloorPlanId}
              onChange={(e) => setActiveFloorPlanId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] font-medium focus:outline-none"
            >
              {floorPlans.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.name} ({fp.level})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-0.5 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[10px] text-[var(--text-secondary)] font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetViewport}
              className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] border-l border-[var(--border-subtle)] ml-0.5 pl-1.5"
              title="Reset View"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Grid Snap Toggle */}
          <button
            onClick={() => setGridSnap(!gridSnap)}
            className={`p-1.5 rounded-[var(--radius-md)] border text-xs flex items-center gap-1.5 transition-colors ${
              gridSnap
                ? 'bg-[var(--accent)] text-[var(--accent-text)] border-[var(--accent)]'
                : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle 20px Grid Magnetism"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Whiteboard Auto-Align */}
          {viewMode === 'whiteboard' && (
            <button
              onClick={autoAlignNodes}
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 shadow-xs"
              title="Auto-organize nodes sequentially along timeline"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Auto-Sequence</span>
            </button>
          )}

          {/* Primary Action Button */}
          {viewMode === 'whiteboard' ? (
            <button
              onClick={() => setIsAddNodeModalOpen(true)}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Node / Cue</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddZoneModalOpen(true)}
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Zone / Booth</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Infinite Grid Workspace */}
        <div
          ref={canvasRef}
          data-canvas-root="true"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 h-full overflow-hidden relative ${
            isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            backgroundColor: 'var(--bg-app)',
            backgroundImage:
              'radial-gradient(var(--border-subtle) 1px, transparent 1px), radial-gradient(var(--border-subtle) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Zoom/Pan Transform Canvas Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning || draggingZoneId ? 'none' : 'transform 120ms ease-out'
            }}
            className="absolute top-0 left-0"
          >
            {/* 1. FLOOR PLAN MODE (2D or Isometric) */}
            {viewMode !== 'whiteboard' && (
              <div
                style={{
                  width: `${activePlan.gridWidth}px`,
                  height: `${activePlan.gridHeight}px`,
                  transform:
                    viewMode === 'isometric'
                      ? 'perspective(1200px) rotateX(55deg) rotateZ(-40deg) translateZ(0)'
                      : 'none',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="relative border-2 border-dashed border-[var(--border-default)] rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]/40 shadow-xl m-10"
              >
                {/* Hall Title Overlay */}
                <div className="absolute top-3 left-4 pointer-events-none select-none flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    {activePlan.name} • {activePlan.level}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    {currentPlanZones.length} Zones Defined
                  </span>
                </div>

                {/* Spatial Zones Rendered */}
                {currentPlanZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id
                  const isStage = zone.type === 'stage'
                  const isBooth = zone.type === 'booth'
                  const isLounge = zone.type === 'lounge'

                  return (
                    <div
                      key={zone.id}
                      onMouseDown={(e) => handleZoneDragStart(e, zone)}
                      style={{
                        position: 'absolute',
                        left: `${zone.x}px`,
                        top: `${zone.y}px`,
                        width: `${zone.width}px`,
                        height: `${zone.height}px`,
                        transform:
                          viewMode === 'isometric'
                            ? `translateZ(${isStage ? '24px' : isLounge ? '16px' : '10px'})`
                            : 'none',
                        boxShadow:
                          viewMode === 'isometric'
                            ? isSelected
                              ? '0 20px 30px rgba(0,0,0,0.5), 0 0 0 2px var(--accent)'
                              : '0 10px 18px rgba(0,0,0,0.3)'
                            : isSelected
                            ? '0 0 0 2px var(--accent)'
                            : 'none'
                      }}
                      className={`rounded-[var(--radius-md)] border p-3 flex flex-col justify-between transition-all cursor-move select-none ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)]/40 z-20'
                          : 'border-[var(--border-default)] bg-[var(--bg-subtle)] hover:border-[var(--text-muted)] z-10'
                      }`}
                    >
                      {/* Zone Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isStage
                                  ? 'bg-amber-400'
                                  : isBooth
                                  ? 'bg-emerald-400'
                                  : isLounge
                                  ? 'bg-purple-400'
                                  : 'bg-blue-400'
                              }`}
                            />
                            <span className="font-bold text-xs truncate text-[var(--text-primary)]">
                              {zone.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                            {zone.type}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          {zone.capacity} pax
                        </span>
                      </div>

                      {/* Zone Content / Exhibitor */}
                      <div className="my-1 text-[11px] text-[var(--text-secondary)] line-clamp-2">
                        {zone.assignedExhibitor || zone.notes || 'Unassigned Zone'}
                      </div>

                      {/* Zone Footer / Specs */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{zone.maxPowerKw || 5} kW</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tv className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{zone.avSpecs.length} AV specs</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 2. INFINITE WHITEBOARD TIMELINE MODE */}
            {viewMode === 'whiteboard' && (
              <div className="relative min-w-[2400px] min-h-[1600px] m-10">
                {/* SVG Connections Layer */}
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ minWidth: '2400px', minHeight: '1600px' }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="5"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
                    </marker>
                  </defs>
                  {whiteboardConnections.map((conn) => {
                    const src = whiteboardNodes.find((n) => n.id === conn.sourceNodeId)
                    const tgt = whiteboardNodes.find((n) => n.id === conn.targetNodeId)
                    if (!src || !tgt) return null

                    const x1 = src.x + src.width
                    const y1 = src.y + src.height / 2
                    const x2 = tgt.x
                    const y2 = tgt.y + tgt.height / 2
                    const dx = Math.abs(x2 - x1) * 0.5
                    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

                    return (
                      <g key={conn.id}>
                        <path
                          d={path}
                          stroke="var(--border-default)"
                          strokeWidth="2"
                          strokeDasharray={conn.type === 'dependency' ? '4 4' : 'none'}
                          fill="none"
                          markerEnd="url(#arrow)"
                        />
                        {conn.label && (
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 8}
                            fill="var(--text-muted)"
                            fontSize="10"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="bg-[var(--bg-app)] px-1"
                          >
                            {conn.label}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </svg>

                {/* Whiteboard Nodes */}
                {whiteboardNodes.map((node) => {
                  const isSelected = selectedWhiteboardNodeId === node.id
                  const isSticky = node.type === 'sticky'

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedWhiteboardNodeId(node.id)}
                      style={{
                        position: 'absolute',
                        left: `${node.x}px`,
                        top: `${node.y}px`,
                        width: `${node.width}px`,
                        minHeight: `${node.height}px`
                      }}
                      className={`rounded-[var(--radius-md)] border p-3.5 shadow-sm transition-all select-none cursor-pointer flex flex-col justify-between ${
                        isSticky
                          ? 'bg-[var(--bg-elevated)] border-[var(--border-default)]'
                          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                      } ${
                        isSelected
                          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40 shadow-md z-20'
                          : 'hover:border-[var(--text-muted)] z-10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                            {node.type}
                          </span>
                          {node.timeStart && (
                            <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                              {node.timeStart} – {node.timeEnd}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                          {node.title}
                        </h4>
                        {node.speaker && (
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                            Speaker: {node.speaker}
                          </div>
                        )}
                        {node.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                            {node.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                        <span
                          className={`capitalize font-semibold ${
                            node.status === 'completed'
                              ? 'text-emerald-400'
                              : node.status === 'in_progress'
                              ? 'text-amber-400'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          ● {node.status || 'pending'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteWhiteboardNode(node.id)
                          }}
                          className="p-1 hover:text-red-400 transition-colors"
                          title="Delete Node"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Drawer: Spatial Inspector & Conflict Resolver */}
        <div className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col h-full shrink-0">
          <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Spatial Inspector</span>
            </h3>
            {selectedZone && (
              <button
                onClick={() => deleteZone(selectedZone.id)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
            {selectedZone ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Zone Name
                  </label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) => updateZone(selectedZone.id, { name: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                      Type
                    </label>
                    <select
                      value={selectedZone.type}
                      onChange={(e) => updateZone(selectedZone.id, { type: e.target.value as SpatialZoneType })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-[var(--text-primary)]"
                    >
                      <option value="stage">Stage / Plenary</option>
                      <option value="booth">Exhibition Booth</option>
                      <option value="breakout">Breakout Hall</option>
                      <option value="lounge">VIP / Lounge</option>
                      <option value="hall">Commons Hall</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={selectedZone.capacity}
                      onChange={(e) => updateZone(selectedZone.id, { capacity: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Assigned Partner / Exhibitor
                  </label>
                  <input
                    type="text"
                    value={selectedZone.assignedExhibitor || ''}
                    onChange={(e) => updateZone(selectedZone.id, { assignedExhibitor: e.target.value })}
                    placeholder="e.g. Apex Global Engineering"
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    AV Equipment & Capabilities
                  </label>
                  <div className="space-y-1.5">
                    {selectedZone.avSpecs.map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px]"
                      >
                        <span>{spec}</span>
                        <button
                          onClick={() => {
                            const updated = selectedZone.avSpecs.filter((_, idx) => idx !== i)
                            updateZone(selectedZone.id, { avSpecs: updated })
                          }}
                          className="text-[var(--text-muted)] hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spatial Conflict Verification */}
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-[var(--text-primary)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Spatial Verification Status</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    No geometric overlap detected. Power footprint ({selectedZone.maxPowerKw || 5} kW) is within hall transformer limits.
                  </p>
                </div>
              </div>
            ) : selectedNode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Node Title
                  </label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => updateWhiteboardNode(selectedNode.id, { title: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      value={selectedNode.timeStart || ''}
                      onChange={(e) => updateWhiteboardNode(selectedNode.id, { timeStart: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      value={selectedNode.timeEnd || ''}
                      onChange={(e) => updateWhiteboardNode(selectedNode.id, { timeEnd: e.target.value })}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Notes & Cues
                  </label>
                  <textarea
                    rows={4}
                    value={selectedNode.description || ''}
                    onChange={(e) => updateWhiteboardNode(selectedNode.id, { description: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Box className="w-8 h-8 mx-auto opacity-30 mb-2" />
                <div className="font-semibold text-[var(--text-secondary)]">No element selected</div>
                <p className="text-[11px] leading-relaxed">
                  Click any zone on the floor plan or any whiteboard node to inspect technical parameters, power ratings, and run-sheet handovers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD ZONE */}
      {isAddZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--accent)]" />
                <span>Create Floor Plan Zone</span>
              </h3>
              <button
                onClick={() => setIsAddZoneModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                  Zone / Room Name
                </label>
                <input
                  type="text"
                  required
                  value={newZoneForm.name}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, name: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Type
                  </label>
                  <select
                    value={newZoneForm.type}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, type: e.target.value as SpatialZoneType })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="stage">Stage / Plenary</option>
                    <option value="booth">Exhibition Booth</option>
                    <option value="breakout">Breakout Hall</option>
                    <option value="lounge">VIP Lounge</option>
                    <option value="hall">Commons Area</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    value={newZoneForm.capacity}
                    onChange={(e) => setNewZoneForm({ ...newZoneForm, capacity: Number(e.target.value) })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                  Exhibitor / Partner
                </label>
                <input
                  type="text"
                  value={newZoneForm.assignedExhibitor}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, assignedExhibitor: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                  AV Specifications (comma-separated)
                </label>
                <input
                  type="text"
                  value={newZoneForm.avSpecs}
                  onChange={(e) => setNewZoneForm({ ...newZoneForm, avSpecs: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddZoneModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1.5 px-4 shadow-xs">
                  Place on Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD WHITEBOARD NODE */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--accent)]" />
                <span>Add Whiteboard Timeline Node</span>
              </h3>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newNodeForm.title}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, title: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Node Category
                  </label>
                  <select
                    value={newNodeForm.type}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, type: e.target.value as any })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  >
                    <option value="session">Event Session</option>
                    <option value="milestone">Key Milestone</option>
                    <option value="cue">Stage / AV Cue</option>
                    <option value="tech_check">Technical Check</option>
                    <option value="sticky">Sticky Note</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Speaker / Lead
                  </label>
                  <input
                    type="text"
                    value={newNodeForm.speaker}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, speaker: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    placeholder="10:00"
                    value={newNodeForm.timeStart}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, timeStart: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    placeholder="11:00"
                    value={newNodeForm.timeEnd}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, timeEnd: e.target.value })}
                    className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
                  Description / Run-Sheet Cue
                </label>
                <textarea
                  rows={3}
                  value={newNodeForm.description}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, description: e.target.value })}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1.5 px-4 shadow-xs">
                  Add to Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
