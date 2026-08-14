/**
 * Apogee - Central Mission Control Orchestrator (ApogeeCore)
 * ByKpubaq | Adil
 */

import { ApogeeConfig, config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { SessionManager } from './SessionManager.js';
import { CDPClient } from '../cdp/CDPClient.js';
import { DOMObserver } from '../cdp/DOMObserver.js';
import { ScreenCapture } from '../cdp/ScreenCapture.js';
import { ModelSelector } from '../cdp/ModelSelector.js';
import { TaskWatcher } from '../cdp/TaskWatcher.js';

export interface CommandContext {
  channelId: 'telegram' | 'whatsapp' | 'discord' | 'cli' | 'api';
  userId: string;
  chatId: string;
  rawText: string;
}

export class ApogeeCore {
  private config: ApogeeConfig;
  public sessionManager: SessionManager;

  // CDP Clients
  public ideCDP: CDPClient;
  public agentCDP: CDPClient;
  public ag2CDP: CDPClient;
  public activeCDP: CDPClient;

  // Domestic Engines
  public domObserver: DOMObserver;
  public screenCapture: ScreenCapture;
  public modelSelector: ModelSelector;
  public taskWatcher: TaskWatcher;

  constructor(cfg: ApogeeConfig = config) {
    this.config = cfg;
    this.sessionManager = new SessionManager(cfg.telegram.allowedUsers, cfg.whatsapp.selfChatMode);

    this.ideCDP = new CDPClient(cfg.cdp.host, cfg.cdp.idePort, 'AntiGravity IDE');
    this.agentCDP = new CDPClient(cfg.cdp.host, cfg.cdp.agentPort, 'AntiGravity CLI/App');
    this.ag2CDP = new CDPClient(cfg.cdp.host, cfg.cdp.idePort, 'AntiGravity 2.0');

    this.activeCDP = cfg.defaultAppTarget === 'agent' ? this.agentCDP : this.ideCDP;

    this.domObserver = new DOMObserver(this.activeCDP, cfg.autoAcceptDefault);
    this.screenCapture = new ScreenCapture(this.activeCDP);
    this.modelSelector = new ModelSelector(this.activeCDP, cfg.defaultModel);
    this.taskWatcher = new TaskWatcher(this.activeCDP);
  }

  public async initialize(): Promise<void> {
    logger.info('ApogeeCore', 'Bootstrapping Apogee Mission Control by ByKpubaq | Adil...');

    const ideConnected = await this.ideCDP.connect();
    const agentConnected = await this.agentCDP.connect();

    if (this.config.defaultAppTarget === 'agent' && agentConnected) {
      this.activeCDP = this.agentCDP;
    } else if (ideConnected) {
      this.activeCDP = this.ideCDP;
    }

    this.domObserver.start();
    this.taskWatcher.start();

    logger.success(
      'ApogeeCore',
      `Apogee online. Active target: [${this.activeCDP.getTargetInfo().name}] | Auto-Accept: ${this.domObserver.getAutoAcceptStatus() ? 'ON' : 'OFF'}`
    );
  }

  public async handleUserMessage(ctx: CommandContext): Promise<{ text?: string; photoBuffer?: Buffer; buttons?: string[] }> {
    const { userId, chatId, rawText, channelId } = ctx;
    const text = rawText.trim();

    this.sessionManager.getOrCreateSession(channelId, userId, chatId);

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      return this.executeCommand(cmd, args, ctx);
    }

    // Direct chat prompt to AI agent
    try {
      await this.taskWatcher.sendUserPrompt(text);
      return {
        text: '🛰️ **Запрос передан в AntiGravity.** Агент выполняет задачу...'
      };
    } catch (err: any) {
      return {
        text: `⚠️ **Ошибка отправки:** ${err.message}\nУбедитесь, что AntiGravity (2.0/IDE/CLI) запущена с отладочным флагом \`--remote-debugging-port=${this.activeCDP.getTargetInfo().port}\`.`
      };
    }
  }

  public async executeCommand(
    cmd: string,
    args: string,
    ctx: CommandContext
  ): Promise<{ text?: string; photoBuffer?: Buffer; buttons?: string[] }> {
    logger.info('ApogeeCore', `Command: ${cmd} (Args: "${args}") [${ctx.channelId}:${ctx.userId}]`);

    switch (cmd) {
      case '/start':
      case '/help':
        return {
          text: `
🛰️ **APOGEE MISSION CONTROL** *(ByKpubaq | Adil)*

**Управление агентом и средой:**
• *(Любой текст)* — отправить промпт напрямую агенту
• \`/status\` — статус подключения, порт и телеметрия
• \`/screenshot\` — снимок экрана активного окна AntiGravity
• \`/latest\` — получить последний ответ агента
• \`/model\` — выбор модели и уровня Thinking Effort
• \`/autoaccept\` — включить/выключить авто-клик подтверждений
• \`/app [ide|agent|ag2]\` — переключить активную цель
• \`/stop\` — остановить текущую генерацию
• \`/shutdown\` — завершить работу сервера Apogee
`.trim()
        };

      case '/status': {
        const info = this.activeCDP.getTargetInfo();
        const connected = this.activeCDP.getConnectedStatus();
        const autoAccept = this.domObserver.getAutoAcceptStatus();
        const state = this.taskWatcher.getState();

        return {
          text: `
🛰️ **Apogee Telemetry Status** *(ByKpubaq | Adil)*

• **Активная цель:** \`${info.name}\` (Port ${info.port})
• **Статус CDP:** ${connected ? '🟢 ONLINE' : '🔴 OFFLINE'}
• **Текущая модель:** \`${this.modelSelector.getCurrentModel()}\`
• **Режим Auto-Accept:** ${autoAccept ? '⚡ ВКЛЮЧЕН' : '⏸️ ВЫКЛЮЧЕН'}
• **Состояние агента:** ${state.isBusy ? '⚙️ Выполняет задачу...' : '💤 Ожидает команд'}
• **Канал связи:** \`${ctx.channelId}\`
`.trim()
        };
      }

      case '/screenshot': {
        try {
          const { buffer } = await this.screenCapture.capture();
          return {
            text: '📸 **Снимок экрана AntiGravity:**',
            photoBuffer: buffer
          };
        } catch (e: any) {
          return { text: `⚠️ Ошибка получения скриншота: ${e.message}` };
        }
      }

      case '/autoaccept': {
        const next = !this.domObserver.getAutoAcceptStatus();
        this.domObserver.setAutoAccept(next);
        return {
          text: `⚡ Режим **Auto-Accept** теперь: **${next ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}**.`
        };
      }

      case '/model': {
        const available = this.modelSelector.getAvailableModels();
        if (!args) {
          return {
            text: `🤖 **Выберите модель для AntiGravity:**\nТекущая: \`${this.modelSelector.getCurrentModel()}\``,
            buttons: available
          };
        }
        await this.modelSelector.setModel(args.trim());
        return {
          text: `✅ Модель успешно переключена на: **${args.trim()}**`
        };
      }

      case '/latest': {
        const msg = await this.taskWatcher.getLatestMessage();
        return { text: `📝 **Последний ответ агента:**\n\n${msg || 'Сообщений пока нет.'}` };
      }

      case '/app': {
        const low = args.toLowerCase();
        let target: 'ide' | 'agent' | 'ag2' = 'ide';
        if (low.includes('agent') || low.includes('cli')) target = 'agent';
        else if (low.includes('2') || low.includes('ag2')) target = 'ag2';

        if (target === 'agent') this.activeCDP = this.agentCDP;
        else if (target === 'ag2') this.activeCDP = this.ag2CDP;
        else this.activeCDP = this.ideCDP;

        this.sessionManager.setAppTarget(ctx.userId, ctx.channelId, target);
        return {
          text: `🔀 Активная цель переключена на: **${this.activeCDP.getTargetInfo().name}** (Port ${this.activeCDP.getTargetInfo().port})`
        };
      }

      case '/stop': {
        await this.taskWatcher.sendUserPrompt('/stop');
        return { text: '⏹️ Команда остановки отправлена агенту.' };
      }

      case '/shutdown': {
        setTimeout(() => process.exit(0), 1000);
        return { text: '🔌 **Apogee Mission Control выключается...**' };
      }

      default:
        return { text: `❓ Неизвестная команда \`${cmd}\`. Отправьте \`/help\` для списка.` };
    }
  }
}
