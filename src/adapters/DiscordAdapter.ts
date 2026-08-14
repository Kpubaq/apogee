/**
 * Apogee - Discord Adapter
 */

import { BaseAdapter, SendMessageOptions } from './BaseAdapter.js';
import { ApogeeCore } from '../core/ApogeeCore.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';

export class DiscordAdapter extends BaseAdapter {
  public readonly name = 'discord' as const;
  private botToken: string;
  private allowedChannels: string[];
  private isRunning: boolean = false;
  private core: ApogeeCore;

  constructor(core: ApogeeCore, botToken: string, allowedChannels: string[] = []) {
    super();
    this.core = core;
    this.botToken = botToken;
    this.allowedChannels = allowedChannels;
  }

  public isEnabled(): boolean {
    return !!this.botToken;
  }

  public async start(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info('DiscordAdapter', 'Discord Bot Token not configured. Adapter skipped.');
      return;
    }

    logger.info('DiscordAdapter', 'Starting Discord Bot Adapter...');
    this.isRunning = true;

    eventBus.onEvent('agent:response', async (payload) => {
      if (payload.text) {
        for (const channelId of this.allowedChannels) {
          await this.sendMessage({
            chatId: channelId,
            text: `🛰️ **AntiGravity Response:**\n\n${payload.text}`
          }).catch(e => logger.error('DiscordAdapter', `Discord broadcast error: ${e.message}`));
        }
      }
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
  }

  public async sendMessage(opts: SendMessageOptions): Promise<void> {
    if (!this.isEnabled()) return;

    const { chatId, text, photoBuffer } = opts;

    if (photoBuffer) {
      const formData = new FormData();
      formData.append('content', text);
      const blob = new Blob([new Uint8Array(photoBuffer)], { type: 'image/png' });
      formData.append('file', blob, 'screenshot.png');

      await fetch(`https://discord.com/api/v10/channels/${chatId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bot ${this.botToken}` },
        body: formData
      });
      return;
    }

    try {
      await fetch(`https://discord.com/api/v10/channels/${chatId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text })
      });
    } catch (e: any) {
      logger.error('DiscordAdapter', `Discord send error: ${e.message}`);
    }
  }

  public async handleIncomingDiscord(channelId: string, authorId: string, content: string): Promise<void> {
    if (this.allowedChannels.length > 0 && !this.allowedChannels.includes(channelId)) {
      return;
    }

    const result = await this.core.handleUserMessage({
      channelId: 'discord',
      userId: authorId,
      chatId: channelId,
      rawText: content
    });

    if (result.text || result.photoBuffer) {
      await this.sendMessage({
        chatId: channelId,
        text: result.text || '',
        photoBuffer: result.photoBuffer
      });
    }
  }
}
