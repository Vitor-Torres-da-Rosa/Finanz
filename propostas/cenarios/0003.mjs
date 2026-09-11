// Um dia com a fatura paga e um gasto comum: é o número do cabeçalho do
// dia que somava por um critério diferente do resumo do período.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dia) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(dia).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-p3', nome: 'C6 Bank', tipo: 'Conta corrente', saldoInicial: 500000 },
               { id: 'cd-p3', nome: 'C6 (cartão)', tipo: 'Cartão de crédito', saldoInicial: 0 }],
      lancamentos: [
        { id: 'p3a', tipo: 'saida', valor: 65000, data: d(7), contaId: 'cd-p3',
          categoria: 'Alimentação', descricao: 'Mercado do bairro' },
        { id: 'p3b', tipo: 'saida', valor: 50000, data: d(9), contaId: 'cc-p3',
          categoria: 'Outros', descricao: 'PAGAMENTO DE FATURA' },
        { id: 'p3c', tipo: 'saida', valor: 12000, data: d(9), contaId: 'cc-p3',
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

  // Recorta do cabeçalho do dia até o fim do cartão daquele dia.
  const caixa = await page.evaluate(() => {
    const cartoes = [...document.querySelectorAll('#telaTransacoes .cartao')];
    const alvo = cartoes.find((x) => /FATURA/i.test(x.textContent));
    if (!alvo) return null;
    const cab = alvo.previousElementSibling;
    alvo.scrollIntoView({ block: 'center' });
    const a = cab.getBoundingClientRect();
    const b = alvo.getBoundingClientRect();
    return { x: Math.max(a.x - 10, 0), y: Math.max(a.y - 8, 0),
             width: Math.min(Math.max(a.width, b.width) + 20, 390),
             height: (b.bottom - a.top) + 16 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
