// Transações num mês com compras no cartão e a fatura paga: é a linha da
// fatura que muda de cara.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dia) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(dia).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-p1', nome: 'C6 Bank', tipo: 'Conta corrente', saldoInicial: 500000 },
               { id: 'cd-p1', nome: 'C6 (cartão)', tipo: 'Cartão de crédito', saldoInicial: 0 }],
      lancamentos: [
        { id: 'p1a', tipo: 'saida', valor: 65000, data: d(7), contaId: 'cd-p1',
          categoria: 'Alimentação', descricao: 'Mercado do bairro' },
        { id: 'p1b', tipo: 'saida', valor: 50000, data: d(9), contaId: 'cc-p1',
          categoria: 'Outros', descricao: 'PAGAMENTO DE FATURA' },
        { id: 'p1c', tipo: 'saida', valor: 12000, data: d(9), contaId: 'cc-p1',
          categoria: 'Transporte', descricao: 'Posto Ipiranga' }
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
  await page.click('#navegacao button:has-text("Transações")');
  await page.waitForTimeout(1800);

  // Recorta o cartão do dia em que a fatura foi paga.
  const caixa = await page.evaluate(() => {
    const n = [...document.querySelectorAll('#telaTransacoes .cartao')]
      .find((x) => /FATURA/i.test(x.textContent));
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect();
    return { x: Math.max(r.x - 10, 0), y: Math.max(r.y - 10, 0),
             width: Math.min(r.width + 20, 390), height: r.height + 20 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
