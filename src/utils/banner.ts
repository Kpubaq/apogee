/**
 * Apogee - Modern ASCII Banner with ByKpubaq | Adil Branding
 */

import chalk from 'chalk';

export function getApogeeBanner(): string {
  const line1 = chalk.bold.cyan("    ___    ____  ____  ______ ______ ______");
  const line2 = chalk.bold.cyan("   /   |  / __ \\/ __ \\/ ____// ____// ____/");
  const line3 = chalk.bold.magenta("  / /| | / /_/ / / / / / __ / __/  / __/   ");
  const line4 = chalk.bold.magenta(" / ___ |/ ____/ /_/ / /_/ // /___ / /___   ");
  const line5 = chalk.bold.blue("/_/  |_/_/    \\____/\\____//_____//_____/   ");
  const author = chalk.hex('#FFA500').bold("ByKpubaq | Adil");

  return `
${line1}
${line2}
${line3}
${line4}
${line5}                                 \x1b[90m[\x1b[0m${author}\x1b[90m]\x1b[0m
${chalk.gray('────────────────────────────────────────────────────────────────────────')}
  ${chalk.cyan('🚀 Target Platform:')} ${chalk.white('AntiGravity 2.0 | IDE | CLI / App')}
  ${chalk.magenta('📱 Omnichannel:')}     ${chalk.white('Telegram | WhatsApp (QR) | Discord | CLI')}
  ${chalk.yellow('⚡ Autonomy:')}        ${chalk.white('Auto-Accept ON | Proactive Telemetry | Screenshots')}
${chalk.gray('────────────────────────────────────────────────────────────────────────')}
`;
}

export function printBanner(): void {
  console.log(getApogeeBanner());
}
