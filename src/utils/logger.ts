/**
 * Apogee - Telemetry & System Logger
 */

import chalk from 'chalk';

class ApogeeLogger {
  private formatTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  public debug(module: string, message: string, ...args: any[]): void {
    if (process.env.DEBUG_MODE === 'true') {
      console.log(`${chalk.gray(`[${this.formatTime()}]`)} ${chalk.gray(`[DEBUG]`)} ${chalk.dim(`[${module}]`)} ${message}`, ...args);
    }
  }

  public info(module: string, message: string, ...args: any[]): void {
    console.log(`${chalk.gray(`[${this.formatTime()}]`)} ${chalk.cyan(`[INFO]`)} ${chalk.magenta(`[${module}]`)} ${chalk.white(message)}`, ...args);
  }

  public success(module: string, message: string, ...args: any[]): void {
    console.log(`${chalk.gray(`[${this.formatTime()}]`)} ${chalk.green(`[SUCCESS]`)} ${chalk.magenta(`[${module}]`)} ${chalk.green(message)}`, ...args);
  }

  public warn(module: string, message: string, ...args: any[]): void {
    console.warn(`${chalk.gray(`[${this.formatTime()}]`)} ${chalk.yellow(`[WARN]`)} ${chalk.magenta(`[${module}]`)} ${chalk.yellow(message)}`, ...args);
  }

  public error(module: string, message: string, ...args: any[]): void {
    console.error(`${chalk.gray(`[${this.formatTime()}]`)} ${chalk.red(`[ERROR]`)} ${chalk.magenta(`[${module}]`)} ${chalk.red(message)}`, ...args);
  }

  public telemetry(event: string, details: Record<string, any>): void {
    console.log(
      `${chalk.gray(`[${this.formatTime()}]`)} ${chalk.bold.blue(`[🛰️ TELEMETRY]`)} ${chalk.bold.cyan(event)} | ` +
      Object.entries(details).map(([k, v]) => `${chalk.yellow(k)}=${chalk.white(JSON.stringify(v))}`).join(' ')
    );
  }
}

export const logger = new ApogeeLogger();
