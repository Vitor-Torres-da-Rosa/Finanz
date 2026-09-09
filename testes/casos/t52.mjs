import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
import fs from 'fs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844} })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
let arquivo = null;
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1400);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('z'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// 1) sem conta nenhuma: o app deixa importar e oferece criar a conta do banco
let arq0 = amostras + '/c6-aberto.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo || arq0); });
await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(700);
await page.click('#telaMais .linha:has-text("Importar extrato")'); await page.waitForTimeout(3000);
console.log('1. sem conta -> conta sugerida:', await page.textContent('#folha .selecao').catch(()=>'-'));
await page.goBack(); await page.waitForTimeout(800);

await page.click('#navegacao button:has-text("Início")'); await page.waitForTimeout(600);
await page.click('#telaInicio .cartao-acao:has-text("+ Nova")'); await page.waitForTimeout(500);
await folha().locator('input.entrada[type=text]').first().fill('C6 Bank');
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);

arquivo = amostras + '/escaneado.pdf';
async function importar() {
  await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(700);
  await page.click('#telaMais .linha:has-text("Importar extrato")');
}
await importar(); await page.waitForTimeout(2500);
console.log('2. escaneado:', await page.textContent('#dialogoTitulo').catch(()=>'-'), '|',
  (await page.textContent('#dialogoTexto').catch(()=>'-')).slice(0,110));
await page.click('#dialogoAcoes button'); await page.waitForTimeout(700);

// 3) extrato grande, com senha
arquivo = amostras + '/c6-grande.pdf';
const t0 = Date.now();
await importar(); await page.waitForTimeout(2500);
await folha().locator('input[type=password]').fill('12345678');
await page.click('#folha .btn-ouro:has-text("Abrir")');
await page.waitForSelector('#folha .item-extrato', { timeout: 60000 });
await page.waitForTimeout(600);
console.log('3. grande: itens =', await page.locator('#folha .item-extrato').count(),
            '| tempo total', Date.now()-t0, 'ms');
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato')).replace(/\s+/g,' '));
console.log('   botão:', await page.textContent('#folha .btn-ouro'));
const t1 = Date.now();
await page.click('#folha .btn-ouro'); await page.waitForTimeout(700);
await page.click('#dialogoAcoes button:has-text("Sim")');
await page.waitForTimeout(6000);
console.log('4. importou em', Date.now()-t1, 'ms | tela:', (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ').slice(0,90));
await browser.close();
