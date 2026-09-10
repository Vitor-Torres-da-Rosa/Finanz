# Voltar uma versão

Toda atualização deixa uma cópia inteira e funcionando da versão anterior
guardada dentro do próprio site. Se algo quebrar, dá para voltar na hora,
pelo celular, sem git e sem esperar ninguém.

## Como voltar

Abra no navegador:

    https://vitor-torres-da-rosa.github.io/finanz/versoes/

Aparece a lista: a de cima é a que está no ar, as de baixo são as
guardadas. Toque numa e o app abre naquela versão.

**Seus dados continuam os mesmos.** Eles ficam guardados no aparelho e na
nuvem, não dentro da versão — trocar de versão é trocar o programa, não os
dados.

Para voltar à versão nova, é só usar o endereço normal do app.

## O que é guardado

As cinco últimas versões, cada uma completa: `index.html`, o service worker,
o manifesto, os ícones e as imagens. Mais que cinco só engorda o repositório
sem ajudar.

Cada versão também vira uma etiqueta no git aqui do lado de cá. Elas não
sobem para o GitHub — o acesso desta sessão só deixa mandar branch, não
etiqueta —, mas o histórico inteiro continua no repositório, um commit por
versão, para quem quiser ir mais fundo.

## Como isso é feito

Antes de subir uma versão nova:

    ./guardar-versao.sh

Ele copia a versão que está no `index.html` para `versoes/<numero>/`,
apaga as que passaram de cinco e refaz a página da lista.
