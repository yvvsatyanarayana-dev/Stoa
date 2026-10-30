import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Lock, AlertCircle } from 'lucide-react'

export const WorkspaceLockScreen: React.FC = () => {
  const { isWorkspaceLocked, setIsWorkspaceLocked, settings } = useAppStore()

  const [enteredPin, setEnteredPin] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Desired PIN or default '1234'
  const targetPin = (settings as any)?.workspace_pin || '1234'

  useEffect(() => {
    if (!isWorkspaceLocked) {
      setEnteredPin('')
      setErrorMessage(null)
    }
  }, [isWorkspaceLocked])

  // Global keydown listener when locked
  useEffect(() => {
    if (!isWorkspaceLocked) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (enteredPin.length < 6) {
          handleDigitPress(e.key)
        }
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Enter') {
        handleVerify()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isWorkspaceLocked, enteredPin])

  if (!isWorkspaceLocked) return null

  const handleDigitPress = (digit: string) => {
    setErrorMessage(null)
    const next = enteredPin + digit
    setEnteredPin(next)
    if (next.length === targetPin.length) {
      // Auto verify when length matches
      if (next === targetPin) {
        setIsWorkspaceLocked(false)
        setEnteredPin('')
      } else {
        setErrorMessage('Incorrect security PIN. Please try again.')
        setEnteredPin('')
      }
    }
  }

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1))
    setErrorMessage(null)
  }

  const handleClear = () => {
    setEnteredPin('')
    setErrorMessage(null)
  }

  const handleVerify = () => {
    if (enteredPin === targetPin) {
      setIsWorkspaceLocked(false)
      setEnteredPin('')
    } else {
      setErrorMessage('Incorrect security PIN. Please try again.')
      setEnteredPin('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] text-[var(--text-primary)] animate-in fade-in duration-200 select-none">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl max-w-sm w-full p-8 space-y-6 shadow-2xl text-center flex flex-col items-center">
        {/* Lock Emblem */}
        <div className="w-14 h-14 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] flex items-center justify-center shadow-md">
          <Lock className="w-6 h-6 stroke-[2]" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            Workspace Locked
          </h2>
          <p className="text-[11px] text-[var(--text-muted)] font-mono">
            {settings?.company_name || 'ChronoDesk Enterprise'}
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {Array.from({ length: targetPin.length }).map((_, idx) => {
            const isFilled = idx < enteredPin.length
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  isFilled
                    ? 'bg-[var(--accent)] border-[var(--accent)] scale-110 shadow-xs'
                    : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
                }`}
              />
            )
          })}
        </div>

        {errorMessage && (
          <div className="text-[11px] text-red-400 font-medium flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="h-12 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] active:scale-95 border border-[var(--border-subtle)] text-sm font-bold font-mono text-[var(--text-primary)] transition-all shadow-xs flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] active:scale-95 border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)] transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-12 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] active:scale-95 border border-[var(--border-subtle)] text-sm font-bold font-mono text-[var(--text-primary)] transition-all shadow-xs flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] active:scale-95 border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-muted)] transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Footer Hint */}
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] font-mono">
          Default security PIN: <span className="font-bold text-[var(--text-secondary)]">1234</span>
        </div>
      </div>
    </div>
  )
}
