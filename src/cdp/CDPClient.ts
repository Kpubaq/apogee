/**
 * Apogee - Chrome DevTools Protocol (CDP) Client for AntiGravity 2.0 / IDE / CLI
 */

import WebSocket from 'ws';
import http from 'http';
import { logger } from '../utils/logger.js';
import { eventBus } from '../core/EventBus.js';

export interface CDPTarget {
  id: string;
  title: string;
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

export class CDPClient {
  private ws: WebSocket | null = null;
  private messageId: number = 0;
  private callbacks: Map<number, { resolve: (res: any) => void; reject: (err: any) => void }> = new Map();
  private host: string;
  private port: number;
  private targetName: string;
  private isConnected: boolean = false;
  private activeTarget: CDPTarget | null = null;

  constructor(host: string, port: number, targetName: string = 'AntiGravity') {
    this.host = host;
    this.port = port;
    this.targetName = targetName;
  }

  public getConnectedStatus(): boolean {
    return this.isConnected;
  }

  public getTargetInfo(): { name: string; host: string; port: number; target: CDPTarget | null } {
    return {
      name: this.targetName,
      host: this.host,
      port: this.port,
      target: this.activeTarget
    };
  }

  public async fetchTargets(): Promise<CDPTarget[]> {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://${this.host}:${this.port}/json/list`, (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const targets = JSON.parse(data) as CDPTarget[];
            resolve(targets);
          } catch (e) {
            reject(new Error(`Failed to parse targets: ${e}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(new Error(`Could not connect to ${this.host}:${this.port} (${err.message})`));
      });

      req.setTimeout(2500, () => {
        req.destroy();
        reject(new Error(`Timeout connecting to ${this.host}:${this.port}`));
      });
    });
  }

  public async connect(): Promise<boolean> {
    try {
      logger.debug('CDP', `Scanning targets on ${this.host}:${this.port}...`);
      const targets = await this.fetchTargets();
      
      const candidate = targets.find(t => t.type === 'page' || t.title.toLowerCase().includes('antigravity')) || targets[0];
      if (!candidate || !candidate.webSocketDebuggerUrl) {
        throw new Error(`No WebSocket debugger target available on port ${this.port}.`);
      }

      this.activeTarget = candidate;
      logger.info('CDP', `Connecting to [${this.targetName}] "${candidate.title}" (Port ${this.port})`);

      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(candidate.webSocketDebuggerUrl);

        this.ws.on('open', async () => {
          this.isConnected = true;
          logger.success('CDP', `Connected to [${this.targetName}] on port ${this.port}`);
          
          await this.send('Page.enable', {});
          await this.send('Runtime.enable', {});
          await this.send('DOM.enable', {});

          eventBus.emitEvent('cdp:connected', {
            channelId: 'system',
            data: { target: candidate, port: this.port },
            timestamp: Date.now()
          });

          resolve(true);
        });

        this.ws.on('message', (raw: string) => {
          this.handleMessage(raw.toString());
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          logger.warn('CDP', `Disconnected from ${this.targetName} on port ${this.port}`);
          eventBus.emitEvent('cdp:disconnected', {
            channelId: 'system',
            data: { port: this.port },
            timestamp: Date.now()
          });
        });

        this.ws.on('error', (err: any) => {
          logger.error('CDP', `WebSocket error on port ${this.port}: ${err.message}`);
          if (!this.isConnected) {
            reject(err);
          }
        });
      });
    } catch (err: any) {
      this.isConnected = false;
      logger.debug('CDP', `Connection to ${this.targetName} (port ${this.port}) unavailable: ${err.message}`);
      return false;
    }
  }

  public async send(method: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`CDP connection is not open on port ${this.port}`);
    }

    const id = ++this.messageId;
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws?.send(payload);

      setTimeout(() => {
        if (this.callbacks.has(id)) {
          this.callbacks.delete(id);
          reject(new Error(`CDP timeout for ${method}`));
        }
      }, 15000);
    });
  }

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id)!;
        this.callbacks.delete(msg.id);
        if (msg.error) {
          reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        } else {
          resolve(msg.result);
        }
      } else if (msg.method) {
        if (msg.method === 'DOM.documentUpdated' || msg.method === 'DOM.childNodeInserted') {
          eventBus.emitEvent('cdp:dom_mutation', {
            channelId: 'system',
            data: msg,
            timestamp: Date.now()
          });
        }
      }
    } catch (e) {
      logger.error('CDP', `Error parsing CDP payload: ${e}`);
    }
  }

  public async evaluate<T = any>(expression: string): Promise<T> {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });

    if (result && result.exceptionDetails) {
      throw new Error(`Evaluation exception: ${result.exceptionDetails.text}`);
    }

    return result?.result?.value;
  }

  public async captureScreenshot(): Promise<Buffer> {
    const result = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 90,
      fromSurface: true
    });

    return Buffer.from(result.data, 'base64');
  }

  public async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
