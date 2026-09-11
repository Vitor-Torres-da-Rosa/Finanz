// Uma conta com movimento normal e uma conta agendada para daqui a 20 dias.
// O banco mostra R$ 1.880,00; o app somava a conta futura e acusava erro.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (n) => {
      const x = new Date(h.getFullYear(), h.getMonth(), h.getDate() + n);
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') +
             '-' + String(x.getDate()).padStart(2, '0');
    };
    const dados = {
      contas: [{ id: 'cc-pc', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 200000 }],
      lancamentos: [
        { id: 'pc1', tipo: 'saida', valor: 12000, data: d(-6), contaId: 'cc-pc',
          categoria: 'Transporte', descricao: 'Posto Ipiranga' },
        { id: 'pc2', tipo: 'entrada', valor: 8000, data: d(-3), contaId: 'cc-pc',
          categoria: 'Serviços', descricao: 'Serviço avulso' },
        { id: 'pc3', tipo: 'saida', valor: 45000, data: d(20), contaId: 'cc-pc',
          categoria: 'Moradia', descricao: 'Aluguel agendado' }
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
  await page.click('#navegacao button:has-text("Início")');
  await page.waitForTimeout(1500);
  await page.click('#telaInicio .linha-alvo:has-text("Banco Inter")');
  await page.waitForTimeout(1400);
  await page.click('#folha .btn-ouro:has-text("Conferir esta conta")');
  await page.waitForTimeout(1600);
  return { x: 0, y: 0, width: 390, height: 640 };
}
