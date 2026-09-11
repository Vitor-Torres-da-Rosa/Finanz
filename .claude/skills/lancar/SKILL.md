---
name: lancar
description: Lança as propostas que o Vitor aceitou e joga fora as recusadas. Junta os ramos escolhidos, sobe a versão, roda a suíte, guarda o backup e empurra para as três branches.
---

# Lançar o que foi aceito

O Vitor diz os números que aceita (ex.: "aceito a 1 e a 4, recusa a 2").
Só isso é autorização para lançar. Na dúvida sobre um número, pergunte.

## Aceitas

1. Volte para o ramo de trabalho `claude/receitas-despesas-app-q8nvq0`.
2. Junte cada ramo aceito, na ordem dos números:
   `git merge --no-ff proposta/NNNN-apelido`. Conflito entre duas
   propostas: resolva mantendo as duas intenções e diga o que fez.
3. Rode `node testes/rodar.mjs` inteiro. Vermelho não sobe.
4. `./guardar-versao.sh` para guardar a versão que está no ar.
5. Suba `var VERSAO` no `index.html` e a primeira linha do `sw.js`.
   Menor para acabamento, média para funcionalidade nova.
6. Escreva a entrada em `NOVIDADES` juntando as propostas aceitas, no tom
   das outras: o que estava errado, o que mudou, com número de verdade.
7. Apague as pastas das propostas aceitas de `propostas/` e refaça o
   índice com `./montar-propostas.sh`.
8. Commit e `git push -u origin` para o ramo de trabalho, `main` e
   `gh-pages`.
9. Relate: versão, imagem e o que mudou.

## Recusadas

Apague o ramo (`git branch -D` e `git push origin --delete`) e a pasta em
`propostas/`. Anote em `propostas/ideias.md` que foi recusada e por quê, se
ele disse — para não voltar a propor a mesma coisa.

## Nunca

- Nunca lançar proposta que ele não citou.
- Nunca lançar com a suíte vermelha.
- Nunca lançar sem ter guardado a versão anterior.
