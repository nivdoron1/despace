import path from 'path';
import fs from 'fs-extra';
import type { WorkspaceInfo } from '../types';

/**
 * Find the workspace root by traversing up from current directory
 * A workspace root is identified by having a package.json with "workspaces" field
 */
export async function findWorkspaceRoot(startDir: string = process.cwd()): Promise<WorkspaceInfo | null> {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        const pkgPath = path.join(currentDir, 'package.json');

        if (await fs.pathExists(pkgPath)) {
            const pkg = await fs.readJson(pkgPath);

            // Check if this is a workspace root
            if (pkg.workspaces && Array.isArray(pkg.workspaces)) {
                return {
                    rootDir: currentDir,
                    workspaceName: pkg.name || path.basename(currentDir),
                    packageJson: pkg
                };
            }
        }

        // Move up one directory
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break; // Reached root
        currentDir = parentDir;
    }

    return null;
}

/**
 * Validate workspace structure
 */
export async function validateWorkspace(workspaceInfo: WorkspaceInfo): Promise<boolean> {
    const { rootDir } = workspaceInfo;

    // Check for essential directories
    const packagesDir = path.join(rootDir, 'packages');
    const scriptsDir = path.join(rootDir, 'scripts');

    if (!await fs.pathExists(packagesDir)) {
        return false;
    }

    if (!await fs.pathExists(scriptsDir)) {
        return false;
    }

    // Check for generate-supabase-package.sh script
    const generateScript = path.join(scriptsDir, 'generate-supabase-package.sh');
    if (!await fs.pathExists(generateScript)) {
        return false;
    }

    return true;
}
