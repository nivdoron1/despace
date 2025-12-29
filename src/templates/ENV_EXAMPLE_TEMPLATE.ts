export function generateEnvExampleVite(withStripe: boolean): string {
    let content = `# Supabase Configuration
# Find these values in your Supabase project dashboard:
# https://supabase.com/dashboard/project/_/settings/api

VITE_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (for server-side operations only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Database URL (find in Settings > Database > Connection string > URI)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
`;

    if (withStripe) {
        content += `
# Stripe Configuration
# Find these in your Stripe dashboard: https://dashboard.stripe.com/apikeys
VITE_PUBLIC_STRIPE_SECRET_KEY=sk_live_...
VITE_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_...
`;
    }

    return content;
}

export function generateEnvExampleNext(withStripe: boolean): string {
    let content = `# Supabase Configuration
# Find these values in your Supabase project dashboard:
# https://supabase.com/dashboard/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (for server-side operations only, never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Database URL (find in Settings > Database > Connection string > URI)
DATABASE_URL=postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
`;

    if (withStripe) {
        content += `
# Stripe Configuration
# Find these in your Stripe dashboard: https://dashboard.stripe.com/apikeys
VITE_PUBLIC_STRIPE_SECRET_KEY=sk_live_...
VITE_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_...
`;
    }

    return content;
}
