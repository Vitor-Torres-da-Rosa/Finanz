---
name: sempre
description: Liga o trabalho autônomo sem fim no Finanz. Trabalha até o limite da conta acabar, volta sozinho quando o limite reseta, e segue assim por meses até acabarem os limites ou o Vitor mandar parar com /parar.
---

# Trabalhar sempre

O Vitor autorizou: trabalhar sozinho preparando propostas, sem teto de
quantidade, voltando por conta própria depois de cada reset de limite, por
meses, até os limites acabarem de vez ou ele mandar parar.

Ligar isso é ato dele. Só execute quando ele digitar `/sempre`.

## O que montar

São duas peças, e as duas são necessárias:

1. **A queima** — `/loop /melhorar` sem intervalo. É o que aproveita a
   janela: uma passada emenda na outra até o limite bater. Se ele não
   pediu uma cadência específica, é assim.

2. **O despertador** — uma Routine de hora em hora, presa a esta sessão,
   com este texto:

   > Se a conta ainda estiver no limite, não faça nada e não avise ninguém.
   > Se já der para trabalhar, retome `/loop /melhorar` do ponto em que
   > parou, mandando cada proposta no chat conforme ficarem prontas. O
   > Vitor autorizou isso com `/sempre`; não peça confirmação de novo.

   Crie com `create_trigger`, cron `0 * * * *`, `initiation: human_request`.
   Sem `create_new_session_on_fire`: tem que cair **nesta** sessão, senão
   as propostas param de chegar no chat dele.

Quando a queima morre por limite, o despertador toca na hora seguinte. Se
ainda estiver bloqueado, ele não faz nada e tenta de novo na próxima. Na
primeira hora depois do reset, o trabalho volta sozinho.

## Depois de montar

Diga, em quatro linhas: que está ligado, o id da Routine, que cada proposta
chega no chat, e que `/parar` desliga tudo. Depois comece a trabalhar — não
fique esperando.

## Diga também, uma vez só

Ele merece saber disto antes de sair:

- Isso consome o limite da conta continuamente, inclusive quando ele está
  dormindo ou trabalhando. É o que ele pediu, mas é bom estar dito.
- O despertador está preso a esta conversa. Se esta sessão for arquivada, o
  ciclo morre junto e ele precisa religar com `/sempre` numa conversa nova.
- Nada é lançado. A fila só cresce até ele decidir pelos números.

## Nunca

- Nunca lance nada por conta própria, por mais propostas que se acumulem.
- Nunca recrie o despertador depois de um `/parar`. Parar é parar.
- Nunca troque a Routine por uma que abre sessão nova: as propostas têm que
  chegar no chat dele.
