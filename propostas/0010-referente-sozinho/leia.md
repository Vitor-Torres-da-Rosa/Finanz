# O "Referente a" nascia vazio mesmo quando não havia o que escolher
Registrando o pagamento direto da ficha do cliente, o campo "Referente a"
vinha em "Sem registro específico" — mesmo quando o cliente tem um único
registro e não há o que escolher. Um toque a mais toda vez, e quem esquece
fica com o pagamento solto, sem saber a que venda ou serviço ele se refere.

O que a proposta faz: quando não há escolha, ele já vem apontado. Quando há,
continua vazio — o app não chuta, porque errar o registro bagunça a conta do
cliente.

Na folha de pagamento, "não há escolha" é o cliente ter um registro só.

Na folha de parcelamento a fila é outra: registro que já tem parcela
combinada saiu dela. Com "Celular" e "TV" os dois em aberto, o campo fica
vazio e quem escolhe é a pessoa. Depois de parcelar o Celular, sobra a TV
sozinha na fila — e aí ela já vem apontada.

Registros de acréscimo que o próprio app criou (do parcelamento) não contam
nas duas filas: eles existem por causa de outro registro, não são o que o
cliente comprou. Então um cliente com "TV" e "Acréscimo do parcelamento
em 4x" continua apontando para a TV.

O que ela NÃO faz: não mexe em valor, em parcela nem em pagamento já
gravado. É só o valor inicial de um campo.

Combina com a 0009 (a que faz venda entrar como Venda no caixa): aquela só
tem efeito quando o registro está apontado, e esta faz o apontamento
acontecer sozinho no caso mais comum. Aceitar as duas juntas fecha o
caminho; aceitar só uma funciona, cada uma pela metade.

Risco: baixo. Muda o valor padrão de um seletor. Teste novo t89 cobre as
três situações da folha de parcelamento.

Arquivos: index.html (abrirFolhaPagamento, abrirFolhaParcelamento),
testes/casos/t89.mjs.
