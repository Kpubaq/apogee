/**
 * Apogee - Project Creation & Workspace Management Engine
 * ByKpubaq | Adil
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CDPClient } from './CDPClient.js';
import { TaskWatcher } from './TaskWatcher.js';
import { logger } from '../utils/logger.js';

export class WorkspaceManager {
  private cdp: CDPClient;
  private taskWatcher: TaskWatcher;
  private baseProjectsDir: string;

  constructor(cdp: CDPClient, taskWatcher: TaskWatcher, customDir?: string) {
    this.cdp = cdp;
    this.taskWatcher = taskWatcher;
    this.baseProjectsDir = customDir || path.join(os.homedir(), 'AntiGravityProjects');
  }

  public async getProjectsDirectory(): Promise<string> {
    await fs.mkdir(this.baseProjectsDir, { recursive: true });
    return this.baseProjectsDir;
  }

  /**
   * Creates a new project directory and initializes it in AntiGravity
   */
  public async createProject(
    projectName: string,
    description: string = 'Created via Apogee Mission Control'
  ): Promise<{ success: boolean; projectPath: string; message: string }> {
    const cleanName = projectName.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    if (!cleanName) {
      throw new Error('Некорректное имя проекта.');
    }

    const baseDir = await this.getProjectsDirectory();
    const projectPath = path.join(baseDir, cleanName);

    logger.info('Workspace', `Creating new AntiGravity project at: ${projectPath}`);
    await fs.mkdir(projectPath, { recursive: true });

    // Initialize README.md
    const readmeContent = `# ${cleanName}

${description}

---
*Created and managed via **Apogee Mission Control** (ByKpubaq | Adil).*
`;
    await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent, { flag: 'wx' }).catch(() => {});

    // Initialize .gitignore
    const gitignoreContent = `node_modules/\n.env\ndist/\n*.log\n`;
    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent, { flag: 'wx' }).catch(() => {});

    // Open and dispatch initialization prompt to AntiGravity
    let ideMessage = '';
    if (this.cdp.getConnectedStatus()) {
      try {
        const initPrompt = `
[WORKSPACE SWITCH / NEW PROJECT]
Project: "${cleanName}"
Location: "${projectPath}"

Please initialize this workspace and begin scaffolding the project according to user requirements.
`.trim();
        await this.taskWatcher.sendUserPrompt(initPrompt);
        ideMessage = 'и передан в работу AI-агенту AntiGravity';
      } catch (e: any) {
        ideMessage = `(предупреждение: ${e.message})`;
      }
    } else {
      ideMessage = '(AntiGravity IDE в данный момент оффлайн)';
    }

    return {
      success: true,
      projectPath,
      message: `✨ Проект **${cleanName}** успешно создан в \`${projectPath}\` ${ideMessage}.`
    };
  }

  /**
   * Opens an existing project folder in AntiGravity
   */
  public async openProject(folderPath: string): Promise<{ success: boolean; projectPath: string; message: string }> {
    const resolvedPath = path.resolve(folderPath.trim());

    try {
      const stat = await fs.stat(resolvedPath);
      if (!stat.isDirectory()) {
        throw new Error(`Указанный путь не является папкой: ${resolvedPath}`);
      }
    } catch {
      throw new Error(`Папка не найдена: ${resolvedPath}`);
    }

    logger.info('Workspace', `Opening workspace folder: ${resolvedPath}`);

    if (this.cdp.getConnectedStatus()) {
      const openPrompt = `
[OPEN WORKSPACE]
Location: "${resolvedPath}"
Please switch active workspace context to this directory.
`.trim();
      await this.taskWatcher.sendUserPrompt(openPrompt);
    }

    return {
      success: true,
      projectPath: resolvedPath,
      message: `📂 Воркспейс переключен на: \`${resolvedPath}\``
    };
  }

  /**
   * Lists available projects in the AntiGravityProjects directory
   */
  public async listProjects(): Promise<string[]> {
    const baseDir = await this.getProjectsDirectory();
    try {
      const entries = await fs.readdir(baseDir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch {
      return [];
    }
  }
}
