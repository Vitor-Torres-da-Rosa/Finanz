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
await c.nth(0).fill('Vitor'); await c.nth(1).fill('w63'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// 1) o app não pode se recarregar sozinho quando um SW novo assume
const antes = await page.evaluate(() => location.href);
const recarregou = await page.evaluate(async () => {
  let recarregou = false;
  const marca = Date.now();
  window.__marca = marca;
  // simula o controllerchange que o navegador dispara quando um sw novo assume
  navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
  await new Promise(r => setTimeout(r, 1500));
  return window.__marca !== marca;
});
console.log('1. recarregou sozinho no controllerchange?', recarregou ? 'SIM (ruim)' : 'não');

// 2) durante a leitura, o app não procura atualização
const b64 = fs.readFileSync(amostras+'/c6-fatura.pdf').toString('base64');
const r = await page.evaluate(async (b64) => {
  const bin = atob(b64); const by = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) by[i]=bin.charCodeAt(i);
  const inp = document.getElementById('arquivoExtrato');
  const dt = new DataTransfer();
  dt.items.add(new File([by], 'fatura_c6.pdf', { type:'application/pdf' }));
  inp.files = dt.files;

  const marcas = [];
  inp.dispatchEvent(new Event('change'));
  marcas.push('input logo depois: ' + inp.files.length);
  // O pior caso do Vitor: volta do seletor e o app tenta se atualizar.
  document.dispatchEvent(new Event('visibilitychange'));
  navigator.serviceWorker.dispatchEvent(new Event('controllerchange'));
  await new Promise(r => setTimeout(r, 3000));
  marcas.push('folha: ' + ((document.getElementById('folhaTitulo')||{}).textContent || 'NENHUMA'));
  marcas.push('aviso: ' + ((document.getElementById('dialogoTexto')||{}).textContent || '-').slice(0,60));
  return marcas;
}, b64);
r.forEach(m => console.log('2.', m));
console.log('   URL igual?', (await page.evaluate(() => location.href)) === antes);
await page.screenshot({ path: dir+'/k01-corrida.png' });
await browser.close();
