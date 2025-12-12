#!/usr/bin/env node

import { createWorkspace, promptWorkspaceOptions } from './commands/create-workspace';
import { createSupabase, promptSupabaseOptions } from './commands/create-supabase';
import type { PackageManager } from './types';
import { detectPackageManager } from './utils/package-manager';

const HELP_TEXT = `
despace - Supabase workspace CLI

Usage:
  despace create workspace <name> [options]
  despace create new-supabase <name> [options]
  despace --help
  despace --version

Commands:
  create workspace <name>       Create a new Supabase monorepo workspace
  create new-supabase <name>    Create a new Supabase instance in current workspace

Options:
  --package-manager <pm>        Package manager to use: yarn or npm (default: yarn)
  --help, -h                    Show help
  --version, -v                 Show version

Examples:
  # Create a new workspace with yarn (default)
  despace create workspace my-workspace

  # Create a new workspace with npm
  despace create workspace my-workspace --package-manager npm

  # Create a new Supabase instance (run from within workspace)
  despace create new-supabase my-app --project-id abc123 --anon-key eyJ...

For more help on specific commands:
  despace create workspace --help
  despace create new-supabase --help
`;

const WORKSPACE_HELP = `
despace create workspace - Create a new Supabase monorepo workspace

Usage:
  despace create workspace <name> [options]

Arguments:
  <name>                        Name of the workspace directory to create

Options:
  --package-manager <pm>        Package manager: yarn or npm (default: yarn)
  --git-url <url>               Git repository URL (optional)
  --app-type <type>             App type: next, vite, or none (default: next)
  --app-name <name>             Name for the app (default: web)
  --no-chat                     Exclude assistant-ui chat components
  --chat-model <model>          Chat model: openai, anthropic, gemini, groq, azure, aws, cohere, ollama (default: openai)
  --chat-theme <theme>          Chat theme: default, minimal, floating (default: default)
  --help, -h                    Show this help

Interactive Mode:
  If no options are provided, the CLI will prompt for configuration.

Examples:
  # Interactive mode
  despace create workspace my-workspace

  # With all options
  despace create workspace my-workspace --package-manager npm --git-url https://github.com/user/repo

  # Without chat
  despace create workspace my-workspace --no-chat

What gets created:
  - Root workspace with package.json and scripts
  - packages/supabase-core: Core Supabase types and client
  - packages/stripe-core: Stripe integration package
  - packages/ui: shadcn/ui component library (with assistant-ui chat)
  - scripts/: Shell scripts for generating Supabase instances
  - apps/example: Example app (if not disabled)
`;

const SUPABASE_HELP = `
despace create new-supabase - Create a new Supabase instance package

Usage:
  despace create new-supabase <name> [options]

Note: This command must be run from within a workspace created with "despace create workspace"

Arguments:
  <name>                        Instance name (lowercase, alphanumeric, hyphens)

Required Options:
  --project-id <id>             Supabase project ID
  --anon-key <key>              Supabase anonymous key

Optional:
  --service-key <key>           Supabase service role key
  --db-password <password>      Database password (for DATABASE_URL auto-generation)
  --database-url <url>          Direct PostgreSQL URL (overrides auto-generation)
  --with-stripe                 Include Stripe integration (enables Drizzle)
  --stripe-secret-key <key>     Stripe secret key
  --stripe-webhook-secret <s>   Stripe webhook secret
  --with-drizzle                Include Drizzle ORM
  --help, -h                    Show this help

Interactive Mode:
  If required options are not provided, the CLI will prompt for them.

Examples:
  # Interactive mode (prompts for all configuration)
  despace create new-supabase my-app

  # With required options
  despace create new-supabase my-app --project-id abc123 --anon-key eyJ... --db-password mypass

  # With Stripe integration
  despace create new-supabase my-app --project-id abc123 --anon-key eyJ... --with-stripe --db-password mypass

What gets created:
  - packages/supabase-<name>: New Supabase instance package
  - Environment configuration (.env files)
  - TypeScript types and client
  - Optional: Drizzle ORM setup with schemas
  - Optional: Stripe integration with Edge Functions
`;

function showHelp() {
    console.log(HELP_TEXT);
}

function showWorkspaceHelp() {
    console.log(WORKSPACE_HELP);
}

function showSupabaseHelp() {
    console.log(SUPABASE_HELP);
}

function showVersion() {
    // Read version from package.json
    const pkg = require('../package.json');
    console.log(`despace v${pkg.version}`);
}

interface ParsedArgs {
    command?: string;
    subcommand?: string;
    name?: string;
    options: Record<string, any>;
}

function parseArgs(args: string[]): ParsedArgs {
    const result: ParsedArgs = {
        options: {}
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            result.options.help = true;
            i++;
        } else if (arg === '--version' || arg === '-v') {
            result.options.version = true;
            i++;
        } else if (arg === '--package-manager') {
            result.options.packageManager = args[i + 1] as PackageManager;
            i += 2;
        } else if (arg === '--git-url') {
            result.options.gitUrl = args[i + 1];
            i += 2;
        } else if (arg === '--app-type') {
            result.options.appType = args[i + 1];
            i += 2;
        } else if (arg === '--app-name') {
            result.options.appName = args[i + 1];
            i += 2;
        } else if (arg === '--no-vite' || arg === '--no-app') {
            result.options.appType = 'none';
            i++;
        } else if (arg === '--project-id') {
            result.options.projectId = args[i + 1];
            i += 2;
        } else if (arg === '--anon-key') {
            result.options.anonKey = args[i + 1];
            i += 2;
        } else if (arg === '--service-key') {
            result.options.serviceKey = args[i + 1];
            i += 2;
        } else if (arg === '--db-password') {
            result.options.dbPassword = args[i + 1];
            i += 2;
        } else if (arg === '--database-url') {
            result.options.databaseUrl = args[i + 1];
            i += 2;
        } else if (arg === '--with-stripe') {
            result.options.withStripe = true;
            i++;
        } else if (arg === '--stripe-secret-key') {
            result.options.stripeSecretKey = args[i + 1];
            i += 2;
        } else if (arg === '--stripe-webhook-secret') {
            result.options.stripeWebhookSecret = args[i + 1];
            i += 2;
        } else if (arg === '--with-drizzle') {
            result.options.withDrizzle = true;
            i++;
        } else if (arg === '--no-chat') {
            result.options.includeChat = false;
            i++;
        } else if (arg === '--chat-model') {
            result.options.chatModel = args[i + 1];
            i += 2;
        } else if (arg === '--chat-theme') {
            result.options.chatTheme = args[i + 1];
            i += 2;
        } else if (!arg.startsWith('--')) {
            // Positional argument
            if (!result.command) {
                result.command = arg;
            } else if (!result.subcommand) {
                result.subcommand = arg;
            } else if (!result.name) {
                result.name = arg;
            }
            i++;
        } else {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
        }
    }

    return result;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showHelp();
        process.exit(0);
    }

    const parsed = parseArgs(args);

    // Handle global flags
    if (parsed.options.version) {
        showVersion();
        process.exit(0);
    }

    if (parsed.options.help && !parsed.command) {
        showHelp();
        process.exit(0);
    }

    // Handle commands
    if (parsed.command === 'create') {
        if (parsed.subcommand === 'workspace') {
            if (parsed.options.help) {
                showWorkspaceHelp();
                process.exit(0);
            }

            if (!parsed.name) {
                console.error('Error: Workspace name is required');
                console.error('Usage: despace create workspace <name> [options]');
                console.error('Run "despace create workspace --help" for more information');
                process.exit(1);
            }

            const packageManager = parsed.options.packageManager || detectPackageManager();

            // Validate package manager
            if (packageManager !== 'yarn' && packageManager !== 'npm') {
                console.error('Error: Invalid package manager. Must be "yarn" or "npm"');
                process.exit(1);
            }

            // If interactive options needed
            if (!parsed.options.gitUrl && parsed.options.appType === undefined) {
                const options = await promptWorkspaceOptions(parsed.name);
                options.packageManager = packageManager;
                // Use CLI overrides if provided
                if (parsed.options.includeChat !== undefined) {
                    options.includeChat = parsed.options.includeChat;
                }
                if (parsed.options.chatModel) {
                    options.chatModel = parsed.options.chatModel;
                }
                if (parsed.options.chatTheme) {
                    options.chatTheme = parsed.options.chatTheme;
                }
                await createWorkspace(options);
            } else {
                await createWorkspace({
                    workspaceName: parsed.name,
                    packageManager,
                    gitUrl: parsed.options.gitUrl,
                    appType: parsed.options.appType || 'next',
                    appName: parsed.options.appName || 'web',
                    includeChat: parsed.options.includeChat,
                    chatModel: parsed.options.chatModel,
                    chatTheme: parsed.options.chatTheme
                });
            }
        } else if (parsed.subcommand === 'new-supabase') {
            if (parsed.options.help) {
                showSupabaseHelp();
                process.exit(0);
            }

            // Name is optional - can be prompted
            // Validate instance name if provided
            if (parsed.name && !/^[a-z0-9-]+$/.test(parsed.name)) {
                console.error('Error: Instance name must contain only lowercase letters, numbers, and hyphens');
                process.exit(1);
            }

            // If required options are missing or name not provided, prompt
            if (!parsed.name || !parsed.options.projectId || !parsed.options.anonKey) {
                const options = await promptSupabaseOptions(parsed.name);
                await createSupabase(options);
            } else {
                await createSupabase({
                    name: parsed.name,
                    projectId: parsed.options.projectId,
                    anonKey: parsed.options.anonKey,
                    serviceKey: parsed.options.serviceKey,
                    dbPassword: parsed.options.dbPassword,
                    databaseUrl: parsed.options.databaseUrl,
                    withStripe: parsed.options.withStripe || false,
                    stripeSecretKey: parsed.options.stripeSecretKey,
                    stripeWebhookSecret: parsed.options.stripeWebhookSecret,
                    withDrizzle: parsed.options.withDrizzle || parsed.options.withStripe || false
                });
            }
        } else {
            console.error(`Error: Unknown subcommand: ${parsed.subcommand}`);
            console.error('Valid subcommands: workspace, new-supabase');
            console.error('Run "despace --help" for more information');
            process.exit(1);
        }
    } else {
        console.error(`Error: Unknown command: ${parsed.command}`);
        console.error('Valid commands: create');
        console.error('Run "despace --help" for more information');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
