#!/usr/bin/env node
/**
 * Apogee - Command Line Interface (CLI) & Interactive Mission Control
 * ByKpubaq | Adil
 */

import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import { printBanner, getApogeeBanner } from '../src/utils/banner.js';
import { CDPClient } from '../src/cdp/CDPClient.js';
import { ScreenCapture } from '../src/cdp/ScreenCapture.js';
import { TerminalQR } from '../src/utils/qr.js';

const program = new Command();

program
  .name('apogee')
  .description('Apogee Mission Control for AntiGravity 2.0 / IDE / CLI (ByKpubaq | Adil)')
  .version('2.0.0');

program
  .command('status')
  .description('Проверить статус подключения к AntiGravity 2.0 / IDE (9334) и CLI (9333)')
  .action(async () => {
    printBanner();
    console.log(chalk.bold.cyan('🔍 Сканирование доступных портов AntiGravity...\n'));

    const ideClient = new CDPClient('127.0.0.1', 9334, 'AntiGravity 2.0 / IDE');
    const appClient = new CDPClient('127.0.0.1', 9333, 'AntiGravity Standalone CLI');

    try {
      const ideTargets = await ideClient.fetchTargets();
      console.log(`${chalk.green('✔ AntiGravity 2.0 / IDE (Port 9334):')} ${chalk.bold.green('ONLINE')} (${ideTargets.length} окон)`);
      ideTargets.forEach(t => console.log(`   ${chalk.gray('└─')} [${t.type}] ${chalk.white(t.title)}`));
    } catch (e: any) {
      console.log(`${chalk.red('✖ AntiGravity 2.0 / IDE (Port 9334):')} ${chalk.red('OFFLINE')} (${e.message})`);
    }

    try {
      const appTargets = await appClient.fetchTargets();
      console.log(`\n${chalk.green('✔ AntiGravity CLI / App (Port 9333):')} ${chalk.bold.green('ONLINE')} (${appTargets.length} окон)`);
      appTargets.forEach(t => console.log(`   ${chalk.gray('└─')} [${t.type}] ${chalk.white(t.title)}`));
    } catch (e: any) {
      console.log(`\n${chalk.red('✖ AntiGravity CLI / App (Port 9333):')} ${chalk.red('OFFLINE')} (${e.message})`);
    }
    console.log('\n');
  });

program
  .command('screenshot')
  .description('Снять моментальный скриншот активного окна AntiGravity')
  .option('-p, --port <number>', 'Порт CDP (по умолчанию 9334)', '9334')
  .action(async (opts) => {
    const port = Number(opts.port);
    const client = new CDPClient('127.0.0.1', port, 'AntiGravity');
    const connected = await client.connect();

    if (!connected) {
      console.error(chalk.red(`Ошибка: Не удалось подключиться к CDP на порту ${port}`));
      process.exit(1);
    }

    const capture = new ScreenCapture(client);
    const res = await capture.capture();
    console.log(chalk.green(`✔ Скриншот успешно сохранен: ${res.filePath}`));
    await client.close();
  });

program
  .command('qr')
  .description('Сгенерировать и показать QR-код привязки WhatsApp Web в терминале')
  .action(() => {
    printBanner();
    TerminalQR.render(`2@APOGEE_PAIR_${Date.now()}_BYKPUBAQ_ADIL`, 'Apogee WhatsApp Web Link');
  });

program
  .command('start')
  .description('Запустить фоновый сервис Apogee (Telegram, WhatsApp, Discord, API)')
  .action(async () => {
    await import('../src/index.js');
  });

program
  .command('dashboard', { isDefault: true })
  .description('Открыть интерактивный терминальный Mission Control дашборд')
  .action(async () => {
    console.clear();
    printBanner();
    runInteractiveDashboard();
  });

function runInteractiveDashboard() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.bold.yellow('🕹️  ИНТЕРАКТИВНОЕ МЕНЮ APOGEE:'));
  console.log(`
  ${chalk.cyan('1.')} Проверить статус подключения (Status & Ports)
  ${chalk.cyan('2.')} Сделать моментальный скриншот IDE (Screenshot)
  ${chalk.cyan('3.')} Показать QR-код WhatsApp Web (QR Pairing)
  ${chalk.cyan('4.')} Отправить промпт агенту (Send Prompt)
  ${chalk.cyan('5.')} Запустить полный сервис в фоне (Start Server)
  ${chalk.cyan('6.')} Выйти (Exit)
`);

  rl.question(chalk.bold.magenta('Выберите действие [1-6]: '), async (answer) => {
    const choice = answer.trim();

    switch (choice) {
      case '1': {
        const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity 2.0 / IDE');
        try {
          const targets = await client.fetchTargets();
          console.log(chalk.green(`\n✔ AntiGravity 2.0 / IDE: ONLINE (${targets.length} окон)`));
        } catch (e: any) {
          console.log(chalk.red(`\n✖ AntiGravity 2.0 / IDE: OFFLINE (${e.message})`));
        }
        rl.close();
        break;
      }
      case '2': {
        const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
        if (await client.connect()) {
          const cap = new ScreenCapture(client);
          const res = await cap.capture();
          console.log(chalk.green(`\n✔ Снимок сохранен: ${res.filePath}`));
          await client.close();
        } else {
          console.log(chalk.red('\n✖ AntiGravity не запущена на порту 9334.'));
        }
        rl.close();
        break;
      }
      case '3': {
        TerminalQR.render(`2@APOGEE_PAIR_${Date.now()}_BYKPUBAQ_ADIL`, 'Apogee WhatsApp Web Link');
        rl.close();
        break;
      }
      case '4': {
        rl.question(chalk.cyan('Введите сообщение для агента: '), async (promptText) => {
          const client = new CDPClient('127.0.0.1', 9334, 'AntiGravity');
          if (await client.connect()) {
            const watcher = new (await import('../src/cdp/TaskWatcher.js')).TaskWatcher(client);
            await watcher.sendUserPrompt(promptText);
            console.log(chalk.green('✔ Промпт передан в интерфейс AntiGravity!'));
            await client.close();
          } else {
            console.log(chalk.red('✖ AntiGravity недоступна.'));
          }
          rl.close();
        });
        break;
      }
      case '5': {
        rl.close();
        await import('../src/index.js');
        break;
      }
      default:
        console.log(chalk.gray('Выход из дашборда.'));
        rl.close();
        process.exit(0);
    }
  });
}

program.parse(process.argv);
