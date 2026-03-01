'use client'
import { useState } from 'react'
import { CheckCircle, ChevronDown } from 'lucide-react'

const TASKS = [
  'Concrete cutting', 'Concrete grinding', 'Core drilling',
  'Concrete breaking / demolition', 'Saw cutting', 'Concrete polishing',
  'Stone fabrication / grinding', 'Excavation in silica-bearing soil',
  'Masonry cutting', 'Other silica-generating task',
]

const RPE_TYPES = [
  'P2 disposable half-face respirator',
  'P2 reusable half-face respirator',
  'Full-face P3 respirator',
  'Powered air-purifying respirator (PAPR)',
  'Supplied air respirator',
  'No RPE used',
]

const CONTROLS = [
  { id: 'wet_cutting',   label: 'Wet cutting / water suppression' },
  { id: 'lev',           label: 'Local exhaust ventilation (LEV / on-tool extraction)' },
  { id: 'enclosure',     label: 'Enclosure / isolation of work area' },
  { id: 'restricted',    label: 'Restricted access zone' },
  { id: 'swms',          label: 'SWMS in place' },
  { id: 'signage',       label: 'Silica hazard signage displayed' },
  { id: 'decon',         label: 'Decontamination procedures in place' },
]

type Worker = { id: string; full_name: string; role_trade: string; employer: string | null }

export function CheckInForm({ siteId, orgId, workers }: { siteId: string; orgId: string; workers: Worker[] }) {
  const [step,        setStep]       = useState<'select' | 'details' | 'done'>('select')
  const [workerId,    setWorkerId]   = useState('')
  const [task,        setTask]       = useState('')
  const [rpe,         setRpe]        = useState('')
  const [controls,    setControls]   = useState<string[]>([])
  const [submitting,  setSubmitting] = useState(false)
  const [error,       setError]      = useState('')

  const selectedWorker = workers.find(w => w.id === workerId)

  function toggleControl(id: string) {
    setControls(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function submit() {
    if (!workerId || !task || !rpe) { setError('Please complete all fields.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteId,
          organisation_id: orgId,
          worker_id: workerId,
          task_activity: task,
          rpe_type: rpe,
          controls_used: controls,
          logged_via: 'qr',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setStep('done')
    } catch (e: any) {
      setError(e.message || 'Check-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h2 className="text-xl font-bold mb-1">Checked In</h2>
        <p className="text-gray-400 text-sm mb-2">{selectedWorker?.full_name}</p>
        <p className="text-gray-400 text-sm">{task}</p>
        <p className="text-xs text-gray-500 mt-4">Your exposure has been logged. Check out when your task is complete.</p>
        <button
          onClick={() => { setStep('select'); setWorkerId(''); setTask(''); setRpe(''); setControls([]) }}
          className="mt-6 border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          Check In Another Worker
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-5">
        {step === 'select' ? 'Select Your Name' : 'Task Details'}
      </h2>

      {step === 'select' && (
        <div className="space-y-3">
          {workers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No workers are assigned to this site yet. Contact your supervisor.</p>
          )}
          {workers.map(w => (
            <button
              key={w.id}
              onClick={() => { setWorkerId(w.id); setStep('details') }}
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl px-4 py-4 text-left transition-colors"
            >
              <p className="font-medium">{w.full_name}</p>
              <p className="text-sm text-gray-400">{w.role_trade}{w.employer ? ` · ${w.employer}` : ''}</p>
            </button>
          ))}
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-5">
          <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Checking in as</p>
              <p className="font-medium">{selectedWorker?.full_name}</p>
            </div>
            <button onClick={() => setStep('select')} className="text-xs text-gray-400 hover:text-white">Change</button>
          </div>

          {/* Task */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Task / Activity *</label>
            <div className="space-y-2">
              {TASKS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTask(t)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    task === t ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* RPE */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">RPE Used *</label>
            <div className="space-y-2">
              {RPE_TYPES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRpe(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    rpe === r ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Controls in Use (select all that apply)</label>
            <div className="space-y-2">
              {CONTROLS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleControl(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    controls.includes(c.id) ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{controls.includes(c.id) ? '✓' : '○'}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting || !task || !rpe}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-xl font-semibold text-base transition-colors"
          >
            {submitting ? 'Logging...' : 'Check In'}
          </button>
        </div>
      )}
    </div>
  )
}
