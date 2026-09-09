import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
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
await c.nth(0).fill('Vitor'); await c.nth(1).fill('f'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

let arquivo = amostras + '/c6-fatura.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });
async function importar() {
  await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
  await page.click('#telaMais .linha:has-text("Importar extrato")');
}

// 1) FATURA em PDF, sem nenhuma conta criada
await importar(); await page.waitForTimeout(3000);
console.log('1. título:', await page.textContent('#folhaTitulo'));
console.log('   banco:', (await page.textContent('#folha .cabeca-banco')).replace(/\s+/g,' '));
console.log('   selo:', await page.textContent('#folha .cabeca-banco .selo'), '| cor:', await page.evaluate(() => getComputedStyle(document.querySelector('#folha .cabeca-banco .selo')).color));
console.log('   conta:', await page.textContent('#folha .selecao'));
console.log('   resumo:', (await page.textContent('#folha .resumo-extrato')).replace(/\s+/g,' '));
await page.screenshot({ path: dir+'/e01-fatura.png' });
// cria a conta do banco
await page.click('#folha .selecao'); await page.waitForTimeout(700);
console.log('2. opções de conta:', await page.$$eval('#escolhaLista .escolha-item .txt', ns=>ns.map(x=>x.textContent.replace(/\s+/g,' '))));
await page.click('#escolhaLista .escolha-item:has-text("Criar conta")'); await page.waitForTimeout(1500);
console.log('3. conta agora:', await page.textContent('#folha .selecao'));
await page.screenshot({ path: dir+'/e02-conta-criada.png' });
// confirma
await page.click('#folha .btn-ouro'); await page.waitForTimeout(900);
console.log('4. confirmação:', await page.textContent('#dialogoTitulo'), '|', (await page.textContent('#dialogoTexto')).replace(/\s+/g,' '));
await page.screenshot({ path: dir+'/e03-confirmar.png' });
await page.click('#dialogoAcoes button:has-text("Sim")'); await page.waitForTimeout(2500);
const tx = (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ');
console.log('5. importou:', /NETFLIX/.test(tx), '| tela:', tx.slice(0,80));
// a conta criada tem cor e monograma?
await page.click('#navegacao button:has-text("Início")'); await page.waitForTimeout(1200);
const conta = await page.evaluate(() => {
  const l = document.querySelector('#telaInicio .linha-alvo .selo');
  return l ? { marca: l.textContent, cor: getComputedStyle(l).color } : null;
});
console.log('6. selo da conta:', JSON.stringify(conta));
console.log('   nome:', await page.textContent('#telaInicio .linha-alvo .linha-titulo').catch(()=>'-'));
await page.screenshot({ path: dir+'/e04-conta.png' });
await browser.close();
