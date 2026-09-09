(function (raiz) {
  'use strict';
  var P = raiz.CaixaPdf, Q = raiz.CaixaPdfParser, D = raiz.CaixaPdfDoc;
  var ehDic = D.ehDic, ehNome = D.ehNome, ehBytes = D.ehBytes;

  // 0x80-0x9F do WinAnsi, que é onde ele foge do latin-1.
  var WINANSI = { 128:0x20AC,130:0x201A,131:0x0192,132:0x201E,133:0x2026,134:0x2020,135:0x2021,
    136:0x02C6,137:0x2030,138:0x0160,139:0x2039,140:0x0152,142:0x017D,145:0x2018,146:0x2019,
    147:0x201C,148:0x201D,149:0x2022,150:0x2013,151:0x2014,152:0x02DC,153:0x2122,154:0x0161,
    155:0x203A,156:0x0153,158:0x017E,159:0x0178 };

  // Nomes de glifo que aparecem em /Differences num extrato.
  var GLIFOS = { space:32, exclam:33, quotedbl:34, numbersign:35, dollar:36, percent:37, ampersand:38,
    quotesingle:39, parenleft:40, parenright:41, asterisk:42, plus:43, comma:44, hyphen:45, period:46,
    slash:47, zero:48, one:49, two:50, three:51, four:52, five:53, six:54, seven:55, eight:56, nine:57,
    colon:58, semicolon:59, less:60, equal:61, greater:62, question:63, at:64, bracketleft:91,
    backslash:92, bracketright:93, asciicircum:94, underscore:95, grave:96, braceleft:123, bar:124,
    braceright:125, asciitilde:126, quotedblleft:0x201C, quotedblright:0x201D, quoteleft:0x2018,
    quoteright:0x2019, endash:0x2013, emdash:0x2014, bullet:0x2022, Euro:0x20AC, degree:0xB0,
    ccedilla:0xE7, Ccedilla:0xC7, aacute:0xE1, eacute:0xE9, iacute:0xED, oacute:0xF3, uacute:0xFA,
    atilde:0xE3, otilde:0xF5, acircumflex:0xE2, ecircumflex:0xEA, ocircumflex:0xF4, agrave:0xE0,
    Aacute:0xC1, Eacute:0xC9, Iacute:0xCD, Oacute:0xD3, Uacute:0xDA, Atilde:0xC3, Otilde:0xD5,
    Acircumflex:0xC2, Ecircumflex:0xCA, Ocircumflex:0xD4, Agrave:0xC0, ordfeminine:0xAA,
    ordmasculine:0xBA, sterling:0xA3, yen:0xA5, section:0xA7, paragraph:0xB6 };

  function letra(cod) {
    if (cod == null || cod < 0) return '';
    try { return String.fromCodePoint(cod); } catch (e) { return ''; }
  }

  // ---------- fontes ----------

  function lerToUnicode(txt) {
    var mapa = {}, m;
    var reChar = /beginbfchar([\s\S]*?)endbfchar/g;
    while ((m = reChar.exec(txt))) {
      var re1 = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g, p;
      while ((p = re1.exec(m[1]))) mapa[parseInt(p[1], 16)] = deHex(p[2]);
    }
    var reRange = /beginbfrange([\s\S]*?)endbfrange/g;
    while ((m = reRange.exec(txt))) {
      var corpo = m[1];
      var re2 = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]*)>|\[([\s\S]*?)\])/g, r;
      while ((r = re2.exec(corpo))) {
        var de = parseInt(r[1], 16), ate = parseInt(r[2], 16);
        if (ate - de > 65535) continue;
        if (r[4] != null) {
          var baseHex = r[4];
          for (var c = de; c <= ate; c++) {
            var passo = c - de;
            mapa[c] = deHexComPasso(baseHex, passo);
          }
        } else if (r[5] != null) {
          var itens = r[5].match(/<([0-9a-fA-F]*)>/g) || [];
          for (var k = 0; k < itens.length && de + k <= ate; k++) {
            mapa[de + k] = deHex(itens[k].replace(/[<>]/g, ''));
          }
        }
      }
    }
    // quantos bytes por código
    var bytes = 1;
    var cs = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(txt);
    if (cs) {
      var pri = /<([0-9a-fA-F]+)>/.exec(cs[1]);
      if (pri && pri[1].length >= 4) bytes = 2;
    }
    return { mapa: mapa, bytes: bytes };
  }

  function deHex(h) {
    if (!h) return '';
    var fora = '';
    for (var i = 0; i + 4 <= h.length; i += 4) {
      var v = parseInt(h.substr(i, 4), 16);
      if (v >= 0xD800 && v <= 0xDBFF && i + 8 <= h.length) {
        var baixo = parseInt(h.substr(i + 4, 4), 16);
        fora += String.fromCharCode(v, baixo);
        i += 4;
      } else fora += String.fromCharCode(v);
    }
    if (!fora && h.length >= 2) fora = String.fromCharCode(parseInt(h.substr(0, 2), 16));
    return fora;
  }

  function deHexComPasso(h, passo) {
    if (h.length <= 4) return String.fromCharCode((parseInt(h, 16) || 0) + passo);
    var cabeca = h.slice(0, h.length - 4);
    var cauda = parseInt(h.slice(-4), 16) + passo;
    return deHex(cabeca) + String.fromCharCode(cauda);
  }

  function lerFonte(doc, refFonte) {
    var d = doc.dic(refFonte);
    if (!d) return Promise.resolve({ bytes: 1, mapa: null, dif: null });

    var sub = doc.pegar(d.Subtype);
    var ehType0 = ehNome(sub) && sub.nome === 'Type0';
    var bytes = ehType0 ? 2 : 1;

    // /Differences do encoding
    var dif = null;
    var enc = doc.pegar(d.Encoding);
    if (enc && ehDic(enc)) {
      var lista = doc.pegar(enc.dic.Differences);
      if (Array.isArray(lista)) {
        dif = {};
        var atual = 0;
        lista.forEach(function (it) {
          var v = doc.pegar(it);
          if (typeof v === 'number') atual = v;
          else if (ehNome(v)) {
            var g = GLIFOS[v.nome];
            if (g == null) {
              var mu = /^uni([0-9A-Fa-f]{4})$/.exec(v.nome);
              if (mu) g = parseInt(mu[1], 16);
            }
            if (g == null && v.nome.length === 1) g = v.nome.charCodeAt(0);
            dif[atual] = g == null ? -1 : g;
            atual++;
          }
        });
      }
    } else if (ehNome(enc) && /Identity/.test(enc.nome)) bytes = 2;

    var tu = d.ToUnicode;
    if (!tu) return Promise.resolve({ bytes: bytes, mapa: null, dif: dif });
    var num = tu && typeof tu.ref === 'number' ? tu.ref : null;
    if (num == null) return Promise.resolve({ bytes: bytes, mapa: null, dif: dif });

    return doc.fluxo(num).then(function (dados) {
      var lido = lerToUnicode(P.textoDeBytes(dados));
      return { bytes: lido.bytes || bytes, mapa: lido.mapa, dif: dif };
    }).catch(function () { return { bytes: bytes, mapa: null, dif: dif }; });
  }

  function decodificar(fonte, bytes) {
    var fora = '';
    var passo = fonte.bytes === 2 ? 2 : 1;
    for (var i = 0; i < bytes.length; i += passo) {
      var cod = passo === 2 ? ((bytes[i] << 8) | (bytes[i + 1] || 0)) : bytes[i];
      if (fonte.mapa && fonte.mapa[cod] != null) { fora += fonte.mapa[cod]; continue; }
      if (fonte.dif && fonte.dif[cod] != null) { fora += letra(fonte.dif[cod]); continue; }
      if (passo === 2) { fora += letra(cod); continue; }
      fora += letra(WINANSI[cod] != null ? WINANSI[cod] : cod);
    }
    return fora;
  }

  // ---------- matrizes ----------

  function mult(a, b) {
    return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3],
            a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
            a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]];
  }

  // ---------- percorrer o conteúdo ----------

  function lerConteudo(doc, dados, fontes) {
    var txt = P.textoDeBytes(dados);
    var lex = new Q.Lex(txt, 0);
    var pilhaOp = [];
    var ctm = [1, 0, 0, 1, 0, 0], pilhaCtm = [];
    var tm = null, tlm = null;
    var fonte = { bytes: 1, mapa: null, dif: null }, tamanho = 12, avanco = 0, escalaH = 1, espacoPal = 0, espacoChar = 0;
    var pedacos = [];

    function posicao() {
      var m = mult(tm || [1,0,0,1,0,0], ctm);
      return { x: m[4], y: m[5], escala: Math.abs(m[3]) || Math.abs(m[0]) || 1 };
    }

    function mostrar(bytesTexto) {
      if (!tm) tm = [1,0,0,1,0,0];
      var s = decodificar(fonte, bytesTexto);
      if (!s) return;
      var p = posicao();
      pedacos.push({ x: p.x, y: p.y, t: s, tam: tamanho * (p.escala || 1) });
      // Avanço aproximado: serve só para saber que houve espaço entre colunas.
      var largura = s.length * tamanho * 0.5 * escalaH;
      tm = mult([1, 0, 0, 1, largura, 0], tm);
    }

    for (;;) {
      lex.pularBrancos();
      if (lex.i >= txt.length) break;
      var antes = lex.i;
      var v;
      try { v = lex.valor(); } catch (e) { break; }
      if (lex.i === antes) { lex.i++; continue; }
      if (v === undefined) continue;

      if (!(v && v.palavra)) { pilhaOp.push(v); if (pilhaOp.length > 64) pilhaOp.shift(); continue; }

      var op = v.palavra;
      var a = pilhaOp;

      if (op === 'q') { pilhaCtm.push(ctm.slice()); }
      else if (op === 'Q') { if (pilhaCtm.length) ctm = pilhaCtm.pop(); }
      else if (op === 'cm' && a.length >= 6) {
        var n6 = a.slice(-6).map(Number);
        if (n6.every(isFinite)) ctm = mult(n6, ctm);
      }
      else if (op === 'BT') { tm = [1,0,0,1,0,0]; tlm = tm.slice(); }
      else if (op === 'ET') { tm = null; }
      else if (op === 'Tf' && a.length >= 2) {
        var nf = a[a.length - 2];
        tamanho = Number(a[a.length - 1]) || 12;
        if (nf && nf.nome && fontes[nf.nome]) fonte = fontes[nf.nome];
      }
      else if (op === 'Td' && a.length >= 2) {
        tlm = mult([1,0,0,1, Number(a[a.length-2])||0, Number(a[a.length-1])||0], tlm || [1,0,0,1,0,0]);
        tm = tlm.slice();
      }
      else if (op === 'TD' && a.length >= 2) {
        avanco = -(Number(a[a.length-1]) || 0);
        tlm = mult([1,0,0,1, Number(a[a.length-2])||0, Number(a[a.length-1])||0], tlm || [1,0,0,1,0,0]);
        tm = tlm.slice();
      }
      else if (op === 'Tm' && a.length >= 6) {
        var m6 = a.slice(-6).map(Number);
        if (m6.every(isFinite)) { tlm = m6; tm = m6.slice(); }
      }
      else if (op === 'T*') {
        tlm = mult([1,0,0,1,0,-avanco], tlm || [1,0,0,1,0,0]);
        tm = tlm.slice();
      }
      else if (op === 'TL') { avanco = Number(a[a.length-1]) || 0; }
      else if (op === 'Tz') { escalaH = (Number(a[a.length-1]) || 100) / 100; }
      else if (op === 'Tc') { espacoChar = Number(a[a.length-1]) || 0; }
      else if (op === 'Tw') { espacoPal = Number(a[a.length-1]) || 0; }
      else if (op === 'Tj' && a.length) {
        var u = a[a.length-1];
        if (u && u.bytes) mostrar(u.bytes);
      }
      else if ((op === "'" || op === '"') && a.length) {
        tlm = mult([1,0,0,1,0,-avanco], tlm || [1,0,0,1,0,0]);
        tm = tlm.slice();
        var u2 = a[a.length-1];
        if (u2 && u2.bytes) mostrar(u2.bytes);
      }
      else if (op === 'TJ' && a.length) {
        var arr = a[a.length-1];
        if (Array.isArray(arr)) {
          arr.forEach(function (it) {
            if (it && it.bytes) mostrar(it.bytes);
            else if (typeof it === 'number') {
              var d = -it / 1000 * tamanho * escalaH;
              if (tm) tm = mult([1,0,0,1,d,0], tm);
              // Um recuo grande entre pedaços é espaço de verdade.
              if (it < -180 && pedacos.length) pedacos[pedacos.length-1].t += ' ';
            }
          });
        }
      }
      pilhaOp = [];
    }
    return pedacos;
  }

  // Junta os pedaços em linhas, pela altura, e ordena pela horizontal.
  function montarLinhas(pedacos) {
    if (!pedacos.length) return [];
    var ordem = pedacos.slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; });
    var linhas = [], atual = null;
    ordem.forEach(function (p) {
      var tol = Math.max(2, (p.tam || 8) * 0.45);
      if (!atual || Math.abs(atual.y - p.y) > tol) {
        atual = { y: p.y, itens: [] };
        linhas.push(atual);
      }
      atual.itens.push(p);
    });
    return linhas.map(function (l) {
      var itens = l.itens.sort(function (a, b) { return a.x - b.x; });
      if (itens.length === 1) return itens[0].t.trim();

      // Quanto anda um caractere nesta linha, medido nas próprias posições.
      // Estimar por um fator fixo enfiava espaço no meio das palavras, porque
      // letra larga (O, M, G) anda bem mais do que a média.
      var passos = [];
      for (var i = 1; i < itens.length; i++) {
        var n = Math.max(1, itens[i - 1].t.length);
        var d = itens[i].x - itens[i - 1].x;
        if (d > 0) passos.push(d / n);
      }
      passos.sort(function (a, b) { return a - b; });
      var unidade = passos.length ? passos[Math.floor(passos.length / 2)] : 0;

      // Quando cada coluna é um pedaço só, todo passo já traz o vão da coluna
      // embutido e a mediana estoura. O corpo da letra é o teto: nenhuma
      // fonte anda mais do que isso por caractere, em média.
      var tams = itens.map(function (p) { return p.tam || 8; }).sort(function (a, b) { return a - b; });
      var teto = tams[Math.floor(tams.length / 2)] * 0.62;
      if (!(unidade > 0) || unidade > teto) unidade = teto;
      if (!(unidade > 0)) unidade = 4;

      // Se o próprio PDF já escreve os espaços, só marco as colunas. Se ele
      // não escreve nenhum, aí sim preciso adivinhar onde a palavra acaba.
      var temEspaco = itens.some(function (p) { return /\s/.test(p.t); });
      var limite = temEspaco ? 1.6 : 0.45;

      var fora = itens[0].t;
      for (var k = 1; k < itens.length; k++) {
        var ant = itens[k - 1];
        var sobra = (itens[k].x - ant.x) - ant.t.length * unidade;
        if (sobra > unidade * limite && !/\s$/.test(fora)) fora += ' ';
        fora += itens[k].t;
      }
      return fora.replace(/\s+/g, ' ').trim();
    }).filter(function (s) { return s; });
  }

  // ---------- porta de entrada ----------

  function extrair(bytes, senha) {
    var doc = new D.Documento(bytes);
    doc.varrer();
    return doc.prepararCifra(senha).then(function (r) {
      if (!r.ok) return { precisaSenha: true, linhas: [] };
      return doc.abrirObjStm().then(function () {
        // As páginas, na ordem em que aparecem.
        var paginas = [];
        Object.keys(doc.objetos).map(Number).sort(function (a, b) { return a - b; }).forEach(function (num) {
          var reg = doc.objetos[num];
          var d = ehDic(reg.valor) ? reg.valor.dic : null;
          if (!d) return;
          var t = doc.pegar(d.Type);
          if (ehNome(t) && t.nome === 'Page') paginas.push({ num: num, dic: d });
        });

        var linhas = [];
        var tarefa = Promise.resolve();
        paginas.forEach(function (pg) {
          tarefa = tarefa.then(function () {
            // fontes da página
            var rec = doc.dic(pg.dic.Resources) || {};
            var fdic = doc.dic(rec.Font) || {};
            var fontes = {};
            var t2 = Promise.resolve();
            Object.keys(fdic).forEach(function (chave) {
              t2 = t2.then(function () {
                return lerFonte(doc, fdic[chave]).then(function (f) { fontes[chave] = f; });
              });
            });

            return t2.then(function () {
              var cont = doc.pegar(pg.dic.Contents);
              var nums = [];
              if (pg.dic.Contents && typeof pg.dic.Contents.ref === 'number') nums.push(pg.dic.Contents.ref);
              else if (Array.isArray(pg.dic.Contents)) {
                pg.dic.Contents.forEach(function (c) { if (c && typeof c.ref === 'number') nums.push(c.ref); });
              }
              var partes = [];
              var t3 = Promise.resolve();
              nums.forEach(function (n) {
                t3 = t3.then(function () { return doc.fluxo(n).then(function (b) { partes.push(b); }); });
              });
              return t3.then(function () {
                if (!partes.length) return;
                var tudo = P.juntar(partes.map(function (b, i) {
                  return i ? P.juntar([P.bytesDeTexto('\n'), b]) : b;
                }));
                var pedacos = lerConteudo(doc, tudo, fontes);
                montarLinhas(pedacos).forEach(function (l) { linhas.push(l); });
              });
            });
          });
        });
        return tarefa.then(function () { return { precisaSenha: false, linhas: linhas, paginas: paginas.length }; });
      });
    });
  }

  raiz.CaixaPdfTexto = { extrair: extrair, montarLinhas: montarLinhas };
})(typeof globalThis !== 'undefined' ? globalThis : this);
