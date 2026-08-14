/**
 * Apogee - Telegram Adapter
 */

import { BaseAdapter, SendMessageOptions } from './BaseAdapter.js';
import { ApogeeCore } from '../core/ApogeeCore.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';

export class TelegramAdapter extends BaseAdapter {
  public readonly name = 'telegram' as const;
  private botToken: string;
  private allowedUsers: string[];
  private isRunning: boolean = false;
  private core: ApogeeCore;
  private lastUpdateId: number = 0;
  private pollAbort: AbortController | null = null;
  private activeChats: Set<string> = new Set();

  constructor(core: ApogeeCore, botToken: string, allowedUsers: string[] = []) {
    super();
    this.core = core;
    this.botToken = botToken;
    this.allowedUsers = allowedUsers;
  }

  public isEnabled(): boolean {
    return !!this.botToken;
  }

  public async start(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info('TelegramAdapter', 'Telegram Bot Token not configured. Adapter skipped.');
      return;
    }

    logger.info('TelegramAdapter', 'Starting Telegram Bot Long-Polling...');
    this.isRunning = true;
    this.pollAbort = new AbortController();

    eventBus.onEvent('agent:response', async (payload) => {
      if (payload.text) {
        for (const chatId of this.activeChats) {
          await this.sendMessage({
            chatId,
            text: `🛰️ **Ответ AntiGravity:**\n\n${payload.text}`
          }).catch(e => logger.error('TelegramAdapter', `Broadcast error: ${e.message}`));
        }
      }
    });

    this.runPollingLoop().catch(e => {
      logger.error('TelegramAdapter', `Polling loop error: ${e.message}`);
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.pollAbort) {
      this.pollAbort.abort();
      this.pollAbort = null;
    }
  }

  public async sendMessage(opts: SendMessageOptions): Promise<void> {
    if (!this.isEnabled()) return;

    const { chatId, text, buttons, photoBuffer } = opts;
    this.activeChats.add(chatId);

    if (photoBuffer) {
      await this.sendPhotoNative(chatId, photoBuffer, text);
      return;
    }

    const payload: Record<string, any> = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    };

    if (buttons && buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: buttons.map(b => [{ text: b, callback_data: b.substring(0, 60) }])
      };
    }

    await this.callApi('sendMessage', payload);
  }

  private async sendPhotoNative(chatId: string, buffer: Buffer, caption?: string): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (caption) formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
    formData.append('photo', blob, 'screenshot.png');

    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send photo: ${err}`);
    }
  }

  private async callApi(method: string, body: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (e: any) {
      logger.error('TelegramAdapter', `API Exception: ${e.message}`);
    }
  }

  private async runPollingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=20`,
          { signal: this.pollAbort?.signal }
        );

        if (!res.ok) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data = (await res.json()) as any;
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.processUpdate(update);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  private async processUpdate(update: any): Promise<void> {
    let chatId = '';
    let userId = '';
    let text = '';

    if (update.message) {
      chatId = String(update.message.chat.id);
      userId = String(update.message.from?.id || chatId);
      text = update.message.text || '';
    } else if (update.callback_query) {
      chatId = String(update.callback_query.message?.chat.id);
      userId = String(update.callback_query.from?.id || chatId);
      text = update.callback_query.data || '';

      await this.callApi('answerCallbackQuery', {
        callback_query_id: update.callback_query.id
      });
    }

    if (!text || !chatId) return;
    this.activeChats.add(chatId);

    if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(userId) && !this.allowedUsers.includes(chatId)) {
      await this.sendMessage({
        chatId,
        text: `⛔ **Доступ запрещен.** ID \`${chatId}\` не авторизован в Apogee.`
      });
      return;
    }

    const result = await this.core.handleUserMessage({
      channelId: 'telegram',
      userId,
      chatId,
      rawText: text
    });

    if (result.text || result.photoBuffer || result.buttons) {
      await this.sendMessage({
        chatId,
        text: result.text || '',
        photoBuffer: result.photoBuffer,
        buttons: result.buttons
      });
    }
  }
}
