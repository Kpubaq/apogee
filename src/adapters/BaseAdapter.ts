/**
 * Apogee - Base Messenger Adapter
 */

export interface SendMessageOptions {
  chatId: string;
  text: string;
  buttons?: string[];
  photoBuffer?: Buffer;
  parseMode?: 'Markdown' | 'HTML';
}

export abstract class BaseAdapter {
  public abstract readonly name: 'telegram' | 'whatsapp' | 'discord' | 'cli' | 'api';
  public abstract isEnabled(): boolean;
  public abstract start(): Promise<void>;
  public abstract stop(): Promise<void>;
  public abstract sendMessage(opts: SendMessageOptions): Promise<void>;
}
