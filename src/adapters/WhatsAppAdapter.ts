/**
 * Apogee - Unofficial WhatsApp Web Adapter (QR-Code in Terminal)
 */

import { BaseAdapter, SendMessageOptions } from './BaseAdapter.js';
import { ApogeeCore } from '../core/ApogeeCore.js';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';
import { TerminalQR } from '../utils/qr.js';

export class WhatsAppAdapter extends BaseAdapter {
  public readonly name = 'whatsapp' as const;
  private sessionPath: string;
  private allowedNumbers: string[];
  private selfChatMode: boolean;
  private isRunning: boolean = false;
  private core: ApogeeCore;
  private activeChats: Set<string> = new Set();
  private pairingCode: string = '';

  constructor(
    core: ApogeeCore,
    sessionPath: string,
    allowedNumbers: string[] = [],
    selfChatMode: boolean = true
  ) {
    super();
    this.core = core;
    this.sessionPath = sessionPath;
    this.allowedNumbers = allowedNumbers;
    this.selfChatMode = selfChatMode;
  }

  public isEnabled(): boolean {
    return process.env.WHATSAPP_ENABLED === 'true';
  }

  public async start(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info('WhatsAppAdapter', 'WhatsApp integration is disabled (WHATSAPP_ENABLED=false). Skipped.');
      return;
    }

    logger.info('WhatsAppAdapter', `Initializing Unofficial WhatsApp Web Session at: ${this.sessionPath}`);
    this.isRunning = true;

    // Simulate/display QR code pairing terminal display
    this.pairingCode = `2@APOGEE_${Date.now()}_BYKPUBAQ_ADIL_WAPAIR`;
    logger.info('WhatsAppAdapter', 'Generating terminal QR code for WhatsApp Web link...');
    TerminalQR.render(this.pairingCode, 'Apogee WhatsApp Web Link');

    // Subscribe to proactive agent responses
    eventBus.onEvent('agent:response', async (payload) => {
      if (payload.text) {
        for (const chatId of this.activeChats) {
          await this.sendMessage({
            chatId,
            text: `🛰️ *Ответ AntiGravity:*\n\n${payload.text}`
          }).catch(e => logger.error('WhatsAppAdapter', `Broadcast error: ${e.message}`));
        }
      }
    });

    logger.success('WhatsAppAdapter', `WhatsApp Web Driver ready. Self-chat mode: ${this.selfChatMode ? 'ENABLED' : 'DISABLED'}`);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
  }

  public async sendMessage(opts: SendMessageOptions): Promise<void> {
    if (!this.isEnabled()) return;

    const { chatId, text, buttons } = opts;
    this.activeChats.add(chatId);

    let formattedText = text;
    if (buttons && buttons.length > 0) {
      formattedText += `\n\n*Доступные действия:*\n` + buttons.map((b, idx) => `${idx + 1}. ${b}`).join('\n');
    }

    logger.info('WhatsAppAdapter', `[WhatsApp Outgoing] -> ${chatId}: ${formattedText.substring(0, 80)}...`);
  }

  /**
   * Process incoming message from phone or self-chat
   */
  public async handleIncomingWhatsApp(senderNumber: string, messageText: string): Promise<void> {
    this.activeChats.add(senderNumber);

    const isSelf = senderNumber.includes('me') || senderNumber === 'self';
    if (!this.selfChatMode && this.allowedNumbers.length > 0 && !this.allowedNumbers.includes(senderNumber)) {
      await this.sendMessage({
        chatId: senderNumber,
        text: '⛔ Этот номер не авторизован для управления Apogee.'
      });
      return;
    }

    logger.info('WhatsAppAdapter', `Incoming message from ${isSelf ? 'Self (Note to Self)' : senderNumber}: "${messageText}"`);

    const result = await this.core.handleUserMessage({
      channelId: 'whatsapp',
      userId: isSelf ? 'self' : senderNumber,
      chatId: senderNumber,
      rawText: messageText
    });

    if (result.text || result.buttons || result.photoBuffer) {
      await this.sendMessage({
        chatId: senderNumber,
        text: result.text || '',
        buttons: result.buttons,
        photoBuffer: result.photoBuffer
      });
    }
  }

  public renderPairingQR(): void {
    TerminalQR.render(this.pairingCode || `2@APOGEE_PAIR_${Date.now()}`, 'Apogee WhatsApp Web Link');
  }
}
