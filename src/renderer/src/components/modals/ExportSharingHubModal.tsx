import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  X,
  Share2,
  FileText,
  Globe,
  FileSpreadsheet,
  Rss,
  QrCode
} from 'lucide-react'

import { BrandedPdfReportTab } from '../export/BrandedPdfReportTab'
import { PublicShareTab } from '../export/PublicShareTab'
import { ExcelExportTab } from '../export/ExcelExportTab'
import { IcalFeedTab } from '../export/IcalFeedTab'
import { QrEventCardTab } from '../export/QrEventCardTab'

export type ExportHubTab = 'pdf' | 'share' | 'excel' | 'ical' | 'qr'

export const ExportSharingHubModal: React.FC = () => {
  const { isExportHubOpen, setIsExportHubOpen, exportHubInitialTab } = useAppStore()

  const [activeTab, setActiveTab] = useState<ExportHubTab>('pdf')

  // Set initial tab from store if opened with a specific intent
  useEffect(() => {
    if (isExportHubOpen && exportHubInitialTab) {
      setActiveTab(exportHubInitialTab)
    }
  }, [isExportHubOpen, exportHubInitialTab])

  if (!isExportHubOpen) return null

  const handleClose = () => {
    setIsExportHubOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-[var(--text-primary)] animate-in fade-in duration-150">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0 shadow-xs">
              <Share2 className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Export, Sharing & Public Integration Hub
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Generate branded PDF reports, read-only share links, Excel workbooks, iCal feeds, and smart QR passes.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'pdf'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Branded PDF Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'share'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Share Link</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'excel'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Roster Export</span>
          </button>

          <button
            onClick={() => setActiveTab('ical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'ical'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Rss className="w-3.5 h-3.5" />
            <span>iCal / .ics Live Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'qr'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Event Cards</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'pdf' && <BrandedPdfReportTab />}
          {activeTab === 'share' && <PublicShareTab />}
          {activeTab === 'excel' && <ExcelExportTab />}
          {activeTab === 'ical' && <IcalFeedTab />}
          {activeTab === 'qr' && <QrEventCardTab />}
        </div>
      </div>
    </div>
  )
}
