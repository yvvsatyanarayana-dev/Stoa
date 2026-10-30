import React, { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  Building2,
  Stethoscope,
  GraduationCap
} from 'lucide-react'

export interface WorkspaceProfile {
  id: string
  name: string
  icon: string
  domain: string
  color: string
  company_name: string
  company_footer: string
  working_hours_start: string
  working_hours_end: string
  is_default?: boolean
}

export const DEFAULT_PROFILES: WorkspaceProfile[] = [
  {
    id: 'prof-enterprise',
    name: 'Enterprise Operations',
    icon: 'building',
    domain: 'Operations & Project Management',
    color: '#3b82f6',
    company_name: 'Apex Global Enterprise',
    company_footer: 'Corporate & Confidential • Internal Use Only',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    is_default: true
  },
  {
    id: 'prof-medical',
    name: 'Clinical Medical Center',
    icon: 'medical',
    domain: 'Healthcare & Shift Coverage',
    color: '#10b981',
    company_name: 'Metro Health & Trauma Center',
    company_footer: 'HIPAA Protected Health Information • Restricted Access',
    working_hours_start: '07:00',
    working_hours_end: '19:00',
    is_default: true
  },
  {
    id: 'prof-academic',
    name: 'Academic & Research Campus',
    icon: 'academic',
    domain: 'Higher Education & Lab Rotations',
    color: '#8b5cf6',
    company_name: 'Institute of Science & Technology',
    company_footer: 'Academic Year 2026-2027 • Faculty & Student Run-sheets',
    working_hours_start: '08:30',
    working_hours_end: '17:30',
    is_default: true
  },
  {
    id: 'prof-executive',
    name: 'Executive Advisory & Board',
    icon: 'briefcase',
    domain: 'Strategic Advisory & Governance',
    color: '#f59e0b',
    company_name: 'Vanguard Advisory Partners',
    company_footer: 'Board of Directors • Strictly Private & Privileged',
    working_hours_start: '10:00',
    working_hours_end: '17:00',
    is_default: true
  }
]

export const WorkspaceProfilesManager: React.FC = () => {
  const { activeProfileId, setActiveProfileId, updateSetting } = useAppStore()

  const [profiles, setProfiles] = useState<WorkspaceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('chronodesk_workspace_profiles')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_PROFILES
  })

  const [editingProfile, setEditingProfile] = useState<Partial<WorkspaceProfile> | null>(null)

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0]

  const handleSelectProfile = async (profile: WorkspaceProfile) => {
    setActiveProfileId(profile.id)
    try {
      localStorage.setItem('chronodesk_active_profile_id', profile.id)
      await updateSetting('company_name', profile.company_name)
      await updateSetting('company_footer', profile.company_footer)
    } catch {}
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile || !editingProfile.name) return

    let updated: WorkspaceProfile[]
    if (editingProfile.id) {
      updated = profiles.map((p) => (p.id === editingProfile.id ? ({ ...p, ...editingProfile } as WorkspaceProfile) : p))
    } else {
      const newP: WorkspaceProfile = {
        id: `prof-${Date.now()}`,
        name: editingProfile.name,
        icon: editingProfile.icon || 'building',
        domain: editingProfile.domain || 'General Workspace',
        color: editingProfile.color || '#3b82f6',
        company_name: editingProfile.company_name || editingProfile.name,
        company_footer: editingProfile.company_footer || 'Confidential Schedule',
        working_hours_start: editingProfile.working_hours_start || '09:00',
        working_hours_end: editingProfile.working_hours_end || '18:00'
      }
      updated = [...profiles, newP]
    }

    setProfiles(updated)
    try {
      localStorage.setItem('chronodesk_workspace_profiles', JSON.stringify(updated))
    } catch {}
    setEditingProfile(null)
  }

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return
    const updated = profiles.filter((p) => p.id !== id)
    setProfiles(updated)
    try {
      localStorage.setItem('chronodesk_workspace_profiles', JSON.stringify(updated))
      if (activeProfileId === id) {
        handleSelectProfile(updated[0])
      }
    } catch {}
  }

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'medical':
        return <Stethoscope className="w-4 h-4 text-emerald-400" />
      case 'academic':
        return <GraduationCap className="w-4 h-4 text-purple-400" />
      case 'briefcase':
        return <Briefcase className="w-4 h-4 text-amber-400" />
      default:
        return <Building2 className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Profile Banner */}
      <div className="card p-5 border-l-4 shadow-xs" style={{ borderLeftColor: activeProfile.color }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: `${activeProfile.color}20`, color: activeProfile.color }}
            >
              {renderIcon(activeProfile.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {activeProfile.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Profile
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {activeProfile.domain} • Operating Hours: {activeProfile.working_hours_start} – {activeProfile.working_hours_end}
              </p>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-[var(--text-muted)] hidden md:block">
            <div className="font-semibold text-[var(--text-secondary)]">{activeProfile.company_name}</div>
            <div className="text-[10px] opacity-75 truncate max-w-xs">{activeProfile.company_footer}</div>
          </div>
        </div>
      </div>

      {/* Profiles Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Available Workspace Profiles
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Switch between isolated profiles with separate company branding, hours, and domains.
            </p>
          </div>

          <button
            onClick={() =>
              setEditingProfile({
                name: '',
                icon: 'building',
                domain: '',
                color: '#3b82f6',
                company_name: '',
                company_footer: '',
                working_hours_start: '09:00',
                working_hours_end: '18:00'
              })
            }
            className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map((prof) => {
            const isSelected = prof.id === activeProfile.id

            return (
              <div
                key={prof.id}
                className={`p-4 rounded-[var(--radius-md)] border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${prof.color}20`, color: prof.color }}
                    >
                      {renderIcon(prof.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {prof.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-[var(--accent)] text-[var(--accent-text)] shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 truncate">
                        {prof.domain}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingProfile(prof)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!prof.is_default && profiles.length > 1 && (
                      <button
                        onClick={() => handleDeleteProfile(prof.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-red-400 rounded hover:bg-[var(--bg-hover)]"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Hours: {prof.working_hours_start} – {prof.working_hours_end}</span>
                  {!isSelected && (
                    <button
                      onClick={() => handleSelectProfile(prof)}
                      className="px-2.5 py-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-[10px] font-medium transition-colors"
                    >
                      Switch to Profile
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Profile Creation / Editing Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)]">
          <form
            onSubmit={handleSaveProfile}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">
                {editingProfile.id ? 'Edit Workspace Profile' : 'Create New Workspace Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={editingProfile.name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="e.g. Regional Clinic, Global Ops"
                  className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    Icon Theme
                  </label>
                  <select
                    value={editingProfile.icon || 'building'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, icon: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  >
                    <option value="building">Enterprise / Corporate (🏢)</option>
                    <option value="medical">Medical / Hospital (🩺)</option>
                    <option value="academic">Academic / University (🎓)</option>
                    <option value="briefcase">Advisory / Practice (💼)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    Theme Color
                  </label>
                  <input
                    type="color"
                    value={editingProfile.color || '#3b82f6'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, color: e.target.value })}
                    className="w-full h-8 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Domain / Department
                </label>
                <input
                  type="text"
                  value={editingProfile.domain || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, domain: e.target.value })}
                  placeholder="e.g. Trauma Surgery & ER Roster"
                  className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Branded Organization Name
                </label>
                <input
                  type="text"
                  value={editingProfile.company_name || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, company_name: e.target.value })}
                  placeholder="Appears on PDF exports and titles"
                  className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                  Confidentiality Notice / Footer
                </label>
                <input
                  type="text"
                  value={editingProfile.company_footer || ''}
                  onChange={(e) => setEditingProfile({ ...editingProfile, company_footer: e.target.value })}
                  placeholder="e.g. Confidential • Internal Use Only"
                  className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    Operating Start
                  </label>
                  <input
                    type="time"
                    value={editingProfile.working_hours_start || '09:00'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, working_hours_start: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--text-muted)] mb-1">
                    Operating End
                  </label>
                  <input
                    type="time"
                    value={editingProfile.working_hours_end || '18:00'}
                    onChange={(e) => setEditingProfile({ ...editingProfile, working_hours_end: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-4"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
