/**
 * Neural Calendar Interface Types
 * Brain-Computer Interface (BCI), Cognitive State Telemetry & Subconscious Pattern Mining
 */

export type CognitiveState =
  | 'deep_flow'
  | 'collaborative'
  | 'fatigued'
  | 'hyper_focused'
  | 'restoration_needed'

export type BCIConnectionMode =
  | 'hardware_bci' // Web Bluetooth / OSC stream (Muse, Neuralink, OpenBCI)
  | 'hardware_proxy' // Keyboard/mouse cadence, window focus, biometric telemetry
  | 'standby'

export interface EEGTelemetryPacket {
  timestamp: number
  // Frequency bands (normalized spectral power 0-100)
  delta: number // 0.5 - 4 Hz (deep rest/sleep)
  theta: number // 4 - 8 Hz (subconscious creativity, flow)
  alpha: number // 8 - 12 Hz (relaxed alertness, baseline)
  beta: number // 13 - 30 Hz (active logical thought, concentration)
  gamma: number // 30 - 100 Hz (high cognitive binding, hyper-focus)

  // Derived cognitive biometric indicators
  cognitiveLoadPct: number // 0 to 100%
  focusIndex: number // (beta + gamma) / (theta + alpha)
  relaxationIndex: number // alpha / (beta + theta)
  keystrokeCadenceWpm: number // Measured typing cadence
  interKeystrokeIntervalMs: number // Variance indicates cognitive pause/flow
  blinkRatePerMinute: number // Optical / EMG blink estimate
  pupilDilationMm: number // Cognitive effort dilation
}

export interface NeuralIntentDraft {
  id: string
  rawThoughtStream: string
  extractedTitle: string
  suggestedDate: string // YYYY-MM-DD
  suggestedTime: string // HH:mm
  durationMinutes: number
  attendees: string[]
  confidenceScore: number // 0 to 100%
  cognitivePriority: 'urgent' | 'high' | 'medium' | 'low'
  sourceCognitiveState: CognitiveState
  timestamp: string
}

export interface DreamJournalEntry {
  id: string
  timestamp: string
  transcript: string
  subconsciousThemes: string[]
  sentiment: 'visionary' | 'anxious' | 'grounded' | 'creative'
  spindleCorrelationScore: number // Sleep spindle density correlation with creative output
  recommendedActionItems: Array<{
    title: string
    suggestedDurationMins: number
    targetWindow: string
    category: string
  }>
}

export interface CreativityWindowForecast {
  windowStart: string
  windowEnd: string
  ultradianCycleNumber: number // 1 to 5 daily cycles
  predictedCreativityIndex: number // 0 to 100
  recommendedTaskType: 'deep_architecture' | 'divergent_ideation' | 'synthesis' | 'shallow_ops'
  rationale: string
}

export interface MicroBreakAlert {
  id: string
  timestamp: string
  sustainedFlowMinutes: number
  triggerReason: string
  suggestedDurationSeconds: number
  status: 'pending' | 'taken' | 'snoozed'
}

export interface FocusTimePrompt {
  id: string
  detectedAt: number
  suggestedDurationMinutes: number
  reason: string
}
