// O relatório de apoio ao imposto de renda, num ano com gastos de saúde e
// educação lançados.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const ano = new Date().getFullYear();
    const dados = {
      contas: [{ id: 'cc-p5', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 500000 }],
      lancamentos: [
        { id: 'p5a', tipo: 'saida', valor: 32000, data: ano + '-02-14', contaId: 'cc-p5',
          categoria: 'Saúde', descricao: 'Consulta dentista' },
        { id: 'p5b', tipo: 'saida', valor: 89900, data: ano + '-03-10', contaId: 'cc-p5',
          categoria: 'Educação', descricao: 'Mensalidade CESUMAR' },
        { id: 'p5c', tipo: 'saida', valor: 47500, data: ano + '-05-08', contaId: 'cc-p5',
          categoria: 'Saúde', descricao: 'Plano de saúde Unimed' },
        { id: 'p5d', tipo: 'saida', valor: 12000, data: ano + '-06-21', contaId: 'cc-p5',
          categoria: 'Alimentação', descricao: 'Mercado do bairro' }
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

  // Recorta do fim dos rendimentos até o fim do relatório.
  const caixa = await page.evaluate(() => {
    const alvo = document.getElementById('relConteudo');
    const titulos = [...alvo.querySelectorAll('h2')];
    const inicio = titulos[titulos.length - 1];
    if (!inicio) return null;
    inicio.scrollIntoView({ block: 'start' });
    return null;
  });
  await page.waitForTimeout(500);
  return caixa;
}
