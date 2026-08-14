/**
 * Apogee - Model & Effort Tier Selector
 */

import { CDPClient } from './CDPClient.js';
import { logger } from '../utils/logger.js';

export const APOGEE_MODELS = [
  'Gemini 3.7 Flash (High)',
  'Gemini 3.7 Flash (Medium)',
  'Gemini 3.7 Flash (Low)',
  'Gemini 3.1 Pro (High)',
  'Gemini 3.1 Pro (Low)',
  'Claude Opus 4.6',
  'Claude Sonnet 4.6'
];

export class ModelSelector {
  private cdp: CDPClient;
  private currentModel: string;

  constructor(cdp: CDPClient, defaultModel: string = 'Gemini 3.7 Flash (High)') {
    this.cdp = cdp;
    this.currentModel = defaultModel;
  }

  public getCurrentModel(): string {
    return this.currentModel;
  }

  public getAvailableModels(): string[] {
    return APOGEE_MODELS;
  }

  public async setModel(modelName: string): Promise<boolean> {
    this.currentModel = modelName;
    logger.info('ModelSelector', `Switching agent model to: "${modelName}"`);

    if (!this.cdp.getConnectedStatus()) {
      return true;
    }

    try {
      const script = `
        (() => {
          const btns = Array.from(document.querySelectorAll('[data-testid="model-selector"], .model-picker, [aria-label*="model" i]'));
          for (const btn of btns) {
            btn.click();
            break;
          }
          return { success: true };
        })()
      `;
      await this.cdp.evaluate(script);
      return true;
    } catch (err: any) {
      logger.error('ModelSelector', `Model switch DOM error: ${err.message}`);
      return false;
    }
  }
}
