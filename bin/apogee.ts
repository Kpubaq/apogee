import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { printBanner, getApogeeBanner, renderCyberCard, padBoxLine } from '../src/utils/banner.js';
import { logger } from '../src/utils/logger.js';
import { CDPClient } from '../src/cdp/CDPClient.js';
import { ScreenCapture } from '../src/cdp/ScreenCapture.js';

const program = new Command();

program
  .name('apogee')
  .description('Apogee 2026 Universal Mission Control for AntiGravity 2.0 / IDE / CLI (ByKpubaq | Adil)')
  .version('2.0.0');

// ==========================================
// CLI COMMAND: STATUS & TELEMETRY
// ==========================================
program
  .command('status')
  .description('Scan and report live CDP connectivity for AntiGravity 2.0 (9334) & CLI (9333)')
  .action(async () => {
    printBanner();
    console.log(chalk.hex('#00F0FF').bold('  🔍 Scanning AntiGravity CDP Network Surface...\n'));

    const ideClient = new CDPClient('127.0.0.1', 9334, 'AntiGravity 2.0 / IDE');
    const appClient = new CDPClient('127.0.0.1', 9333, 'AntiGravity Standalone CLI');

    const statusLines: string[] = [];

    // Probe IDE CDP (Port 9334)
    try {
      const ideTargets = await ideClient.fetchTargets();
      statusLines.push(
        `${chalk.hex('#10B981').bold('🟢 ONLINE')}  ${chalk.bold.white('AntiGravity 2.0 / IDE')} ${chalk.hex('#64748B')('(Port 9334)')} — ${chalk.hex('#00FF9D')(`${ideTargets.length} active window(s)`)}`
      );
      ideTargets.forEach((t, idx) => {
        const icon = t.type === 'page' ? '🖥️ ' : '⚙️ ';
        statusLines.push(`    ${chalk.hex('#8B5CF6')('├─')} ${icon} ${chalk.hex('#94A3B8')(`[${t.type}]`)} ${chalk.hex('#E2E8F0')(t.title || 'Untitled Target')}`);
        if (idx === ideTargets.length - 1) {
          statusLines.push(`    ${chalk.hex('#64748B')(`└─► Target ID: ${t.id}`)}`);
        }
      });
    } catch (e: any) {
      statusLines.push(
        `${chalk.hex('#F43F5E').bold('🔴 OFFLINE')} ${chalk.bold.white('AntiGravity 2.0 / IDE')} ${chalk.hex('#64748B')('(Port 9334)')} — ${chalk.hex('#FDA4AF')(e.message)}`
      );
      statusLines.push(`    ${chalk.hex('#64748B')('└─► Tip: Launch IDE with --remote-debugging-port=9334')}`);
    }

    statusLines.push('');

    // Probe Standalone CLI CDP (Port 9333)
    try {
      const appTargets = await appClient.fetchTargets();
      statusLines.push(
        `${chalk.hex('#10B981').bold('🟢 ONLINE')}  ${chalk.bold.white('AntiGravity Standalone CLI')} ${chalk.hex('#64748B')('(Port 9333)')} — ${chalk.hex('#00FF9D')(`${appTargets.length} target(s)`)}`
      );
      appTargets.forEach(t => {
        statusLines.push(`    ${chalk.hex('#8B5CF6')('└─')} ⚙️  ${chalk.hex('#94A3B8')(`[${t.type}]`)} ${chalk.hex('#E2E8F0')(t.title || 'CLI Surface')}`);
      });
    } catch (e: any) {
      statusLines.push(
        `${chalk.hex('#94A3B8').bold('⚪ STANDBY')} ${chalk.bold.white('AntiGravity Standalone CLI')} ${chalk.hex('#64748B')('(Port 9333)')} — ${chalk.hex('#94A3B8')(e.message)}`
      );
    }

    console.log(renderCyberCard('TELEMETRY SCAN REPORT', statusLines, '#00F0FF'));
    console.log('\n');
  });

// ==========================================
// CLI COMMAND: SCREENSHOT
// ==========================================
program
  .command('screenshot')
  .description('Instant viewport screenshot capture of active AntiGravity window')
  .option('-p, --port <number>', 'CDP Port (defaults to 9334)', '9334')
  .action(async (opts: { port?: string }) => {
    const port = Number(opts.port);
    const client = new CDPClient('127.0.0.1', port, 'AntiGravity');
    
    console.log(chalk.hex('#00F0FF')(`\n  📸 Initiating viewport capture on 127.0.0.1:${port}...`));
    const connected = await client.connect();

    if (!connected) {
      console.log(renderCyberCard('CAPTURE FAILED', [
        `${chalk.hex('#F43F5E').bold('✖ Connection Error:')} Unable to reach CDP endpoint on port ${port}`,
        chalk.hex('#94A3B8')('Please ensure AntiGravity 2.0 is running with remote debugging enabled.')
      ], '#F43F5E'));
      process.exit(1);
    }

    const capture = new ScreenCapture(client);
    const res = await capture.capture();

    console.log(renderCyberCard('VIEWPORT CAPTURE READY', [
      `${chalk.hex('#10B981').bold('✔ Status:')}       Capture successfully encoded and written to disk`,
      `${chalk.hex('#38BDF8').bold('📁 File Path:')}    ${chalk.hex('#F1F5F9')(res.filePath)}`,
      `${chalk.hex('#A855F7').bold('📊 File Size:')}    ${chalk.hex('#FDE047')(`${(res.buffer.length / 1024).toFixed(1)} KB`)}`,
      `${chalk.hex('#EC4899').bold('⚡ Latency:')}      ${chalk.hex('#00FF9D')('Real-time Surface Pipe')}`
    ], '#10B981'));

    await client.close();
    console.log('\n');
  });

// ==========================================
// CLI COMMAND: CREATE PROJECT
// ==========================================
program
  .command('create <name>')
  .description('Scaffold and initialize a new project workspace in AntiGravity')
  .action(async (name: string) => {
    printBanner();
    const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
    await client.connect().catch(() => {});
    const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
    const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);
    const res = await ws.createProject(name);

    console.log(renderCyberCard('WORKSPACE CREATION', [
      `${chalk.hex('#10B981').bold('✔ Result:')}    ${res.message}`,
      `${chalk.hex('#38BDF8').bold('📂 Target:')}    ~/AntiGravityProjects/${name}`,
      `${chalk.hex('#A855F7').bold('⚙️ Status:')}    Workspace active and attached to IDE context`
    ], '#818CF8'));

    await client.close();
    console.log('\n');
  });

// ==========================================
// CLI COMMAND: OPEN WORKSPACE
// ==========================================
program
  .command('open <path>')
  .description('Open existing workspace directory in AntiGravity IDE')
  .action(async (targetPath: string) => {
    printBanner();
    const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
    await client.connect().catch(() => {});
    const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
    const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);

    try {
      const res = await ws.openProject(targetPath);
      console.log(renderCyberCard('WORKSPACE SWITCH', [
        `${chalk.hex('#10B981').bold('✔ Workspace Opened:')} ${res.message}`,
        `${chalk.hex('#38BDF8').bold('📂 Path:')}             ${targetPath}`
      ], '#00F0FF'));
    } catch (e: any) {
      console.log(renderCyberCard('WORKSPACE SWITCH FAILED', [
        `${chalk.hex('#F43F5E').bold('✖ Error:')} ${e.message}`,
        `${chalk.hex('#94A3B8')('Check that the directory exists and permissions are valid.')}`
      ], '#F43F5E'));
    }

    await client.close();
    console.log('\n');
  });

// ==========================================
// CLI COMMAND: LIST PROJECTS
// ==========================================
program
  .command('projects')
  .description('List all managed workspaces in ~/AntiGravityProjects')
  .action(async () => {
    printBanner();
    const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
    const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
    const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);
    const list = await ws.listProjects();

    const lines: string[] = [];
    if (list.length === 0) {
      lines.push(chalk.hex('#94A3B8')('No projects found in ~/AntiGravityProjects.'));
      lines.push(chalk.hex('#64748B')('Create one with: apogee create <projectName>'));
    } else {
      lines.push(`${chalk.hex('#38BDF8').bold('Total Managed Projects:')} ${chalk.hex('#00FF9D').bold(list.length)}`);
      lines.push('');
      list.forEach((p, i) => {
        lines.push(`  ${chalk.hex('#F59E0B').bold(`[${String(i + 1).padStart(2, '0')}]`)}  📁  ${chalk.hex('#F1F5F9').bold(p)}`);
      });
    }

    console.log(renderCyberCard('PROJECT REPOSITORY MATRIX', lines, '#A855F7'));
    console.log('\n');
  });

// ==========================================
// CLI COMMAND: START 24/7 SERVICE
// ==========================================
program
  .command('start')
  .description('Start the full 24/7 background mission control daemon (Telegram, Discord, CDP)')
  .action(async () => {
    await import('../src/index.js');
  });

// ==========================================
// CLI DEFAULT COMMAND: INTERACTIVE DASHBOARD
// ==========================================
program
  .command('dashboard', { isDefault: true })
  .description('Launch the 2026 Interactive Cyberdeck Dashboard')
  .action(async () => {
    console.clear();
    printBanner();
    await runInteractiveDashboard();
  });

/**
 * Helper to prompt a question asynchronously
 */
function ask(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, ans => resolve(ans.trim())));
}

/**
 * Interactive Cyberdeck Control Room
 */
async function runInteractiveDashboard() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const renderDashboardMenu = () => {
    const W = 76;
    const border = (char: string) => chalk.hex('#00F0FF')(char);
    const catHeader = (icon: string, title: string, colorHex: string) =>
      `  ${chalk.hex(colorHex).bold(icon)} ${chalk.hex(colorHex).bold(title)}`;

    const titleText = ' [ APOGEE 2026 INTERACTIVE CYBERDECK CONTROL ROOM ] ';
    const topDash = Math.max(0, W - titleText.length - 2);
    console.log(border('╭─') + chalk.hex('#00F0FF').bold(titleText) + border('─'.repeat(topDash) + '╮'));
    console.log(border('│') + ' '.repeat(W) + border('│'));

    // Category 1: Rapid Telemetry
    console.log(border('│') + padBoxLine(catHeader('🕹️', 'RAPID TELEMETRY & VIEWPORT ACTIONS', '#00F0FF'), W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#00F0FF').bold('[1]')} 📊 ${chalk.white.bold('System Status & Telemetry')}     ${chalk.hex('#64748B')('• Proactive CDP probe (9334/9333)')}`, W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#00F0FF').bold('[2]')} 📸 ${chalk.white.bold('Instant IDE Viewport Capture')}  ${chalk.hex('#64748B')('• Direct screenshot buffer encode')}`, W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#00F0FF').bold('[3]')} 💬 ${chalk.white.bold('Send Real-Time Agent Prompt')}   ${chalk.hex('#64748B')('• Live injection into AntiGravity UI')}`, W) + border('│'));
    console.log(border('│') + ' '.repeat(W) + border('│'));

    // Category 2: Workspace & Projects
    console.log(border('│') + padBoxLine(catHeader('📂', 'WORKSPACE & PROJECT MANAGEMENT', '#818CF8'), W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#818CF8').bold('[4]')} 📂 ${chalk.white.bold('Create New Project in AG')}       ${chalk.hex('#64748B')('• Scaffold & attach new folder')}`, W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#818CF8').bold('[5]')} 📂 ${chalk.white.bold('Open Existing Workspace')}        ${chalk.hex('#64748B')('• Switch active workspace context')}`, W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#818CF8').bold('[6]')} 🗂️  ${chalk.white.bold('List Managed Projects')}         ${chalk.hex('#64748B')('• View project repository tree')}`, W) + border('│'));
    console.log(border('│') + ' '.repeat(W) + border('│'));

    // Category 3: Daemon & Mission Control
    console.log(border('│') + padBoxLine(catHeader('⚙️', 'CORE DAEMON & SYSTEM CONTROL', '#10B981'), W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#10B981').bold('[7]')} 🚀 ${chalk.white.bold('Launch 24/7 Mission Control')}    ${chalk.hex('#64748B')('• Telegram/Discord & CDP Bridge')}`, W) + border('│'));
    console.log(border('│') + padBoxLine(`   ${chalk.hex('#F43F5E').bold('[8]')} ❌ ${chalk.white.bold('Exit Mission Control')}          ${chalk.hex('#64748B')('• Terminate interactive session')}`, W) + border('│'));
    console.log(border('│') + ' '.repeat(W) + border('│'));

    console.log(border('╰' + '─'.repeat(W) + '╯\n'));
  };

  renderDashboardMenu();

  const promptUser = async () => {
    const choice = await ask(rl, `  ${chalk.hex('#00F0FF').bold('❯')} ${chalk.hex('#EC4899').bold('Select Action')} ${chalk.hex('#64748B')('[1-8 | q]')}: `);

    switch (choice.toLowerCase()) {
      case '1': {
        console.log(chalk.hex('#00F0FF')('\n  🔍 Querying CDP ports...'));
        const ideClient = new CDPClient('127.0.0.1', 9334, 'AntiGravity 2.0 / IDE');
        try {
          const targets = await ideClient.fetchTargets();
          console.log(renderCyberCard('CDP 9334 STATUS', [
            `${chalk.hex('#10B981').bold('🟢 ONLINE')} — ${targets.length} target window(s) discovered:`,
            ...targets.map(t => `   ${chalk.hex('#8B5CF6')('◆')} ${chalk.hex('#38BDF8')(`[${t.type}]`)} ${chalk.white(t.title || 'Untitled')}`)
          ], '#10B981'));
        } catch (e: any) {
          console.log(renderCyberCard('CDP 9334 STATUS', [
            `${chalk.hex('#F43F5E').bold('🔴 OFFLINE')} — ${e.message}`,
            chalk.hex('#94A3B8')('AntiGravity IDE is not responding on port 9334.')
          ], '#F43F5E'));
        }
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '2': {
        console.log(chalk.hex('#00F0FF')('\n  📸 Capturing active viewport...'));
        const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
        if (await client.connect()) {
          const cap = new ScreenCapture(client);
          const res = await cap.capture();
          console.log(renderCyberCard('VIEWPORT CAPTURE', [
            `${chalk.hex('#10B981').bold('✔ Screenshot Saved:')} ${chalk.white(res.filePath)}`,
            `${chalk.hex('#38BDF8').bold('📊 Size:')}             ${(res.buffer.length / 1024).toFixed(1)} KB`
          ], '#10B981'));
          await client.close();
        } else {
          console.log(renderCyberCard('CAPTURE FAILED', [
            `${chalk.hex('#F43F5E').bold('✖ Connection Error:')} AntiGravity 2.0 is not reachable on port 9334.`
          ], '#F43F5E'));
        }
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '3': {
        const promptText = await ask(rl, `  ${chalk.hex('#00F0FF').bold('❯')} ${chalk.white('Enter Prompt for AntiGravity Agent:')} `);
        if (promptText) {
          const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
          if (await client.connect()) {
            const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
            await watcher.sendUserPrompt(promptText);
            console.log(renderCyberCard('PROMPT DISPATCHED', [
              `${chalk.hex('#10B981').bold('✔ Dispatched:')} Prompt sent to AntiGravity UI context`,
              `${chalk.hex('#38BDF8').bold('📝 Prompt:')}     "${promptText}"`
            ], '#00F0FF'));
            await client.close();
          } else {
            console.log(renderCyberCard('PROMPT FAILED', [
              `${chalk.hex('#F43F5E').bold('✖ Error:')} AntiGravity IDE is not reachable on port 9334.`
            ], '#F43F5E'));
          }
        }
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '4': {
        const projName = await ask(rl, `  ${chalk.hex('#818CF8').bold('❯')} ${chalk.white('Enter New Project Name:')} `);
        if (projName) {
          const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
          await client.connect().catch(() => {});
          const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
          const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);
          const res = await ws.createProject(projName);
          console.log(renderCyberCard('PROJECT CREATED', [
            `${chalk.hex('#10B981').bold('✔ Success:')} ${res.message}`
          ], '#818CF8'));
          await client.close();
        }
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '5': {
        const folderPath = await ask(rl, `  ${chalk.hex('#818CF8').bold('❯')} ${chalk.white('Enter Workspace Path:')} `);
        if (folderPath) {
          const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
          await client.connect().catch(() => {});
          const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
          const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);
          try {
            const res = await ws.openProject(folderPath);
            console.log(renderCyberCard('WORKSPACE OPENED', [
              `${chalk.hex('#10B981').bold('✔ Success:')} ${res.message}`
            ], '#818CF8'));
          } catch (e: any) {
            console.log(renderCyberCard('OPEN FAILED', [
              `${chalk.hex('#F43F5E').bold('✖ Error:')} ${e.message}`
            ], '#F43F5E'));
          }
          await client.close();
        }
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '6': {
        const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
        const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
        const ws = new (await import('../src/cdp/WorkspaceManager.js')).WorkspaceManager(client, watcher);
        const list = await ws.listProjects();
        
        const lines: string[] = [];
        if (list.length === 0) {
          lines.push(chalk.hex('#94A3B8')('No projects found in ~/AntiGravityProjects.'));
        } else {
          list.forEach((p, i) => lines.push(`  ${chalk.hex('#F59E0B').bold(`[${i + 1}]`)}  📁  ${chalk.white.bold(p)}`));
        }

        console.log(renderCyberCard('PROJECTS MATRIX', lines, '#A855F7'));
        await ask(rl, chalk.hex('#64748B')('\n  Press Enter to continue...'));
        console.clear();
        printBanner();
        renderDashboardMenu();
        await promptUser();
        break;
      }

      case '7': {
        console.log(chalk.hex('#10B981').bold('\n  🚀 Launching Apogee 24/7 Mission Control Server...\n'));
        rl.close();
        await import('../src/index.js');
        break;
      }

      case '8':
      case 'q':
      case 'exit': {
        console.log(chalk.hex('#64748B')('\n  ⚡ Session terminated. Farewell, Operator.\n'));
        rl.close();
        process.exit(0);
        break;
      }

      default: {
        console.log(chalk.hex('#F59E0B')('  ▲ Invalid selection. Please enter a number between 1 and 9.'));
        await promptUser();
        break;
      }
    }
  };

  await promptUser();
}

program.parse(process.argv);
