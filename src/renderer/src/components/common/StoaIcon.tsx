import React from 'react'

export const StoaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Architrave / Top Beam */}
    <rect x="3" y="4" width="18" height="2.8" rx="0.5" fill="currentColor" fillOpacity="0.25" strokeWidth="1.8" />
    {/* Architectural Columns */}
    <line x1="6.5" y1="6.8" x2="6.5" y2="18" strokeWidth="2" />
    <line x1="12" y1="6.8" x2="12" y2="18" strokeWidth="2" />
    <line x1="17.5" y1="6.8" x2="17.5" y2="18" strokeWidth="2" />
    {/* Stylobate / Base Foundation */}
    <line x1="3.5" y1="18.2" x2="20.5" y2="18.2" strokeWidth="1.8" />
    <line x1="2" y1="20.2" x2="22" y2="20.2" strokeWidth="1.5" />
  </svg>
)
