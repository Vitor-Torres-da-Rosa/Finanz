(function (raiz) {
  'use strict';
  var P = raiz.CaixaPdf, Q = raiz.CaixaPdfParser;

  // ---------- ZIP ----------
  // Um .xlsx é um zip com XML dentro. Só preciso dos arquivos que interessam.

  function lerZip(bytes) {
    var n = bytes.length;
    // Fim do diretório central: assinatura 0x06054b50, perto do fim.
    var fim = -1;
    for (var i = n - 22; i >= 0 && i > n - 66000; i--) {
      if (bytes[i] === 0x50 && bytes[i+1] === 0x4B && bytes[i+2] === 0x05 && bytes[i+3] === 0x06) { fim = i; break; }
    }
    if (fim < 0) return null;

    var v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var quantos = v.getUint16(fim + 10, true);
    var inicio = v.getUint32(fim + 16, true);
    var arquivos = {};
    var p = inicio;

    for (var k = 0; k < quantos && p + 46 <= n; k++) {
      if (v.getUint32(p, true) !== 0x02014b50) break;
      var metodo = v.getUint16(p + 10, true);
      var comprimido = v.getUint32(p + 20, true);
      var cru = v.getUint32(p + 24, true);
      var tamNome = v.getUint16(p + 28, true);
      var tamExtra = v.getUint16(p + 30, true);
      var tamCom = v.getUint16(p + 32, true);
      var local = v.getUint32(p + 42, true);
      var nome = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + tamNome));
      arquivos[nome] = { metodo: metodo, comprimido: comprimido, cru: cru, local: local };
      p += 46 + tamNome + tamExtra + tamCom;
    }
    return { bytes: bytes, v: v, arquivos: arquivos };
  }

  function tirarDoZip(zip, nome) {
    var e = zip.arquivos[nome];
    if (!e) return Promise.resolve(null);
    var v = zip.v, p = e.local;
    if (v.getUint32(p, true) !== 0x04034b50) return Promise.resolve(null);
    var tamNome = v.getUint16(p + 26, true);
    var tamExtra = v.getUint16(p + 28, true);
    var ini = p + 30 + tamNome + tamExtra;
    var dados = zip.bytes.subarray(ini, ini + e.comprimido);
    if (e.metodo === 0) return Promise.resolve(dados);
    if (e.metodo !== 8) return Promise.resolve(null);
    return Q.inflar(dados, true).then(function (b) { return b && b.length ? b : null; });
  }

  // ---------- XML ----------

  function destrocar(t) {
    return String(t == null ? '' : t)
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (m, d) { return String.fromCodePoint(+d); })
      .replace(/&amp;/g, '&');
  }

  function textoDeXml(trecho) {
    var fora = '', re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g, m;
    while ((m = re.exec(trecho))) fora += destrocar(m[1]);
    return fora;
  }

  // ---------- datas ----------

  // O Excel guarda data como número de dias desde 1900, com o bug do ano
  // bissexto de 1900 embutido. Por isso a base é 30/12/1899.
  function dataDeSerial(n) {
    if (!(n > 0) || n > 2958465) return '';
    var ms = Math.round((n - 25569) * 86400000);
    var d = new Date(ms);
    if (isNaN(d.getTime())) return '';
    return d.getUTCFullYear() + '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }

  var FORMATOS_DATA = { 14:1, 15:1, 16:1, 17:1, 18:1, 19:1, 20:1, 21:1, 22:1, 45:1, 46:1, 47:1 };

  function estilosDeData(xml) {
    if (!xml) return {};
    var proprios = {};
    var re = /<numFmt[^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g, m;
    while ((m = re.exec(xml))) {
      var cod = destrocar(m[2]);
      // Um formato com dia, mês ou ano e sem aspas é data.
      if (/[dmyDMY]/.test(cod.replace(/"[^"]*"/g, '')) && !/^[^dmyDMY]*$/.test(cod)) proprios[m[1]] = 1;
    }
    var bloco = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml);
    if (!bloco) return {};
    var mapa = {}, idx = 0;
    var reXf = /<xf\b([^>]*)\/?>/g, x;
    while ((x = reXf.exec(bloco[1]))) {
      var id = /numFmtId="(\d+)"/.exec(x[1]);
      if (id && (FORMATOS_DATA[+id[1]] || proprios[id[1]])) mapa[idx] = 1;
      idx++;
    }
    return mapa;
  }

  // ---------- planilha ----------

  function coluna(ref) {
    var m = /^([A-Z]+)/.exec(ref || '');
    if (!m) return 0;
    var n = 0;
    for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }

  function lerPlanilha(xml, textos, datas) {
    var linhas = [];
    var reLinha = /<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g, ml;
    while ((ml = reLinha.exec(xml))) {
      var corpo = ml[1] || '';
      var celulas = [];
      var reCel = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, mc;
      while ((mc = reCel.exec(corpo))) {
        var attrs = mc[1] || '', dentro = mc[2] || '';
        var refm = /r="([A-Z]+\d+)"/.exec(attrs);
        var col = refm ? coluna(refm[1]) : celulas.length;
        var tipo = (/t="([^"]*)"/.exec(attrs) || [])[1] || 'n';
        var estilo = +((/s="(\d+)"/.exec(attrs) || [])[1] || -1);

        var valor = '';
        if (tipo === 's') {
          var iv = /<v>([\s\S]*?)<\/v>/.exec(dentro);
          valor = iv ? (textos[+iv[1]] || '') : '';
        } else if (tipo === 'inlineStr') {
          valor = textoDeXml(dentro);
        } else if (tipo === 'str') {
          var sv = /<v>([\s\S]*?)<\/v>/.exec(dentro);
          valor = sv ? destrocar(sv[1]) : '';
        } else {
          var nv = /<v>([\s\S]*?)<\/v>/.exec(dentro);
          if (nv) {
            var num = parseFloat(nv[1]);
            if (datas[estilo] && isFinite(num)) valor = dataDeSerial(num);
            else if (isFinite(num)) {
              // Guardo com vírgula, que é como o resto do app lê dinheiro.
              valor = (Math.round(num * 100) / 100).toFixed(2).replace('.', ',');
            } else valor = nv[1];
          }
        }
        while (celulas.length < col) celulas.push('');
        celulas[col] = valor;
      }
      if (celulas.length) linhas.push(celulas);
    }
    return linhas;
  }

  function lerXlsx(bytes) {
    var zip = lerZip(bytes);
    if (!zip) return Promise.resolve(null);

    var textos = [], datas = {}, folhas = [];
    return tirarDoZip(zip, 'xl/sharedStrings.xml').then(function (b) {
      if (!b) return;
      var xml = new TextDecoder('utf-8').decode(b);
      var re = /<si\b[^>]*>([\s\S]*?)<\/si>/g, m;
      while ((m = re.exec(xml))) textos.push(textoDeXml(m[1]));
    }).then(function () {
      return tirarDoZip(zip, 'xl/styles.xml');
    }).then(function (b) {
      if (b) datas = estilosDeData(new TextDecoder('utf-8').decode(b));
    }).then(function () {
      // Todas as abas, na ordem dos arquivos.
      var nomes = Object.keys(zip.arquivos).filter(function (n) {
        return /^xl\/worksheets\/sheet\d+\.xml$/.test(n);
      }).sort(function (a, b) {
        return (+/(\d+)/.exec(a)[1]) - (+/(\d+)/.exec(b)[1]);
      });
      var tarefa = Promise.resolve();
      nomes.forEach(function (n) {
        tarefa = tarefa.then(function () {
          return tirarDoZip(zip, n).then(function (b) {
            if (!b) return;
            folhas.push(lerPlanilha(new TextDecoder('utf-8').decode(b), textos, datas));
          });
        });
      });
      return tarefa;
    }).then(function () {
      var tudo = [];
      folhas.forEach(function (f) { f.forEach(function (l) { tudo.push(l); }); });
      return tudo;
    });
  }

  raiz.CaixaXlsx = { lerXlsx: lerXlsx, lerZip: lerZip };
})(typeof globalThis !== 'undefined' ? globalThis : this);
