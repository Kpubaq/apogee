/**
 * Apogee - 24/7 Watchdog Supervisor
 * ByKpubaq | Adil
 */

import { spawn } from 'child_process';
import { logger } from '../src/utils/logger.js';
import { printBanner } from '../src/utils/banner.js';

let restartCount = 0;
const MAX_RESTARTS = 50;

printBanner();
logger.info('Watchdog', 'Apogee 24/7 Supervisor daemon started.');

function startProcess() {
  logger.info('Watchdog', `Spawning Apogee runtime (Run #${restartCount + 1})...`);

  const child = spawn('npx', ['tsx', 'src/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  child.on('exit', (code, signal) => {
    logger.warn('Watchdog', `Process stopped (code: ${code}, signal: ${signal})`);
    restartCount++;

    if (restartCount < MAX_RESTARTS) {
      logger.info('Watchdog', 'Restarting in 3 seconds...');
      setTimeout(startProcess, 3000);
    } else {
      logger.error('Watchdog', 'Maximum restart attempts reached. Terminating.');
      process.exit(1);
    }
  });

  child.on('error', (err) => {
    logger.error('Watchdog', `Process error: ${err.message}`);
  });
}

startProcess();
