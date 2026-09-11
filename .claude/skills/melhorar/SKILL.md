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
7. **Publicar para revisão.** `./montar-propostas.sh` refaz o índice.
   Depois empurre o ramo da proposta e **só a pasta `propostas/`** para o
   `gh-pages`, para ele abrir em `finanz/propostas/` pelo celular.
8. **Anotar.** Marque o item em `propostas/ideias.md` como proposto.

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
- Já há 10 propostas esperando decisão: encheu a fila, pare de produzir.
