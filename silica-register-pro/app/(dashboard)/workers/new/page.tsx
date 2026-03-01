'use client'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const schema = z.object({
  full_name:  z.string().min(2, 'Name required'),
  role_trade: z.string().min(2, 'Role/trade required'),
  employer:   z.string().optional(),
  phone:      z.string().optional(),
  email:      z.string().email().optional().or(z.literal('')),
  notes:      z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function NewWorkerPage() {
  const router  = useRouter()
  const supabase = createClient()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile }  = await supabase.from('profiles').select('organisation_id').eq('id', user!.id).single()

    const { error } = await supabase.from('workers').insert({
      ...data,
      organisation_id: profile!.organisation_id!,
      created_by: user!.id,
    })

    if (!error) router.push('/workers')
    else alert('Error saving worker: ' + error.message)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/workers" className="text-sm text-gray-500 hover:text-gray-700">← Back to Workers</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Add Worker</h1>
        <p className="text-sm text-gray-500 mt-1">Register a new worker to your silica worker register.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <Field label="Full Name *" error={errors.full_name?.message}>
          <input {...register('full_name')} className="input" placeholder="e.g. John Smith" />
        </Field>
        <Field label="Role / Trade *" error={errors.role_trade?.message}>
          <select {...register('role_trade')} className="input">
            <option value="">Select trade...</option>
            {['Concrete cutter','Concrete grinder','Core driller','Demolition worker',
              'Civil worker','Stone fabricator','Saw cutter','Site supervisor','Other'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Employer (Subcontractor)" error={errors.employer?.message}>
          <input {...register('employer')} className="input" placeholder="e.g. Smith Cutting Pty Ltd" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" error={errors.phone?.message}>
            <input {...register('phone')} className="input" placeholder="04xx xxx xxx" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" className="input" placeholder="worker@email.com" />
          </Field>
        </div>
        <Field label="Notes" error={errors.notes?.message}>
          <textarea {...register('notes')} className="input h-20 resize-none" placeholder="Optional notes..." />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            {isSubmitting ? 'Saving...' : 'Add Worker'}
          </button>
          <Link href="/workers" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>
      </form>

      <style jsx global>{`
        .input { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent; }
      `}</style>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
