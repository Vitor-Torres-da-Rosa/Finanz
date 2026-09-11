// Um cliente com parcela vencida há meses e juros por atraso combinados.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dias) => {
      const x = new Date(h.getFullYear(), h.getMonth(), h.getDate() + dias);
      return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') +
             '-' + String(x.getDate()).padStart(2, '0');
    };
    const dados = {
      contas: [{ id: 'cc-p8', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 0 }],
      lancamentos: [], pagamentos: [],
      clientes: [{ id: 'c8', nome: 'Hermes Klagenberg', telefone: '51920000000' }],
      servicos: [{ id: 's8', clienteId: 'c8', nome: 'Reforma elétrica', tipo: 'Serviço',
                   valor: 200000, data: d(-120) }],
      parcelas: [
        { id: 'q8a', clienteId: 'c8', servicoId: 's8', numero: 1, total: 2, valor: 100000,
          vencimento: d(-90), jurosAtraso: 2 },
        { id: 'q8b', clienteId: 'c8', servicoId: 's8', numero: 2, total: 2, valor: 100000,
          vencimento: d(-60), jurosAtraso: 2 }
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
  await page.waitForTimeout(1200);
  await page.click('#telaInicio button:has-text("Empreendedor")');
  await page.waitForTimeout(1500);
  // O cliente atrasado abre o resumo do atraso; volto e entro na ficha.
  await page.evaluate(() => {
    const n = [...document.querySelectorAll('#telaInicio .linha-alvo')]
      .find((x) => /Hermes/.test(x.textContent));
    if (n) n.click();
  });
  await page.waitForTimeout(1200);
  const temFicha = await page.locator('#folha .aba-cliente').count();
  if (!temFicha) {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#folha button')]
        .find((n) => /Abrir a ficha|ficha/i.test(n.textContent));
      if (b) b.click();
    });
    await page.waitForTimeout(1400);
  }
  const caixa = await page.evaluate(() => {
    const n = document.querySelector('#folha .cartao');
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: Math.max(r.x - 10, 0), y: Math.max(r.y - 10, 0),
             width: Math.min(r.width + 20, 390), height: r.height + 20 };
  });
  await page.waitForTimeout(300);
  return caixa;
}
