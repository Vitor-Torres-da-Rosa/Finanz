import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
import fs from 'fs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844} })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
let arquivo = amostras + '/c6-fatura.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1500);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('v62'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// Injeta o arquivo e observa quando o input é limpo, em relação à leitura.
const b64 = fs.readFileSync(amostras+'/c6-fatura.pdf').toString('base64');
const ordem = await page.evaluate(async (b64) => {
  const bin = atob(b64); const by = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) by[i]=bin.charCodeAt(i);
  const inp = document.getElementById('arquivoExtrato');
  const dt = new DataTransfer();
  dt.items.add(new File([by], 'fatura_c6.pdf', { type:'application/pdf' }));
  inp.files = dt.files;

  const marcas = [];
  marcas.push('antes: input tem ' + inp.files.length + ' arquivo(s)');
  inp.dispatchEvent(new Event('change'));
  // logo depois do change, síncrono: o arquivo TEM que continuar lá
  marcas.push('logo apos change: ' + inp.files.length + ' arquivo(s)');
  await new Promise(r => setTimeout(r, 60));
  marcas.push('60ms depois: ' + inp.files.length + ' arquivo(s)');
  await new Promise(r => setTimeout(r, 2500));
  marcas.push('no fim: ' + inp.files.length + ' arquivo(s)');
  marcas.push('folha: ' + ((document.getElementById('folhaTitulo')||{}).textContent || '-'));
  return marcas;
}, b64);
ordem.forEach(m => console.log(' ', m));

await browser.close();
