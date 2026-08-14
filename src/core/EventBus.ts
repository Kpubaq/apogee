/**
 * Apogee - EventBus
 */

import { EventEmitter } from 'events';

export type ApogeeEvent =
  | 'user:message'
  | 'user:command'
  | 'agent:response'
  | 'agent:notification'
  | 'agent:state_change'
  | 'cdp:connected'
  | 'cdp:disconnected'
  | 'cdp:dom_mutation'
  | 'autoaccept:triggered'
  | 'screenshot:ready'
  | 'qr:received';

export interface ApogeePayload {
  channelId: 'telegram' | 'whatsapp' | 'discord' | 'cli' | 'api' | 'system';
  userId?: string;
  chatId?: string;
  text?: string;
  command?: string;
  args?: string[];
  data?: any;
  timestamp: number;
}

class ApogeeEventBus extends EventEmitter {
  public emitEvent(event: ApogeeEvent, payload: ApogeePayload): boolean {
    return this.emit(event, payload);
  }

  public onEvent(event: ApogeeEvent, listener: (payload: ApogeePayload) => void): this {
    return this.on(event, listener);
  }
}

export const eventBus = new ApogeeEventBus();
