'use strict';

const net = require('net');
const { spawn } = require('child_process');
const { Setting } = require('../../models');
const { buildOrderBuffer } = require('./escposBuilder');

const STORE_CONFIG_KEY = 'store_config';
const DEFAULT_PORT = 9100;
const TCP_TIMEOUT_MS = 5000;

async function getPrintConfig() {
  try {
    const [setting] = await Setting.findOrCreate({
      where: { key: STORE_CONFIG_KEY },
      defaults: { key: STORE_CONFIG_KEY, value: {} },
    });
    return setting.value?.print || {};
  } catch {
    return {};
  }
}

function sendViaTcp(buffer, host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(TCP_TIMEOUT_MS);

    socket.connect(port, host, () => {
      socket.write(buffer, (err) => {
        if (err) {
          socket.destroy();
          return reject(err);
        }
        // pequena espera antes de fechar para garantir flush
        setTimeout(() => {
          socket.destroy();
          resolve();
        }, 200);
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Timeout ao conectar na impressora ${host}:${port}`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

function execPrintCommand(command, args, buffer) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGKILL');
      reject(new Error(`Timeout ao executar comando de impressão: ${command}`));
    }, TCP_TIMEOUT_MS);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (code === 0) return resolve();
      return reject(new Error(stderr.trim() || `${command} finalizou com código ${code}`));
    });

    child.stdin.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(err);
    });

    child.stdin.write(buffer);
    child.stdin.end();
  });
}

async function sendViaUsbCups(buffer, printerName) {
  const lpArgs = ['-d', printerName, '-o', 'raw', '-t', `qbombom-${Date.now()}`];
  try {
    await execPrintCommand('lp', lpArgs, buffer);
    return;
  } catch (lpError) {
    const lprArgs = ['-P', printerName, '-o', 'raw'];
    try {
      await execPrintCommand('lpr', lprArgs, buffer);
      return;
    } catch (lprError) {
      const err = new Error(
        `Falha ao imprimir via USB/CUPS. lp: ${lpError.message}. lpr: ${lprError.message}.`,
      );
      err.code = 'PRINT_USB_FAILED';
      throw err;
    }
  }
}

/**
 * Imprime comanda de pedido.
 * @param {object} order - objeto de pedido com items populados
 * @param {object} storeConfig - config completa da loja (opcional — lê do BD se não fornecida)
 * @returns {Promise<{transport, host, port}>}
 */
async function printOrder(order, storeConfig = null) {
  const config = storeConfig?.print
    ? storeConfig.print
    : await getPrintConfig();

  const mode = config.mode;

  if (!mode || mode === 'disabled') {
    const err = new Error(
      'Impressão desabilitada. Ative e configure a impressora em Configurações > Impressão.',
    );
    err.code = 'PRINT_DISABLED';
    throw err;
  }

  const buffer = buildOrderBuffer(order, storeConfig || { print: config });

  if (mode === 'network') {
    const host = config.network?.host;
    const port = Number(config.network?.port) || DEFAULT_PORT;

    if (!host) {
      const err = new Error(
        'Host da impressora não configurado. Defina em Configurações > Impressão > IP da Impressora.',
      );
      err.code = 'PRINT_NO_HOST';
      throw err;
    }

    await sendViaTcp(buffer, host, port);
    return { transport: 'network', host, port };
  }

  if (mode === 'usb') {
    const printerName = config.usb?.printerName;
    if (!printerName) {
      const err = new Error(
        'Nome da impressora USB não configurado. Defina em Configurações > Impressão > Nome da Impressora (CUPS).',
      );
      err.code = 'PRINT_NO_USB_PRINTER';
      throw err;
    }

    await sendViaUsbCups(buffer, printerName);
    return { transport: 'usb', printerName };
  }

  const err = new Error(`Modo de impressão desconhecido: "${mode}".`);
  err.code = 'PRINT_UNKNOWN_MODE';
  throw err;
}

module.exports = { printOrder };
