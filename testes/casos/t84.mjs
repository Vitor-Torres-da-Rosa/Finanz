// A meta de economia é escolhida em Preferências e manda na análise.
import { chromium, dir, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 })).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.goto(ENDERECO, { waitUntil:'networkidle' }); await page.waitForTimeout(400);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(() => { document.getElementById('entrada').scrollTop = 99999; });
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(500);
const c = page.locator('.ent-campo input');
await c.nth(0).fill('Vitor'); await c.nth(1).fill('t84' + Date.now() + '-' + process.pid + '@exemplo.com'); await c.nth(3).fill('senha123');
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Continuar")'); await page.waitForTimeout(400);
await page.click('.btn-dourado:has-text("Criar minha conta")'); await page.waitForTimeout(3000);

// renda e gastos: guardou 25%
await page.evaluate(() => new Promise(res => {
  const hoje = new Date();
  const d = (v) => { const x = new Date(hoje.getFullYear(), hoje.getMonth()-v, 10);
    return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-10'; };
  const l = [];
  for (let m = 3; m >= 0; m--) {
    l.push({id:'e'+m+'-t84',tipo:'entrada',valor:400000,data:d(m),contaId:'cc-t84',categoria:'Salário',descricao:'Salário'});
    l.push({id:'g'+m+'-t84',tipo:'saida',valor:300000,data:d(m),contaId:'cc-t84',categoria:'Mercado',descricao:'Compras'});
  }
  const dados = { contas:[{id:'cc-t84',nome:'Conta',tipo:'Conta corrente',saldoInicial:0}], lancamentos:l };
  const f = new File([JSON.stringify({app:'finanz', dados})],'b.json',{type:'application/json'});
  const inp = document.getElementById('arquivoRestaurar');
  const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files;
  inp.dispatchEvent(new Event('change')); setTimeout(()=>res(true), 900);
}));
await page.click('#dialogoAcoes button:has-text("Restaurar")'); await page.waitForTimeout(3000);

await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(1500);
await page.click('#telaMais .cartao.saude .btn-mini'); await page.waitForTimeout(1000);
console.log('1. com meta de 20%:', (await page.$$eval('#folha .parte-nota', ns=>ns.map(n=>n.textContent.replace(/\s+/g,' '))))[0]);
await page.goBack(); await page.waitForTimeout(1000);

await page.click('#telaMais .linha:has-text("Preferências")'); await page.waitForTimeout(1100);
console.log('2. campo existe?', await page.locator('#folha .campo:has-text("Meta de economia")').count());
console.log('   valor atual:', (await page.textContent('#folha .campo:has-text("Meta de economia") .selecao')).trim());
console.log('   nota:', (await page.$$eval('#folha .linha-nota', ns=>ns.map(n=>n.textContent).filter(t=>/seria guardar/.test(t))))[0]);
await page.click('#folha .campo:has-text("Meta de economia") .selecao'); await page.waitForTimeout(700);
await page.click('#escolhaLista .escolha-item:has-text("30%")'); await page.waitForTimeout(800);
console.log('3. depois de escolher 30%:', (await page.$$eval('#folha .linha-nota', ns=>ns.map(n=>n.textContent).filter(t=>/seria guardar/.test(t))))[0]);
await page.screenshot({ path: dir+'/u01-meta.png', fullPage: true });
await page.click('#folha .btn-ouro:has-text("Salvar")'); await page.waitForTimeout(1500);

await page.click('#navegacao button:has-text("Mais")'); await page.waitForTimeout(1200);
await page.click('#telaMais .cartao.saude .btn-mini'); await page.waitForTimeout(1000);
console.log('4. a análise usou a meta nova:', (await page.$$eval('#folha .parte-nota', ns=>ns.map(n=>n.textContent.replace(/\s+/g,' '))))[0]);
await browser.close();
