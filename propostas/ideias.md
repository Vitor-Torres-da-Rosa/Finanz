# Fila de ideias

O que a `/melhorar` pega quando roda sozinha, de cima para baixo. Item que
virou proposta ganha `[proposto NNNN]`. Recusado ganha `[recusado]` com o
motivo, para não voltar.

## Bug que dá número errado

- A dívida de cartões só cresce. `dividaDeCartoes` soma toda saída lançada
  no cartão e nunca desconta o pagamento da fatura, porque a importação
  registra esse pagamento como saída da conta corrente e não como
  transferência para o cartão. Quem usa cartão vê uma dívida que não para
  de subir.
- Em Transações o total do dia soma a fatura paga, mas o total de "Saídas"
  do período não. As duas contas estão certas cada uma no seu critério, mas
  na mesma tela isso confunde: falta dizer qual é qual.

## Falta funcionalidade

- Não dá para marcar uma parcela como perdoada ou renegociada: ou ela é
  paga, ou fica devendo para sempre.
- Orçamento por categoria não avisa quando estoura — só mostra a barra.
- O relatório de IR existe, mas não separa o que é dedutível.

## Acabamento

- O lançamento que não conta como despesa é marcado com texto corrido no
  subtítulo; junto com o resto da linha vira uma frase só.
- Estado vazio de Investimentos não tem botão para o primeiro passo.
- Nos cartões de conta, o nome longo corta sem reticência.
