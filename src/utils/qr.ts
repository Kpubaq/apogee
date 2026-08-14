/**
 * Apogee - 2026 Luxury Cyberpunk Terminal QR Code Generator
 * Designed by ByKpubaq | Adil
 */

import qrcode from 'qrcode-terminal';
import chalk from 'chalk';

export class TerminalQR {
  public static render(qrString: string, title: string = 'WhatsApp Web MD Pairing Matrix'): void {
    const border = chalk.hex('#EC4899');
    const headerTitle = ` [ ${title} ] `;
    const dashCount = Math.max(0, 76 - headerTitle.length - 2);

    console.log('\n' + border('╭─') + chalk.hex('#EC4899').bold(headerTitle) + border('─'.repeat(dashCount) + '╮'));
    console.log(border('│') + chalk.hex('#94A3B8')('  📱 Scan this matrix with WhatsApp on your phone:') + ' '.repeat(26) + border('│'));
    console.log(border('│') + chalk.hex('#64748B')('     Navigate to: WhatsApp Settings -> Linked Devices -> Link a Device') + ' '.repeat(5) + border('│'));
    console.log(border('╰' + '─'.repeat(76) + '╯\n'));

    qrcode.generate(qrString, { small: true }, (qr: string) => {
      console.log(qr);
    });

    console.log(chalk.hex('#00F0FF')('  ⏳ ') + chalk.hex('#E2E8F0').bold('Listening for multi-device cryptographic handshake...'));
    console.log(chalk.hex('#334155')('  ─'.repeat(38)) + '\n');
  }
}
