// Quatro categorias com teto: a estourada tem nome no fim do alfabeto, para
// a ordem aparecer.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dia) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(dia).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-p4', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 500000 }],
      orcamentos: { geral: 300000, categorias: { 'Alimentação': 80000, 'Transporte': 50000, 'Lazer': 60000 } },
      lancamentos: [
        { id: 'p4a', tipo: 'saida', valor: 95000, data: d(5), contaId: 'cc-p4',
          categoria: 'Alimentação', descricao: 'Mercado do mês' },
        { id: 'p4b', tipo: 'saida', valor: 46000, data: d(6), contaId: 'cc-p4',
          categoria: 'Transporte', descricao: 'Combustível' },
        { id: 'p4c', tipo: 'saida', valor: 18000, data: d(7), contaId: 'cc-p4',
          categoria: 'Lazer', descricao: 'Cinema' }
      ]
    };
    const f = new File([JSON.stringify({ app: 'finanz', dados })], 'b.json', { type: 'application/json' });
    const inp = document.getElementById('arquivoRestaurar');
    const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    setTimeout(() => res(true), 900);
  }));
  await page.click('#dialogoAcoes button:has-text("Restaurar")');
  await page.waitForTimeout(3000);
  await page.click('#navegacao button:has-text("Planejar")');
  await page.waitForTimeout(1800);

  const caixa = await page.evaluate(() => {
    const n = [...document.querySelectorAll('#telaPlanejamento .cartao')]
      .find((x) => /Por categoria/.test(x.textContent));
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect();
    return { x: Math.max(r.x - 10, 0), y: Math.max(r.y - 10, 0),
             width: Math.min(r.width + 20, 390), height: r.height + 20 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
