/**
 * Apogee - DOM Observer & Auto-Accept Engine
 */

import { CDPClient } from './CDPClient.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';

export class DOMObserver {
  private cdp: CDPClient;
  private isAutoAcceptEnabled: boolean = true;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(cdp: CDPClient, defaultEnabled: boolean = true) {
    this.cdp = cdp;
    this.isAutoAcceptEnabled = defaultEnabled;
  }

  public setAutoAccept(enabled: boolean): void {
    this.isAutoAcceptEnabled = enabled;
    logger.info('DOMObserver', `Auto-Accept mode set to: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  public getAutoAcceptStatus(): boolean {
    return this.isAutoAcceptEnabled;
  }

  public start(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      if (!this.isAutoAcceptEnabled || !this.cdp.getConnectedStatus()) return;

      try {
        await this.checkAndClickConfirmButtons();
      } catch (err: any) {
        logger.debug('DOMObserver', `Polling cycle: ${err.message}`);
      }
    }, 1200);

    logger.info('DOMObserver', 'Auto-Accept DOM scanner activated.');
  }

  public stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async checkAndClickConfirmButtons(): Promise<void> {
    const script = `
      (() => {
        const actionKeywords = [
          'run', 'accept', 'allow', 'continue', 'apply', 'proceed', 'allow command',
          'run command', 'save changes', 'confirm', 'выполнить', 'принять', 'продолжить'
        ];

        const buttons = Array.from(document.querySelectorAll('button, .monaco-button, [role="button"]'));
        for (const btn of buttons) {
          const text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
          const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
          const match = actionKeywords.find(kw => text === kw || aria === kw || text.includes(kw));

          if (match && !btn.disabled && btn.offsetParent !== null) {
            btn.click();
            return { clicked: true, text: text || aria, match };
          }
        }
        return { clicked: false };
      })()
    `;

    const result = await this.cdp.evaluate<{ clicked: boolean; text?: string; match?: string }>(script);

    if (result && result.clicked) {
      logger.success('AutoAccept', `⚡ Action auto-confirmed: [${result.text}] (${result.match})`);
      eventBus.emitEvent('autoaccept:triggered', {
        channelId: 'system',
        data: result,
        timestamp: Date.now()
      });
    }
  }
}
