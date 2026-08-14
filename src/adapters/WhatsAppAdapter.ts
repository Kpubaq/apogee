/**
 * Apogee - Genuine WhatsApp Web Multi-Device Adapter (Baileys)
 * ByKpubaq | Adil
 */

import fs from 'fs';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
  WAMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
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
  private isConnecting: boolean = false;
  private core: ApogeeCore;
  private sock: WASocket | null = null;
  private activeChats: Set<string> = new Set();
  private sentMessageIds: Set<string> = new Set();
  private lastQr: string = '';

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

    logger.info('WhatsAppAdapter', `Initializing Genuine WhatsApp Web Multi-Device Session at: ${this.sessionPath}`);
    logger.warn('WhatsAppAdapter', '⚠️ DISCLAIMER: Unofficial WhatsApp Web automation carries risk of account bans by Meta Platforms, Inc. The author bears NO liability. Use at your own risk.');
    this.isRunning = true;

    if (!fs.existsSync(this.sessionPath)) {
      fs.mkdirSync(this.sessionPath, { recursive: true });
    }

    // Subscribe to proactive agent responses from EventBus
    eventBus.onEvent('agent:response', async (payload) => {
      if (payload.text && this.isRunning) {
        for (const chatId of this.activeChats) {
          await this.sendMessage({
            chatId,
            text: `🛰️ *Ответ AntiGravity:*\n\n${payload.text}`
          }).catch(e => logger.error('WhatsAppAdapter', `Broadcast error: ${e.message}`));
        }
      }
    });

    await this.startSocket();
  }

  private async startSocket(): Promise<void> {
    if (this.isConnecting || !this.isRunning) return;
    this.isConnecting = true;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }) as any,
        printQRInTerminal: false,
        browser: ['Apogee Mission Control', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: true,
      });

      this.sock = sock;
      this.isConnecting = false;

      // Handle credentials updates
      sock.ev.on('creds.update', saveCreds);

      // Handle connection updates (QR code, open, close, reconnect)
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.lastQr = qr;
          logger.info('WhatsAppAdapter', 'Pairing QR code received. Scan via WhatsApp -> Linked Devices:');
          TerminalQR.render(qr, 'WhatsApp Web Pairing QR');
        }

        if (connection === 'open') {
          const userJid = sock.user?.id || 'Authenticated User';
          logger.success('WhatsAppAdapter', `WhatsApp Web connected successfully! Logged in as: ${userJid}`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          logger.warn(
            'WhatsAppAdapter',
            `WhatsApp connection closed (Code: ${statusCode || 'unknown'}). Logged out: ${isLoggedOut}`
          );

          if (!isLoggedOut && this.isRunning) {
            logger.info('WhatsAppAdapter', 'Reconnecting to WhatsApp in 3 seconds...');
            setTimeout(() => {
              if (this.isRunning) {
                this.startSocket().catch(err => {
                  logger.error('WhatsAppAdapter', `Reconnection failed: ${err.message}`);
                });
              }
            }, 3000);
          } else if (isLoggedOut) {
            logger.error('WhatsAppAdapter', 'WhatsApp session logged out. Please remove auth credentials and re-pair.');
          }
        }
      });

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
          await this.handleIncomingMessage(msg);
        }
      });

      logger.success('WhatsAppAdapter', `WhatsApp Web Driver initialized. Self-chat mode: ${this.selfChatMode ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      this.isConnecting = false;
      logger.error('WhatsAppAdapter', `Failed to initialize WhatsApp socket: ${err.message}`);
      if (this.isRunning) {
        setTimeout(() => {
          if (this.isRunning) this.startSocket();
        }, 5000);
      }
    }
  }

  private async handleIncomingMessage(msg: WAMessage): Promise<void> {
    if (!msg.message || !msg.key) return;

    const messageId = msg.key.id;
    if (messageId && this.sentMessageIds.has(messageId)) {
      this.sentMessageIds.delete(messageId);
      return;
    }

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid || remoteJid === 'status@broadcast') return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.documentMessage?.caption ||
      '';

    if (!text || typeof text !== 'string') return;

    const myJidRaw = this.sock?.user?.id || '';
    const myNumber = myJidRaw.split(':')[0].split('@')[0];
    const remoteNumber = remoteJid.split('@')[0].split(':')[0];
    const isFromMe = !!msg.key.fromMe;
    const isSelfChat = isFromMe || (!!myNumber && remoteNumber === myNumber);

    if (isFromMe && !this.selfChatMode) {
      return;
    }

    const senderId = isSelfChat ? 'self' : remoteNumber;

    if (!this.isAuthorizedNumber(senderId) && !this.isAuthorizedNumber(remoteNumber)) {
      logger.warn('WhatsAppAdapter', `Unauthorized message from ${remoteJid}. Rejected.`);
      await this.sendMessage({
        chatId: remoteJid,
        text: '⛔ Этот номер не авторизован для управления Apogee.'
      });
      return;
    }

    logger.info('WhatsAppAdapter', `Incoming message from ${isSelfChat ? 'Self (Note to Self)' : remoteJid}: "${text}"`);
    this.activeChats.add(remoteJid);

    const result = await this.core.handleUserMessage({
      channelId: 'whatsapp',
      userId: isSelfChat ? 'self' : senderId,
      chatId: remoteJid,
      rawText: text
    });

    if (result.text || result.buttons || result.photoBuffer) {
      await this.sendMessage({
        chatId: remoteJid,
        text: result.text || '',
        buttons: result.buttons,
        photoBuffer: result.photoBuffer
      });
    }
  }

  public isAuthorizedNumber(senderNumber: string): boolean {
    if (this.selfChatMode && (senderNumber === 'self' || senderNumber === 'me' || senderNumber.includes('self'))) {
      return true;
    }
    if (this.allowedNumbers.length === 0) {
      return true;
    }
    const cleanSender = senderNumber.replace(/[^\d]/g, '');
    return this.allowedNumbers.some(num => {
      const cleanAllowed = num.replace(/[^\d]/g, '');
      return cleanAllowed === cleanSender || senderNumber.toLowerCase() === num.toLowerCase();
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (e: any) {
        logger.error('WhatsAppAdapter', `Error closing socket: ${e.message}`);
      }
      this.sock = null;
    }
  }

  public async sendMessage(opts: SendMessageOptions): Promise<void> {
    if (!this.isEnabled() || !this.sock) return;

    const { chatId, text, buttons, photoBuffer } = opts;
    const targetJid = this.formatJid(chatId);
    this.activeChats.add(targetJid);

    let formattedText = text;
    if (buttons && buttons.length > 0) {
      formattedText += `\n\n*Доступные действия:*\n` + buttons.map((b, idx) => `${idx + 1}. ${b}`).join('\n');
    }

    try {
      let sent: WAMessage | undefined;

      if (photoBuffer) {
        sent = await this.sock.sendMessage(targetJid, {
          image: photoBuffer,
          caption: formattedText || undefined
        });
      } else if (formattedText) {
        sent = await this.sock.sendMessage(targetJid, {
          text: formattedText
        });
      }

      if (sent?.key?.id) {
        this.sentMessageIds.add(sent.key.id);
        if (this.sentMessageIds.size > 1000) {
          const firstKey = this.sentMessageIds.values().next().value;
          if (firstKey) this.sentMessageIds.delete(firstKey);
        }
      }

      logger.info('WhatsAppAdapter', `[WhatsApp Outgoing] -> ${targetJid}: ${formattedText.substring(0, 80)}...`);
    } catch (err: any) {
      logger.error('WhatsAppAdapter', `Failed to send WhatsApp message to ${targetJid}: ${err.message}`);
    }
  }

  public renderPairingQR(): void {
    if (this.lastQr) {
      TerminalQR.render(this.lastQr, 'Apogee WhatsApp Web Pairing QR');
    } else {
      logger.info('WhatsAppAdapter', 'No pairing QR code currently active or already authenticated.');
    }
  }

  private formatJid(jid: string): string {
    if (!jid) return '';
    if (jid.includes('@')) return jid;
    const cleaned = jid.replace(/[^\d]/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }
}
