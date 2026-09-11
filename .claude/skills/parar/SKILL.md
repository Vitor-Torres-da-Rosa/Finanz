---
name: parar
description: Desliga o trabalho autônomo do Finanz. Encerra o loop, apaga o despertador do /sempre e deixa tudo parado até o Vitor mandar de novo.
---

# Parar

1. Encerre o loop em curso (`ScheduleWakeup` com `stop: true`, ou pare a
   passada atual se ela estiver no meio de algo que possa ficar quebrado —
   termine o passo e não comece outro).
2. Liste as Routines com `list_triggers` e apague com `delete_trigger` a
   que foi criada pelo `/sempre`.
3. Não mexa nas propostas já prontas: elas continuam esperando decisão nos
   ramos e em `propostas/`.

Relate: que parou, quantas propostas ficaram na fila, quais números, e qual
seria o próximo item de `propostas/ideias.md`.

Depois disso, fique parado. Nada de rearmar, nada de "só mais uma".
