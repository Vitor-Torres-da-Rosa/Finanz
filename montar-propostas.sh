#!/bin/bash
# Refaz propostas/index.html a partir das pastas propostas/NNNN-apelido/.
#
# É a página que o Vitor abre no celular para decidir o que entra e o que
# não entra. Cada proposta aparece com o print do antes, o do depois e a
# explicação — nada é lançado antes de ele dizer o número.
set -u
cd "$(dirname "$0")" || exit 1

SAIDA=propostas/index.html
PASTAS=$(ls -1d propostas/[0-9][0-9][0-9][0-9]-* 2>/dev/null | sort)

{
cat <<'CABECA'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Finanz · propostas</title>
<style>
  :root { --fundo:#0A0A0C; --cartao:#141118; --texto:#F4F0E7; --suave:#C9C1B2;
          --fraco:#7C7362; --ouro:#E9B44C; --borda:rgba(233,180,76,.18);
          --verde:#3DDC84; --vermelho:#F87171; }
  * { box-sizing:border-box; }
  body { margin:0; padding:20px 16px 60px; background:var(--fundo); color:var(--texto);
         font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  h1 { font-size:20px; margin:0 0 4px; letter-spacing:.04em; }
  .sub { color:var(--fraco); font-size:13px; margin:0 0 22px; }
  .vazio { color:var(--suave); background:var(--cartao); border:1px solid var(--borda);
           border-radius:16px; padding:22px; text-align:center; }
  .p { background:var(--cartao); border:1px solid var(--borda); border-radius:16px;
       padding:16px; margin-bottom:18px; }
  .n { color:var(--ouro); font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
  .t { font-size:17px; font-weight:600; margin:2px 0 10px; }
  .par { display:flex; gap:10px; margin:12px 0 6px; }
  .par figure { flex:1 1 0; margin:0; min-width:0; }
  .par figcaption { font-size:11px; color:var(--fraco); text-transform:uppercase;
                    letter-spacing:.08em; margin-bottom:5px; }
  .par img { width:100%; border-radius:10px; border:1px solid var(--borda); display:block; }
  .leia { font-size:13.5px; color:var(--suave); white-space:pre-wrap; margin-top:10px; }
  .como { margin-top:26px; border-top:1px solid var(--borda); padding-top:16px;
          color:var(--fraco); font-size:13px; }
  a { color:var(--ouro); }
</style>
</head>
<body>
<h1>FINANZ · PROPOSTAS</h1>
CABECA

if [ -z "$PASTAS" ]; then
  echo '<p class="sub">Nada esperando decisão.</p>'
  echo '<div class="vazio">Sem propostas na fila. Tudo o que foi preparado já foi decidido.</div>'
else
  QTD=$(echo "$PASTAS" | grep -c .)
  echo "<p class=\"sub\">$QTD esperando a sua decisão · nada disso está no ar.</p>"
  for d in $PASTAS; do
    NUM=$(basename "$d" | cut -d- -f1)
    APELIDO=$(basename "$d" | cut -d- -f2- | tr '-' ' ')
    TITULO=$(head -1 "$d/leia.md" 2>/dev/null | sed 's/^#* *//')
    [ -n "$TITULO" ] || TITULO="$APELIDO"
    echo '<div class="p">'
    echo "  <div class=\"n\">Proposta $NUM</div>"
    echo "  <div class=\"t\">$TITULO</div>"
    if [ -f "$d/antes.png" ] && [ -f "$d/depois.png" ]; then
      echo '  <div class="par">'
      echo "    <figure><figcaption>Antes</figcaption><img src=\"$NUM-$(basename "$d" | cut -d- -f2-)/antes.png\" alt=\"antes\"></figure>"
      echo "    <figure><figcaption>Depois</figcaption><img src=\"$NUM-$(basename "$d" | cut -d- -f2-)/depois.png\" alt=\"depois\"></figure>"
      echo '  </div>'
    fi
    echo '  <div class="leia">'
    tail -n +2 "$d/leia.md" 2>/dev/null | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g'
    echo '  </div>'
    echo '</div>'
  done
fi

cat <<'RODAPE'
<div class="como">
  Para aceitar, diga os números na conversa: <b>&ldquo;aceito a 1 e a 3, recusa a 2&rdquo;</b>.
  As aceitas viram uma versão nova; as recusadas são apagadas junto com o código delas.
</div>
</body>
</html>
RODAPE
} > "$SAIDA"

echo "$SAIDA refeito"
