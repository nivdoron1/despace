export const NEXT_ENV_TEMPLATE = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare namespace NodeJS {
    interface ProcessEnv {
        readonly NEXT_PUBLIC_SUPABASE_URL: string;
        readonly NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
        readonly SUPABASE_SERVICE_ROLE_KEY?: string;
        readonly DATABASE_URL?: string;
        readonly STRIPE_SECRET_KEY?: string;
        readonly STRIPE_WEBHOOK_SECRET?: string;
    }
}
`;
