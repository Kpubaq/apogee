/**
 * Apogee - Server Entry Point
 * ByKpubaq | Adil
 */

import http from 'http';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { printBanner } from './utils/banner.js';
import { ApogeeCore } from './core/ApogeeCore.js';
import { TelegramAdapter } from './adapters/TelegramAdapter.js';
import { DiscordAdapter } from './adapters/DiscordAdapter.js';
import { WhatsAppAdapter } from './adapters/WhatsAppAdapter.js';

async function bootstrap() {
  printBanner();

  const core = new ApogeeCore(config);
  await core.initialize();

  const telegramAdapter = new TelegramAdapter(core, config.telegram.botToken, config.telegram.allowedUsers);
  const discordAdapter = new DiscordAdapter(core, config.discord.botToken, config.discord.allowedChannels);
  const whatsAppAdapter = new WhatsAppAdapter(
    core,
    config.whatsapp.sessionPath,
    config.whatsapp.allowedNumbers,
    config.whatsapp.selfChatMode
  );

  if (config.telegram.enabled) {
    await telegramAdapter.start();
  }

  if (config.discord.enabled) {
    await discordAdapter.start();
  }

  if (config.whatsapp.enabled) {
    await whatsAppAdapter.start();
  }

  // REST API Bridge
  const server = http.createServer(async (req, res) => {
    const url = req.url || '';
    const method = req.method || 'GET';

    if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ONLINE',
        app: config.appName,
        author: config.author,
        cdp: core.activeCDP.getTargetInfo(),
        uptime: process.uptime()
      }));
      return;
    }

    if (url === '/api/command' && method === 'POST') {
      let body = '';
      req.on('data', chunk => (body += chunk));
      req.on('end', async () => {
        try {
          const json = JSON.parse(body);
          const auth = req.headers['authorization'];
          if (auth !== `Bearer ${config.api.secretKey}`) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }

          const result = await core.handleUserMessage({
            channelId: 'api',
            userId: json.userId || 'api_user',
            chatId: json.chatId || 'api_chat',
            rawText: json.command || json.text || ''
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });

  server.listen(config.api.port, () => {
    logger.info('Server', `Apogee REST Bridge listening on http://127.0.0.1:${config.api.port}`);
  });

  const shutdown = async () => {
    logger.info('System', 'Shutting down Apogee Mission Control...');
    await telegramAdapter.stop();
    await discordAdapter.stop();
    await whatsAppAdapter.stop();
    core.domObserver.stop();
    core.taskWatcher.stop();
    await core.ideCDP.close();
    await core.agentCDP.close();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  logger.error('Bootstrap', `Fatal startup error: ${err.message}`, err.stack);
  process.exit(1);
});
