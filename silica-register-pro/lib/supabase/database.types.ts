// Auto-generate with: npm run db:types
// Manual version below — run `npm run db:types` after connecting to Supabase to replace.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: {
          id: string
          name: string
          abn: string | null
          address: string | null
          logo_url: string | null
          plan: 'founding_beta' | 'starter' | 'growth' | 'pro'
          plan_status: 'active' | 'trialing' | 'past_due' | 'canceled'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          max_workers: number
          max_sites: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['organisations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organisations']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          organisation_id: string | null
          full_name: string | null
          role: 'owner' | 'admin' | 'supervisor'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      sites: {
        Row: {
          id: string
          organisation_id: string
          name: string
          address: string | null
          principal_contractor: string | null
          project_number: string | null
          is_active: boolean
          qr_token: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'id' | 'qr_token' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['sites']['Insert']>
      }
      workers: {
        Row: {
          id: string
          organisation_id: string
          full_name: string
          role_trade: string
          employer: string | null
          phone: string | null
          email: string | null
          is_active: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workers']['Insert']>
      }
      worker_sites: {
        Row: { worker_id: string; site_id: string; assigned_at: string }
        Insert: Omit<Database['public']['Tables']['worker_sites']['Row'], 'assigned_at'>
        Update: Partial<Database['public']['Tables']['worker_sites']['Insert']>
      }
      exposure_events: {
        Row: {
          id: string
          organisation_id: string
          worker_id: string
          site_id: string
          task_activity: string
          rpe_type: string | null
          controls_used: string[] | null
          check_in_at: string
          check_out_at: string | null
          duration_hours: number | null
          logged_via: 'qr' | 'manual' | 'supervisor'
          logged_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exposure_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exposure_events']['Insert']>
      }
      fit_tests: {
        Row: {
          id: string
          organisation_id: string
          worker_id: string
          rpe_type: string
          rpe_model: string | null
          test_date: string
          fit_factor: number | null
          result: 'pass' | 'fail' | 'exempt_papr'
          provider: string | null
          next_due_date: string | null
          certificate_url: string | null
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['fit_tests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['fit_tests']['Insert']>
      }
      monitoring_uploads: {
        Row: {
          id: string
          organisation_id: string
          site_id: string | null
          description: string
          file_name: string
          file_url: string
          file_type: string | null
          file_size_bytes: number | null
          monitoring_date: string | null
          provider: string | null
          result_summary: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['monitoring_uploads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['monitoring_uploads']['Insert']>
      }
    }
    Views: {
      worker_fit_test_status: {
        Row: {
          worker_id: string
          full_name: string
          organisation_id: string
          fit_test_id: string | null
          rpe_type: string | null
          test_date: string | null
          next_due_date: string | null
          result: string | null
          status: 'current' | 'expiring_soon' | 'overdue' | 'no_record' | 'exempt'
        }
      }
      worker_exposure_summary: {
        Row: {
          worker_id: string
          organisation_id: string
          total_events: number
          total_hours: number | null
          last_exposure: string | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}

// Convenience row types
export type Organisation = Database['public']['Tables']['organisations']['Row']
export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Site         = Database['public']['Tables']['sites']['Row']
export type Worker       = Database['public']['Tables']['workers']['Row']
export type ExposureEvent = Database['public']['Tables']['exposure_events']['Row']
export type FitTest      = Database['public']['Tables']['fit_tests']['Row']
export type MonitoringUpload = Database['public']['Tables']['monitoring_uploads']['Row']
export type WorkerFitTestStatus = Database['public']['Views']['worker_fit_test_status']['Row']
