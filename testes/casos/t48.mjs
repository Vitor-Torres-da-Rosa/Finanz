import { chromium, dir, amostras, ENDERECO } from '../comum.mjs';
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.goto(ENDERECO, { waitUntil:'networkidle' });
await page.waitForTimeout(1200);
// limparEstado é interno; testo pelo mesmo caminho do restaurador: injeto um arquivo.
const casos = {
  'completo': { contas:[{id:'a',nome:'Nubank',tipo:'Conta corrente',saldoInicial:0,cor:'#fff'}],
    lancamentos:[{id:'l1',tipo:'entrada',valor:1000,categoria:'Salário',descricao:'x',data:'2026-01-05',contaId:'a'}],
    clientes:[{id:'c1',nome:'João',telefones:[{numero:'51999999999',whats:true}],criadoEm:1}],
    servicos:[{id:'s1',clienteId:'c1',valor:45000,tipo:'Serviço',nome:'Obra',data:'2026-01-01'}],
    parcelas:[{id:'p1',clienteId:'c1',servicoId:'s1',numero:1,total:10,valor:4500,vence:'2026-02-01'}],
    pagamentos:[{id:'g1',clienteId:'c1',valor:3000,data:'2026-02-01',parcelaId:'p1'}],
    perfil:{nome:'Vitor'} },
  'sem telefones (antigo)': { contas:[{id:'a',nome:'X',tipo:'Conta corrente',saldoInicial:0}],
    lancamentos:[], clientes:[{id:'c1',nome:'João',telefone:'51999999999'}] },
  'parcela sem cliente': { contas:[{id:'a',nome:'X',tipo:'Conta corrente',saldoInicial:0}], lancamentos:[],
    parcelas:[{id:'p1',numero:1,valor:100}] },
  'nulos': { contas:[null,{id:'a',nome:'X',tipo:'Conta corrente',saldoInicial:0}], lancamentos:[null],
    clientes:[null], servicos:[null], parcelas:[null], pagamentos:[null], metas:[null], ativos:[null] },
  'campos faltando': { contas:[{id:'a',nome:'X'}], lancamentos:[{id:'l1'}], clientes:[{id:'c1',nome:'J'}],
    servicos:[{id:'s1'}], parcelas:[{id:'p1'}], pagamentos:[{id:'g1'}] },
};
for (const [nome, dados] of Object.entries(casos)) {
  const r = await page.evaluate((d) => {
    return new Promise(res => {
      const f = new File([JSON.stringify({app:'caixa', dados:d})], 'b.json', {type:'application/json'});
      const inp = document.getElementById('arquivoRestaurar');
      const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files;
      const antes = window.onerror; let erro = null;
      window.onerror = (m) => { erro = m; };
      try { inp.dispatchEvent(new Event('change')); } catch (e) { erro = 'sync: ' + e.message; }
      setTimeout(() => {
        window.onerror = antes;
        const t = document.getElementById('dialogoTexto');
        res({ erro, toque: (document.getElementById('toque')||{}).textContent,
              dialogo: t ? t.textContent : null });
      }, 500);
    });
  }, dados);
  console.log(nome.padEnd(24), JSON.stringify(r));
  await page.evaluate(() => { const b=document.querySelector('#dialogoAcoes button:last-child'); if(b) b.click(); });
  await page.waitForTimeout(300);
}
await browser.close();
