// Descrição repetida ("Pix enviado: Pix enviado: ..."): sai uma vez só,
// tanto no que se importa agora quanto no que já estava guardado.
import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
page.on('filechooser', async fc => { await fc.setFiles(amostras+'/inter-repetido.pdf'); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('l74'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
await page.click('#telaMais label.linha:has-text("Importar extrato")');
await page.waitForSelector('#folha .cabeca-banco', { timeout: 60000 }); await page.waitForTimeout(1200);
const descs = await page.$$eval('#folha .item-desc', ns => ns.map(n=>n.textContent.trim()));
console.log('1. descrições lidas:');
descs.forEach(d => console.log('   |'+d+'|'));
console.log('2. alguma repetida?', descs.some(d => /^(.{5,40}?)\s*[:–—-]?\s+\1\b/i.test(d)));

// e o que já estava guardado, importado antes da correção?
const r = await page.evaluate(() => new Promise(res => {
  const dados = { contas:[{id:'a',nome:'Banco Inter',tipo:'Conta corrente',saldoInicial:0}],
    lancamentos:[{id:'l1',tipo:'saida',valor:11534,data:'2026-09-08',contaId:'a',categoria:'Outros',
                  descricao:'Pix enviado: Pix enviado: Vitor Torres Fantinelli da Rosa'}] };
  const f = new File([JSON.stringify({app:'caixa', dados})], 'b.json', {type:'application/json'});
  const inp = document.getElementById('arquivoRestaurar');
  const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files;
  inp.dispatchEvent(new Event('change'));
  setTimeout(() => res(true), 700);
}));
await page.click('#dialogoAcoes button:has-text("Restaurar"), #dialogoAcoes button:last-child');
await page.waitForTimeout(2500);
await page.click('#navegacao button:has-text("Transações")'); await page.waitForTimeout(1500);
const tx = (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ');
console.log('3. achou o lançamento restaurado?', /Vitor Torres Fantinelli/.test(tx));
console.log('4. ainda repetido?', /Pix enviado: Pix enviado/.test(tx));
console.log('   trecho:', (tx.match(/Pix enviado[^|]{0,50}/)||['-'])[0]);
await page.screenshot({ path: dir+'/g03-desc.png', fullPage: true });
await browser.close();
