import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Try loading from ~/.apogee/.env first
const globalEnvPath = path.join(os.homedir(), '.apogee', '.env');
if (fs.existsSync(globalEnvPath)) {
  dotenv.config({ path: globalEnvPath });
}

// Also try loading from current working directory (overrides)
const localEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(localEnvPath) && localEnvPath !== globalEnvPath) {
  dotenv.config({ path: localEnvPath, override: true });
}

dotenv.config();

export interface ApogeeConfig {
  appName: string;
  author: string;
  debugMode: boolean;
  defaultAppTarget: 'ide' | 'agent' | 'ag2';
  autoAcceptDefault: boolean;
  defaultModel: string;

  cdp: {
    host: string;
    agentPort: number;
    idePort: number;
  };

  telegram: {
    enabled: boolean;
    botToken: string;
    allowedUsers: string[];
  };

  discord: {
    enabled: boolean;
    botToken: string;
    clientId: string;
    allowedChannels: string[];
  };

  api: {
    port: number;
    secretKey: string;
  };
}

function parseCsv(val?: string): string[] {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

function parseBool(val?: string, defaultVal: boolean = false): boolean {
  if (!val) return defaultVal;
  return val.toLowerCase() === 'true' || val === '1';
}

export const config: ApogeeConfig = {
  appName: process.env.APP_NAME || 'Apogee',
  author: process.env.AUTHOR || 'ByKpubaq | Adil',
  debugMode: parseBool(process.env.DEBUG_MODE, false),
  defaultAppTarget: (process.env.DEFAULT_APP_TARGET || 'ide') as 'ide' | 'agent' | 'ag2',
  autoAcceptDefault: parseBool(process.env.AUTOACCEPT_DEFAULT, true),
  defaultModel: process.env.DEFAULT_MODEL || 'Gemini 3.7 Flash (High)',

  cdp: {
    host: process.env.CDP_HOST || '127.0.0.1',
    agentPort: Number(process.env.AGENT_CDP_PORT) || 9333,
    idePort: Number(process.env.IDE_CDP_PORT) || 9334,
  },

  telegram: {
    enabled: parseBool(process.env.TELEGRAM_ENABLED, true),
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    allowedUsers: parseCsv(process.env.TELEGRAM_ALLOWED_USERS),
  },

  discord: {
    enabled: parseBool(process.env.DISCORD_ENABLED, false),
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    allowedChannels: parseCsv(process.env.DISCORD_ALLOWED_CHANNELS),
  },

  api: {
    port: Number(process.env.API_PORT) || 3890,
    secretKey: process.env.API_SECRET_KEY || 'apogee-secret-key-change-me',
  }
};
