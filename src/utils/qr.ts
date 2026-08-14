/**
 * Apogee - Terminal QR Code Generator for WhatsApp Web Pairing
 */

import qrcode from 'qrcode-terminal';
import chalk from 'chalk';

export class TerminalQR {
  public static render(qrString: string, title: string = 'WhatsApp Web Pairing QR'): void {
    console.log('\n' + chalk.bold.cyan(`═══════════════ [ ${title} ] ═══════════════`));
    console.log(chalk.gray('Scan this QR code with WhatsApp on your phone (Linked Devices -> Link a Device):\n'));

    qrcode.generate(qrString, { small: true }, (qr) => {
      console.log(qr);
    });

    console.log(chalk.bold.yellow('⏳ Waiting for device pairing authorization...'));
    console.log(chalk.gray('─────────────────────────────────────────────────────────────\n'));
  }
}
