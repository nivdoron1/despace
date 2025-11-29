export type PackageManager = 'yarn' | 'npm';

export interface CreateWorkspaceOptions {
    workspaceName: string;
    packageManager: PackageManager;
    gitUrl?: string;
    createVite: boolean;
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
