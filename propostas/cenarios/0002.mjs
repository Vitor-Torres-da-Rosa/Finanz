// Um cartão com compras e a fatura paga na conta corrente: é o "Total a
// pagar nos cartões" que mede errado hoje.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (mes, dia) => {
      const x = new Date(h.getFullYear(), h.getMonth() - mes, dia);
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') +
             '-' + String(x.getDate()).padStart(2, '0');
    };
    const l = [];
    let n = 0;
    // Três meses de cartão, cada fatura paga em dia pela conta corrente.
    for (let m = 2; m >= 0; m--) {
      l.push({ id: 'c' + (n++), tipo: 'saida', valor: 65000, data: d(m, 7), contaId: 'cd-p2',
               categoria: 'Alimentação', descricao: 'Mercado do bairro' });
      l.push({ id: 'c' + (n++), tipo: 'saida', valor: 12000, data: d(m, 8), contaId: 'cd-p2',
               categoria: 'Transporte', descricao: 'Posto Ipiranga' });
      if (m > 0) {
        l.push({ id: 'f' + (n++), tipo: 'saida', valor: 77000, data: d(m - 1, 10), contaId: 'cc-p2',
                 categoria: 'Outros', descricao: 'PAGAMENTO DE FATURA' });
      }
    }
    l.push({ id: 'e0', tipo: 'entrada', valor: 800000, data: d(0, 5), contaId: 'cc-p2',
             categoria: 'Salário', descricao: 'Salário' });
    const dados = {
      contas: [{ id: 'cc-p2', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 0 },
               { id: 'cd-p2', nome: 'Inter Gold', tipo: 'Cartão de crédito', saldoInicial: 0 }],
      lancamentos: l
    };
    const f = new File([JSON.stringify({ app: 'finanz', dados })], 'b.json', { type: 'application/json' });
    const inp = document.getElementById('arquivoRestaurar');
    const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files;
    inp.dispatchEvent(new Event('change'));
    setTimeout(() => res(true), 900);
  }));
  await page.click('#dialogoAcoes button:has-text("Restaurar")');
  await page.waitForTimeout(3000);
  await page.click('#navegacao button:has-text("Início")');
  await page.waitForTimeout(1800);

  const caixa = await page.evaluate(() => {
    const n = [...document.querySelectorAll('#telaInicio .cartao')]
      .find((x) => /Total a pagar nos cart/.test(x.textContent));
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect();
    return { x: Math.max(r.x - 10, 0), y: Math.max(r.y - 10, 0),
             width: Math.min(r.width + 20, 390), height: r.height + 20 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
