export interface AuthConfig {
    providers: {
        google?: {
            enabled: boolean;
            redirectUrl?: string;
        };
        email?: {
            enabled: boolean;
            requireEmailConfirmation?: boolean;
        };
    };
    cache?: {
        enabled: boolean;
        key?: string;
    };
    redirects?: {
        onSuccess?: string;
        onError?: string;
    };
}

export interface AuthUser {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
}

export interface AuthSession {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: AuthUser;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    metadata?: Record<string, any>;
}

export interface AuthState {
    user: AuthUser | null;
    session: AuthSession | null;
    loading: boolean;
    error: Error | null;
}
