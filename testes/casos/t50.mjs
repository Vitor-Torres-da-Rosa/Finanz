import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
page.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text()); });
const folha = () => page.locator('#folha');
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1400);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('x'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);
await page.click('#telaInicio .cartao-acao:has-text("+ Nova")'); await page.waitForTimeout(500);
await folha().locator('input.entrada[type=text]').first().fill('C6 Bank');
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);

await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(700);
let arquivo = amostras + '/c6-senha-aes256.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });
await page.click('#telaMais .linha:has-text("Importar extrato")'); await page.waitForTimeout(2500);
console.log('1. pediu senha? título =', await page.textContent('#folhaTitulo').catch(()=>'-'));
await page.screenshot({ path: dir+'/c01-senha.png' });
// senha errada primeiro
await folha().locator('input[type=password]').fill('erradaXX');
await page.click('#folha .btn-ouro:has-text("Abrir")'); await page.waitForTimeout(2500);
console.log('2. senha errada ->', await page.textContent('#folhaTitulo').catch(()=>'-'), '|',
  (await page.textContent('#folha .ajuda').catch(()=>'-')).slice(0,60));
await folha().locator('input[type=password]').fill('12345678');
await page.click('#folha .btn-ouro:has-text("Abrir")'); await page.waitForTimeout(3500);
console.log('3. abriu ->', await page.textContent('#folhaTitulo').catch(()=>'-'));
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato').catch(()=>'-')).replace(/\s+/g,' '));
console.log('   itens:', await page.locator('#folha .item-extrato').count());
console.log('   botão:', await page.textContent('#folha .btn-ouro'));
await page.screenshot({ path: dir+'/c02-conferir.png', fullPage: true });
const primeiros = await page.$$eval('#folha .item-extrato', ns => ns.slice(0,4).map(n => n.textContent.replace(/\s+/g,' ')));
primeiros.forEach(p => console.log('   *', p));
// desmarca um
await page.click('#folha .item-extrato:nth-child(1) .caixinha'); await page.waitForTimeout(400);
console.log('4. após desmarcar:', await page.textContent('#folha .btn-ouro'));
await page.click('#folha .item-extrato:nth-child(1) .caixinha'); await page.waitForTimeout(400);
// importa
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
console.log('5. diálogo:', await page.textContent('#dialogoTitulo').catch(()=>'-'));
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2000);
await page.waitForTimeout(1500);
const tx = (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ');
console.log('6. transações:', tx.slice(0,150));
console.log('   achou POSTO?', /POSTO/.test(tx), '| SALARIO?', /SALARIO/.test(tx));
await page.screenshot({ path: dir+'/c03-transacoes.png' });
await browser.close();
