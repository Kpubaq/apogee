/**
 * Apogee - 2026 Luxury Cyberpunk Telemetry & System Logger
 * Designed by ByKpubaq | Adil
 */

import chalk from 'chalk';

export type LogLevel = 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'TELEMETRY';

class ApogeeLogger {
  /**
   * Generates a sleek 2026 cyberpunk high-precision timestamp [HH:MM:SS.mmm]
   */
  private formatTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const millis = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  }

  /**
   * Formats a module name into a glowing cyberpunk tag
   */
  private formatModule(module: string): string {
    return chalk.hex('#A855F7')('⟨') + chalk.hex('#EC4899').bold(module) + chalk.hex('#A855F7')('⟩');
  }

  public debug(module: string, message: string, ...args: any[]): void {
    if (process.env.DEBUG_MODE === 'true') {
      const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
      const badge = chalk.bgHex('#1E293B').hex('#94A3B8').bold(' DBG ');
      const mod = chalk.hex('#475569')(`⟨${module}⟩`);
      const msg = chalk.hex('#94A3B8')(message);
      console.log(`${time} ${badge} ${mod} ${msg}`, ...args);
    }
  }

  public info(module: string, message: string, ...args: any[]): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const badge = chalk.bgHex('#0284C7').hex('#FFFFFF').bold(' INFO ');
    const symbol = chalk.hex('#00F0FF').bold('✦');
    const mod = this.formatModule(module);
    const msg = chalk.hex('#F1F5F9')(message);
    console.log(`${time} ${symbol} ${badge} ${mod} ${msg}`, ...args);
  }

  public success(module: string, message: string, ...args: any[]): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const badge = chalk.bgHex('#059669').hex('#FFFFFF').bold(' PASS ');
    const symbol = chalk.hex('#10B981').bold('✔');
    const mod = this.formatModule(module);
    const msg = chalk.hex('#6EE7B7').bold(message);
    console.log(`${time} ${symbol} ${badge} ${mod} ${msg}`, ...args);
  }

  public warn(module: string, message: string, ...args: any[]): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const badge = chalk.bgHex('#D97706').hex('#000000').bold(' WARN ');
    const symbol = chalk.hex('#F59E0B').bold('▲');
    const mod = this.formatModule(module);
    const msg = chalk.hex('#FDE68A')(message);
    console.warn(`${time} ${symbol} ${badge} ${mod} ${msg}`, ...args);
  }

  public error(module: string, message: string, ...args: any[]): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const badge = chalk.bgHex('#E11D48').hex('#FFFFFF').bold(' FAIL ');
    const symbol = chalk.hex('#F43F5E').bold('✖');
    const mod = this.formatModule(module);
    const msg = chalk.hex('#FDA4AF')(message);
    console.error(`${time} ${symbol} ${badge} ${mod} ${msg}`, ...args);
  }

  public telemetry(event: string, details: Record<string, any> = {}): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const badge = chalk.bgHex('#7C3AED').hex('#FFFFFF').bold(' TELEMETRY ');
    const symbol = chalk.hex('#A855F7')('🛰️');
    const evtName = chalk.hex('#00F0FF').bold(event);
    
    console.log(`${time} ${symbol} ${badge} ${evtName}`);

    const entries = Object.entries(details);
    if (entries.length > 0) {
      const formatted = entries
        .map(([k, v]) => `${chalk.hex('#F59E0B')(k)}=${chalk.hex('#10B981')(typeof v === 'object' ? JSON.stringify(v) : String(v))}`)
        .join(chalk.hex('#475569')('  •  '));
      console.log(`   ${chalk.hex('#8B5CF6')('└─►')} ${formatted}`);
    }
  }

  public step(step: number | string, description: string): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    const stepBadge = chalk.bgHex('#4338CA').hex('#E0E7FF').bold(` STEP ${step} `);
    console.log(`${time} ${chalk.hex('#818CF8')('❯')} ${stepBadge} ${chalk.hex('#FFFFFF').bold(description)}`);
  }

  public status(service: string, state: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'STANDBY', detail?: string): void {
    const time = chalk.hex('#64748B')(`[${this.formatTime()}]`);
    let stateBadge = '';
    switch (state) {
      case 'ONLINE':
        stateBadge = chalk.hex('#10B981').bold('🟢 ONLINE');
        break;
      case 'CONNECTING':
        stateBadge = chalk.hex('#F59E0B').bold('🟡 CONNECTING');
        break;
      case 'STANDBY':
        stateBadge = chalk.hex('#94A3B8').bold('⚪ STANDBY');
        break;
      case 'OFFLINE':
      default:
        stateBadge = chalk.hex('#F43F5E').bold('🔴 OFFLINE');
        break;
    }

    const detailText = detail ? ` ${chalk.hex('#64748B')('—')} ${chalk.hex('#CBD5E1')(detail)}` : '';
    console.log(`${time} ${chalk.hex('#00F0FF')('◆')} ${chalk.hex('#E2E8F0').bold(service)}: ${stateBadge}${detailText}`);
  }

  public divider(title?: string): void {
    if (title) {
      const header = `── ${chalk.hex('#00F0FF').bold(title)} `;
      const rest = 74 - header.length;
      console.log(chalk.hex('#334155')(`${header}${'─'.repeat(Math.max(0, rest))}`));
    } else {
      console.log(chalk.hex('#334155')('─'.repeat(74)));
    }
  }
}

export const logger = new ApogeeLogger();
