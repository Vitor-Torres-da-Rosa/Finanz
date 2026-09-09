import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
import fs from 'fs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844} })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
let arquivo = amostras + '/c6-fatura.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('s64'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

const b64 = fs.readFileSync(amostras+'/c6-fatura.pdf').toString('base64');

// Quebra TODOS os caminhos menos o fluxo, e vê se ele salva a leitura.
const r = await page.evaluate(async (b64) => {
  const bin = atob(b64); const by = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) by[i]=bin.charCodeAt(i);
  const arq = new File([by], 'fatura_c6.pdf', { type:'application/pdf' });

  // sabota: arrayBuffer, FileReader, fetch e slice passam a falhar
  Object.defineProperty(arq, 'arrayBuffer', { value: () => Promise.reject(new DOMException('x','NotFoundError')) });
  const fatiaReal = Blob.prototype.slice;
  Blob.prototype.slice = function () { const b = fatiaReal.apply(this, arguments);
    Object.defineProperty(b, 'arrayBuffer', { value: () => Promise.reject(new DOMException('x','NotFoundError')) });
    return b; };
  const lerReal = FileReader.prototype.readAsArrayBuffer;
  FileReader.prototype.readAsArrayBuffer = function () { const eu = this;
    setTimeout(() => { Object.defineProperty(eu,'error',{value:new DOMException('x','NotFoundError'),configurable:true});
      if (eu.onerror) eu.onerror(new Event('error')); }, 5); };
  const fetchReal = window.fetch;
  window.fetch = function (u) { if (String(u).startsWith('blob:')) return Promise.reject(new DOMException('x','NotFoundError')); return fetchReal.apply(this, arguments); };

  const inp = document.getElementById('arquivoExtrato');
  const dt = new DataTransfer(); dt.items.add(arq); inp.files = dt.files;
  inp.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 4000));

  Blob.prototype.slice = fatiaReal; FileReader.prototype.readAsArrayBuffer = lerReal; window.fetch = fetchReal;
  return { folha: (document.getElementById('folhaTitulo')||{}).textContent || 'NENHUMA',
           banco: (document.querySelector('#folha .cabeca-nome')||{}).textContent || '-',
           aviso: ((document.getElementById('dialogoTexto')||{}).textContent || '-').slice(0,140) };
}, b64);
console.log('1. só o fluxo funcionando ->', JSON.stringify(r, null, 1));
await browser.close();
