import { AuthConfig } from "../../types/auth";
import { SupabaseClient } from '@supabase/supabase-js';

export interface LoginProps {
  supabaseClient: SupabaseClient;
  config?: AuthConfig;
  onSuccess?: (user: any) => void;
  onError?: (error: Error) => void;
  showGoogleLogin?: boolean;
}