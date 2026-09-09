import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
const folha = () => page.locator('#folha');
let arquivo = amostras + '/c6-grande.pdf';
page.on('filechooser', async fc => { await fc.setFiles(arquivo); });
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('p67'+Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);
await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(800);
await page.click('#telaMais label.linha:has-text("Importar extrato")');
await page.waitForSelector('#folha input[type=password]', { timeout: 40000 });
await folha().locator('input[type=password]').fill('12345678');
await page.click('#folha .btn-ouro:has-text("Abrir")');
await page.waitForSelector('#folha .paginas', { timeout: 60000 }); await page.waitForTimeout(1000);

const r = await page.evaluate(async () => {
  const f = document.getElementById('folha');
  const barra = () => f.querySelector('.paginas-conta').textContent;
  const toca = (texto) => {
    const b = [...f.querySelectorAll('.paginas .btn-mini, .atalhos-extrato .btn-mini')]
      .find(x => x.textContent.includes(texto) && !x.disabled);
    if (b) b.click();
  };
  const esperar = () => new Promise(r => setTimeout(r, 400));

  f.scrollTop = 1400;
  await esperar();
  const antes = f.scrollTop;
  const linhas = ['1. rolagem ' + antes + ' | ' + barra()];

  toca('Próximos'); await esperar();
  linhas.push('2. Próximos -> rolagem ' + f.scrollTop + ' | ' + barra() +
    ' | mexeu? ' + (f.scrollTop === antes ? 'NÃO (certo)' : 'SIM'));

  toca('Anteriores'); await esperar();
  linhas.push('3. Anteriores -> rolagem ' + f.scrollTop + ' | ' + barra() +
    ' | mexeu? ' + (f.scrollTop === antes ? 'NÃO (certo)' : 'SIM'));

  toca('Desmarcar todos'); await esperar();
  linhas.push('4. Desmarcar todos -> rolagem ' + f.scrollTop +
    ' | mexeu? ' + (f.scrollTop === antes ? 'NÃO (certo)' : 'SIM'));

  toca('Marcar todos'); await esperar();
  linhas.push('5. Marcar todos -> rolagem ' + f.scrollTop +
    ' | mexeu? ' + (f.scrollTop === antes ? 'NÃO (certo)' : 'SIM'));
  return linhas;
});
r.forEach(l => console.log('  ', l));
await page.screenshot({ path: dir+'/n01-paginas.png' });
await browser.close();
