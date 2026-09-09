import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1400);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('y'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);
for (const nome of ['C6 Bank','Nubank']) {
  await page.click('#telaInicio .cartao-acao:has-text("+ Nova")'); await page.waitForTimeout(500);
  await folha().locator('input.entrada[type=text]').first().fill(nome);
  await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
}
let arquivo = amostras + '/c6-aberto.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });

async function importar() {
  await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(700);
  await page.click('#telaMais .linha:has-text("Importar extrato")'); await page.waitForTimeout(3500);
}
await importar();
await page.screenshot({ path: dir+'/c10-conferir.png', fullPage:true });
await page.click('#folha .btn-ouro'); await page.waitForTimeout(800);
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2200);
console.log('1. primeira importação ok');

// de novo: tem que marcar como repetido
await importar();
console.log('2. aviso de repetidos:', (await page.textContent('#folha .ajuda').catch(()=>'-')).slice(0,90));
console.log('   marcados:', await page.locator('#folha .caixinha.marcada').count(), 'de', await page.locator('#folha .item-extrato').count());
console.log('   botão:', await page.textContent('#folha .btn-ouro'));
console.log('   selos "já existe":', await page.locator('#folha .ja-tem').count());
await page.screenshot({ path: dir+'/c11-repetidos.png', fullPage:true });

// trocar de conta: na Nubank nada é repetido
await page.click('#folha .selecao'); await page.waitForTimeout(700);
await page.click('#escolhaLista .escolha-item:has-text("Nubank")'); await page.waitForTimeout(1200);
console.log('3. na Nubank -> marcados:', await page.locator('#folha .caixinha.marcada').count(),
            '| botão:', await page.textContent('#folha .btn-ouro'));
// trocar categoria de um item
await page.click('#folha .item-extrato:nth-child(2) .etiqueta-cat'); await page.waitForTimeout(700);
console.log('4. menu de categoria:', await page.textContent('#escolhaTitulo').catch(()=>'-'));
await page.click('#escolhaLista .escolha-item:has-text("Lazer")'); await page.waitForTimeout(600);
console.log('   virou:', await page.textContent('#folha .item-extrato:nth-child(2) .etiqueta-cat'));
await browser.close();
