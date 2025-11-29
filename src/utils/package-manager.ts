import { execa } from 'execa';
import type { PackageManager } from '../types';

export class PackageManagerUtil {
    constructor(private pm: PackageManager) { }

    /**
     * Get the init command
     */
    getInitCommand(): string[] {
        return this.pm === 'yarn' ? ['yarn', 'init', '-y'] : ['npm', 'init', '-y'];
    }

    /**
     * Get the install command
     */
    getInstallCommand(): string[] {
        return this.pm === 'yarn' ? ['yarn', 'install'] : ['npm', 'install'];
    }

    /**
     * Get the create vite command
     */
    getCreateViteCommand(appName: string): { cmd: string; args: string[] } {
        if (this.pm === 'yarn') {
            return {
                cmd: 'yarn',
                args: ['create', 'vite', appName, '--template', 'react-ts']
            };
        } else {
            return {
                cmd: 'npm',
                args: ['create', 'vite@latest', appName, '--', '--template', 'react-ts']
            };
        }
    }

    /**
     * Get the build command
     */
    getBuildCommand(): string[] {
        return this.pm === 'yarn' ? ['yarn', 'build'] : ['npm', 'run', 'build'];
    }

    /**
     * Get the workspace-specific command prefix
     */
    getWorkspaceCommand(workspaceName: string): string[] {
        return this.pm === 'yarn'
            ? ['yarn', 'workspace', workspaceName]
            : ['npm', 'run', '--workspace', workspaceName];
    }

    /**
     * Run a command with the package manager
     */
    async run(args: string[], options: any = {}) {
        const [cmd, ...cmdArgs] = args;
        return execa(cmd, cmdArgs, options);
    }

    /**
     * Get script syntax for package.json
     */
    getScriptSyntax(command: string, workspace?: string): string {
        if (this.pm === 'yarn') {
            return workspace
                ? `yarn workspace ${workspace} ${command}`
                : `yarn ${command}`;
        } else {
            return workspace
                ? `npm run ${command} --workspace ${workspace}`
                : `npm run ${command}`;
        }
    }

    /**
     * Get the package manager name
     */
    getName(): PackageManager {
        return this.pm;
    }

    /**
     * Get packageManager field for package.json
     */
    getPackageManagerField(): string | undefined {
        // Only Yarn has a specific version we want to pin
        return this.pm === 'yarn' ? 'yarn@4.12.0' : undefined;
    }
}

/**
 * Detect package manager from environment or return default
 */
export function detectPackageManager(): PackageManager {
    // Check if npm_config_user_agent contains yarn or npm
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent) {
        if (userAgent.includes('yarn')) return 'yarn';
        if (userAgent.includes('npm')) return 'npm';
    }

    // Default to yarn
    return 'yarn';
}
