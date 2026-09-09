// O que todo teste precisa saber: onde acham o Playwright, onde ficam os
// arquivos de exemplo e onde jogar as imagens de tela.
//
// Nada aqui usa caminho fixo de máquina: tudo sai da posição deste arquivo,
// então a pasta de testes funciona em qualquer container.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const raiz = path.dirname(fileURLToPath(import.meta.url));
export const amostras = path.join(raiz, 'amostras');
export const dir = path.join(raiz, 'saidas');
export const app = path.join(raiz, 'appteste');
export const ENDERECO = 'http://127.0.0.1:8833/index.html';

fs.mkdirSync(dir, { recursive: true });

// O Playwright vem instalado na imagem, mas nem sempre no mesmo lugar.
async function acharChromium() {
  const tentativas = ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs'];
  for (const caminho of tentativas) {
    try { return (await import(caminho)).chromium; } catch (e) { /* tenta o próximo */ }
  }
  throw new Error('não achei o Playwright. Rode testes/preparar.sh.');
}

export const chromium = await acharChromium();
