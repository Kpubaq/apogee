/**
 * Apogee - 2026 Luxury Cyberpunk Terminal Banner & Telemetry HUD
 * Designed by ByKpubaq | Adil
 */

import chalk from 'chalk';

export interface BannerOptions {
  idePort?: number;
  ideOnline?: boolean;
  cliPort?: number;
  cliOnline?: boolean;
  autoAccept?: boolean;
  activeChannels?: string[];
  activeTarget?: string;
  showHud?: boolean;
}

/**
 * Remove ANSI escape sequences from string
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

/**
 * Calculate visible visual length of a string in terminal columns
 */
export function visualLength(str: string): number {
  const plain = stripAnsi(str);
  let len = 0;
  for (let i = 0; i < plain.length; i++) {
    const code = plain.codePointAt(i) || 0;
    // East Asian Wide characters & standard emojis count as 2 columns
    if (
      (code >= 0x1F300 && code <= 0x1FAFF) ||
      (code >= 0x2600 && code <= 0x27BF) ||
      (code >= 0x1F600 && code <= 0x1F64F) ||
      (code >= 0x1F900 && code <= 0x1F9FF) ||
      (code >= 0x1100 && (code <= 0x115f || code === 0x2329 || code === 0x232a || (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) || (code >= 0xac00 && code <= 0xd7a3) || (code >= 0xf900 && code <= 0xfaff) || (code >= 0xfe10 && code <= 0xfe19) || (code >= 0xfe30 && code <= 0xfe6f) || (code >= 0xff00 && code <= 0xff60) || (code >= 0xffe0 && code <= 0xffe6)))
    ) {
      len += 2;
      if (code > 0xffff) i++; // skip surrogate pair
    } else {
      len += 1;
    }
  }
  return len;
}

/**
 * Pad line content to exact width inside box walls
 */
export function padBoxLine(content: string, width: number = 76): string {
  const vLen = visualLength(content);
  const padding = Math.max(0, width - vLen);
  return content + ' '.repeat(padding);
}

/**
 * Wraps a string into multiple lines fitting within maxLen visual characters
 */
export function wrapVisualLine(str: string, maxLen: number): string[] {
  if (visualLength(str) <= maxLen) return [str];
  const words = str.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (visualLength(testLine) <= maxLen) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
        currentLine = '';
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Renders the ultra-crisp 2026 luxury cyberpunk ASCII banner for APOGEE
 */
export function getApogeeBanner(options: BannerOptions = {}): string {
  const {
    idePort = 9334,
    ideOnline = true,
    cliPort = 9333,
    cliOnline = false,
    autoAccept = true,
    activeChannels = ['Telegram', 'WhatsApp MD', 'Discord', 'CLI'],
    showHud = true
  } = options;

  const INNER_WIDTH = 76;

  // Frame colors
  const borderCyan = chalk.hex('#00F0FF');
  const borderViolet = chalk.hex('#8B5CF6');
  const borderDim = chalk.hex('#334155');

  // Gradient ASCII Logo for APOGEE
  const logoLine1 = chalk.hex('#00F0FF').bold('  █████╗ ██████╗  ██████╗  ██████╗ ███████╗███████╗');
  const logoLine2 = chalk.hex('#00D2FF').bold(' ██╔══██╗██╔══██╗██╔═══██╗██╔════╝ ██╔════╝██╔════╝');
  const logoLine3 = chalk.hex('#818CF8').bold(' ███████║██████╔╝██║   ██║██║  ███╗█████╗  █████╗  ');
  const logoLine4 = chalk.hex('#A855F7').bold(' ██╔══██║██╔═══╝ ██║   ██║██║   ██║██╔══╝  ██╔══╝  ');
  const logoLine5 = chalk.hex('#EC4899').bold(' ██║  ██║██║     ╚██████╔╝╚██████╔╝███████╗███████╗');
  const logoLine6 = chalk.hex('#F43F5E').bold(' ╚═╝  ╚═╝╚═╝      ╚═════╝  ╚═════╝ ╚══════╝╚══════╝');

  // Centering padding for 51-char logo in 76-char inner box
  const logoLeftPad = '            '; // 12 spaces

  // Top rounded border
  const topBorder = borderCyan('╭' + '─'.repeat(INNER_WIDTH) + '╮');
  const dividerBorder = borderDim('├' + '─'.repeat(INNER_WIDTH) + '┤');

  // Author Watermark Bottom Border
  // 1 (╰) + 50 (─) + 3 (' [ ') + 15 ('ByKpubaq | Adil') + 3 (' ] ') + 5 (─) + 1 (╯) = 78 total width
  const authorTag = chalk.hex('#64748B')(' [ ') + chalk.hex('#F59E0B').bold('ByKpubaq | Adil') + chalk.hex('#64748B')(' ] ');
  const bottomBorder = borderViolet('╰' + '─'.repeat(50)) + authorTag + borderViolet('─'.repeat(5) + '╯');

  // Subtitle header
  const subTitleLeft = chalk.hex('#00FF9D').bold('  ✦') + ' ' + chalk.hex('#E2E8F0').bold('UNIVERSAL AUTONOMOUS MISSION CONTROL');
  const versionBadge = chalk.hex('#38BDF8').bold('v2.0.0') + ' ' + chalk.hex('#64748B')('│') + ' ' + chalk.hex('#A855F7').bold('CYBERDECK');
  const subTitleSpacing = Math.max(2, INNER_WIDTH - visualLength(subTitleLeft) - visualLength(versionBadge) - 2);
  const subTitleLine = `${subTitleLeft}${' '.repeat(subTitleSpacing)}${versionBadge}  `;

  // Status Dots & Telemetry Formats
  const ideStatusDot = ideOnline ? chalk.hex('#10B981').bold('🟢 ONLINE') : chalk.hex('#64748B').bold('⚪ STANDBY');
  const cliStatusDot = cliOnline ? chalk.hex('#10B981').bold('🟢 ONLINE') : chalk.hex('#64748B').bold('⚪ STANDBY');
  const autoAcceptDot = autoAccept ? chalk.hex('#10B981').bold('🟢 ACTIVE') : chalk.hex('#F59E0B').bold('🟡 PAUSED');

  // Telemetry Rows with exact layout
  const rowTarget = `  ${chalk.hex('#00F0FF')('◆')} ${chalk.hex('#38BDF8').bold('TARGET ENGINE')}    ${chalk.hex('#475569')('│')} ${chalk.white('IDE [9334]:')} ${ideStatusDot}   ${chalk.white('CLI [9333]:')} ${cliStatusDot}`;
  
  const channelsFormatted = activeChannels.map(c => chalk.hex('#F1F5F9')(c)).join(chalk.hex('#EC4899')(' ✦ '));
  const rowChannels = `  ${chalk.hex('#EC4899')('◆')} ${chalk.hex('#F472B6').bold('ACTIVE CHANNELS')}  ${chalk.hex('#475569')('│')} ${chalk.hex('#F59E0B')('⚡')} ${channelsFormatted}`;
  
  const rowAutonomy = `  ${chalk.hex('#A855F7')('◆')} ${chalk.hex('#C084FC').bold('AUTONOMY STATUS')}  ${chalk.hex('#475569')('│')} ${autoAcceptDot} ${chalk.hex('#64748B')('(Auto-Confirm)')}   ${chalk.hex('#00F0FF')('📡')} ${chalk.hex('#E2E8F0')('Live CDP Observer')}`;

  const rowSubsystem = `  ${chalk.hex('#10B981')('◆')} ${chalk.hex('#34D399').bold('PROTOCOL CORE')}    ${chalk.hex('#475569')('│')} ${chalk.hex('#00FF9D')('💎')} ${chalk.white('AntiGravity 2.0 Engine')}  ${chalk.hex('#475569')('│')} ${chalk.hex('#F59E0B')('⚡')} ${chalk.white('<1ms Bridge')}`;

  const renderWall = (content: string, wallColor = borderCyan) => {
    return `${wallColor('│')}${padBoxLine(content, INNER_WIDTH)}${wallColor('│')}`;
  };

  const lines: string[] = [
    '',
    topBorder,
    renderWall(''),
    renderWall(`${logoLeftPad}${logoLine1}`),
    renderWall(`${logoLeftPad}${logoLine2}`),
    renderWall(`${logoLeftPad}${logoLine3}`),
    renderWall(`${logoLeftPad}${logoLine4}`),
    renderWall(`${logoLeftPad}${logoLine5}`),
    renderWall(`${logoLeftPad}${logoLine6}`),
    renderWall(''),
    renderWall(subTitleLine),
  ];

  if (showHud) {
    lines.push(
      dividerBorder,
      renderWall(''),
      renderWall(rowTarget, borderViolet),
      renderWall(rowChannels, borderViolet),
      renderWall(rowAutonomy, borderViolet),
      renderWall(rowSubsystem, borderViolet),
      renderWall('')
    );
  }

  lines.push(bottomBorder, '');

  return lines.join('\n');
}

/**
 * Prints the main Apogee cyberpunk banner to standard output
 */
export function printBanner(options?: BannerOptions): void {
  console.log(getApogeeBanner(options));
}

/**
 * Returns a compact single-line or mini cyber badge for subcommands
 */
export function getCompactBanner(): string {
  const title = chalk.hex('#00F0FF').bold('APOGEE') + ' ' + chalk.hex('#A855F7').bold('v2.0.0') + ' ' + chalk.hex('#EC4899')('⟨Mission Control⟩');
  const author = chalk.hex('#64748B')('[') + chalk.hex('#F59E0B').bold('ByKpubaq | Adil') + chalk.hex('#64748B')(']');
  return `\n${title}  ${author}\n${chalk.hex('#334155')('─'.repeat(76))}\n`;
}

/**
 * Helper to render a stylized cyber card
 */
export function renderCyberCard(title: string, contentLines: string[], borderColorHex = '#00F0FF'): string {
  const INNER_WIDTH = 76;
  const border = chalk.hex(borderColorHex);
  const topTitle = ` ${chalk.bold.white(title)} `;
  const topDashCount = Math.max(0, INNER_WIDTH - visualLength(topTitle) - 3);
  
  const header = border(`╭─${topTitle}${'─'.repeat(topDashCount)}╮`);
  const footer = border(`╰${'─'.repeat(INNER_WIDTH)}╯`);

  const wrappedLines: string[] = [];
  for (const line of contentLines) {
    if (!line.trim()) {
      wrappedLines.push('');
    } else {
      const parts = wrapVisualLine(line, INNER_WIDTH - 4);
      wrappedLines.push(...parts);
    }
  }

  const body = wrappedLines.map(line => `${border('│')}${padBoxLine('  ' + line, INNER_WIDTH)}${border('│')}`).join('\n');

  return `${header}\n${body}\n${footer}`;
}
