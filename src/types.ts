export type PackageManager = 'yarn' | 'npm';
export type AppType = 'next' | 'vite' | 'none';
export type ChatModel = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'azure' | 'aws' | 'cohere' | 'ollama' | 'none';
export type ChatTheme = 'default' | 'minimal' | 'floating';

export interface CreateWorkspaceOptions {
    workspaceName: string;
    packageManager: PackageManager;
    gitUrl?: string;
    appType: AppType;
    appName?: string;
    includeChat?: boolean;
    chatModel?: ChatModel;
    chatTheme?: ChatTheme;
}

export interface CreateSupabaseOptions {
    name: string;
    projectId: string;
    anonKey: string;
    serviceKey?: string;
    dbPassword?: string;
    databaseUrl?: string;
    withStripe: boolean;
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
    withDrizzle: boolean;
}

export interface WorkspaceInfo {
    rootDir: string;
    workspaceName: string;
    packageJson: any;
}

// Chat model environment variable mapping
export const CHAT_ENV_VARS: Record<ChatModel, string[]> = {
    openai: ['OPENAI_API_KEY'],
    anthropic: ['ANTHROPIC_API_KEY'],
    gemini: ['GOOGLE_GENERATIVE_AI_API_KEY'],
    groq: ['GROQ_API_KEY'],
    azure: ['AZURE_RESOURCE_NAME', 'AZURE_API_KEY'],
    aws: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    cohere: ['COHERE_API_KEY'],
    ollama: [],
    none: []
};
