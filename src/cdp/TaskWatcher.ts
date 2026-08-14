/**
 * Apogee - Task Watcher & Native CDP Prompt Injection Engine
 * ByKpubaq | Adil
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
    }, 1000);

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
          const elements = Array.from(document.querySelectorAll('.whitespace-pre-wrap, p, pre, .rendered-markdown, [data-author="model"]'));
          if (!elements.length) return '';
          // Get the last substantial element
          for (let i = elements.length - 1; i >= 0; i--) {
            const text = (elements[i].innerText || elements[i].textContent || '').trim();
            if (text.length > 5) return text;
          }
          return '';
        })()
      `;
      const text = await this.cdp.evaluate<string>(script);
      return text || this.lastState.lastResponseText;
    } catch {
      return this.lastState.lastResponseText;
    }
  }

  /**
   * Dispatches user prompt directly into AntiGravity via native Chromium CDP Input pipeline
   */
  public async sendUserPrompt(prompt: string): Promise<boolean> {
    if (!this.cdp.getConnectedStatus()) {
      throw new Error('AntiGravity is not connected via CDP.');
    }

    logger.info('TaskWatcher', `Dispatching prompt to AntiGravity UI (${prompt.length} chars)...`);

    // 1. Focus editor and clear previous draft in DOM
    const focusScript = `
      (() => {
        const editor = document.querySelector('[contenteditable="true"], textarea, input[type="text"]');
        if (!editor) return { success: false, error: 'Editor input not found in DOM' };

        editor.focus();

        if (editor.tagName.toLowerCase() === 'textarea' || editor.tagName.toLowerCase() === 'input') {
          editor.value = '';
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // Select all & delete for contenteditable
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          editor.innerHTML = '<p><br></p>';
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }

        return { success: true };
      })()
    `;

    const focusRes = await this.cdp.evaluate<{ success: boolean; error?: string }>(focusScript);
    if (!focusRes?.success) {
      throw new Error(focusRes?.error || 'Could not focus AntiGravity editor input.');
    }

    // 2. Native CDP Input.insertText (directly updates React/Lexical/ProseMirror buffers)
    await this.cdp.send('Input.insertText', { text: prompt });

    // Short pause for state synchronization
    await new Promise(r => setTimeout(r, 80));

    // 3. Dispatch Enter key via native CDP KeyEvents
    await this.cdp.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });

    await this.cdp.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });

    // 4. Also trigger submit button if available in DOM
    await this.cdp.evaluate(`
      (() => {
        const sendBtn = document.querySelector(
          'button[data-tooltip-id*="input-send-button"], button[aria-label*="send" i], button[aria-label*="submit" i], button[type="submit"]'
        );
        if (sendBtn && !sendBtn.disabled && !sendBtn.getAttribute('aria-label')?.toLowerCase().includes('cancel')) {
          sendBtn.click();
        }
      })()
    `);

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
        const isBusy = !!document.querySelector(
          'button[aria-label*="cancel" i], button[aria-label*="stop" i], [data-tooltip-id*="cancel"], .animate-spin, .loading'
        );
        
        const elements = Array.from(document.querySelectorAll('.whitespace-pre-wrap, p, pre, .rendered-markdown, [data-author="model"]'));
        let latestText = '';
        for (let i = elements.length - 1; i >= 0; i--) {
          const t = (elements[i].innerText || elements[i].textContent || '').trim();
          if (t.length > 10) {
            latestText = t;
            break;
          }
        }

        return { isBusy, latestText };
      })()
    `;

    const res = await this.cdp.evaluate<{ isBusy: boolean; latestText: string }>(script);
    if (!res) return;

    const wasBusy = this.lastState.isBusy;

    this.lastState.isBusy = res.isBusy;
    if (res.latestText) {
      this.lastState.lastResponseText = res.latestText;
      this.lastState.responseLength = res.latestText.length;
    }
    this.lastState.lastUpdated = Date.now();

    if (wasBusy && !res.isBusy) {
      logger.success('TaskWatcher', 'Agent generation completed.');
      eventBus.emitEvent('agent:response', {
        channelId: 'system',
        text: this.lastState.lastResponseText,
        data: { text: this.lastState.lastResponseText },
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
