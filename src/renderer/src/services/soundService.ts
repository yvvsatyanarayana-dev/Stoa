// Web Audio API Synthesizer for ChronoDesk Pro Sound Themes
export type SoundTheme = 'executive_chime' | 'gentle_marimba' | 'urgent_pulse' | 'subtle_tick' | 'zen_bowl'

class SoundService {
  private ctx: AudioContext | null = null
  private theme: SoundTheme = 'executive_chime'
  private volume: number = 0.8
  private muted: boolean = false

  constructor() {
    // Load persisted settings
    try {
      const savedTheme = localStorage.getItem('chronodesk_sound_theme') as SoundTheme | null
      if (savedTheme) this.theme = savedTheme

      const savedVol = localStorage.getItem('chronodesk_sound_volume')
      if (savedVol !== null) this.volume = parseFloat(savedVol)

      const savedMute = localStorage.getItem('chronodesk_sound_muted')
      if (savedMute !== null) this.muted = savedMute === 'true'
    } catch {}
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public getTheme(): SoundTheme {
    return this.theme
  }

  public setTheme(theme: SoundTheme): void {
    this.theme = theme
    try {
      localStorage.setItem('chronodesk_sound_theme', theme)
    } catch {}
  }

  public getVolume(): number {
    return this.volume
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol))
    try {
      localStorage.setItem('chronodesk_sound_volume', this.volume.toString())
    } catch {}
  }

  public isMuted(): boolean {
    return this.muted
  }

  public setMuted(muted: boolean): void {
    this.muted = muted
    try {
      localStorage.setItem('chronodesk_sound_muted', muted ? 'true' : 'false')
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  // Play sound preview or alert
  public play(themeOverride?: SoundTheme): void {
    if (this.muted) return
    const ctx = this.getContext()
    if (!ctx) return

    const activeTheme = themeOverride || this.theme
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(this.volume, ctx.currentTime)
    masterGain.connect(ctx.destination)

    const now = ctx.currentTime

    switch (activeTheme) {
      case 'executive_chime': {
        // Harmonious corporate dual chime: E5 (659Hz) -> A5 (880Hz)
        this.createTone(ctx, masterGain, 659.25, now, 0.45, 'sine')
        this.createTone(ctx, masterGain, 880.0, now + 0.15, 0.6, 'sine')
        break
      }
      case 'gentle_marimba': {
        // Warm melodic arpeggio: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
        this.createTone(ctx, masterGain, 523.25, now, 0.35, 'triangle')
        this.createTone(ctx, masterGain, 659.25, now + 0.12, 0.35, 'triangle')
        this.createTone(ctx, masterGain, 783.99, now + 0.24, 0.5, 'triangle')
        break
      }
      case 'urgent_pulse': {
        // High clarity alert: double pulse at 987Hz (B5)
        this.createTone(ctx, masterGain, 987.77, now, 0.12, 'square', 0.2)
        this.createTone(ctx, masterGain, 987.77, now + 0.15, 0.25, 'square', 0.25)
        break
      }
      case 'subtle_tick': {
        // Minimalist acoustic tick
        this.createTone(ctx, masterGain, 1200, now, 0.05, 'triangle', 0.15)
        break
      }
      case 'zen_bowl': {
        // Ambient resonant singing bowl: fundamental 432Hz with harmonic 864Hz
        this.createTone(ctx, masterGain, 432.0, now, 1.2, 'sine', 0.35)
        this.createTone(ctx, masterGain, 864.0, now, 0.9, 'sine', 0.15)
        break
      }
    }
  }

  // Play based on priority
  public playForPriority(priority?: 'low' | 'medium' | 'high' | 'urgent'): void {
    if (priority === 'urgent' || priority === 'high') {
      this.play('urgent_pulse')
    } else if (priority === 'low') {
      this.play('subtle_tick')
    } else {
      this.play() // uses user default theme
    }
  }

  private createTone(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    peakGain: number = 0.4
  ): void {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)

    // Smooth envelope attack and exponential decay
    gain.gain.setValueAtTime(0.001, startTime)
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(destination)

    osc.start(startTime)
    osc.stop(startTime + duration + 0.05)
  }
}

export const soundService = new SoundService()
