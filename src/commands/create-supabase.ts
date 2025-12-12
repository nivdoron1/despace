import path from 'path';
import inquirer from 'inquirer';
import { execa } from 'execa';
import type { CreateSupabaseOptions } from '../types';
import { findWorkspaceRoot, validateWorkspace } from '../utils/workspace-detector';

export async function createSupabase(options: CreateSupabaseOptions): Promise<void> {
    // Find workspace root
    const workspaceInfo = await findWorkspaceRoot();

    if (!workspaceInfo) {
        console.error('Error: Not in a workspace directory.');
        console.error('Please run this command from within a workspace created with "despace create workspace"');
        process.exit(1);
    }

    // Validate workspace
    const isValid = await validateWorkspace(workspaceInfo);
    if (!isValid) {
        console.error('Error: Invalid workspace structure.');
        console.error('Missing required directories or scripts.');
        process.exit(1);
    }

    console.log(`Found workspace: ${workspaceInfo.workspaceName}`);
    console.log(`Workspace root: ${workspaceInfo.rootDir}`);
    console.log('');

    // Build command args for generate-supabase-package.sh
    const scriptPath = path.join(workspaceInfo.rootDir, 'scripts', 'generate-supabase-package.sh');
    const args = [
        options.name,
        '--project-id', options.projectId,
        '--anon-key', options.anonKey,
    ];

    if (options.serviceKey) {
        args.push('--service-key', options.serviceKey);
    }

    if (options.dbPassword) {
        args.push('--db-password', options.dbPassword);
    }

    if (options.databaseUrl) {
        args.push('--database-url', options.databaseUrl);
    }

    if (options.withStripe) {
        args.push('--with-stripe');

        if (options.stripeSecretKey) {
            args.push('--stripe-secret-key', options.stripeSecretKey);
        }

        if (options.stripeWebhookSecret) {
            args.push('--stripe-webhook-secret', options.stripeWebhookSecret);
        }
    }

    if (options.withDrizzle) {
        args.push('--with-drizzle');
    }

    // Execute the script
    console.log('Creating Supabase package...');
    console.log('');

    try {
        await execa(scriptPath, args, {
            cwd: workspaceInfo.rootDir,
            stdio: 'inherit'
        });
    } catch (error) {
        console.error('Error creating Supabase package:', error);
        process.exit(1);
    }
}

export async function promptSupabaseOptions(name?: string): Promise<CreateSupabaseOptions> {

    // 2. Define the questions array
    const questions: any[] = [];

    // 3. If name is not provided, add the name prompt to the beginning
    if (!name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'Package name:',
            default: 'supabase', // Default value as requested
            validate: (input: string) => input.length > 0 || 'Package name is required'
        });
    }

    // 4. Add the rest of the existing questions
    questions.push(
        {
            type: 'input',
            name: 'projectId',
            message: 'Supabase project ID:',
            validate: (input: string) => input.length > 0 || 'Project ID is required'
        },
        {
            type: 'input',
            name: 'anonKey',
            message: 'Supabase anonymous key:',
            validate: (input: string) => input.length > 0 || 'Anonymous key is required'
        },
        {
            type: 'input',
            name: 'serviceKey',
            message: 'Supabase service role key (optional):',
        },
        {
            type: 'input',
            name: 'dbPassword',
            message: 'Database password (optional, for auto-generating DATABASE_URL):',
        },
        {
            type: 'input',
            name: 'databaseUrl',
            message: 'Direct DATABASE_URL (optional, overrides auto-generation):',
        },
        {
            type: 'confirm',
            name: 'withStripe',
            message: 'Include Stripe integration?',
            default: false
        },
        {
            type: 'input',
            name: 'stripeSecretKey',
            message: 'Stripe secret key (optional):',
            when: (answers: any) => answers.withStripe
        },
        {
            type: 'input',
            name: 'stripeWebhookSecret',
            message: 'Stripe webhook secret (optional):',
            when: (answers: any) => answers.withStripe
        },
        {
            type: 'confirm',
            name: 'withDrizzle',
            message: 'Include Drizzle ORM? (automatically enabled with Stripe)',
            default: false,
            when: (answers: any) => !answers.withStripe
        }
    );

    const answers = await inquirer.prompt(questions);

    return {
        // 5. Use the passed argument OR the prompt answer
        name: name || answers.name,
        projectId: answers.projectId,
        anonKey: answers.anonKey,
        serviceKey: answers.serviceKey || undefined,
        dbPassword: answers.dbPassword || undefined,
        databaseUrl: answers.databaseUrl || undefined,
        withStripe: answers.withStripe,
        stripeSecretKey: answers.stripeSecretKey || undefined,
        stripeWebhookSecret: answers.stripeWebhookSecret || undefined,
        withDrizzle: answers.withStripe || answers.withDrizzle
    };
}