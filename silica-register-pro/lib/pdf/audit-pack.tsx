import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, Image,
} from '@react-pdf/renderer'
import { format } from 'date-fns'

// ── Types ────────────────────────────────────────────────────────────────────
export interface AuditPackData {
  organisation: {
    name: string
    abn?: string
    logo_url?: string
  }
  dateRange: { from: Date; to: Date }
  sites: Array<{ id: string; name: string; address?: string }>
  workers: Array<{
    id: string
    full_name: string
    role_trade: string
    employer?: string
    status: string
    fit_test_status: string
    total_events: number
    total_hours: number
    added_at: string
  }>
  exposureEvents: Array<{
    date: string
    worker_name: string
    site_name: string
    task_activity: string
    duration_hours?: number
    controls_used?: string[]
    rpe_type?: string
    logged_via: string
  }>
  fitTests: Array<{
    worker_name: string
    rpe_type: string
    test_date: string
    fit_factor?: number
    result: string
    next_due_date?: string
    status: string
  }>
  monitoringUploads: Array<{
    upload_date: string
    site_name?: string
    description: string
    file_name: string
    file_type?: string
  }>
  generatedAt: Date
}

// ── Styles ───────────────────────────────────────────────────────────────────
const GREEN  = '#166534'
const GREEN2 = '#16a34a'
const GREEN_LIGHT = '#dcfce7'
const GREY   = '#6b7280'
const DARK   = '#111827'
const RED    = '#dc2626'
const YELLOW = '#d97706'

const S = StyleSheet.create({
  page:         { padding: 48, fontFamily: 'Helvetica', fontSize: 9, color: DARK, backgroundColor: '#ffffff' },
  coverPage:    { padding: 0 },
  coverTop:     { backgroundColor: GREEN, padding: 48, paddingBottom: 80 },
  coverTitle:   { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 40 },
  coverSub:     { fontSize: 12, color: '#bbf7d0', marginTop: 8 },
  coverBody:    { padding: 48, paddingTop: 40 },
  coverMeta:    { fontSize: 10, color: GREY, marginBottom: 6 },
  coverMetaVal: { fontSize: 11, color: DARK, fontFamily: 'Helvetica-Bold', marginBottom: 16 },
  disclaimer:   { fontSize: 8, color: GREY, marginTop: 24, lineHeight: 1.5 },

  sectionTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 4, marginTop: 20 },
  sectionRule:  { height: 2, backgroundColor: GREEN2, marginBottom: 12 },
  sectionPurp:  { fontSize: 8.5, color: GREY, marginBottom: 10, lineHeight: 1.5 },

  table:        { width: '100%', marginBottom: 12 },
  thead:        { flexDirection: 'row', backgroundColor: GREEN, marginBottom: 0 },
  theadCell:    { flex: 1, color: '#ffffff', fontSize: 7.5, fontFamily: 'Helvetica-Bold', padding: 5 },
  trow:         { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  trowAlt:      { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  tcell:        { flex: 1, fontSize: 8, padding: 5, color: DARK },

  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryCard:  { backgroundColor: GREEN_LIGHT, borderRadius: 6, padding: 12, flex: 1, marginRight: 8 },
  summaryNum:   { fontSize: 20, fontFamily: 'Helvetica-Bold', color: GREEN },
  summaryLabel: { fontSize: 8, color: GREEN, marginTop: 2 },

  badge:        { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  badgeGreen:   { backgroundColor: '#dcfce7', color: '#166534' },
  badgeYellow:  { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeRed:     { backgroundColor: '#fee2e2', color: '#991b1b' },
  badgeGrey:    { backgroundColor: '#f3f4f6', color: '#6b7280' },

  footer:       { position: 'absolute', bottom: 28, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:   { fontSize: 7.5, color: GREY },
  pageNum:      { fontSize: 7.5, color: GREY },
})

// ── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, any> = {
    current:       S.badgeGreen,
    expiring_soon: S.badgeYellow,
    overdue:       S.badgeRed,
    no_record:     S.badgeGrey,
    exempt:        S.badgeGreen,
    pass:          S.badgeGreen,
    fail:          S.badgeRed,
  }
  const labels: Record<string, string> = {
    current: 'Current', expiring_soon: 'Expiring Soon', overdue: 'Overdue',
    no_record: 'No Record', exempt: 'Exempt (PAPR)', pass: 'Pass', fail: 'Fail',
  }
  return (
    <View style={[S.badge, map[status] ?? S.badgeGrey]}>
      <Text>{labels[status] ?? status}</Text>
    </View>
  )
}

function PageFooter({ orgName, generated }: { orgName: string; generated: Date }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>{orgName} | Silica Compliance Audit Pack | Generated {format(generated, 'dd MMM yyyy HH:mm')}</Text>
      <Text style={S.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  )
}

function SectionHeader({ title, purpose }: { title: string; purpose?: string }) {
  return (
    <View>
      <Text style={S.sectionTitle}>{title}</Text>
      <View style={S.sectionRule} />
      {purpose && <Text style={S.sectionPurp}>{purpose}</Text>}
    </View>
  )
}

// ── MAIN DOCUMENT ─────────────────────────────────────────────────────────────
export function AuditPackPDF({ data }: { data: AuditPackData }) {
  const { organisation, dateRange, sites, workers, exposureEvents, fitTests, monitoringUploads, generatedAt } = data
  const periodStr = `${format(dateRange.from, 'd MMM yyyy')} – ${format(dateRange.to, 'd MMM yyyy')}`
  const siteNames = sites.map(s => s.name).join(', ')

  const overdue   = fitTests.filter(f => f.status === 'overdue').length
  const expiring  = fitTests.filter(f => f.status === 'expiring_soon').length
  const compliant = fitTests.filter(f => f.status === 'current' || f.status === 'exempt').length

  return (
    <Document title="Silica Compliance Audit Pack" author="SilicaRegister Pro">

      {/* ── COVER PAGE ─────────────────────────────────────────────────────── */}
      <Page size="A4" style={[S.page, S.coverPage]}>
        <View style={S.coverTop}>
          <Text style={{ fontSize: 10, color: '#86efac', fontFamily: 'Helvetica-Bold', letterSpacing: 2 }}>
            SILICA COMPLIANCE AUDIT PACK
          </Text>
          <Text style={S.coverTitle}>{organisation.name}</Text>
          <Text style={S.coverSub}>Generated by SilicaRegister Pro</Text>
        </View>
        <View style={S.coverBody}>
          <Text style={S.coverMeta}>Period Covered</Text>
          <Text style={S.coverMetaVal}>{periodStr}</Text>
          <Text style={S.coverMeta}>Site(s)</Text>
          <Text style={S.coverMetaVal}>{siteNames || 'All sites'}</Text>
          {organisation.abn && (
            <>
              <Text style={S.coverMeta}>ABN</Text>
              <Text style={S.coverMetaVal}>{organisation.abn}</Text>
            </>
          )}
          <Text style={S.coverMeta}>Generated</Text>
          <Text style={S.coverMetaVal}>{format(generatedAt, 'dd MMMM yyyy, HH:mm AEDT')}</Text>
          <Text style={S.disclaimer}>
            DISCLAIMER: This document is generated by SilicaRegister Pro as a compliance record-keeping tool.
            The PCBU remains solely responsible for ensuring compliance with the Work Health and Safety Act, WHS Regulations,
            and all applicable Codes of Practice. This document does not constitute legal or safety advice.
          </Text>
        </View>
      </Page>

      {/* ── SECTION 2: WORKER REGISTER ──────────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <SectionHeader
          title="Section 1 — Silica Worker Register"
          purpose="Purpose: Demonstrate the PCBU maintains a register of workers carrying out silica-generating work, as required under the WHS Regulations and SafeWork Australia Code of Practice."
        />

        {/* Summary cards */}
        <View style={S.summaryRow}>
          <View style={S.summaryCard}>
            <Text style={S.summaryNum}>{workers.length}</Text>
            <Text style={S.summaryLabel}>Total Registered</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={S.summaryNum}>{workers.filter(w => w.status === 'active' && w.total_events > 0).length}</Text>
            <Text style={S.summaryLabel}>Active with Exposure</Text>
          </View>
          <View style={[S.summaryCard, { marginRight: 0 }]}>
            <Text style={S.summaryNum}>{exposureEvents.length}</Text>
            <Text style={S.summaryLabel}>Exposure Events in Period</Text>
          </View>
        </View>

        <View style={S.table}>
          <View style={S.thead}>
            {['Worker Name', 'Role / Trade', 'Employer', 'Status', 'Events', 'Hrs', 'Fit-Test'].map(h => (
              <Text key={h} style={S.theadCell}>{h}</Text>
            ))}
          </View>
          {workers.map((w, i) => (
            <View key={w.id} style={i % 2 === 0 ? S.trow : S.trowAlt}>
              <Text style={[S.tcell, { fontFamily: 'Helvetica-Bold' }]}>{w.full_name}</Text>
              <Text style={S.tcell}>{w.role_trade}</Text>
              <Text style={S.tcell}>{w.employer ?? '—'}</Text>
              <Text style={S.tcell}>{w.status}</Text>
              <Text style={S.tcell}>{w.total_events}</Text>
              <Text style={S.tcell}>{w.total_hours?.toFixed(1) ?? '0.0'}</Text>
              <Badge status={w.fit_test_status} />
            </View>
          ))}
        </View>
        <PageFooter orgName={organisation.name} generated={generatedAt} />
      </Page>

      {/* ── SECTION 3: EXPOSURE EVENT LOG ───────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <SectionHeader
          title="Section 2 — Exposure Event Log"
          purpose={`Purpose: Detailed record of every silica exposure event in the selected period. Total events: ${exposureEvents.length} | Period: ${periodStr}`}
        />
        <View style={S.table}>
          <View style={S.thead}>
            {['Date', 'Worker', 'Site', 'Task / Activity', 'Hrs', 'RPE', 'Logged Via'].map(h => (
              <Text key={h} style={S.theadCell}>{h}</Text>
            ))}
          </View>
          {exposureEvents.map((e, i) => (
            <View key={i} style={i % 2 === 0 ? S.trow : S.trowAlt}>
              <Text style={S.tcell}>{e.date}</Text>
              <Text style={S.tcell}>{e.worker_name}</Text>
              <Text style={S.tcell}>{e.site_name}</Text>
              <Text style={S.tcell}>{e.task_activity}</Text>
              <Text style={S.tcell}>{e.duration_hours?.toFixed(1) ?? '—'}</Text>
              <Text style={S.tcell}>{e.rpe_type ?? '—'}</Text>
              <Text style={S.tcell}>{e.logged_via}</Text>
            </View>
          ))}
          {exposureEvents.length === 0 && (
            <View style={S.trow}>
              <Text style={[S.tcell, { color: GREY, fontFamily: 'Helvetica-Oblique' }]}>No exposure events in this period.</Text>
            </View>
          )}
        </View>
        <PageFooter orgName={organisation.name} generated={generatedAt} />
      </Page>

      {/* ── SECTION 4: FIT-TEST REGISTER ────────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <SectionHeader
          title="Section 3 — Fit-Test Register & Expiry Status"
          purpose="Purpose: Demonstrate all workers using tight-fitting RPE have current fit-tests, per WHS Regulations."
        />

        <View style={S.summaryRow}>
          <View style={S.summaryCard}>
            <Text style={[S.summaryNum, { color: '#166534' }]}>{compliant}</Text>
            <Text style={S.summaryLabel}>Compliant / Exempt</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={[S.summaryNum, { color: '#92400e' }]}>{expiring}</Text>
            <Text style={S.summaryLabel}>Expiring (30 days)</Text>
          </View>
          <View style={[S.summaryCard, { marginRight: 0 }]}>
            <Text style={[S.summaryNum, { color: RED }]}>{overdue}</Text>
            <Text style={[S.summaryLabel, { color: RED }]}>Overdue</Text>
          </View>
        </View>

        <View style={S.table}>
          <View style={S.thead}>
            {['Worker', 'RPE Type', 'Last Test', 'Fit Factor', 'Result', 'Next Due', 'Status'].map(h => (
              <Text key={h} style={S.theadCell}>{h}</Text>
            ))}
          </View>
          {fitTests.map((f, i) => (
            <View key={i} style={i % 2 === 0 ? S.trow : S.trowAlt}>
              <Text style={[S.tcell, { fontFamily: 'Helvetica-Bold' }]}>{f.worker_name}</Text>
              <Text style={S.tcell}>{f.rpe_type}</Text>
              <Text style={S.tcell}>{f.test_date}</Text>
              <Text style={S.tcell}>{f.fit_factor ?? '—'}</Text>
              <Text style={S.tcell}>{f.result}</Text>
              <Text style={S.tcell}>{f.next_due_date ?? '—'}</Text>
              <Badge status={f.status} />
            </View>
          ))}
          {fitTests.length === 0 && (
            <View style={S.trow}>
              <Text style={[S.tcell, { color: GREY, fontFamily: 'Helvetica-Oblique' }]}>No fit-test records found.</Text>
            </View>
          )}
        </View>
        <PageFooter orgName={organisation.name} generated={generatedAt} />
      </Page>

      {/* ── SECTION 5: MONITORING UPLOADS ───────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <SectionHeader
          title="Section 4 — Air Monitoring Uploads Register"
          purpose="Purpose: Evidence that air monitoring has been conducted and results are on file. Total uploads: "
        />
        <View style={S.table}>
          <View style={S.thead}>
            {['Upload Date', 'Site', 'Description', 'File Name', 'Type', 'Monitoring Date'].map(h => (
              <Text key={h} style={S.theadCell}>{h}</Text>
            ))}
          </View>
          {monitoringUploads.map((m, i) => (
            <View key={i} style={i % 2 === 0 ? S.trow : S.trowAlt}>
              <Text style={S.tcell}>{m.upload_date}</Text>
              <Text style={S.tcell}>{m.site_name ?? '—'}</Text>
              <Text style={S.tcell}>{m.description}</Text>
              <Text style={S.tcell}>{m.file_name}</Text>
              <Text style={S.tcell}>{m.file_type ?? '—'}</Text>
              <Text style={S.tcell}>{m.monitoring_date ?? '—'}</Text>
            </View>
          ))}
          {monitoringUploads.length === 0 && (
            <View style={S.trow}>
              <Text style={[S.tcell, { color: RED, fontFamily: 'Helvetica-Bold' }]}>
                No air monitoring uploads on file. Upload results in Monitoring section.
              </Text>
            </View>
          )}
        </View>
        <Text style={[S.sectionPurp, { marginTop: 16 }]}>
          Sites with monitoring: {[...new Set(monitoringUploads.map(m => m.site_name).filter(Boolean))].join(', ') || 'None'}{'\n'}
          Sites without monitoring: {sites.filter(s => !monitoringUploads.some(m => m.site_name === s.name)).map(s => s.name).join(', ') || 'None'}
        </Text>
        <PageFooter orgName={organisation.name} generated={generatedAt} />
      </Page>

    </Document>
  )
}
