import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import { findWorkspaceRoot } from '../utils/workspace-detector';
import {
    CORS_UTIL_TEMPLATE,
    STRIPE_SERVICE_TEMPLATE,
    STRIPE_TYPES_TEMPLATE,
    STRIPE_INDEX_TEMPLATE,
    WEBHOOK_HANDLER_TEMPLATE,
    CREATE_CHECKOUT_TEMPLATE,
    SYNC_CUSTOMER_TEMPLATE,
    CUSTOMER_PORTAL_TEMPLATE,
    CORE_STRIPE_SERVICE_TEMPLATE,
    CORE_STRIPE_TYPES_TEMPLATE
} from '../templates/STRIPE_TEMPLATES';

const FUNCTIONS = [
    { name: 'stripe-webhook-handler', description: 'Handles all Stripe webhook events' },
    { name: 'create-checkout-session', description: 'Creates Stripe checkout sessions' },
    { name: 'sync-stripe-customer', description: 'Syncs Stripe customer with Supabase Auth user' },
    { name: 'get-customer-portal', description: 'Creates Stripe customer portal session' },
];

export async function generateSupabaseStripe(targetDirArg: string): Promise<void> {
    const targetDir = path.isAbsolute(targetDirArg)
        ? targetDirArg
        : path.resolve(process.cwd(), targetDirArg);

    console.log(`🚀 Starting Comprehensive Stripe + Supabase Generator...`);
    console.log(`Target directory: ${targetDir}`);

    try {
        await ensureTargetDirectory(targetDir);

        // Check if we are in a valid workspace to replace placeholders
        const workspaceInfo = await findWorkspaceRoot();
        const workspaceName = workspaceInfo ? workspaceInfo.workspaceName : 'supabase-workspace';

        await initializeSupabaseProject(targetDir);

        // 1. Generate Edge Functions
        for (const func of FUNCTIONS) {
            await createFunction(targetDir, func.name);
            await generateFunctionContent(targetDir, func.name);
        }
        await createSharedUtils(targetDir);

        // 2. Generate Client Service
        await createClientStripeService(targetDir, workspaceName);

        // 3. Install dependencies
        await installDependencies(targetDir);

        printCompletionMessage();
    } catch (error: any) {
        console.error('\n❌ Generation failed:', error.message);
        process.exit(1);
    }
}

async function ensureTargetDirectory(targetDir: string) {
    console.log(`📂 Checking target directory: ${targetDir}`);
    if (!await fs.pathExists(targetDir)) {
        await fs.mkdirp(targetDir);
    }
    console.log('   ✓ Target directory ready\n');
}

async function initializeSupabaseProject(targetDir: string) {
    console.log('🔧 Initializing Supabase project...');
    const supabaseConfigPath = path.join(targetDir, 'supabase');
    if (await fs.pathExists(supabaseConfigPath)) {
        console.log('   ⏩ Supabase already initialized\n');
        return;
    }
    try {
        await execa('npx', ['supabase', 'init'], { cwd: targetDir, stdio: 'inherit' });
        console.log('   ✓ Supabase project initialized\n');
    } catch (error: any) {
        throw new Error(`Failed to initialize: ${error.message}`);
    }
}

async function createFunction(targetDir: string, functionName: string) {
    console.log(`🔨 Creating function: ${functionName}...`);
    const functionPath = path.join(targetDir, 'supabase', 'functions', functionName);
    if (await fs.pathExists(functionPath)) {
        console.log('   ⏩ Function exists, will overwrite...\n');
        return;
    }
    try {
        await execa('npx', ['supabase', 'functions', 'new', functionName], { cwd: targetDir, stdio: 'inherit' });
        console.log('   ✓ Function created\n');
    } catch (error: any) {
        throw new Error(`Failed to create ${functionName}: ${error.message}`);
    }
}

async function generateFunctionContent(targetDir: string, functionName: string) {
    console.log(`✍️  Generating ${functionName} content...`);
    const functionFilePath = path.join(targetDir, 'supabase', 'functions', functionName, 'index.ts');
    let content = '';

    switch (functionName) {
        case 'stripe-webhook-handler':
            content = WEBHOOK_HANDLER_TEMPLATE;
            break;
        case 'create-checkout-session':
            content = CREATE_CHECKOUT_TEMPLATE;
            break;
        case 'sync-stripe-customer':
            content = SYNC_CUSTOMER_TEMPLATE;
            break;
        case 'get-customer-portal':
            content = CUSTOMER_PORTAL_TEMPLATE;
            break;
        default:
            throw new Error(`Unknown function: ${functionName}`);
    }

    await fs.writeFile(functionFilePath, content, 'utf8');
    console.log('   ✓ Content written\n');
}

async function createSharedUtils(targetDir: string) {
    console.log('📦 Creating shared utilities...');
    const utilsPath = path.join(targetDir, 'supabase', 'functions', '_shared');
    if (!await fs.pathExists(utilsPath)) {
        await fs.mkdirp(utilsPath);
    }
    await fs.writeFile(path.join(utilsPath, 'cors.ts'), CORS_UTIL_TEMPLATE, 'utf8');
    console.log('   ✓ Shared utilities created\n');
}

async function createClientStripeService(targetDir: string, workspaceName: string) {
    console.log('🛍️  Creating Client/Server Stripe Service...');
    const servicePath = path.join(targetDir, 'src', 'lib', 'stripe');

    if (!await fs.pathExists(servicePath)) {
        await fs.mkdirp(servicePath);
    }


    // 1. core-types.ts (Create types first as core depends on it)
    await fs.writeFile(path.join(servicePath, 'core-types.ts'), CORE_STRIPE_TYPES_TEMPLATE, 'utf8');

    // 2. core.ts
    await fs.writeFile(path.join(servicePath, 'core.ts'), CORE_STRIPE_SERVICE_TEMPLATE, 'utf8');

    // 3. stripe.service.ts
    // Use the template directly (no replacement needed as it imports from ./core)
    await fs.writeFile(path.join(servicePath, 'stripe.service.ts'), STRIPE_SERVICE_TEMPLATE, 'utf8');

    // 4. stripe.types.ts
    await fs.writeFile(path.join(servicePath, 'stripe.types.ts'), STRIPE_TYPES_TEMPLATE, 'utf8');

    // 3. index.ts
    await fs.writeFile(path.join(servicePath, 'index.ts'), STRIPE_INDEX_TEMPLATE, 'utf8');

    console.log('   ✓ src/lib/stripe service created\n');
}

async function installDependencies(targetDir: string) {
    console.log('📦 Installing dependencies...');
    try {
        await execa('yarn', ['add', 'stripe'], { cwd: targetDir, stdio: 'inherit' });
        console.log('   ✓ stripe package installed\n');
    } catch (error: any) {
        console.warn(`   ⚠️  Failed to install stripe: ${error.message}`);
        console.warn('   Please run "yarn add stripe" manually.\n');
    }
}

function printCompletionMessage() {
    console.log('\n✅ Generation complete!\n');
    console.log('📁 Generated functions:');
    FUNCTIONS.forEach(f => console.log(`   - ${f.name}: ${f.description}`));
    console.log('📁 Generated Service:');
    console.log('   - src/lib/stripe/stripe.service.ts');
    console.log('\n📝 Required Environment Variables:');
    console.log('   - VITE_PUBLIC_STRIPE_SECRET_KEY');
    console.log('   - VITE_PUBLIC_STRIPE_WEBHOOK_SECRET');
    console.log('   - SUPABASE_URL (auto-provided)');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (auto-provided)');
    console.log('   - FRONTEND_URL');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Deploy: supabase functions deploy');
    console.log('   2. Set secrets: supabase secrets set VITE_PUBLIC_STRIPE_SECRET_KEY=sk_... FRONTEND_URL=https://...');
    console.log('   3. Configure webhook: https://your-project.supabase.co/functions/v1/stripe-webhook-handler\n');
}
