import React, { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Table,
  Users,
  DoorClosed
} from 'lucide-react'
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

type ExcelScope = 'week' | 'month' | 'all'

export const ExcelExportTab: React.FC = () => {
  const { events, resources } = useAppStore()

  const [scope, setScope] = useState<ExcelScope>('week')
  const [includeTeamSheet, setIncludeTeamSheet] = useState<boolean>(true)
  const [includeRoomsSheet, setIncludeRoomsSheet] = useState<boolean>(true)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false)

  // Filter events matching scope
  const targetEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => {
        const eStart = new Date(e.start)
        if (scope === 'week') {
          return isWithinInterval(eStart, {
            start: startOfWeek(now, { weekStartsOn: 1 }),
            end: endOfWeek(now, { weekStartsOn: 1 })
          })
        }
        if (scope === 'month') {
          return isWithinInterval(eStart, {
            start: startOfMonth(now),
            end: endOfMonth(now)
          })
        }
        return true
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, scope])

  // Team summary data
  const teamRows = useMemo(() => {
    const staff = resources.filter((r) => r.type === 'person')
    return staff.map((m) => {
      let eventCount = 0
      let totalMins = 0

      targetEvents.forEach((e) => {
        const isAssigned =
          e.resources?.some((r) => r.id === m.id) ||
          e.attendees?.some((a) => a.name.toLowerCase() === m.name.toLowerCase()) ||
          e.title.toLowerCase().includes(m.name.toLowerCase())

        if (isAssigned) {
          eventCount++
          const dur = (new Date(e.end).getTime() - new Date(e.start).getTime()) / (1000 * 60)
          if (dur > 0) totalMins += dur
        }
      })

      const totalHours = Math.round((totalMins / 60) * 10) / 10
      return {
        name: m.name,
        eventCount,
        totalHours,
        status: totalHours > 40 ? 'Overtime Alert' : 'Normal'
      }
    })
  }, [resources, targetEvents])

  // Room summary data
  const roomRows = useMemo(() => {
    const rooms = resources.filter((r) => r.type === 'room')
    return rooms.map((rm) => {
      let eventCount = 0
      let totalMins = 0

      targetEvents.forEach((e) => {
        const isBooked =
          e.location?.toLowerCase().includes(rm.name.toLowerCase()) ||
          e.resources?.some((r) => r.id === rm.id)

        if (isBooked) {
          eventCount++
          const dur = (new Date(e.end).getTime() - new Date(e.start).getTime()) / (1000 * 60)
          if (dur > 0) totalMins += dur
        }
      })

      const totalHours = Math.round((totalMins / 60) * 10) / 10
      return {
        name: rm.name,
        capacity: rm.capacity,
        eventCount,
        totalHours
      }
    })
  }, [resources, targetEvents])

  // Generate multi-sheet XML Spreadsheet (SpreadsheetML) compatible with MS Excel, Sheets & Numbers
  const generateExcelXml = (): string => {
    const escapeXml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    // XML Spreadsheet template with styles
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#111111" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DateStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <NumberFormat ss:Format="Short Date"/>
  </Style>
  <Style ss:ID="AlertStyle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#D9534F" ss:Bold="1"/>
  </Style>
 </Styles>`

    // 1. Sheet 1: Master Schedule
    xml += `
 <Worksheet ss:Name="Schedule Roster">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="140"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Event Title</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Date</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Start Time</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">End Time</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Location / Room</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Priority</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Attendees</Data></Cell>
   </Row>`

    targetEvents.forEach((e) => {
      const s = new Date(e.start)
      const end = new Date(e.end)
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(e.title)}</Data></Cell>
    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${format(s, 'yyyy-MM-dd')}</Data></Cell>
    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${format(s, 'HH:mm')}</Data></Cell>
    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">${format(end, 'HH:mm')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(e.location || '—')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(e.priority.toUpperCase())}</Data></Cell>
    <Cell><Data ss:Type="Number">${e.attendees?.length || 0}</Data></Cell>
   </Row>`
    })
    xml += `
  </Table>
 </Worksheet>`

    // 2. Sheet 2: Team Roster
    if (includeTeamSheet) {
      xml += `
 <Worksheet ss:Name="Team Workload">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Member Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sessions Booked</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Total Hours (Scope)</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Status</Data></Cell>
   </Row>`

      teamRows.forEach((m) => {
        xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(m.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${m.eventCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${m.totalHours}</Data></Cell>
    <Cell ss:StyleID="${m.status === 'Overtime Alert' ? 'AlertStyle' : 'Default'}"><Data ss:Type="String">${m.status}</Data></Cell>
   </Row>`
      })
      xml += `
  </Table>
 </Worksheet>`
    }

    // 3. Sheet 3: Room Occupancy
    if (includeRoomsSheet) {
      xml += `
 <Worksheet ss:Name="Room Utilization">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Room Name</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Capacity</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Bookings</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Hours Occupied</Data></Cell>
   </Row>`

      roomRows.forEach((r) => {
        xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(r.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.capacity}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.eventCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.totalHours}</Data></Cell>
   </Row>`
      })
      xml += `
  </Table>
 </Worksheet>`
    }

    xml += `
</Workbook>`
    return xml
  }

  const handleDownloadExcel = () => {
    setIsExporting(true)
    try {
      const xml = generateExcelXml()
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `ChronoDesk_Roster_${scope}_${format(new Date(), 'yyyyMMdd')}.xls`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('Error generating Excel file:', err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Options Bar */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-[var(--accent-text)]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Excel Roster & Analytics Export
              </span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Generate formatted multi-sheet Excel workbooks with schedule rosters, per-person workloads, and room hours.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--accent)] text-[var(--accent-text)] hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel Workbook (.xls)</span>
          </button>
        </div>

        {/* Scope and Sheet Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Date Interval:
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ExcelScope)}
              className="w-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
            >
              <option value="week">Current Week Schedule</option>
              <option value="month">Current Month Schedule</option>
              <option value="all">Full Schedule Archive</option>
            </select>
          </div>

          {/* Worksheet Toggles */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-semibold text-[var(--text-muted)]">
              Included Worksheets:
            </label>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setIncludeTeamSheet(!includeTeamSheet)}
                className={`px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  includeTeamSheet
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team Workload Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeRoomsSheet(!includeRoomsSheet)}
                className={`px-3 py-1 rounded-[var(--radius-sm)] text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  includeRoomsSheet
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                }`}
              >
                <DoorClosed className="w-3.5 h-3.5" />
                <span>Room Utilization Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Excel Workbook generated and downloaded successfully!</span>
        </div>
      )}

      {/* Spreadsheet Structure Preview */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Spreadsheet Workbook Structure Preview</span>
          <span>{targetEvents.length} data rows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Sheet 1 Preview */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Table className="w-4 h-4 text-[var(--accent)]" />
              <span>Sheet 1: Schedule Roster</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {targetEvents.length} scheduled sessions with start/end time, room, priority, and attendee counts.
            </p>
          </div>

          {/* Sheet 2 Preview */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Sheet 2: Team Workload</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {teamRows.length} team members audited with total weekly hours and overtime threshold alerts.
            </p>
          </div>

          {/* Sheet 3 Preview */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <DoorClosed className="w-4 h-4 text-amber-400" />
              <span>Sheet 3: Room Occupancy</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {roomRows.length} rooms tracked with seating capacity and total hours occupied.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
