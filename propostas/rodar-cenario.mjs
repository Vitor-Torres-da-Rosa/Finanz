// Abre o app, cria uma conta limpa, roda o roteiro da proposta e tira o print.
import { chromium, ENDERECO } from '../testes/comum.mjs';

const [, , cenarioPath, saida] = process.argv;
const cenario = (await import(cenarioPath)).default;

const browser = await chromium.launch();
const page = await (await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true
})).newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto(ENDERECO, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")');
await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor');
await c.nth(1).fill('p' + Date.now() + '-' + process.pid + '@exemplo.com');
await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// O roteiro devolve o recorte, quando quiser recortar.
const recorte = await cenario(page);
await page.screenshot(recorte ? { path: saida, clip: recorte } : { path: saida });
await browser.close();
