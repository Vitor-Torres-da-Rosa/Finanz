// A folha de registrar pagamento de um cliente com um registro só.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dia) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(dia).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-pa', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 0 }],
      lancamentos: [], pagamentos: [], parcelas: [],
      clientes: [{ id: 'ca', nome: 'Gustavo Appelt', telefone: '47984213185' }],
      servicos: [{ id: 'sa', clienteId: 'ca', nome: 'TV Infinity 32', tipo: 'Venda',
                   valor: 80000, data: d(3) }]
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
  await page.waitForTimeout(1200);
  await page.click('#telaInicio button:has-text("Empreendedor")');
  await page.waitForTimeout(1500);
  await page.click('#telaInicio .linha-alvo:has-text("Gustavo Appelt")');
  await page.waitForTimeout(1400);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#folha .aba-cliente button')]
      .find((n) => /Pagos/.test(n.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(900);
  await page.click('#folha .btn-ouro:has-text("Registrar pagamento")');
  await page.waitForTimeout(1400);

  const caixa = await page.evaluate(() => {
    const c = [...document.querySelectorAll('#folha .campo')]
      .find((x) => /Referente a/.test(x.textContent));
    if (!c) return null;
    c.scrollIntoView({ block: 'center' });
    const r = c.getBoundingClientRect();
    return { x: Math.max(r.x - 12, 0), y: Math.max(r.y - 12, 0),
             width: Math.min(r.width + 24, 390), height: r.height + 24 };
  });
  await page.waitForTimeout(400);
  return caixa;
}
