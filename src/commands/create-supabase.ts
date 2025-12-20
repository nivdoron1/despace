import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { execa } from 'execa';
import type { CreateSupabaseOptions, SupabaseFramework } from '../types';
import { findWorkspaceRoot, validateWorkspace } from '../utils/workspace-detector';
import { DATABASE_SERVICE_TEMPLATE } from '../templates/DATABASE_SERVICE_TEMPLATE';
import { DATABASE_TYPES_TEMPLATE } from '../templates/DATABASE_TYPES_TEMPLATE';
import { CLIENT_TEMPLATE_VITE, CLIENT_TEMPLATE_NEXT } from '../templates/CLIENT_TEMPLATE';
import { CONFIG_TEMPLATE_VITE, CONFIG_TEMPLATE_NEXT } from '../templates/CONFIG_TEMPLATE';
import { INDEX_TEMPLATE, INDEX_TEMPLATE_WITH_STRIPE } from '../templates/INDEX_TEMPLATE';
import { VITE_ENV_TEMPLATE } from '../templates/VITE_ENV_TEMPLATE';
import { NEXT_ENV_TEMPLATE } from '../templates/NEXT_ENV_TEMPLATE';
import { generateEnvExampleVite, generateEnvExampleNext } from '../templates/ENV_EXAMPLE_TEMPLATE';
import { ESLINT_CONFIG_TEMPLATE } from '../templates/ESLINT_CONFIG_TEMPLATE';

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
        console.error('Missing required packages/ directory.');
        process.exit(1);
    }

    console.log(`Found workspace: ${workspaceInfo.workspaceName}`);
    console.log(`Workspace root: ${workspaceInfo.rootDir}`);
    console.log('');

    const instanceName = options.name;
    const packageName = `@${workspaceInfo.workspaceName}/supabase-${instanceName}`;
    const packageDir = path.join(workspaceInfo.rootDir, 'packages', `supabase-${instanceName}`);
    const supabaseUrl = `https://${options.projectId}.supabase.co`;

    // Check if package already exists
    if (await fs.pathExists(packageDir)) {
        console.error(`Error: Package already exists at ${packageDir}`);
        process.exit(1);
    }

    // Auto-generate DATABASE_URL if password provided
    let databaseUrl = options.databaseUrl;
    if (options.dbPassword && !databaseUrl) {
        databaseUrl = `postgresql://postgres.${options.projectId}:${options.dbPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`;
        console.log('Auto-generated DATABASE_URL');
    }

    console.log(`Creating: ${instanceName}`);
    console.log(`Project ID: ${options.projectId}`);
    console.log(`URL: ${supabaseUrl}`);
    if (options.withStripe) console.log('Stripe: Enabled');
    if (options.withDrizzle) console.log('Drizzle: Enabled');
    console.log('');

    // Create package structure
    console.log('Creating package structure...');
    await fs.mkdirp(path.join(packageDir, 'src'));

    // Create package.json
    const pkgJson: any = {
        name: packageName,
        version: '1.0.0',
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
            build: 'tsc',
            dev: 'tsc --watch',
            'db:push': 'npx drizzle-kit generate && sleep 3 && npx supabase db push',
            'db:types': `npx supabase gen types typescript --project-id ${options.projectId} > src/database.types.ts`,
            'db:generate': 'yarn db:types && despace generate supabase-types ./src/database.types.ts',
            'db:master': 'yarn db:push && yarn db:generate',
            'add-stripe': 'despace generate supabase-stripe .',
            'lint': 'tsc --noEmit && eslint .',
            'drizzle:generate': 'drizzle-kit generate',
            'drizzle:push': 'drizzle-kit push',
            'drizzle:studio': 'drizzle-kit studio'
        },
        dependencies: {
            '@supabase/supabase-js': '^2.84.0',
            'dotenv': '^16.4.5',
            'postgres': '^3.4.4'
        },
        devDependencies: {
            '@eslint/js': '^9.39.2',
            '@types/eslint': '^8.56.10',
            '@types/node': '^20.12.7',
            'drizzle-kit': '^0.30.1',
            'eslint': '^8.57.0',
            'globals': '^16.5.0',
            'typescript': '^5.3.0',
            'typescript-eslint': '^8.50.0'
        }
    };

    if (options.withStripe) {
    }

    if (options.withDrizzle) {
        pkgJson.dependencies['drizzle-orm'] = '^0.38.2';
        pkgJson.devDependencies['drizzle-kit'] = '^0.30.1';
        // drizzle scripts already added above
    }

    await fs.writeJson(path.join(packageDir, 'package.json'), pkgJson, { spaces: 2 });

    // Create tsconfig.json
    const tsConfig = {
        compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            lib: ['ES2020', 'DOM'],
            declaration: true,
            outDir: './dist',
            rootDir: './src',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            moduleResolution: 'bundler',
            resolveJsonModule: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
    };
    await fs.writeJson(path.join(packageDir, 'tsconfig.json'), tsConfig, { spaces: 2 });

    // Create eslint.config.js
    await fs.writeFile(path.join(packageDir, 'eslint.config.js'), ESLINT_CONFIG_TEMPLATE);

    // Create .env file (framework-aware)
    const isVite = options.framework === 'vite';
    const urlVarName = isVite ? 'VITE_PUBLIC_SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL';
    const keyVarName = isVite ? 'VITE_PUBLIC_SUPABASE_ANON_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

    let envContent = `# Supabase ${instanceName} Configuration
${urlVarName}="${supabaseUrl}"
${keyVarName}="${options.anonKey}"
`;
    if (options.serviceKey) {
        envContent += `SUPABASE_SERVICE_ROLE_KEY="${options.serviceKey}"\n`;
    }
    if (databaseUrl) {
        envContent += `DATABASE_URL="${databaseUrl}"\n`;
    }
    if (options.withStripe) {
        envContent += `\n# Stripe Configuration\n`;
        envContent += `STRIPE_SECRET_KEY="${options.stripeSecretKey || ''}"\n`;
        envContent += `STRIPE_WEBHOOK_SECRET="${options.stripeWebhookSecret || ''}"\n`;
    }
    await fs.writeFile(path.join(packageDir, '.env'), envContent);

    // Create .env.example with instructions
    const envExample = isVite
        ? generateEnvExampleVite(options.withStripe)
        : generateEnvExampleNext(options.withStripe);
    await fs.writeFile(path.join(packageDir, '.env.example'), envExample);

    // Create source files
    await fs.writeFile(path.join(packageDir, 'src', 'database.types.ts'), DATABASE_TYPES_TEMPLATE);
    await fs.writeFile(path.join(packageDir, 'src', 'database.service.ts'), DATABASE_SERVICE_TEMPLATE);

    // Create client.ts (framework-aware)
    const clientTemplate = isVite ? CLIENT_TEMPLATE_VITE : CLIENT_TEMPLATE_NEXT;
    await fs.writeFile(
        path.join(packageDir, 'src', 'client.ts'),
        clientTemplate.replace(/\{\{WORKSPACE_NAME\}\}/g, workspaceInfo.workspaceName)
    );

    // Create config.ts (framework-aware)
    const configTemplate = isVite ? CONFIG_TEMPLATE_VITE : CONFIG_TEMPLATE_NEXT;
    await fs.writeFile(path.join(packageDir, 'src', 'config.ts'), configTemplate);

    // Create env type declarations (framework-aware)
    const envTemplate = isVite ? VITE_ENV_TEMPLATE : NEXT_ENV_TEMPLATE;
    const envFileName = isVite ? 'vite-env.d.ts' : 'next-env.d.ts';
    await fs.writeFile(path.join(packageDir, 'src', envFileName), envTemplate);

    // Create index.ts
    const indexTemplate = options.withStripe ? INDEX_TEMPLATE_WITH_STRIPE : INDEX_TEMPLATE;
    const indexContent = indexTemplate.replace(/\{\{WORKSPACE_NAME\}\}/g, workspaceInfo.workspaceName);
    await fs.writeFile(path.join(packageDir, 'src', 'index.ts'), indexContent);

    // Drizzle setup
    if (options.withDrizzle) {
        console.log('Setting up Drizzle ORM...');
        await fs.mkdirp(path.join(packageDir, 'src', 'db', 'public'));

        // Create basic public schema
        const publicSchema = `import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  updated_at: timestamp('updated_at').defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
});
`;
        await fs.writeFile(path.join(packageDir, 'src', 'db', 'public', 'schema.ts'), publicSchema);

        // Create db/schema.ts
        const dbSchema = `import * as publicSchema from './public/schema';

export const schema = { ...publicSchema };
`;
        await fs.writeFile(path.join(packageDir, 'src', 'db', 'schema.ts'), dbSchema);

        // Create drizzle.config.ts
        const drizzleConfig = `import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
        await fs.writeFile(path.join(packageDir, 'drizzle.config.ts'), drizzleConfig);
    }

    // Create README
    const readme = `# ${packageName}

Supabase client package for ${instanceName}.

## Setup

1. Install dependencies:
   \`\`\`bash
   yarn install
   \`\`\`

2. Generate database types:
   \`\`\`bash
   yarn db:types
   \`\`\`

3. Build:
   \`\`\`bash
   yarn build
   \`\`\`

## Usage

\`\`\`typescript
import { createClient } from '${packageName}';

const supabase = createClient();
\`\`\`
`;
    await fs.writeFile(path.join(packageDir, 'README.md'), readme);

    console.log('✓ Package structure created');

    // Install dependencies
    console.log('Installing dependencies...');
    try {
        await execa('yarn', ['install'], {
            cwd: packageDir,
            stdio: 'inherit'
        });
        console.log('✓ Dependencies installed');

        // Run Stripe generator if enabled
        if (options.withStripe) {
            console.log('Running Stripe generator...');
            await execa('despace', ['generate', 'supabase-stripe', '.'], {
                cwd: packageDir,
                stdio: 'inherit'
            });
            console.log('✓ Stripe validation complete');
        }

    } catch (error) {
        console.warn('Warning: Failed to install dependencies. Run yarn install manually.');
    }

    console.log('');
    console.log(`🎉 Success: ${instanceName}`);
    console.log('');
    console.log(`Package: ${packageName}`);
    console.log(`Location: ${packageDir}`);
    console.log('');
    console.log('Next steps:');
    console.log(`  1. cd ${path.relative(workspaceInfo.rootDir, packageDir)}`);
    console.log('  2. yarn db:types');
    console.log('  3. yarn build');
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
        },
        {
            type: 'list',
            name: 'framework',
            message: 'Target framework:',
            choices: [
                { name: 'Vite', value: 'vite' },
                { name: 'Next.js', value: 'next' }
            ],
            default: 'vite'
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
        withDrizzle: answers.withStripe || answers.withDrizzle,
        framework: answers.framework as SupabaseFramework
    };
}