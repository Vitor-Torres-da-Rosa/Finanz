// Dois clientes pagos pela interface: um registro de Venda e um de Serviço.
// O print é a distribuição de receitas do Início.
export default async function (page) {
  await page.evaluate(() => new Promise((res) => {
    const h = new Date();
    const d = (dia) => h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0') +
                       '-' + String(dia).padStart(2, '0');
    const dados = {
      contas: [{ id: 'cc-p9', nome: 'Banco Inter', tipo: 'Conta corrente', saldoInicial: 0 }],
      lancamentos: [], pagamentos: [], parcelas: [],
      clientes: [{ id: 'c9a', nome: 'Gustavo Appelt', telefone: '47984213185' },
                 { id: 'c9b', nome: 'Daniela Torres', telefone: '51999990000' }],
      servicos: [{ id: 's9a', clienteId: 'c9a', nome: 'TV Infinity 32', tipo: 'Venda',
                   valor: 80000, data: d(3) },
                 { id: 's9b', clienteId: 'c9b', nome: 'Instalação elétrica', tipo: 'Serviço',
                   valor: 50000, data: d(4) }]
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

  // Recebe dos dois pela interface, que é onde o lançamento nasce.
  for (const [nome, valor] of [['Gustavo Appelt', '80000'], ['Daniela Torres', '50000']]) {
    await page.click(`#telaInicio .linha-alvo:has-text("${nome}")`);
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#folha .aba-cliente button')]
        .find((n) => /Pagos/.test(n.textContent));
      if (b) b.click();
    });
    await page.waitForTimeout(900);
    await page.click('#folha .btn-ouro:has-text("Registrar pagamento")');
    await page.waitForTimeout(1300);
    // Aponta o registro em "Referente a", que é o que a pessoa faz quando
    // quer o pagamento amarrado à venda ou ao serviço.
    await page.click('#folha .campo:has-text("Referente a") .selecao');
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      const it = [...document.querySelectorAll('#escolhaLista .escolha-item')]
        .find((n) => !/Sem registro/.test(n.textContent));
      if (it) it.click();
    });
    await page.waitForTimeout(800);
    const campo = page.locator('#folha .campo:has-text("Valor recebido") input, #folha input.valor-grande').first();
    await campo.click();
    for (let i = 0; i < 14; i++) await page.keyboard.press('Backspace');
    await page.keyboard.type(valor);
    await page.waitForTimeout(400);
    await page.click('#folha .btn-ouro:has-text("Salvar")');
    await page.waitForTimeout(2000);
    // volta para a lista
    for (let i = 0; i < 4 && !(await page.locator('#telaInicio .linha-alvo').count()); i++) {
      await page.goBack(); await page.waitForTimeout(800);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
  }

  await page.click('#navegacao button:has-text("Início")');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#telaInicio button')]
      .find((n) => /Visão geral/.test(n.textContent));
    if (b) b.click();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('#telaInicio button')]
      .find((n) => n.textContent.trim() === 'Receitas');
    if (b) b.click();
  });
  await page.waitForTimeout(1200);

  const caixa = await page.evaluate(() => {
    const n = [...document.querySelectorAll('#telaInicio .cartao')]
      .find((x) => /Distribuição de receitas/.test(x.textContent));
    if (!n) return null;
    n.scrollIntoView({ block: 'center' });
    const r = n.getBoundingClientRect();
    return { x: Math.max(r.x - 10, 0), y: Math.max(r.y - 10, 0),
             width: Math.min(r.width + 20, 390), height: Math.min(r.height + 20, 844) };
  });
  await page.waitForTimeout(400);
  return caixa;
}
