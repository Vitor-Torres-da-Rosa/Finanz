# Fila de ideias

O que a `/melhorar` pega quando roda sozinha, de cima para baixo. Item que
virou proposta ganha `[proposto NNNN]`. Recusado ganha `[recusado]` com o
motivo, para não voltar.

## Achado na auditoria

Varri as cinco telas com dados de borda (valor zero, meta sem alvo, ativo
sem aporte, conta sem lançamento, orçamento zerado) procurando NaN,
Infinity, undefined e percentual absurdo: nada. O app aguenta bem esses
casos, e não há erro de console.

- [proposto 0007] O relatório de IR afirmava "Posição em 31/12" com o ano
  ainda correndo, mostrando o valor de hoje sob o rótulo de dezembro.
- [proposto 0009] O pagamento de cliente lançado no caixa entrava sempre na
  categoria "Serviços", mesmo vindo de uma venda.
- [proposto 0010] Registrando o pagamento direto da ficha, o campo
  "Referente a" vem vazio
  mesmo quando o cliente tem um único registro em aberto. Podia já vir
  apontado — amarra o pagamento ao registro e faz a categoria sair certa
  sozinha. Mexe em mais coisa que a 0009, então merece proposta própria.
- [proposto 0008] Os juros de atraso apareciam na parcela e na mensagem do
  WhatsApp, mas não no "Falta" da ficha nem no resumo geral.
- A ordenação do histórico de ativos depende do relógio do aparelho:
  valorAtivoEm percorre o array na ordem em que está e pega o último item
  com data <= o corte. O array é ordenado ao carregar (backup e servidor) e
  os acréscimos usam sempre a data de hoje, então na prática fica ordenado.
  Só quebra se o relógio do celular estiver atrasado. Baixíssima
  prioridade, mas fica anotado.

## Bug que dá número errado

- [proposto 0002] A dívida de cartões só cresce. `dividaDeCartoes` soma toda saída lançada
  no cartão e nunca desconta o pagamento da fatura, porque a importação
  registra esse pagamento como saída da conta corrente e não como
  transferência para o cartão. Quem usa cartão vê uma dívida que não para
  de subir.
- [proposto 0003] Em Transações o total do dia soma a fatura paga, mas o total de "Saídas"
  do período não. As duas contas estão certas cada uma no seu critério, mas
  na mesma tela isso confunde: falta dizer qual é qual.

## Falta funcionalidade

- Não dá para marcar uma parcela como perdoada ou renegociada: ou ela é
  paga, ou fica devendo para sempre. **Não cabe numa proposta**: precisa de
  coluna nova no banco e de migração que o Vitor tem que rodar à mão, e
  proposta é coisa que ele aceita só pelo número. Assunto para uma conversa
  com ele, não para uma passada sozinho.
- [proposto 0004] Orçamento por categoria não avisa quando estoura — só
  mostra a barra.
- [proposto 0005] O relatório de IR existe, mas não separa o que é
  dedutível.

## Acabamento

- [proposto 0001] O lançamento que não conta como despesa é marcado com
  texto corrido no subtítulo; junto com o resto da linha vira uma frase só.
- [proposto 0006] No orçamento por categoria, a que estourou fica perdida
  na ordem alfabética; podia subir para o topo, como o cliente atrasado
  sobe na lista de clientes.

## Ideias que não existiam

Estas eu tinha escrito de memória e fui conferir no código: são falsas.
Fica o registro para eu não voltar a propor, e a lição de semear a fila
com o que foi visto, não com o que foi lembrado.

- [falsa] "Estado vazio de Investimentos não tem botão." Tem: o botão
  "Cadastrar primeiro ativo" já está lá.
- [falsa] "Nome longo corta sem reticência nos cartões de conta." A regra
  .linha-titulo já tem text-overflow: ellipsis.
