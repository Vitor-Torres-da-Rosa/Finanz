// Extrato em PDF do Banco Inter: linhas sem data (a data vem do cabeçalho do
// dia) e duas colunas de dinheiro (Valor e Saldo por transação).
import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
page.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text()); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1400);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('f'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

page.on('filechooser', async fc => { await fc.setFiles(amostras + '/inter.pdf'); });
await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
await page.click('#telaMais .linha:has-text("Importar extrato")'); await page.waitForTimeout(3500);

const folha = (await page.textContent('#folha')).replace(/\s+/g,' ');
console.log('1. folha:', folha.slice(0,120));
await page.screenshot({ path: dir+'/f01-inter.png' });

const linhas = await page.$$eval('#folha .linha-alvo, #folha .item-extrato', ns => ns.map(n=>n.textContent.replace(/\s+/g,' ').trim()));
console.log('2. lançamentos lidos:', linhas.length);
linhas.forEach(l => console.log('   ', l.slice(0,90)));

await page.click('#folha .selecao'); await page.waitForTimeout(700);
await page.click('#escolhaLista .escolha-item:has-text("Criar conta")'); await page.waitForTimeout(1500);
console.log('3. conta:', (await page.textContent('#folha .selecao')).replace(/\s+/g,' '));
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
console.log('4. confirmação:', await page.textContent('#dialogoTitulo'), '|', (await page.textContent('#dialogoTexto')).replace(/\s+/g,' '));
await page.screenshot({ path: dir+'/f02-banco.png' });
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2500);
// O extrato traz o saldo do banco no fim: o app avisa quando não bate.
if (await page.locator('#dialogoTitulo').count()) {
  console.log('4b. aviso do saldo:', await page.textContent('#dialogoTitulo'));
  await page.click('#dialogoAcoes button'); await page.waitForTimeout(1800);
}

const tx = (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ');
console.log('5. Educação em CESUMAR?', /Educação/.test(tx));
console.log('6. nada virou Combustível?', !/Combustível/.test(tx));
console.log('   tela:', tx.slice(0,150));
await page.screenshot({ path: dir+'/f03-inter-tx.png', fullPage: true });
await page.click('#navegacao button:has-text("Início")'); await page.waitForTimeout(1200);
console.log('7. conta criada:', (await page.textContent('#telaInicio .linha-alvo .linha-titulo').catch(()=>'-')));
await page.screenshot({ path: dir+'/f04-inter-inicio.png' });
await browser.close();
