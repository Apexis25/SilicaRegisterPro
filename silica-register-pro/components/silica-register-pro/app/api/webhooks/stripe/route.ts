import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_FOUNDING_BETA ?? '']: 'founding_beta',
  [process.env.STRIPE_PRICE_STARTER ?? '']:       'starter',
  [process.env.STRIPE_PRICE_GROWTH ?? '']:        'growth',
  [process.env.STRIPE_PRICE_PRO ?? '']:           'pro',
}

const PLAN_LIMITS: Record<string, { max_workers: number; max_sites: number }> = {
  founding_beta: { max_workers: 50,  max_sites: 5  },
  starter:       { max_workers: 25,  max_sites: 3  },
  growth:        { max_workers: 100, max_sites: 10 },
  pro:           { max_workers: 500, max_sites: 50 },
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      // ── New subscription ────────────────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price.id ?? ''
        const plan = PLAN_MAP[priceId] ?? 'starter'
        const limits = PLAN_LIMITS[plan]
        const status = sub.status === 'active' ? 'active'
                     : sub.status === 'trialing' ? 'trialing'
                     : sub.status === 'past_due' ? 'past_due'
                     : 'canceled'

        await supabase
          .from('organisations')
          .update({
            stripe_subscription_id: sub.id,
            stripe_customer_id:     sub.customer as string,
            plan,
            plan_status: status,
            max_workers: limits.max_workers,
            max_sites:   limits.max_sites,
            trial_ends_at: sub.trial_end
              ? new Date(sub.trial_end * 1000).toISOString()
              : null,
          })
          .eq('stripe_customer_id', sub.customer as string)

        console.log(`[stripe-webhook] subscription ${event.type} → plan=${plan} status=${status}`)
        break
      }

      // ── Subscription cancelled ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('organisations')
          .update({ plan_status: 'canceled' })
          .eq('stripe_subscription_id', sub.id)

        console.log(`[stripe-webhook] subscription deleted → ${sub.id}`)
        break
      }

      // ── New customer (checkout completed) ───────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId = session.metadata?.organisation_id
        if (orgId) {
          await supabase
            .from('organisations')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', orgId)
        }
        break
      }

      // ── Invoice paid / payment failed ───────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase
          .from('organisations')
          .update({ plan_status: 'active' })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase
          .from('organisations')
          .update({ plan_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string)
        break
      }

      default:
        console.log(`[stripe-webhook] unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[stripe-webhook] handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
