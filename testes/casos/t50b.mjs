import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844} })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message, '\n', (e.stack||'').split('\n').slice(0,4).join('\n')));
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(1500);
const r = await page.evaluate(async () => {
  // chama o miolo direto, sem passar pelo catch que engole o erro
  const fs = await fetch('/nada').catch(()=>null);
  return 'ok';
});
// carrega o PDF e roda a extração + montagem na mão
const fs = await import('fs');
const b64 = fs.readFileSync(amostras+'/c6-aberto.pdf').toString('base64');
const saida = await page.evaluate(async (b64) => {
  const bin = atob(b64); const by = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) by[i]=bin.charCodeAt(i);
  const g = window;
  try {
    const arq = new File([by], 'c6.pdf', {type:'application/pdf'});
    const dt = new DataTransfer(); dt.items.add(arq);
    const inp = document.getElementById('arquivoExtrato');
    inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
  } catch (e) { return 'sync: ' + e.message; }
  await new Promise(r => setTimeout(r, 3000));
  return { titulo: (document.getElementById('folhaTitulo')||{}).textContent,
           toque: (document.getElementById('toque')||{}).textContent,
           itens: document.querySelectorAll('#folha .item-extrato').length };
}, b64);
console.log(JSON.stringify(saida, null, 1));
await browser.close();
