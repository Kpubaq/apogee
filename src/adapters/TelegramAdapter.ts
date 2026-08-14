import { BaseAdapter, SendMessageOptions } from './BaseAdapter.js';
import { ApogeeCore } from '../core/ApogeeCore.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';
import os from 'os';
import path from 'path';

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
      const globalEnv = path.join(os.homedir(), '.apogee', '.env');
      logger.warn('TelegramAdapter', `⚠️ Telegram Bot Token не настроен! Укажите TELEGRAM_BOT_TOKEN в файле: ${globalEnv}`);
      return;
    }

    logger.info('TelegramAdapter', 'Connecting to Telegram Bot API...');
    try {
      const me = await this.callApi('getMe', {});
      if (me && me.ok) {
        logger.success('TelegramAdapter', `✔ Telegram Bot @${me.result.username} («${me.result.first_name}») УСПЕШНО ЗАПУЩЕН И СЛУШАЕТ ЧАТ!`);
      } else {
        logger.error('TelegramAdapter', `✖ Неверный токен Telegram: ${JSON.stringify(me)}`);
        return;
      }
    } catch (e: any) {
      logger.error('TelegramAdapter', `✖ Ошибка подключения к Telegram: ${e.message}`);
    }

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

    // Split long messages into 4000-char chunks for Telegram limit
    const chunks: string[] = [];
    if (text.length > 4000) {
      for (let i = 0; i < text.length; i += 4000) {
        chunks.push(text.substring(i, i + 4000));
      }
    } else {
      chunks.push(text);
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const isLast = i === chunks.length - 1;

      const payload: Record<string, any> = {
        chat_id: chatId,
        text: chunk,
        parse_mode: 'Markdown'
      };

      if (isLast && buttons && buttons.length > 0) {
        payload.reply_markup = {
          inline_keyboard: buttons.map(b => [{ text: b, callback_data: b.substring(0, 60) }])
        };
      }

      const res = await this.callApi('sendMessage', payload);
      // Fallback: If Markdown parsing fails (Telegram error), send as plain text
      if (res && !res.ok && res.description?.toLowerCase().includes('parse')) {
        delete payload.parse_mode;
        await this.callApi('sendMessage', payload);
      }
    }
  }

  private async sendPhotoNative(chatId: string, buffer: Buffer, caption?: string): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    if (caption) formData.append('caption', caption.substring(0, 1024));
    
    const blob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
    formData.append('photo', blob, 'screenshot.png');

    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.text();
      // Retry without markdown if failed
      logger.error('TelegramAdapter', `Failed to send photo: ${err}`);
    }
  }

  private async callApi(method: string, body: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!data.ok) {
        logger.warn('TelegramAdapter', `Telegram API warning on ${method}: ${data.description}`);
      }
      return data;
    } catch (e: any) {
      logger.error('TelegramAdapter', `API Exception: ${e.message}`);
      return { ok: false, error: e.message };
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
