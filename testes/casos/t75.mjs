// Período com dois calendários: ano em cima, mês e dias embaixo.
import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1600);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('l75'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

await page.click('#navegacao button:has-text("Transações")'); await page.waitForTimeout(1200);
await page.click('#telaTransacoes button:has-text("Escolher datas")'); await page.waitForTimeout(1000);
console.log('1. quantos calendários:', await page.locator('#folha .cal').count());
console.log('2. rótulos:', await page.$$eval('#folha .cal-rotulo', ns=>ns.map(n=>n.textContent.replace(/\s+/g,' '))));
console.log('3. ano/mês:', await page.$$eval('#folha .cal-ano, #folha .cal-mes', ns=>ns.map(n=>n.textContent)));
await page.screenshot({ path: dir+'/h01-calendario.png' });
// seta do ano do primeiro calendário
await page.locator('#folha .cal').first().locator('.cal-fita').first().locator('.cal-seta').first().click();
await page.waitForTimeout(300);
console.log('4. ano depois de ‹:', await page.locator('#folha .cal-ano').first().textContent());
// seta do mês
await page.locator('#folha .cal').first().locator('.cal-fita').nth(1).locator('.cal-seta').last().click();
await page.waitForTimeout(300);
console.log('5. mês depois de ›:', await page.locator('#folha .cal-mes').first().textContent());
// escolhe um dia
await page.locator('#folha .cal').first().locator('.cal-dia:not(.fora)').nth(9).click();
await page.waitForTimeout(300);
console.log('6. escolhido:', await page.locator('#folha .cal-rotulo').first().textContent());
console.log('7. nota:', await page.textContent('#folha .linha-nota'));
await page.screenshot({ path: dir+'/h02-escolhido.png' });
await page.click('#folha .btn-ouro:has-text("Ver este período")'); await page.waitForTimeout(1200);
console.log('8. tela:', (await page.textContent('#telaTransacoes')).replace(/\s+/g,' ').slice(0,100));
await browser.close();
