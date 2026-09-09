import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1500);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('q'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// texto tal como sai de um visualizador de PDF do C6
const colado = `Extrato
Banco C6 S.A.
Período - 6 de setembro de 2025 até 6 de outubro de 2025
Setembro 2025 ( 06/09/2025 - 30/09/2025 )
Data Data Tipo Descrição Valor
06/09 08/09 Saída PIX Pix enviado para POSTO DE COMBUSTIVEL DA FIGUEIRA LTDA -R$ 246,02
06/09 08/09 Saída PIX Pix enviado para DAVI TORRES FANTINELLI DA ROSA -R$ 51,00
09/09 09/09 Entrada PIX Pix recebido c6 de IGOR RIBEIRO KLAGENBERG R$ 47,50
Saldo do dia 09/09/25 R$ 381,55
12/09 12/09 Saída PIX Pix enviado para UNICESUMAR -R$ 196,89
02/10 02/10 Entradas RECEBIMENTO SALARIO R$ 3.730,50
07/10 07/10 Saída PIX Pix enviado para UBER DO BRASIL TECNOLOGIA LTDA -R$ 11,97`;

await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(900);
console.log('1. linha existe:', await page.locator('#telaMais .linha:has-text("Colar o extrato")').count());
await page.click('#telaMais .linha:has-text("Colar o extrato")'); await page.waitForTimeout(900);
console.log('2. folha:', await page.textContent('#folhaTitulo'));
await folha().locator('textarea').fill(colado);
await page.screenshot({ path: dir+'/h01-colar.png' });
await page.click('#folha .btn-ouro'); await page.waitForTimeout(1600);
console.log('3. resultado:', await page.textContent('#folhaTitulo'));
console.log('   banco:', await page.textContent('#folha .cabeca-nome'));
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato')).replace(/\s+/g,' '));
const itens = await page.$$eval('#folha .item-extrato', ns=>ns.map(x=>x.textContent.replace(/\s+/g,' ')));
itens.forEach(i=>console.log('    *', i));
await page.screenshot({ path: dir+'/h02-conferir.png', fullPage:true });
// lança
await page.click('#folha .selecao'); await page.waitForTimeout(700);
await page.click('#escolhaLista .escolha-item:has-text("Criar conta")'); await page.waitForTimeout(1400);
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2500);
console.log('4. importou:', /POSTO/.test((await page.textContent('#telaTransacoes')).replace(/\s+/g,' ')));
// texto ruim
await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
await page.click('#telaMais .linha:has-text("Colar o extrato")'); await page.waitForTimeout(900);
await folha().locator('textarea').fill('bom dia isso aqui não é extrato nenhum');
await page.click('#folha .btn-ouro'); await page.waitForTimeout(1400);
console.log('5. texto ruim:', await page.textContent('#dialogoTitulo').catch(()=>'-'), '|',
  (await page.textContent('#dialogoTexto').catch(()=>'-')).slice(0,90));
await browser.close();
