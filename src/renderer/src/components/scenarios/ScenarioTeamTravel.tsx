/**
 * Scenario Team Dynamics & Travel Matrix
 * Multi-Player Alternate Universe Collaboration & Travel Cadence Projections
 */

import React, { useState } from 'react'
import type { ScenarioBranch } from '../../types/scenarioWorld'
import {
  Plane,
  Users,
  UserPlus,
  Share2,
  Check,
  HeartHandshake
} from 'lucide-react'

interface ScenarioTeamTravelProps {
  branch: ScenarioBranch
  onAddPeer: (branchId: string, peerName: string, role: 'partner' | 'advisor' | 'colleague') => void
}

export const ScenarioTeamTravel: React.FC<ScenarioTeamTravelProps> = ({ branch, onAddPeer }) => {
  const [peerName, setPeerName] = useState('')
  const [peerRole, setPeerRole] = useState<'partner' | 'advisor' | 'colleague'>('partner')
  const [isCopied, setIsCopied] = useState(false)

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    if (!peerName.trim()) return
    onAddPeer(branch.id, peerName.trim(), peerRole)
    setPeerName('')
  }

  const handleCopyShareLink = () => {
    const inviteUrl = `stoa-world://${branch.crdtDocumentForkId}?room=${branch.id}&key=e2ee-multiverse`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 3000)
    }
  }

  return (
    <div className="space-y-5">
      {/* Travel Itinerary Matrix */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Simulated Travel Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Total Quarterly Travel: {branch.projections.quarterlyTravelDays} days
          </span>
        </div>

        {branch.travelSchedule.length === 0 ? (
          <div className="p-6 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            Zero long-haul travel disruptions in this universe branch. Pure local circadian stability.
          </div>
        ) : (
          <div className="space-y-2.5">
            {branch.travelSchedule.map((trip) => (
              <div
                key={trip.id}
                className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{trip.tripName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {trip.destination}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] mt-1">
                    <span>Dates: {trip.departureDate} → {trip.returnDate}</span>
                    <span>Flights: {trip.flightBlocks.join(', ')}</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[var(--text-muted)] sm:text-right shrink-0">
                  <span className="text-amber-400 font-bold">Jet Lag Score: {trip.jetLagDisruptionScore}/10</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Dynamics Matrix */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Team Dynamics & Reporting Cadence
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            {branch.teamDynamics.length} Active Stakeholder Relationships
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {branch.teamDynamics.map((td) => (
            <div
              key={td.id}
              className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">{td.name}</span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                    td.sentiment === 'energizing'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : td.sentiment === 'mentorship'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {td.sentiment}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">{td.role}</div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                <span>{td.cadence}</span>
                <span>{td.interactionHoursPerWeek}h / wk</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Player Universe Exploration & Partner Invite */}
      <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Multi-Player Alternate World Exploration
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Invite your partner, spouse, or co-founder to inspect this timeline, compare family impacts, and leave notes.
            </p>
          </div>

          <button
            onClick={handleCopyShareLink}
            className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Invite Link Copied!' : 'Copy Multi-Player Link'}</span>
          </button>
        </div>

        {/* Collaborators List */}
        <div className="flex flex-wrap items-center gap-2">
          {branch.collaborators.map((collab) => (
            <div
              key={collab.peerId}
              className="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-2 text-xs"
            >
              <div
                className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                style={{ background: collab.avatarColor }}
              >
                {collab.peerName[0]}
              </div>
              <span className="font-semibold text-[var(--text-primary)]">{collab.peerName}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">({collab.role})</span>
            </div>
          ))}
        </div>

        {/* Quick Add Partner Form */}
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-2 pt-1">
          <input
            type="text"
            value={peerName}
            onChange={(e) => setPeerName(e.target.value)}
            placeholder="Add partner name (e.g. Sarah / Co-Founder)..."
            className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none flex-1 min-w-[200px]"
          />
          <select
            value={peerRole}
            onChange={(e) => setPeerRole(e.target.value as any)}
            className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none font-mono"
          >
            <option value="partner">Partner / Spouse</option>
            <option value="advisor">Strategic Advisor</option>
            <option value="colleague">Co-Founder / Peer</option>
          </select>
          <button
            type="submit"
            disabled={!peerName.trim()}
            className="btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5 shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite to World</span>
          </button>
        </form>
      </div>
    </div>
  )
}
