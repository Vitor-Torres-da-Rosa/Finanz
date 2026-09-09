import io, re
partes = []
for f in ['leitor.js','parser.js','doc.js','texto.js','xlsx.js','extrato.js']:
    linhas = io.open(f, encoding='utf-8').read().split('\n')
    i = next(k for k,l in enumerate(linhas) if l.strip() == '(function (raiz) {')
    cabecalho = linhas[:i]; corpo = linhas[i+1:]
    j = max(k for k,l in enumerate(corpo) if l.startswith('})(typeof globalThis'))
    corpo = corpo[:j]
    fora, pulando = [], False
    for l in corpo:
        if not pulando and re.match(r'\s*raiz\.\w+ = \{', l): pulando = True
        if pulando:
            if l.rstrip().endswith('};'): pulando = False
            continue
        fora.append(l)
    s = '\n'.join(cabecalho + fora).replace("  'use strict';\n", '')
    for velho in ["  var P = raiz.CaixaPdf, Q = raiz.CaixaPdfParser, D = raiz.CaixaPdfDoc;\n",
                  "  var P = raiz.CaixaPdf, Q = raiz.CaixaPdfParser;\n",
                  "  var P = raiz.CaixaPdf;\n",
                  "  var ehDic = D.ehDic, ehNome = D.ehNome, ehBytes = D.ehBytes;\n"]:
        s = s.replace(velho, '')
    s = s.replace("  var subtle = (raiz.crypto && raiz.crypto.subtle) || null;",
                  "  var subtle = (typeof crypto !== 'undefined' && crypto.subtle) || null;")
    for pref in ('P.', 'Q.', 'D.'):
        s = re.sub(r'(?<![\w.])' + re.escape(pref), '', s)
    assert 'raiz.' not in s, f
    partes.append(s.rstrip() + '\n')
corpo = '\n'.join(partes)
cabeca = """  // =========================================================================
  // Leitor de extrato e de fatura. Abre PDF (inclusive com senha), planilha
  // xlsx, OFX e CSV, sem depender de nenhuma biblioteca de fora. Só lê.
  // =========================================================================
  var Extrato = (function () {
"""
rodape = """
    return { lerPdf: extrair, lerLinhas: lerLinhas, lerOfx: lerOfx, lerCsv: lerCsv,
             lerTabela: lerTabela, lerXlsx: lerXlsx, categoriaDe: categoriaDe,
             acharBanco: acharBanco, bancoPorChave: bancoPorChave, listaDeBancos: listaDeBancos,
             pareceFatura: pareceFatura, textoDeBytes: textoDeBytes };
  })();
"""
corpo = '\n'.join(('  ' + l) if l.strip() else l for l in corpo.split('\n'))
io.open('bloco.js','w',encoding='utf-8').write(cabeca + corpo + rodape)
print('bloco:', (cabeca+corpo+rodape).count('\n'), 'linhas')
