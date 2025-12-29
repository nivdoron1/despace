export const CORS_UTIL_TEMPLATE = `// CORS utility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
`;

export const CORE_STRIPE_SERVICE_TEMPLATE = `import Stripe from 'stripe';
import {
    StripeServiceConfig,
    WebhookVerificationResult,
    PaginationParams
} from './core-types';

// =================================================================
// Utility Functions (Pure Helpers)
// =================================================================

/**
 * Normalizes pagination parameters for Stripe
 */
export function normalizePagination(params?: PaginationParams): Stripe.PaginationParams {
    return {
        limit: params?.limit || 10,
        starting_after: params?.starting_after,
        ending_before: params?.ending_before,
    };
}

// =================================================================
// Core Stripe Functions (Dependency-Injected)
// =================================================================

// --- Customer Operations ---

export async function createCustomer(
    stripe: Stripe,
    params: Stripe.CustomerCreateParams
): Promise<Stripe.Customer> {
    try {
        return await stripe.customers.create(params);
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
}

export async function getCustomer(
    stripe: Stripe,
    customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
}

export async function updateCustomer(
    stripe: Stripe,
    customerId: string,
    params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
    return await stripe.customers.update(customerId, params);
}

/**
 * List Customers (Paginated)
 * Returns a specific page of results.
 */
export async function listCustomers(
    stripe: Stripe,
    params?: Stripe.CustomerListParams
): Promise<Stripe.ApiList<Stripe.Customer>> {
    return await stripe.customers.list(params);
}

/**
 * List ALL Customers (Auto-Pagination)
 * WARNING: heavy operation.
 */
export async function listAllCustomers(
    stripe: Stripe,
    limit: number = 10000
): Promise<Stripe.Customer[]> {
    return await stripe.customers.list({ limit: 100 })
        .autoPagingToArray({ limit });
}

// --- Product & Price Operations ---

export async function createProduct(
    stripe: Stripe,
    params: Stripe.ProductCreateParams
): Promise<Stripe.Product> {
    return await stripe.products.create(params);
}

export async function listProducts(
    stripe: Stripe,
    params?: Stripe.ProductListParams
): Promise<Stripe.ApiList<Stripe.Product>> {
    return await stripe.products.list(params);
}

export async function listAllActiveProducts(
    stripe: Stripe
): Promise<Stripe.Product[]> {
    return await stripe.products.list({ active: true, limit: 100 })
        .autoPagingToArray({ limit: 1000 });
}

export async function createPrice(
    stripe: Stripe,
    params: Stripe.PriceCreateParams
): Promise<Stripe.Price> {
    return await stripe.prices.create(params);
}

// --- Subscription Operations ---

export async function createSubscription(
    stripe: Stripe,
    params: Stripe.SubscriptionCreateParams
): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.create(params);
}

export async function cancelSubscription(
    stripe: Stripe,
    subscriptionId: string
): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.cancel(subscriptionId);
}

export async function listCustomerSubscriptions(
    stripe: Stripe,
    customerId: string,
    params?: PaginationParams
): Promise<Stripe.ApiList<Stripe.Subscription>> {
    const paging = normalizePagination(params);
    return await stripe.subscriptions.list({
        customer: customerId,
        ...paging
    });
}

// --- Checkout & Payments ---

export async function createCheckoutSession(
    stripe: Stripe,
    params: Stripe.Checkout.SessionCreateParams
): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create(params);
}

export async function getCheckoutSession(
    stripe: Stripe,
    sessionId: string
): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.retrieve(sessionId);
}

export async function createPaymentIntent(
    stripe: Stripe,
    params: Stripe.PaymentIntentCreateParams
): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create(params);
}

// --- Invoice Operations ---

export async function listInvoices(
    stripe: Stripe,
    params?: Stripe.InvoiceListParams
): Promise<Stripe.ApiList<Stripe.Invoice>> {
    return await stripe.invoices.list(params);
}

// --- Webhooks & Utilities ---

export function verifyWebhookSignature(
    stripe: Stripe,
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
): WebhookVerificationResult {
    try {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            webhookSecret
        );
        return { event };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { event: null, error: errorMessage };
    }
}

// =================================================================
// Service Factory
// =================================================================

/**
 * Creates a Stripe service object with methods pre-bound to a specific
 * Stripe client instance.
 * * @param config Configuration object or API Key string
 */
export function createStripeService(
    config?: StripeServiceConfig | string
) {
    // 1. Initialize Client
    let secretKey: string;
    let apiVersion: Stripe.LatestApiVersion | undefined;

    if (typeof config === 'string') {
        secretKey = config;
    } else if (config) {
        secretKey = config.secretKey;
        apiVersion = config.apiVersion;
    } else {
        secretKey = import.meta.env.VITE_PUBLIC_STRIPE_SECRET_KEY || '';
    }

    if (!secretKey) throw new Error('Stripe secret key is required.');

    const stripe = new Stripe(secretKey, {
        typescript: true,
        apiVersion: apiVersion,
    });

    // 2. Return Bound Methods
    return {
        // Utils
        getClient: () => stripe,

        // Customer
        createCustomer: (params: Stripe.CustomerCreateParams) =>
            createCustomer(stripe, params),
        getCustomer: (id: string) =>
            getCustomer(stripe, id),
        updateCustomer: (id: string, params: Stripe.CustomerUpdateParams) =>
            updateCustomer(stripe, id, params),
        listCustomers: (params?: Stripe.CustomerListParams) =>
            listCustomers(stripe, params),
        listAllCustomers: (limit?: number) =>
            listAllCustomers(stripe, limit),

        // Product & Price
        createProduct: (params: Stripe.ProductCreateParams) =>
            createProduct(stripe, params),
        listProducts: (params?: Stripe.ProductListParams) =>
            listProducts(stripe, params),
        listAllActiveProducts: () =>
            listAllActiveProducts(stripe),
        createPrice: (params: Stripe.PriceCreateParams) =>
            createPrice(stripe, params),

        // Subscription
        createSubscription: (params: Stripe.SubscriptionCreateParams) =>
            createSubscription(stripe, params),
        cancelSubscription: (id: string) =>
            cancelSubscription(stripe, id),
        listCustomerSubscriptions: (customerId: string, params?: PaginationParams) =>
            listCustomerSubscriptions(stripe, customerId, params),

        // Checkout
        createCheckoutSession: (params: Stripe.Checkout.SessionCreateParams) =>
            createCheckoutSession(stripe, params),
        getCheckoutSession: (id: string) =>
            getCheckoutSession(stripe, id),
        createPaymentIntent: (params: Stripe.PaymentIntentCreateParams) =>
            createPaymentIntent(stripe, params),

        // Invoice
        listInvoices: (params?: Stripe.InvoiceListParams) =>
            listInvoices(stripe, params),

        // Webhook
        verifyWebhookSignature: (payload: string | Buffer, sig: string, secret: string) =>
            verifyWebhookSignature(stripe, payload, sig, secret),
    };
}
`;

export const CORE_STRIPE_TYPES_TEMPLATE = `import Stripe from 'stripe';

// Re-export commonly used Stripe types for convenience
export type { Stripe };

// Webhook event types
export type StripeWebhookEvent = Stripe.Event;

// Customer types
export type StripeCustomer = Stripe.Customer;
export type StripeCustomerCreateParams = Stripe.CustomerCreateParams;

// Checkout session types
export type StripeCheckoutSession = Stripe.Checkout.Session;

// Subscription types
export type StripeSubscription = Stripe.Subscription;

// Product types
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;

// Payment Intent types
export type StripePaymentIntent = Stripe.PaymentIntent;

// Webhook signature verification result
export interface WebhookVerificationResult {
    event: StripeWebhookEvent | null;
    error?: string;
}

// Configuration for Stripe service
export interface StripeServiceConfig {
    secretKey: string;
    apiVersion?: Stripe.LatestApiVersion;
}

// Wrapper for standard pagination parameters
export interface PaginationParams {
    limit?: number;
    starting_after?: string;
    ending_before?: string;
}
`;

export const STRIPE_SERVICE_TEMPLATE = `import { createStripeService } from './core';

/**
 * A pre-configured service object for interacting
 * with the 'stripe' service.
 *
 * This object contains all generic CRUD methods.
 */
export const stripeService = {
  ...createStripeService({
    secretKey: import.meta.env.VITE_PUBLIC_STRIPE_SECRET_KEY || '',
  }),

  // --- Add custom methods below ---
  //
  // Example custom method:
  // async getSubscriptionStatus(subscriptionId: string) {
  //   const subscription = await this.client.subscriptions.retrieve(subscriptionId);
  //   return subscription.status;
  // }
  //
  // --- End custom methods ---
};
`;

export const STRIPE_TYPES_TEMPLATE = `// Re-export types from the core package or define custom ones here
export type { Stripe } from 'stripe';

export interface StripeServiceConfig {
  secretKey: string;
}
`;

export const STRIPE_INDEX_TEMPLATE = `export * from './stripe.service';
export * from './stripe.types';
`;

export const WEBHOOK_HANDLER_TEMPLATE = `// Stripe Webhook Handler
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('VITE_PUBLIC_STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('VITE_PUBLIC_STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Webhook verified:', event.type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id);

        // Update user metadata with Stripe customer ID
        if (session.client_reference_id && session.customer) {
          await supabase.auth.admin.updateUserById(session.client_reference_id, {
            user_metadata: {
              stripe_customer_id: session.customer,
            },
          });

          // Create subscription record
          await supabase.from('subscriptions').upsert({
            user_id: session.client_reference_id,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            status: 'active',
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription event:', subscription.id);

        await supabase.from('subscriptions').upsert({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }, {
          onConflict: 'stripe_subscription_id',
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);

        await supabase.from('subscriptions').update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded:', invoice.id);

        if (invoice.subscription) {
          await supabase.from('subscriptions').update({
            status: 'active',
            last_payment_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed:', invoice.id);

        if (invoice.subscription) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
          }).eq('stripe_subscription_id', invoice.subscription);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
`;

export const CREATE_CHECKOUT_TEMPLATE = `// Create Checkout Session
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('VITE_PUBLIC_STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'priceId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';

    // Check if user already has a Stripe customer ID
    let customerId = user.user_metadata?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user metadata
      const supabaseAdmin = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { stripe_customer_id: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: \`\${ frontendUrl } / success ? session_id = { CHECKOUT_SESSION_ID }\`,
      cancel_url: \`\${ frontendUrl } / pricing\`,
      metadata: {
      supabase_user_id: user.id,
    },
    });

return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
  } catch (error) {
  console.error('Error:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
});
`;

export const SYNC_CUSTOMER_TEMPLATE = `// Sync Stripe Customer
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('VITE_PUBLIC_STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let customerId = user.user_metadata?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user metadata
      const supabaseAdmin = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { stripe_customer_id: customerId },
      });
    }

    // Fetch subscription status
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    return new Response(JSON.stringify({
      customerId,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      } : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
`;

export const CUSTOMER_PORTAL_TEMPLATE = `// Customer Portal
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('VITE_PUBLIC_STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = user.user_metadata?.stripe_customer_id;
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: \`\${ frontendUrl } / account\`,
    });

return new Response(JSON.stringify({ url: session.url }), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
  } catch (error) {
  console.error('Error:', error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
});
`;
