---
name: melhorar
description: Trabalha sozinho no Finanz preparando propostas de melhoria, sem lançar nada. Cada passada escolhe uma coisa, implementa, testa, tira print do antes e do depois e guarda para o Vitor decidir depois. Use com /loop para rodar em segundo plano.
---

# Melhorar o Finanz sem lançar

O Vitor às vezes está trabalhando e não pode acompanhar. Esta habilidade
existe para adiantar trabalho nessa janela: **preparar** melhorias prontas
para ele escolher depois, uma a uma, olhando print do antes e do depois.

Nada do que sai daqui vai para o ar. Quem lança é ele, pela `/lancar`.

## O objetivo

Deixar o app mais premium, sem bugs, com funcionalidade onde falta, e
arrumar o que estiver ruim, feio ou sem sentido. Nessa ordem de prioridade:

1. **Bug que dá número errado.** Dinheiro exibido errado é o pior defeito
   possível num app de finanças. Vem antes de tudo.
2. **Bug que trava ou perde dado.**
3. **Coisa que não faz sentido ter** — tirar é melhoria.
4. **Falta de funcionalidade** onde o caminho fica pela metade.
5. **Acabamento**: alinhamento, contraste, texto confuso, toque que demora.

## Uma passada

Cada passada entrega **uma** proposta. Uma só. Se não couber em um print de
antes e um de depois, é grande demais — quebre em partes e faça a primeira.

1. **Escolher.** Leia `propostas/ideias.md` e pegue o item mais alto que
   ainda não virou proposta. Sem nada lá, audite o app e ache: leia um
   trecho do `index.html` que ainda não foi revisado, rode o app no
   simulador, procure número errado, texto que mente, botão que não leva a
   lugar nenhum, estado vazio sem saída.
2. **Ramo.** `git checkout -b proposta/NNNN-apelido` a partir do ramo de
   trabalho atual. NNNN é o próximo número livre em `propostas/`.
   O ramo carrega **só a mudança do app**. Os prints, o `leia.md` e o
   cenário ficam no ramo de trabalho — senão o índice só enxerga a proposta
   do ramo em que você está e a página de revisão nasce pela metade.
3. **Implementar.** Pequeno. Comentário em português explicando o porquê,
   no tom do arquivo.
4. **Testar.** `node testes/rodar.mjs` inteiro. **Proposta vermelha não
   vira proposta**: conserte ou jogue fora o ramo. Se mexeu em
   comportamento coberto por teste, ajuste o teste — e diga isso no
   `leia.md`.
5. **Print do antes e do depois.** Escreva um cenário em
   `propostas/cenarios/NNNN.mjs` e rode:
   `node propostas/print.mjs NNNN` — ele tira o antes com o app do ramo de
   trabalho e o depois com o app da proposta, no mesmo cenário, mesma tela.
6. **Escrever.** `propostas/NNNN-apelido/leia.md` com: o que está errado
   hoje, o que a proposta faz, o que ela **não** faz, o risco, e os
   arquivos tocados. Sem enfeite: ele vai ler no celular.
7. **Publicar para revisão.** Volte ao ramo de trabalho, traga a pasta da
   proposta e o cenário para ele, rode `./montar-propostas.sh` e empurre o
   ramo da proposta. Depois empurre **só a pasta `propostas/`** para o
   `gh-pages`, para ele abrir em `finanz/propostas/` pelo celular.
8. **Mandar no chat.** `python3 propostas/juntar.py NNNN` faz o `par.png`
   com o antes e o depois lado a lado. Mande com `SendUserFile` e escreva
   junto, em cinco linhas no máximo: o que está errado hoje, o que a
   proposta faz, e o risco. Uma mensagem por proposta, na hora que ela
   fica pronta — não junte várias no fim.
9. **Anotar.** Marque o item em `propostas/ideias.md` como proposto.

## Nunca

- **Nunca** empurrar mudança do app para `main` ou `gh-pages`. Só
  `propostas/**` pode ir ao `gh-pages`, e só isso.
- **Nunca** mexer em `var VERSAO`, em `sw.js` ou na lista `NOVIDADES` numa
  proposta. Versão é coisa de lançamento.
- **Nunca** juntar duas melhorias no mesmo ramo.
- **Nunca** desligar, pular ou afrouxar um teste para ficar verde.
- **Nunca** desligar RLS, nem mexer em chave, senha ou segredo.
- **Nunca** inventar dado na tela. Dado que falta se chama dado que falta.
- **Nunca** lançar. Nem quando a proposta parecer óbvia.

## Quando parar

- A suíte falha por motivo que não é seu e você não consegue explicar.
- Acabaram as ideias e uma auditoria inteira não achou nada — diga isso e
  pare, em vez de inventar mudança para ter o que entregar.

Fila cheia não é motivo para parar: o Vitor pediu sem teto. Pode haver
dezenas esperando decisão. Só tome dois cuidados quando a fila crescer:
recorte os prints apertados (a pasta inteira de uma proposta deve ficar
abaixo de 400 KB) e, antes de propor, confira se o assunto já não está na
fila com outro número.

## Parou, ficou parado

Quando a volta terminar por qualquer motivo — limite da conta, erro, fila
cheia, `/loop stop` —, **não se rearme sozinho**. Nada de agendar a próxima
passada, nada de "continuo de onde parei" na mensagem seguinte. O trabalho
fica onde está, guardado nos ramos e na pasta `propostas/`, e só volta a
andar quando o Vitor mandar continuar. Ele foi explícito sobre isso.

Ao parar, diga em uma linha: quantas propostas ficaram prontas, quais
números, e o que seria o próximo item da fila.
