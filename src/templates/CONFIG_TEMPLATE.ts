export const CONFIG_TEMPLATE_VITE = `const isProduction = import.meta.env.PRODUCTION === 'true';
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;

export const FRONTEND_URL = isProduction ? supabaseUrl : 'http://localhost:3000';
export const IS_PRODUCTION = isProduction;
export const SUPABASE_URL = supabaseUrl;
`;

export const CONFIG_TEMPLATE_NEXT = `const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const FRONTEND_URL = isProduction ? supabaseUrl : 'http://localhost:3000';
export const IS_PRODUCTION = isProduction;
export const SUPABASE_URL = supabaseUrl;
`;
