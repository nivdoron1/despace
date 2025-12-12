import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { execa } from 'execa';
import type { CreateWorkspaceOptions } from '../types';
import { PackageManagerUtil } from '../utils/package-manager';
import { DATABASE_SERVICE_TEMPLATE } from '../templates/DATABASE_SERVICE_TEMPLATE';
import { DATABASE_TYPES_TEMPLATE } from '../templates/DATABASE_TYPES_TEMPLATE';
import { GENERATE_TEMPLATE } from '../templates/GENERATE_TEMPLATE';
import { VITE_ENV_TEMPLATE } from '../templates/VITE_ENV_TEMPLATE';

export async function createWorkspace(options: CreateWorkspaceOptions): Promise<void> {
    const { workspaceName, packageManager, gitUrl, appType, appName } = options;
    const targetDir = path.resolve(process.cwd(), workspaceName);
    const pmUtil = new PackageManagerUtil(packageManager);

    if (await fs.pathExists(targetDir)) {
        console.error(`Directory ${workspaceName} already exists. Choose a different name.`);
        process.exit(1);
    }

    // Create workspace directory
    await fs.mkdirp(targetDir);
    console.log(`Created workspace directory: ${workspaceName}`);

    // Create empty yarn.lock or package-lock.json to isolate workspace
    if (packageManager === 'yarn') {
        await fs.writeFile(path.join(targetDir, 'yarn.lock'), '');
    }

    // Initialize package manager workspace
    await pmUtil.run(pmUtil.getInitCommand(), { cwd: targetDir, stdio: 'inherit' });

    // Configure root package.json
    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = await fs.readJson(pkgPath);

    pkg.private = true;
    pkg.workspaces = ['packages/*', 'apps/*'];
    const pmField = pmUtil.getPackageManagerField();
    if (pmField) {
        pkg.packageManager = pmField;
    }
    pkg.version = '1.0.0';

    if (gitUrl) {
        pkg.repository = gitUrl;
    }

    const pmName = packageManager === 'yarn' ? 'yarn' : 'npm run';
    const actualAppName = appName || 'web';
    pkg.scripts = {
        "build": packageManager === 'yarn'
            ? "yarn workspaces foreach --all run build"
            : "npm run build --workspaces",
        "dev": appType !== 'none'
            ? `${pmName} ${packageManager === 'yarn' ? `workspace ${actualAppName}` : `--workspace ${actualAppName}`} dev`
            : "echo 'No app to run'",
        "clean": packageManager === 'yarn'
            ? "yarn workspaces foreach --all run clean || true"
            : "npm run clean --workspaces || true",
        "new-supabase": "despace create new-supabase"
    };

    pkg.devDependencies = {
        "typescript": "^5.3.0",
        "vite": "^5.0.0"
    };

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    console.log('Configured package manager workspaces and package.json');

    // Create README.md
    const readmeContent = `# ${workspaceName}

This is a Supabase monorepo workspace generated with \`despace\`.

## Structure

- \`packages/supabase-core\`: Core Supabase client and types.
- \`packages/ui\`: Reusable shadcn/ui components (Button, Input, Card, etc.).
- \`packages/supabase-auth\`: Authentication components with shadcn/ui (Login, Register, useAuth).
- \`packages/stripe-core\`: Stripe integration and Edge Function generator.
- \`apps/\`: Application packages (e.g., Vite apps).

## Getting Started

1.  Install dependencies:
    \`\`\`bash
    ${packageManager === 'yarn' ? 'yarn install' : 'npm install'}
    \`\`\`

2.  Build packages:
    \`\`\`bash
    ${packageManager === 'yarn' ? 'yarn build' : 'npm run build'}
    \`\`\`

3.  ${appType !== 'none' ? 'Run the app:\n    ```bash\n    ' + (packageManager === 'yarn' ? 'yarn dev' : 'npm run dev') + '\n    ```' : 'Create a new app in `apps/`.'}

## Scripts

- \`${packageManager === 'yarn' ? 'yarn build' : 'npm run build'}\`: Build all workspaces.
- \`${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}\`: Run the development server (defaults to example app if present).
- \`${packageManager === 'yarn' ? 'yarn clean' : 'npm run clean'}\`: Clean all workspaces.

## Creating New Supabase Instances

Use the \`despace\` CLI to create new Supabase instances:

\`\`\`bash
despace create new-supabase test --project-id <id> --anon-key <key>
\`\`\`

See \`despace create new-supabase --help\` for more options.
`;
    await fs.writeFile(path.join(targetDir, 'README.md'), readmeContent);
    console.log('Created README.md');

    // Create supabase-core package
    const coreDir = path.join(targetDir, 'packages', 'supabase-core');
    await fs.mkdirp(coreDir);

    // Create supabase-core package.json
    const corePackageJson = {
        name: `@${workspaceName}/supabase-core`,
        version: '1.0.0',
        description: 'Core Supabase client and types for workspace',
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
            build: 'tsc',
            dev: 'tsc --watch'
        },
        keywords: ['supabase', 'client'],
        license: 'MIT',
        dependencies: {
            '@supabase/supabase-js': '^2.84.0'
        },
        devDependencies: {
            typescript: '^5.3.0',
            vite: '^5.2.0'
        }
    };
    await fs.writeJson(path.join(coreDir, 'package.json'), corePackageJson, { spaces: 4 });

    // Create supabase-core tsconfig.json
    const coreTsConfig = {
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
            resolveJsonModule: true,
            types: ['vite/client']
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
    };
    await fs.writeJson(path.join(coreDir, 'tsconfig.json'), coreTsConfig, { spaces: 4 });

    // Create src directory and files
    const srcDir = path.join(coreDir, 'src');
    await fs.mkdirp(srcDir);

    // Write database.types.ts
    await fs.writeFile(path.join(srcDir, 'database.types.ts'), DATABASE_TYPES_TEMPLATE);

    // Write vite-env.d.ts
    await fs.writeFile(path.join(srcDir, 'vite-env.d.ts'), VITE_ENV_TEMPLATE);

    // Write database.service.ts
    await fs.writeFile(path.join(srcDir, 'database.service.ts'), DATABASE_SERVICE_TEMPLATE);

    // Write generate.ts
    await fs.writeFile(path.join(srcDir, 'generate.ts'), GENERATE_TEMPLATE);

    // Write index.ts
    const indexTs = `
// Export types
export * from './database.types';

export * from './database.service';

`;
    await fs.writeFile(path.join(srcDir, 'index.ts'), indexTs);

    console.log('Created supabase-core package with all files');

    // Create stripe-core package from bundled templates
    const referenceStripeCorePath = path.join(__dirname, '../../src/templates-data/packages/stripe-core');
    const targetStripeCorePath = path.join(targetDir, 'packages', 'stripe-core');

    if (await fs.pathExists(referenceStripeCorePath)) {
        await fs.copy(referenceStripeCorePath, targetStripeCorePath, {
            filter: (src) => {
                // Exclude node_modules, dist, and lockfiles
                const relativePath = path.relative(referenceStripeCorePath, src);
                return !relativePath.startsWith('node_modules') &&
                    !relativePath.startsWith('dist') &&
                    !relativePath.startsWith('.yarn') &&
                    !relativePath.includes('yarn.lock');
            }
        });

        // Update package.json workspace reference
        const stripePkgPath = path.join(targetStripeCorePath, 'package.json');
        if (await fs.pathExists(stripePkgPath)) {
            const stripePkg = await fs.readJson(stripePkgPath);
            stripePkg.name = `@${workspaceName}/stripe-core`;
            await fs.writeJson(stripePkgPath, stripePkg, { spaces: 2 });
        }

        console.log('Created stripe-core package');
    } else {
        console.warn('Warning: stripe-core template not found in CLI templates');
    }

    // Create ui package from bundled templates
    const referenceUiPath = path.join(__dirname, '../../src/templates-data/packages/ui');
    const targetUiPath = path.join(targetDir, 'packages', 'ui');

    if (await fs.pathExists(referenceUiPath)) {
        await fs.copy(referenceUiPath, targetUiPath, {
            filter: (src) => {
                // Exclude node_modules, dist, and lockfiles
                const relativePath = path.relative(referenceUiPath, src);
                return !relativePath.startsWith('node_modules') &&
                    !relativePath.startsWith('dist') &&
                    !relativePath.startsWith('.yarn') &&
                    !relativePath.includes('yarn.lock') &&
                    !relativePath.startsWith('storybook-static') &&
                    !relativePath.includes('debug-storybook.log');
            }
        });

        // Update package.json workspace reference
        const uiPkgPath = path.join(targetUiPath, 'package.json');
        if (await fs.pathExists(uiPkgPath)) {
            const uiPkg = await fs.readJson(uiPkgPath);
            uiPkg.name = `@${workspaceName}/ui`;
            await fs.writeJson(uiPkgPath, uiPkg, { spaces: 2 });
        }

        // Update components.json workspace reference
        const uiComponentsJsonPath = path.join(targetUiPath, 'components.json');
        if (await fs.pathExists(uiComponentsJsonPath)) {
            const componentsJson = await fs.readJson(uiComponentsJsonPath);
            if (componentsJson.aliases) {
                componentsJson.aliases.components = `@${workspaceName}/ui/components`;
                componentsJson.aliases.utils = `@${workspaceName}/ui/lib/utils`;
                componentsJson.aliases.hooks = `@${workspaceName}/ui/hooks`;
                componentsJson.aliases.lib = `@${workspaceName}/ui/lib`;
                componentsJson.aliases.ui = `@${workspaceName}/ui/components`;
            }
            await fs.writeJson(uiComponentsJsonPath, componentsJson, { spaces: 2 });
        }

        console.log('Created ui package');
    } else {
        console.warn('Warning: ui template not found in CLI templates');
    }

    // Create supabase-auth package from bundled templates (depends on ui)
    const referenceAuthPath = path.join(__dirname, '../../src/templates-data/packages/supabase-auth');
    const targetAuthPath = path.join(targetDir, 'packages', 'supabase-auth');

    if (await fs.pathExists(referenceAuthPath)) {
        await fs.copy(referenceAuthPath, targetAuthPath, {
            filter: (src) => {
                // Exclude node_modules, dist, and lockfiles
                const relativePath = path.relative(referenceAuthPath, src);
                return !relativePath.startsWith('node_modules') &&
                    !relativePath.startsWith('dist') &&
                    !relativePath.startsWith('.yarn') &&
                    !relativePath.includes('yarn.lock');
            }
        });

        // Update package.json workspace reference
        const authPkgPath = path.join(targetAuthPath, 'package.json');
        if (await fs.pathExists(authPkgPath)) {
            const authPkg = await fs.readJson(authPkgPath);
            authPkg.name = `@${workspaceName}/supabase-auth`;
            // Update ui dependency to use workspace name
            if (authPkg.dependencies) {
                // Remove the template placeholder dependency
                delete authPkg.dependencies['@workspace/ui'];
                delete authPkg.dependencies['@templates-data/ui'];
                delete authPkg.dependencies['ui'];
                // Add the workspace-scoped dependency
                authPkg.dependencies[`@${workspaceName}/ui`] = 'workspace:*';
            }
            await fs.writeJson(authPkgPath, authPkg, { spaces: 2 });
        }

        // Update imports in component files
        // We need to check both the new structure (Login/Login.tsx) and potential old structure
        const componentDirs = ['Login', 'Register'];

        for (const component of componentDirs) {
            const componentPath = path.join(targetAuthPath, 'src', 'components', component, `${component}.tsx`);
            const oldComponentPath = path.join(targetAuthPath, 'src', 'components', `${component}.tsx`);

            const targetPath = await fs.pathExists(componentPath) ? componentPath :
                await fs.pathExists(oldComponentPath) ? oldComponentPath : null;

            if (targetPath) {
                let content = await fs.readFile(targetPath, 'utf-8');
                content = content.replace(/@workspace\/ui/g, `@${workspaceName}/ui`);
                content = content.replace(/@templates-data\/ui/g, `@${workspaceName}/ui`);
                // Replace 'ui' imports (checking for quotes to avoid partial matches)
                content = content.replace(/from ['"]ui['"]/g, `from '@${workspaceName}/ui'`);
                content = content.replace(/from ['"]ui\//g, `from '@${workspaceName}/ui/`);
                content = content.replace(/import ['"]ui\/styles.css['"]/g, `import '@${workspaceName}/ui/styles.css'`);
                await fs.writeFile(targetPath, content);
            }
        }

        console.log('Created supabase-auth package');
    } else {
        console.warn('Warning: supabase-auth template not found in CLI templates');
    }

    // Create stripe-ui package from bundled templates (depends on ui)
    const referenceStripeUiPath = path.join(__dirname, '../../src/templates-data/packages/stripe-ui');
    const targetStripeUiPath = path.join(targetDir, 'packages', 'stripe-ui');

    if (await fs.pathExists(referenceStripeUiPath)) {
        await fs.copy(referenceStripeUiPath, targetStripeUiPath, {
            filter: (src) => {
                // Exclude node_modules, dist, and lockfiles
                const relativePath = path.relative(referenceStripeUiPath, src);
                return !relativePath.startsWith('node_modules') &&
                    !relativePath.startsWith('dist') &&
                    !relativePath.startsWith('.yarn') &&
                    !relativePath.includes('yarn.lock');
            }
        });

        // Update package.json workspace reference
        const stripeUiPkgPath = path.join(targetStripeUiPath, 'package.json');
        if (await fs.pathExists(stripeUiPkgPath)) {
            const stripeUiPkg = await fs.readJson(stripeUiPkgPath);
            stripeUiPkg.name = `@${workspaceName}/stripe-ui`;
            // Update ui dependency to use workspace name
            if (stripeUiPkg.dependencies) {
                delete stripeUiPkg.dependencies['@templates-data/ui'];
                delete stripeUiPkg.dependencies['ui'];
                stripeUiPkg.dependencies[`@${workspaceName}/ui`] = 'workspace:*';
            }
            await fs.writeJson(stripeUiPkgPath, stripeUiPkg, { spaces: 2 });
        }

        // Update imports in component files
        const stripeUiComponentsDir = path.join(targetStripeUiPath, 'src', 'components');
        if (await fs.pathExists(stripeUiComponentsDir)) {
            const files = await fs.readdir(stripeUiComponentsDir);
            for (const file of files) {
                if (file.endsWith('.tsx')) {
                    const filePath = path.join(stripeUiComponentsDir, file);
                    let content = await fs.readFile(filePath, 'utf-8');
                    content = content.replace(/@templates-data\/ui/g, `@${workspaceName}/ui`);
                    content = content.replace(/from ['"]ui['"]/g, `from '@${workspaceName}/ui'`);
                    content = content.replace(/from ['"]ui\//g, `from '@${workspaceName}/ui/`);
                    await fs.writeFile(filePath, content);
                }
            }
        }

        console.log('Created stripe-ui package');
    } else {
        console.warn('Warning: stripe-ui template not found in CLI templates');
    }

    // Create app based on type
    if (appType !== 'none') {
        const appDir = path.join(targetDir, 'apps', actualAppName);
        await fs.mkdirp(path.dirname(appDir));

        if (appType === 'next') {
            // Create Next.js app
            console.log(`Creating Next.js app: ${actualAppName}...`);
            await execa('npx', [
                '-y',
                'create-next-app@latest',
                actualAppName,
                '--typescript',
                '--tailwind',
                '--eslint',
                '--app',
                '--no-src-dir',
                '--import-alias', '@/*',
                '--no-git'
            ], {
                cwd: path.join(targetDir, 'apps'),
                stdio: 'inherit',
            });
            console.log(`Created Next.js app: ${actualAppName}`);

            // Add components.json to Next.js app
            const appComponentsJson = {
                "$schema": "https://ui.shadcn.com/schema.json",
                "style": "new-york",
                "rsc": true,
                "tsx": true,
                "tailwind": {
                    "config": "",
                    "css": "../../packages/ui/src/styles/globals.css",
                    "baseColor": "neutral",
                    "cssVariables": true
                },
                "iconLibrary": "lucide",
                "aliases": {
                    "components": "@/components",
                    "hooks": "@/hooks",
                    "lib": "@/lib",
                    "utils": `@${workspaceName}/ui/lib/utils`,
                    "ui": `@${workspaceName}/ui/components`
                }
            };
            await fs.writeJson(path.join(appDir, 'components.json'), appComponentsJson, { spaces: 2 });

            // Add ui dependency to app package.json
            const appPkgPath = path.join(appDir, 'package.json');
            const appPkg = await fs.readJson(appPkgPath);
            appPkg.dependencies = appPkg.dependencies || {};
            appPkg.dependencies[`@${workspaceName}/ui`] = 'workspace:*';

            // Add assistant-ui chat if enabled
            const includeChat = options.includeChat !== false;
            const chatModel = options.chatModel ?? 'openai';
            const chatTheme = options.chatTheme ?? 'default';

            if (includeChat) {
                console.log('Adding assistant-ui chat components...');

                // Add assistant-ui dependencies
                appPkg.dependencies['@assistant-ui/react'] = 'latest';
                appPkg.dependencies['@assistant-ui/react-ai-sdk'] = 'latest';
                appPkg.dependencies['ai'] = 'latest';

                // Add provider-specific SDK
                const providerSdkMap: Record<string, string> = {
                    openai: '@ai-sdk/openai',
                    anthropic: '@ai-sdk/anthropic',
                    gemini: '@ai-sdk/google',
                    groq: '@ai-sdk/openai',
                    azure: '@ai-sdk/azure',
                    aws: '@ai-sdk/amazon-bedrock',
                    cohere: '@ai-sdk/cohere',
                    ollama: 'ollama-ai-provider-v2'
                };

                if (providerSdkMap[chatModel]) {
                    appPkg.dependencies[providerSdkMap[chatModel]] = 'latest';
                }

                // Components are now provided by the ui package, so we don't need to copy them locally.
                // We only need to set up the API route.

                // Copy API route template from ui package source
                const uiPackageApiDir = path.join(__dirname, '../../src/templates-data/packages/ui/api');
                const appApiRouteDir = path.join(appDir, 'app', 'api', 'chat');

                if (await fs.pathExists(uiPackageApiDir)) {
                    await fs.mkdirp(appApiRouteDir);
                    const sourceApiFile = path.join(uiPackageApiDir, `${chatModel}.ts`);

                    if (await fs.pathExists(sourceApiFile)) {
                        await fs.copy(sourceApiFile, path.join(appApiRouteDir, 'route.ts'));
                    } else {
                        console.warn(`Warning: Chat API template for ${chatModel} not found in ui package. Defaulting to openai.`);
                        // Fallback or error handling if needed
                        const fallbackFile = path.join(uiPackageApiDir, 'openai.ts');
                        if (await fs.pathExists(fallbackFile)) {
                            await fs.copy(fallbackFile, path.join(appApiRouteDir, 'route.ts'));
                        }
                    }
                }

                // Generate .env.example with provider-specific vars
                const envVarsMap: Record<string, string[]> = {
                    openai: ['OPENAI_API_KEY="sk-..."'],
                    anthropic: ['ANTHROPIC_API_KEY="..."'],
                    gemini: ['GOOGLE_GENERATIVE_AI_API_KEY="..."'],
                    groq: ['GROQ_API_KEY="..."'],
                    azure: ['AZURE_RESOURCE_NAME="..."', 'AZURE_API_KEY="..."'],
                    aws: ['AWS_ACCESS_KEY_ID="..."', 'AWS_SECRET_ACCESS_KEY="..."', 'AWS_REGION="..."'],
                    cohere: ['COHERE_API_KEY="..."'],
                    ollama: ['# No API key required for Ollama (local)']
                };

                const envContent = `# ${chatModel.toUpperCase()} Chat API Configuration
${(envVarsMap[chatModel] || []).join('\n')}

# Optional: Assistant UI Cloud for persistence
# NEXT_PUBLIC_ASSISTANT_BASE_URL="https://..."
`;
                await fs.writeFile(path.join(appDir, '.env.example'), envContent);
                await fs.writeFile(path.join(appDir, '.env.local'), envContent);

                console.log(`Added chat with ${chatModel} provider (${chatTheme} theme)`);
            }

            await fs.writeJson(appPkgPath, appPkg, { spaces: 2 });

        } else if (appType === 'vite') {
            // Create Vite app
            console.log(`Creating Vite app: ${actualAppName}...`);
            const viteCmd = pmUtil.getCreateViteCommand(actualAppName);
            await execa(viteCmd.cmd, viteCmd.args, {
                cwd: path.join(targetDir, 'apps'),
                stdio: 'inherit',
            });
            console.log(`Created Vite app: ${actualAppName}`);

            // Add components.json to Vite app
            const appComponentsJson = {
                "$schema": "https://ui.shadcn.com/schema.json",
                "style": "new-york",
                "rsc": false,
                "tsx": true,
                "tailwind": {
                    "config": "",
                    "css": "../../packages/ui/src/styles/globals.css",
                    "baseColor": "neutral",
                    "cssVariables": true
                },
                "iconLibrary": "lucide",
                "aliases": {
                    "components": "@/components",
                    "hooks": "@/hooks",
                    "lib": "@/lib",
                    "utils": `@${workspaceName}/ui/lib/utils`,
                    "ui": `@${workspaceName}/ui/components`
                }
            };
            await fs.writeJson(path.join(appDir, 'components.json'), appComponentsJson, { spaces: 2 });

            // Add ui dependency to app package.json
            const appPkgPath = path.join(appDir, 'package.json');
            const appPkg = await fs.readJson(appPkgPath);
            appPkg.dependencies = appPkg.dependencies || {};
            appPkg.dependencies[`@${workspaceName}/ui`] = 'workspace:*';
            await fs.writeJson(appPkgPath, appPkg, { spaces: 2 });
        }
    }

    console.log('');
    console.log('📦 Installing dependencies...');
    await pmUtil.run(pmUtil.getInstallCommand(), { cwd: targetDir, stdio: 'inherit' });

    console.log('');
    console.log('🔨 Building packages...');

    // Build supabase-core
    console.log('Building supabase-core...');
    await pmUtil.run(pmUtil.getBuildCommand(), {
        cwd: path.join(targetDir, 'packages', 'supabase-core'),
        stdio: 'inherit'
    });

    // Build stripe-core if it exists
    const buildStripeCorePath = path.join(targetDir, 'packages', 'stripe-core');
    if (await fs.pathExists(buildStripeCorePath)) {
        console.log('Building stripe-core...');
        await pmUtil.run(pmUtil.getBuildCommand(), {
            cwd: buildStripeCorePath,
            stdio: 'inherit'
        });
    }

    // Build ui if it exists (must be before supabase-auth)
    const buildUiPath = path.join(targetDir, 'packages', 'ui');
    if (await fs.pathExists(buildUiPath)) {
        console.log('Building ui...');
        await pmUtil.run(pmUtil.getBuildCommand(), {
            cwd: buildUiPath,
            stdio: 'inherit'
        });
    }

    // Build supabase-auth if it exists (depends on ui)
    const buildAuthPath = path.join(targetDir, 'packages', 'supabase-auth');
    if (await fs.pathExists(buildAuthPath)) {
        console.log('Building supabase-auth...');
        await pmUtil.run(pmUtil.getBuildCommand(), {
            cwd: buildAuthPath,
            stdio: 'inherit'
        });
    }

    // Build stripe-ui if it exists (depends on ui)
    const buildStripeUiPath = path.join(targetDir, 'packages', 'stripe-ui');
    if (await fs.pathExists(buildStripeUiPath)) {
        console.log('Building stripe-ui...');
        await pmUtil.run(pmUtil.getBuildCommand(), {
            cwd: buildStripeUiPath,
            stdio: 'inherit'
        });
    }

    console.log('');
    console.log('🎉 Workspace setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${workspaceName}`);
    if (appType !== 'none') {
        console.log(`  cd apps/${actualAppName} && ${packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'}`);
    }
    console.log('  despace create new-supabase <name> --project-id <id> --anon-key <key>');
    console.log('');
}

export async function promptWorkspaceOptions(workspaceName: string): Promise<CreateWorkspaceOptions> {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'packageManager',
            message: 'Choose package manager:',
            choices: ['yarn', 'npm'],
            default: 'yarn'
        },
        {
            type: 'input',
            name: 'gitUrl',
            message: 'Enter Git repository URL (optional):',
        },
        {
            type: 'list',
            name: 'appType',
            message: 'Select app framework:',
            choices: [
                { name: 'Next.js', value: 'next' },
                { name: 'Vite (React)', value: 'vite' },
                { name: 'None (packages only)', value: 'none' }
            ],
            default: 'next'
        },
        {
            type: 'input',
            name: 'appName',
            message: 'Enter app name:',
            default: 'web',
            when: (answers: any) => answers.appType !== 'none'
        },
        {
            type: 'confirm',
            name: 'includeChat',
            message: 'Include assistant-ui chat components?',
            default: true,
            when: (answers: any) => answers.appType === 'next'
        },
        {
            type: 'list',
            name: 'chatModel',
            message: 'Select chat model provider:',
            choices: [
                { name: 'OpenAI (GPT-4)', value: 'openai' },
                { name: 'Anthropic (Claude)', value: 'anthropic' },
                { name: 'Google (Gemini)', value: 'gemini' },
                { name: 'Groq (Llama)', value: 'groq' },
                { name: 'Azure OpenAI', value: 'azure' },
                { name: 'AWS Bedrock', value: 'aws' },
                { name: 'Cohere', value: 'cohere' },
                { name: 'Ollama (Local)', value: 'ollama' }
            ],
            default: 'openai',
            when: (answers: any) => answers.includeChat === true
        },
        {
            type: 'list',
            name: 'chatTheme',
            message: 'Select chat theme:',
            choices: [
                { name: 'Default', value: 'default' },
                { name: 'Minimal', value: 'minimal' },
                { name: 'Floating Modal', value: 'floating' }
            ],
            default: 'default',
            when: (answers: any) => answers.includeChat === true
        }
    ]);

    return {
        workspaceName,
        packageManager: answers.packageManager,
        gitUrl: answers.gitUrl,
        appType: answers.appType,
        appName: answers.appName,
        includeChat: answers.includeChat ?? (answers.appType !== 'next' ? false : true),
        chatModel: answers.chatModel ?? 'openai',
        chatTheme: answers.chatTheme ?? 'default'
    };
}
