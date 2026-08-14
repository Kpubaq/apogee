/**
 * Apogee - Screen Capture Engine
 */

import fs from 'fs/promises';
import path from 'path';
import { CDPClient } from './CDPClient.js';
import { logger } from '../utils/logger.js';

export class ScreenCapture {
  private cdp: CDPClient;
  private screenshotsDir: string;

  constructor(cdp: CDPClient, screenshotsDir: string = './screenshots') {
    this.cdp = cdp;
    this.screenshotsDir = path.resolve(screenshotsDir);
  }

  public async capture(): Promise<{ buffer: Buffer; filePath: string; timestamp: number }> {
    if (!this.cdp.getConnectedStatus()) {
      throw new Error('AntiGravity is not connected via CDP.');
    }

    await fs.mkdir(this.screenshotsDir, { recursive: true });

    logger.info('ScreenCapture', 'Capturing AntiGravity screen surface...');
    const buffer = await this.cdp.captureScreenshot();

    const timestamp = Date.now();
    const fileName = `apogee_screenshot_${timestamp}.png`;
    const filePath = path.join(this.screenshotsDir, fileName);

    await fs.writeFile(filePath, buffer);
    logger.success('ScreenCapture', `Screenshot captured (${(buffer.length / 1024).toFixed(1)} KB) -> ${filePath}`);

    return { buffer, filePath, timestamp };
  }
}
