export const INDEX_TEMPLATE = `export { supabase } from './client';
export { FRONTEND_URL, IS_PRODUCTION, SUPABASE_URL } from './config';
`;

export const INDEX_TEMPLATE_WITH_STRIPE = `export { supabase } from './client';
export { FRONTEND_URL, IS_PRODUCTION, SUPABASE_URL } from './config';
export * from './lib/stripe';
`;
