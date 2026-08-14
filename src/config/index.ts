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

function cleanString(val?: string, defaultVal: string = ''): string {
  if (!val) return defaultVal;
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

function parseCsv(val?: string): string[] {
  if (!val) return [];
  return cleanString(val).split(',').map(s => cleanString(s)).filter(Boolean);
}

function parseBool(val?: string, defaultVal: boolean = false): boolean {
  if (!val) return defaultVal;
  const clean = cleanString(val).toLowerCase();
  return clean === 'true' || clean === '1';
}

function cleanToken(val?: string): string {
  if (!val) return '';
  const clean = cleanString(val);
  if (clean.startsWith('your_') || clean.includes('from_botfather') || clean.includes('token_here')) return '';
  return clean;
}

export const config: ApogeeConfig = {
  appName: cleanString(process.env.APP_NAME, 'Apogee'),
  author: cleanString(process.env.AUTHOR, 'ByKpubaq | Adil'),
  debugMode: parseBool(process.env.DEBUG_MODE, false),
  defaultAppTarget: (cleanString(process.env.DEFAULT_APP_TARGET, 'ide')) as 'ide' | 'agent' | 'ag2',
  autoAcceptDefault: parseBool(process.env.AUTOACCEPT_DEFAULT, true),
  defaultModel: cleanString(process.env.DEFAULT_MODEL, 'Gemini 3.7 Flash (High)'),

  cdp: {
    host: cleanString(process.env.CDP_HOST, '127.0.0.1'),
    agentPort: Number(cleanString(process.env.AGENT_CDP_PORT)) || 9333,
    idePort: Number(cleanString(process.env.IDE_CDP_PORT)) || 9334,
  },

  telegram: {
    enabled: parseBool(process.env.TELEGRAM_ENABLED, true),
    botToken: cleanToken(process.env.TELEGRAM_BOT_TOKEN),
    allowedUsers: parseCsv(process.env.TELEGRAM_ALLOWED_USERS),
  },

  discord: {
    enabled: parseBool(process.env.DISCORD_ENABLED, false),
    botToken: cleanString(process.env.DISCORD_BOT_TOKEN),
    clientId: cleanString(process.env.DISCORD_CLIENT_ID),
    allowedChannels: parseCsv(process.env.DISCORD_ALLOWED_CHANNELS),
  },

  api: {
    port: Number(cleanString(process.env.API_PORT)) || 3890,
    secretKey: cleanString(process.env.API_SECRET_KEY, 'apogee-secret-key-change-me'),
  }
};
