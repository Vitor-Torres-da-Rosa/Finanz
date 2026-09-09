(function (raiz) {
  'use strict';
  var P = raiz.CaixaPdf;

  // ---------- leitor de objetos (sintaxe do PDF) ----------

  function Lex(txt, pos) { this.t = txt; this.i = pos || 0; }

  Lex.prototype.pularBrancos = function () {
    for (;;) {
      var c = this.t.charCodeAt(this.i);
      if (c === 32 || c === 10 || c === 13 || c === 9 || c === 0 || c === 12) { this.i++; continue; }
      if (this.t[this.i] === '%') { while (this.i < this.t.length && this.t.charCodeAt(this.i) !== 10 && this.t.charCodeAt(this.i) !== 13) this.i++; continue; }
      return;
    }
  };

  function delimitador(c) { return '()<>[]{}/%'.indexOf(c) >= 0; }
  function branco(c) { var k = c.charCodeAt(0); return k === 32 || k === 10 || k === 13 || k === 9 || k === 0 || k === 12; }

  Lex.prototype.nome = function () {
    this.i++; // a barra
    var fora = '';
    while (this.i < this.t.length) {
      var c = this.t[this.i];
      if (branco(c) || delimitador(c)) break;
      if (c === '#') {
        fora += String.fromCharCode(parseInt(this.t.substr(this.i + 1, 2), 16) || 0);
        this.i += 3;
        continue;
      }
      fora += c; this.i++;
    }
    return { nome: fora };
  };

  Lex.prototype.textoLiteral = function () {
    this.i++; // o (
    var fora = [], nivel = 1;
    while (this.i < this.t.length) {
      var c = this.t[this.i];
      if (c === '\\') {
        var d = this.t[this.i + 1];
        this.i += 2;
        if (d === 'n') fora.push(10);
        else if (d === 'r') fora.push(13);
        else if (d === 't') fora.push(9);
        else if (d === 'b') fora.push(8);
        else if (d === 'f') fora.push(12);
        else if (d === '\n') { /* quebra escapada: nada */ }
        else if (d === '\r') { if (this.t[this.i] === '\n') this.i++; }
        else if (d >= '0' && d <= '7') {
          var oct = d;
          while (oct.length < 3 && this.t[this.i] >= '0' && this.t[this.i] <= '7') { oct += this.t[this.i]; this.i++; }
          fora.push(parseInt(oct, 8) & 255);
        } else fora.push(d.charCodeAt(0) & 255);
        continue;
      }
      if (c === '(') nivel++;
      if (c === ')') { nivel--; if (!nivel) { this.i++; break; } }
      fora.push(c.charCodeAt(0) & 255);
      this.i++;
    }
    return { bytes: new Uint8Array(fora) };
  };

  Lex.prototype.textoHex = function () {
    this.i++; // o <
    var digitos = '';
    while (this.i < this.t.length && this.t[this.i] !== '>') {
      var c = this.t[this.i];
      if (/[0-9a-fA-F]/.test(c)) digitos += c;
      this.i++;
    }
    this.i++;
    if (digitos.length % 2) digitos += '0';
    var b = new Uint8Array(digitos.length / 2);
    for (var k = 0; k < b.length; k++) b[k] = parseInt(digitos.substr(k * 2, 2), 16);
    return { bytes: b };
  };

  Lex.prototype.valor = function () {
    this.pularBrancos();
    if (this.i >= this.t.length) return null;
    var c = this.t[this.i];

    if (c === '/') return this.nome();
    if (c === '(') return this.textoLiteral();
    if (c === '[') {
      this.i++;
      var lista = [];
      for (;;) {
        this.pularBrancos();
        if (this.t[this.i] === ']') { this.i++; break; }
        if (this.i >= this.t.length) break;
        var v = this.valor();
        if (v === undefined) break;
        lista.push(v);
      }
      return lista;
    }
    if (c === '<') {
      if (this.t[this.i + 1] === '<') {
        this.i += 2;
        var d = {};
        for (;;) {
          this.pularBrancos();
          if (this.t[this.i] === '>' && this.t[this.i + 1] === '>') { this.i += 2; break; }
          if (this.i >= this.t.length) break;
          if (this.t[this.i] !== '/') { this.i++; continue; }
          var ch = this.nome().nome;
          var vv = this.valor();
          d[ch] = vv;
        }
        return { dic: d };
      }
      return this.textoHex();
    }
    if (c === ']' || c === '>' || c === '}' || c === ')') { this.i++; return undefined; }
    if (c === '{') { this.i++; return undefined; }

    // palavra ou número
    var ini = this.i;
    while (this.i < this.t.length && !branco(this.t[this.i]) && !delimitador(this.t[this.i])) this.i++;
    var bruto = this.t.slice(ini, this.i);
    if (!bruto) { this.i++; return undefined; }

    if (/^[+-]?[\d.]+$/.test(bruto)) {
      // referência? "12 0 R"
      var guarda = this.i;
      var m = /^\s*(\d+)\s+R\b/.exec(this.t.slice(this.i, this.i + 24));
      if (m && /^\d+$/.test(bruto)) {
        this.i += m[0].length;
        return { ref: parseInt(bruto, 10), ger: parseInt(m[1], 10) };
      }
      this.i = guarda;
      var n = parseFloat(bruto);
      return isFinite(n) ? n : 0;
    }
    if (bruto === 'true') return true;
    if (bruto === 'false') return false;
    if (bruto === 'null') return null;
    return { palavra: bruto };
  };

  // ---------- filtros ----------

  function desinflar(dados, formato) {
    return new Promise(function (ok, erro) {
      var ds;
      try { ds = new DecompressionStream(formato); } catch (e) { erro(e); return; }
      // O erro pode vir pelo escritor ou pela leitura; os dois precisam de
      // tratamento, senão ele escapa e derruba a página.
      var escritor = ds.writable.getWriter();
      escritor.write(dados).catch(function () {});
      escritor.close().catch(function () {});
      new Response(ds.readable).arrayBuffer().then(function (b) {
        ok(new Uint8Array(b));
      }, erro);
    });
  }

  function inflar(dados, cru) {
    var primeiro = cru ? 'deflate-raw' : 'deflate';
    var segundo = cru ? 'deflate' : 'deflate-raw';
    return desinflar(dados, primeiro)
      .catch(function () { return desinflar(dados, segundo); })
      .catch(function () { return new Uint8Array(0); });
  }

  function asciiHex(dados) {
    var t = P.textoDeBytes(dados), d = '';
    for (var i = 0; i < t.length; i++) {
      if (t[i] === '>') break;
      if (/[0-9a-fA-F]/.test(t[i])) d += t[i];
    }
    if (d.length % 2) d += '0';
    var b = new Uint8Array(d.length / 2);
    for (var k = 0; k < b.length; k++) b[k] = parseInt(d.substr(k * 2, 2), 16);
    return b;
  }

  function ascii85(dados) {
    var t = P.textoDeBytes(dados).replace(/\s+/g, '');
    if (t.slice(0, 2) === '<~') t = t.slice(2);
    var fim = t.indexOf('~>'); if (fim >= 0) t = t.slice(0, fim);
    var fora = [], grupo = [], i;
    for (i = 0; i < t.length; i++) {
      var c = t[i];
      if (c === 'z' && !grupo.length) { fora.push(0, 0, 0, 0); continue; }
      grupo.push(c.charCodeAt(0) - 33);
      if (grupo.length === 5) {
        var v = 0;
        for (var j = 0; j < 5; j++) v = v * 85 + grupo[j];
        fora.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255);
        grupo = [];
      }
    }
    if (grupo.length) {
      var falta = 5 - grupo.length;
      for (var q = 0; q < falta; q++) grupo.push(84);
      var w = 0;
      for (var z = 0; z < 5; z++) w = w * 85 + grupo[z];
      var quatro = [(w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255];
      for (var y = 0; y < 4 - falta; y++) fora.push(quatro[y]);
    }
    return new Uint8Array(fora);
  }

  function runLength(dados) {
    var fora = [], i = 0;
    while (i < dados.length) {
      var n = dados[i++];
      if (n === 128) break;
      if (n < 128) { for (var k = 0; k <= n; k++) fora.push(dados[i++]); }
      else { var b = dados[i++]; for (var j = 0; j < 257 - n; j++) fora.push(b); }
    }
    return new Uint8Array(fora);
  }

  function lzw(dados, primeiro) {
    var cedo = primeiro === 0 ? 0 : 1;
    var dic = [], i;
    function reiniciar() { dic = []; for (i = 0; i < 256; i++) dic[i] = [i]; dic[256] = null; dic[257] = null; }
    reiniciar();
    var largura = 9, buffer = 0, bits = 0, anterior = null, fora = [];
    for (var p = 0; p < dados.length; p++) {
      buffer = (buffer << 8) | dados[p]; bits += 8;
      while (bits >= largura) {
        var cod = (buffer >> (bits - largura)) & ((1 << largura) - 1);
        bits -= largura;
        if (cod === 256) { reiniciar(); largura = 9; anterior = null; continue; }
        if (cod === 257) { p = dados.length; break; }
        var entrada;
        if (cod < dic.length && dic[cod]) entrada = dic[cod];
        else if (anterior) entrada = anterior.concat([anterior[0]]);
        else continue;
        for (i = 0; i < entrada.length; i++) fora.push(entrada[i]);
        if (anterior) dic.push(anterior.concat([entrada[0]]));
        anterior = entrada;
        if (dic.length + cedo >= (1 << largura) && largura < 12) largura++;
      }
    }
    return new Uint8Array(fora);
  }

  // Previsor PNG/TIFF, usado principalmente nos fluxos de referência cruzada.
  function desprever(dados, parms, pegar) {
    if (!parms) return dados;
    var pre = pegar(parms.Predictor) || 1;
    if (pre <= 1) return dados;
    var cores = pegar(parms.Colors) || 1;
    var bpc = pegar(parms.BitsPerComponent) || 8;
    var colunas = pegar(parms.Columns) || 1;
    var bpp = Math.ceil(cores * bpc / 8);
    var linha = Math.ceil(cores * bpc * colunas / 8);

    if (pre === 2) {
      if (bpc !== 8) return dados;
      for (var r = 0; r + linha <= dados.length; r += linha) {
        for (var c = bpp; c < linha; c++) dados[r + c] = (dados[r + c] + dados[r + c - bpp]) & 255;
      }
      return dados;
    }

    var linhas = Math.floor(dados.length / (linha + 1));
    var fora = new Uint8Array(linhas * linha);
    var cima = new Uint8Array(linha);
    for (var y = 0; y < linhas; y++) {
      var tipo = dados[y * (linha + 1)];
      var atual = dados.subarray(y * (linha + 1) + 1, y * (linha + 1) + 1 + linha);
      var nova = new Uint8Array(linha);
      for (var x = 0; x < linha; x++) {
        var a = x >= bpp ? nova[x - bpp] : 0;
        var b = cima[x];
        var cc = x >= bpp ? cima[x - bpp] : 0;
        var v = atual[x];
        if (tipo === 0) nova[x] = v;
        else if (tipo === 1) nova[x] = (v + a) & 255;
        else if (tipo === 2) nova[x] = (v + b) & 255;
        else if (tipo === 3) nova[x] = (v + ((a + b) >> 1)) & 255;
        else {
          var pp = a + b - cc, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - cc);
          nova[x] = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : cc)) & 255;
        }
      }
      fora.set(nova, y * linha);
      cima = nova;
    }
    return fora;
  }

  raiz.CaixaPdfParser = { Lex: Lex, inflar: inflar, asciiHex: asciiHex, ascii85: ascii85,
                          runLength: runLength, lzw: lzw, desprever: desprever };
})(typeof globalThis !== 'undefined' ? globalThis : this);
