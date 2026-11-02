// Offline Web Audio Focus Soundscape Engine
// Synthesizes 40Hz Binaural Gamma Focus Waves and Deep Brown Noise without external audio files

class FocusAudioService {
  private ctx: AudioContext | null = null
  private oscLeft: OscillatorNode | null = null
  private oscRight: OscillatorNode | null = null
  private noiseNode: AudioNode | null = null
  private gainNode: GainNode | null = null
  private isPlaying: boolean = false
  private currentMode: 'binaural_gamma' | 'brown_noise' | 'rain_drift' = 'binaural_gamma'

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime)
      this.gainNode.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setVolume(volume: number): void {
    if (this.gainNode && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume))
      this.gainNode.gain.setValueAtTime(clamped, this.ctx.currentTime)
    }
  }

  public play(mode: 'binaural_gamma' | 'brown_noise' | 'rain_drift' = 'binaural_gamma'): void {
    this.stop()
    this.initContext()
    if (!this.ctx || !this.gainNode) return

    this.currentMode = mode
    this.isPlaying = true

    if (mode === 'binaural_gamma') {
      // 40Hz Gamma Wave for high-level cognitive concentration (200Hz Left, 240Hz Right)
      const merger = this.ctx.createChannelMerger(2)

      this.oscLeft = this.ctx.createOscillator()
      this.oscLeft.type = 'sine'
      this.oscLeft.frequency.setValueAtTime(200, this.ctx.currentTime)
      this.oscLeft.connect(merger, 0, 0) // Left ear

      this.oscRight = this.ctx.createOscillator()
      this.oscRight.type = 'sine'
      this.oscRight.frequency.setValueAtTime(240, this.ctx.currentTime)
      this.oscRight.connect(merger, 0, 1) // Right ear

      merger.connect(this.gainNode)
      this.oscLeft.start()
      this.oscRight.start()
    } else if (mode === 'brown_noise' || mode === 'rain_drift') {
      // Synthesized Brown noise (1/f^2) for deep uninterrupted flow
      const bufferSize = 2 * this.ctx.sampleRate
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      let lastOut = 0.0

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        output[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = output[i]
        output[i] *= 3.5 // boost gain
      }

      const whiteNoise = this.ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      // Gentle lowpass filter for silky soft background sound
      const filter = this.ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(mode === 'rain_drift' ? 800 : 400, this.ctx.currentTime)

      whiteNoise.connect(filter)
      filter.connect(this.gainNode)
      whiteNoise.start()
      this.noiseNode = whiteNoise
    }
  }

  public stop(): void {
    if (this.oscLeft) {
      try {
        this.oscLeft.stop()
        this.oscLeft.disconnect()
      } catch {}
      this.oscLeft = null
    }
    if (this.oscRight) {
      try {
        this.oscRight.stop()
        this.oscRight.disconnect()
      } catch {}
      this.oscRight = null
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioScheduledSourceNode).stop()
        this.noiseNode.disconnect()
      } catch {}
      this.noiseNode = null
    }
    this.isPlaying = false
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public getMode(): string {
    return this.currentMode
  }
}

export const focusAudioService = new FocusAudioService()
