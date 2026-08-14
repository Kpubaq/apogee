/**
 * Apogee - Task Watcher & Prompt Injection Engine
 */

import { CDPClient } from './CDPClient.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';

export interface TaskState {
  isBusy: boolean;
  lastResponseText: string;
  responseLength: number;
  lastUpdated: number;
}

export class TaskWatcher {
  private cdp: CDPClient;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastState: TaskState = {
    isBusy: false,
    lastResponseText: '',
    responseLength: 0,
    lastUpdated: Date.now()
  };

  constructor(cdp: CDPClient) {
    this.cdp = cdp;
  }

  public getState(): TaskState {
    return { ...this.lastState };
  }

  public start(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      if (!this.cdp.getConnectedStatus()) return;

      try {
        await this.inspectChatState();
      } catch (err: any) {
        logger.debug('TaskWatcher', `Status check: ${err.message}`);
      }
    }, 1200);

    logger.info('TaskWatcher', 'Task Watcher background service active.');
  }

  public stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  public async getLatestMessage(): Promise<string> {
    if (!this.cdp.getConnectedStatus()) {
      return this.lastState.lastResponseText || 'AntiGravity IDE not connected.';
    }

    try {
      const script = `
        (() => {
          const bubbles = Array.from(document.querySelectorAll('.agent-response, .chat-turn-model, [data-author="model"], .rendered-markdown'));
          if (!bubbles.length) return '';
          const latest = bubbles[bubbles.length - 1];
          return (latest.innerText || latest.textContent || '').trim();
        })()
      `;
      const text = await this.cdp.evaluate<string>(script);
      return text || this.lastState.lastResponseText;
    } catch {
      return this.lastState.lastResponseText;
    }
  }

  public async sendUserPrompt(prompt: string): Promise<boolean> {
    if (!this.cdp.getConnectedStatus()) {
      throw new Error('AntiGravity is not connected via CDP.');
    }

    logger.info('TaskWatcher', `Dispatching prompt to AntiGravity UI (${prompt.length} chars)...`);

    const script = `
      ((text) => {
        const textarea = document.querySelector('textarea, [contenteditable="true"], .monaco-editor textarea, input[type="text"]');
        if (!textarea) return { success: false, error: 'Chat input element not found' };

        if (textarea.tagName.toLowerCase() === 'textarea' || textarea.tagName.toLowerCase() === 'input') {
          textarea.value = text;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          textarea.innerText = text;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const sendBtn = document.querySelector('button[aria-label*="send" i], button[title*="send" i], .chat-send-button');
        if (sendBtn && !sendBtn.disabled) {
          sendBtn.click();
          return { success: true, method: 'button_click' };
        }

        const enterEvent = new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13
        });
        textarea.dispatchEvent(enterEvent);
        return { success: true, method: 'enter_key' };
      })(${JSON.stringify(prompt)})
    `;

    const result = await this.cdp.evaluate<{ success: boolean; method?: string; error?: string }>(script);
    if (!result || !result.success) {
      throw new Error(result?.error || 'Failed to send prompt to AntiGravity.');
    }

    this.lastState.isBusy = true;
    eventBus.emitEvent('agent:state_change', {
      channelId: 'system',
      data: { isBusy: true },
      timestamp: Date.now()
    });

    return true;
  }

  private async inspectChatState(): Promise<void> {
    const script = `
      (() => {
        const isBusy = !!document.querySelector('.generating, .thinking, .typing-indicator, [data-status="busy"], button[aria-label*="stop" i]');
        const bubbles = Array.from(document.querySelectorAll('.agent-response, .chat-turn-model, [data-author="model"], .rendered-markdown'));
        const latestText = bubbles.length ? (bubbles[bubbles.length - 1].innerText || '') : '';
        return { isBusy, latestText: latestText.trim() };
      })()
    `;

    const res = await this.cdp.evaluate<{ isBusy: boolean; latestText: string }>(script);
    if (!res) return;

    const wasBusy = this.lastState.isBusy;

    this.lastState.isBusy = res.isBusy;
    this.lastState.lastResponseText = res.latestText;
    this.lastState.responseLength = res.latestText.length;
    this.lastState.lastUpdated = Date.now();

    if (wasBusy && !res.isBusy) {
      logger.success('TaskWatcher', 'Agent generation completed.');
      eventBus.emitEvent('agent:response', {
        channelId: 'system',
        text: res.latestText,
        data: { text: res.latestText },
        timestamp: Date.now()
      });
      eventBus.emitEvent('agent:state_change', {
        channelId: 'system',
        data: { isBusy: false },
        timestamp: Date.now()
      });
    } else if (!wasBusy && res.isBusy) {
      eventBus.emitEvent('agent:state_change', {
        channelId: 'system',
        data: { isBusy: true },
        timestamp: Date.now()
      });
    }
  }
}
