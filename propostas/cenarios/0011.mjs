// A conta já tem um Pix de R$ 50,00 do dia 8. O extrato colado traz dois
// Pix de R$ 50,00 no dia 8, porque foram dois mesmo.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const dia = (n) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(n).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-pb', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 100000 }],
      lancamentos: [
        { id: 'pb1', tipo: 'saida', valor: 5000, data: dia(8), contaId: 'cc-pb',
          categoria: 'Outros', descricao: 'Pix enviado' }
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
  await page.waitForTimeout(1500);

  // Cola o extrato: Mais -> "Colar o extrato".
  await page.click('#navegacao button:has-text("Mais")');
  await page.waitForTimeout(1000);
  await page.click('#telaMais .linha:has-text("Colar o extrato")');
  await page.waitForTimeout(1000);
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');
  const ano = new Date().getFullYear();
  const texto = [
    '08/' + mes + '/' + ano + '  Pix enviado para JOAO  -R$ 50,00',
    '08/' + mes + '/' + ano + '  Pix enviado para JOAO  -R$ 50,00',
    '09/' + mes + '/' + ano + '  POSTO IPIRANGA  -R$ 120,00'
  ].join('\n');
  await page.locator('#folha textarea').fill(texto);
  await page.waitForTimeout(500);
  await page.click('#folha .btn-ouro');
  await page.waitForTimeout(2200);
  // aponta a conta que já tem o Pix
  await page.evaluate(() => {
    const sel = document.querySelector('#folha .selecao');
    if (sel) sel.click();
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const it = [...document.querySelectorAll('#escolhaLista .escolha-item')]
      .find((n) => /Banco Inter/.test(n.textContent));
    if (it) it.click();
  });
  await page.waitForTimeout(1600);

  const caixa = await page.evaluate(() => {
    const p = [...document.querySelectorAll('#folha p.ajuda')]
      .find((n) => /já existem|repetid/i.test(n.textContent));
    if (p) p.scrollIntoView({ block: 'start' });
    return { x: 0, y: 0, width: 390, height: 700 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
