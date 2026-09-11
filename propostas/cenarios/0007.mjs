// O relatório de IR aberto no meio do ano, com um ativo que subiu.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const ano = new Date().getFullYear();
    const dados = {
      contas: [{ id: 'cc-p7', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 100000 }],
      lancamentos: [],
      ativos: [
        { id: 't7a', nome: 'Tesouro Selic', classe: 'Renda fixa', aplicado: 1000000,
          historico: [{ data: (ano - 1) + '-12-31', valor: 1000000 },
                      { data: ano + '-06-30', valor: 1180000 }] },
        { id: 't7b', nome: 'Fundo imobiliário', classe: 'Fundos', aplicado: 500000,
          historico: [{ data: (ano - 1) + '-12-31', valor: 500000 },
                      { data: ano + '-07-15', valor: 462000 }] }
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
  await page.click('#navegacao button:has-text("Mais")');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#telaMais button')]
      .find((n) => /imposto de renda/i.test(n.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(1600);
  return { x: 0, y: 0, width: 390, height: 560 };
}
