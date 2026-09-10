#!/bin/bash
# Guarda uma cópia inteira e funcionando da versão atual em versoes/<n>/.
#
# Serve para uma coisa só: se uma atualização estragar alguma coisa, dá para
# abrir a versão anterior no celular na hora, sem mexer em git nem esperar
# ninguém. Guardo as três últimas; mais que isso só engorda o repositório.
set -u
cd "$(dirname "$0")" || exit 1

VERSAO=$(grep -oE "var VERSAO = '[^']+'" index.html | head -1 | cut -d"'" -f2)
[ -n "$VERSAO" ] || { echo "não achei a versão no index.html"; exit 1; }

DESTINO="versoes/$VERSAO"
if [ -d "$DESTINO" ]; then echo "a versão $VERSAO já está guardada"; exit 0; fi

mkdir -p "$DESTINO"
# Tudo o que o app precisa para rodar sozinho a partir dessa pasta.
cp index.html sw.js manifest.webmanifest config.js icon.svg "$DESTINO/" 2>/dev/null
cp icon-*.png *.webp "$DESTINO/" 2>/dev/null
echo "guardada a versão $VERSAO em $DESTINO"

# Só as três últimas ficam. Ordena por número de versão, não por texto.
GUARDADAS=$(ls -1 versoes 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -t. -k1,1n -k2,2n -k3,3n)
TOTAL=$(echo "$GUARDADAS" | grep -c .)
if [ "$TOTAL" -gt 3 ]; then
  echo "$GUARDADAS" | head -n $((TOTAL - 3)) | while read -r velha; do
    rm -rf "versoes/$velha"
    echo "tirei a versão antiga $velha"
  done
fi

# A página que lista o que está guardado.
{
  echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1">'
  echo '<title>Versões do Finanz</title><style>'
  echo 'body{background:#050506;color:#F4F0E7;font:16px/1.55 system-ui,sans-serif;margin:0;padding:28px 20px 40px}'
  echo 'h1{font-size:20px;letter-spacing:.14em;color:#E9B44C;font-weight:600;margin:0 0 4px}'
  echo 'p{color:#A79C89;font-size:14px;max-width:34em}'
  echo 'a.v{display:flex;justify-content:space-between;align-items:center;gap:12px;'
  echo 'border:1px solid rgba(198,158,78,.26);border-radius:14px;padding:15px 16px;'
  echo 'margin-top:10px;color:#F4F0E7;text-decoration:none}'
  echo 'a.v small{color:#7C7362;font-size:12px}'
  echo '.agora{border-color:#E9B44C}'
  echo '</style></head><body>'
  echo '<h1>F I N A N Z</h1>'
  echo '<p>Versões guardadas. A de cima é a que está no ar. Se uma atualização'
  echo 'estragar alguma coisa, abra a de baixo — seus dados continuam os mesmos,'
  echo 'porque ficam guardados no aparelho e não dentro da versão.</p>'
  echo "<a class=\"v agora\" href=\"../\"><span>Versão $VERSAO</span><small>no ar agora</small></a>"
  ls -1 versoes | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -t. -k1,1nr -k2,2nr -k3,3nr | while read -r v; do
    [ "$v" = "$VERSAO" ] && continue
    echo "<a class=\"v\" href=\"$v/\"><span>Versão $v</span><small>guardada</small></a>"
  done
  echo '<p style="margin-top:26px">Abrindo uma versão antiga, o atalho da tela inicial'
  echo 'continua apontando para a de cima. Para voltar de vez, é só usar o endereço'
  echo 'normal do app.</p>'
  echo '</body></html>'
} > versoes/index.html
echo "versoes/index.html atualizado"
