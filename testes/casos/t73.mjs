// Lote de arquivos: quando o primeiro não tem nada a usar (tudo já existe),
// tem que dar para seguir para o próximo pelo botão lá do fim.
import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
let arquivos = [amostras+'/lote-a.pdf'];
page.on('filechooser', async fc => { await fc.setFiles(arquivos); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('l73'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

async function importar() {
  await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
  await page.click('#telaMais label.linha:has-text("Importar extrato")');
  await page.waitForSelector('#folha input[type=password]', { timeout: 40000 }); await page.waitForTimeout(600);
  if (await page.locator('#folha .marcar-todos .caixinha').count()) {
    await page.click('#folha .marcar-todos .caixinha'); await page.waitForTimeout(300);
  }
  await folha().locator('input[type=password]').fill('12345678');
  await page.click('#folha .btn-ouro:has-text("Abrir")');
  await page.waitForSelector('#folha .cabeca-banco', { timeout: 60000 }); await page.waitForTimeout(1200);
}

// 1) importa o lote-a sozinho, para os lançamentos passarem a existir
await importar();
await page.click('#folha .selecao'); await page.waitForTimeout(700);
await page.click('#escolhaLista .escolha-item:has-text("Criar conta")'); await page.waitForTimeout(1500);
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2500);
console.log('1. primeira importação feita');

// 2) agora manda o MESMO arquivo + outro: no arquivo 1 nada é novo
arquivos = [amostras+'/lote-a.pdf', amostras+'/lote-b.pdf'];
await importar();
console.log('2. arquivo:', (await page.textContent('#folha .linha-nota')).replace(/\s+/g,' '));
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato')).replace(/\s+/g,' ').slice(0,60));
const botoes = await page.$$eval('#folha .acoes .btn', bs => bs.map(b => b.textContent.trim()+(b.disabled?' [apagado]':'')));
console.log('3. botões do fim:', botoes);
await page.evaluate(() => { document.getElementById('folha').scrollTop = 99999; });
await page.waitForTimeout(300);
await page.screenshot({ path: dir+'/g01-pular.png' });
await page.click('#folha .btn-fantasma:has-text("Pular")'); await page.waitForTimeout(2500);
console.log('4. depois de pular:', (await page.textContent('#folha .linha-nota')).replace(/\s+/g,' '));
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato')).replace(/\s+/g,' ').slice(0,60));
console.log('5. no último arquivo ainda tem "Pular"?', await page.locator('#folha .btn-fantasma:has-text("Pular")').count());
await page.screenshot({ path: dir+'/g02-arquivo2.png' });
// nada foi lançado a mais pelo pular
const n = await page.evaluate(() => JSON.parse(localStorage.getItem('caixa-estado')||'{}').lancamentos?.length);
console.log('6. lançamentos no app:', n === undefined ? '(cofre cifrado)' : n);
await browser.close();
