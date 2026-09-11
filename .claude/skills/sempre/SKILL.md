---
name: sempre
description: Liga o trabalho autônomo sem fim no Finanz. Queima a janela de limite inteira, volta no minuto seguinte ao reset, insiste minuto a minuto até conseguir, e segue assim por meses até acabarem os limites ou o Vitor mandar parar com /parar.
---

# Trabalhar sempre

O Vitor autorizou: trabalhar sozinho preparando propostas, sem teto de
quantidade, voltando por conta própria assim que o limite resetar, por
meses, até os limites acabarem de vez ou ele mandar parar.

Ligar isso é ato dele. Só execute quando ele digitar `/sempre`.

## Duas peças

**A queima.** `/loop /melhorar` sem intervalo: uma passada emenda na outra
até o limite bater. É o que aproveita a janela inteira.

**O despertador.** Não é de hora em hora: o horário do reset é um dado que
dá para ler, então use o dado.

## O despertador, em detalhe

1. `get_session` (sem `session_id`) devolve, em
   `external_metadata.rate_limit_info`, o campo `resetsAt` — o instante do
   reset, em epoch. Leia de lá, sempre. Nunca estime de cabeça.
2. Agende uma **escada** de despertares com `send_later`, todos nesta
   sessão, em **reset + 1, 2, 4, 8, 15, 30 e 60 minutos**. Nomeie cada um
   `finanz-retomar-NN`, para dar para achar e apagar depois.
3. A escada existe porque o primeiro tiro pode falhar: se a conta ainda
   estiver bloqueada no minuto seguinte ao reset, aquele despertar não
   produz turno nenhum e ninguém sobra para reagendar. Com a escada, o
   próximo degrau tenta de novo sozinho.
4. Mensagem de cada despertar:

   > Retome o `/loop /melhorar` de onde parou, mandando cada proposta no
   > chat. Se a conta ainda estiver no limite, agende a escada de novo a
   > partir do `resetsAt` atual e não avise nada. O Vitor autorizou com
   > `/sempre`; não peça confirmação.

## Ao acordar

1. Se o trabalho **já retomou** num degrau anterior, apague os degraus que
   sobraram (`list_triggers`, `delete_trigger` nos `finanz-retomar-*`) e
   não faça mais nada. Despertar repetido não pode virar turno repetido.
2. Se ainda está bloqueado, leia o `resetsAt` novo e monte a escada de
   novo. Sem avisar: ele não quer ser acordado por nada.
3. Se destravou, apague os degraus restantes e volte a queimar.

## Depois de montar

Diga, em quatro linhas: que está ligado, a que horas é o próximo reset,
que cada proposta chega no chat, e que `/parar` desliga tudo. Depois comece
a trabalhar — não fique esperando.

## Diga também, uma vez só

- Isso consome o limite da conta continuamente, inclusive de madrugada.
- O despertador está preso a esta conversa. Se esta sessão for arquivada, o
  ciclo morre junto e ele religa com `/sempre` numa conversa nova.
- Nada é lançado. A fila só cresce até ele decidir pelos números.

## Nunca

- Nunca lance nada por conta própria, por mais propostas que se acumulem.
- Nunca recrie o despertador depois de um `/parar`. Parar é parar.
- Nunca troque a escada por uma Routine que abre sessão nova: as propostas
  têm que chegar no chat dele.
- Nunca deixe degrau velho para trás: escada de ontem acordando hoje é
  turno do nada.
