(function (raiz) {
  'use strict';
  var P = raiz.CaixaPdf, Q = raiz.CaixaPdfParser;

  var ENCHIMENTO = new Uint8Array([
    0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,
    0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A]);

  function ehDic(v) { return v && typeof v === 'object' && v.dic; }
  function ehRef(v) { return v && typeof v === 'object' && typeof v.ref === 'number'; }
  function ehBytes(v) { return v && v.bytes instanceof Uint8Array; }
  function ehNome(v) { return v && typeof v.nome === 'string'; }

  function Documento(bytes) {
    this.bytes = bytes;
    this.txt = P.textoDeBytes(bytes);
    this.objetos = {};      // num -> { valor, fluxoIni, fluxoFim, ger }
    this.cifra = null;
    this.chave = null;
  }

  Documento.prototype.pegar = function (v) {
    var voltas = 0;
    while (ehRef(v) && voltas++ < 32) {
      var o = this.objetos[v.ref];
      v = o ? o.valor : null;
    }
    return v;
  };

  Documento.prototype.dic = function (v) {
    var d = this.pegar(v);
    return ehDic(d) ? d.dic : null;
  };

  // Varre o arquivo inteiro atrás de "N G obj". É mais teimoso do que seguir a
  // tabela de referência cruzada, que costuma vir quebrada em arquivo remendado.
  Documento.prototype.varrer = function () {
    var re = /(\d+)\s+(\d+)\s+obj\b/g, m;
    while ((m = re.exec(this.txt))) {
      var num = parseInt(m[1], 10), ger = parseInt(m[2], 10);
      var lex = new Q.Lex(this.txt, m.index + m[0].length);
      var valor;
      try { valor = lex.valor(); } catch (e) { continue; }
      var reg = { valor: valor, ger: ger, fluxoIni: -1, fluxoFim: -1, num: num };

      lex.pularBrancos();
      if (this.txt.substr(lex.i, 6) === 'stream') {
        var p = lex.i + 6;
        if (this.txt[p] === '\r') p++;
        if (this.txt[p] === '\n') p++;
        reg.fluxoIni = p;
        var d = ehDic(valor) ? valor.dic : null;
        var comp = d ? this.pegar(d.Length) : null;
        var fim = -1;
        if (typeof comp === 'number' && comp > 0 && p + comp <= this.txt.length) {
          var apos = this.txt.substr(p + comp, 20);
          if (/^\s*endstream/.test(apos)) fim = p + comp;
        }
        if (fim < 0) {
          var e = this.txt.indexOf('endstream', p);
          fim = e < 0 ? this.txt.length : e;
          while (fim > p && (this.txt.charCodeAt(fim - 1) === 10 || this.txt.charCodeAt(fim - 1) === 13)) fim--;
        }
        reg.fluxoFim = fim;
      }
      // Um objeto remendado depois vale mais do que o original.
      this.objetos[num] = reg;
    }
  };

  Documento.prototype.acharTrailer = function () {
    var achado = { encrypt: null, id: null, raiz: null };
    var re = /trailer/g, m;
    while ((m = re.exec(this.txt))) {
      var lex = new Q.Lex(this.txt, m.index + 7);
      var v;
      try { v = lex.valor(); } catch (e) { continue; }
      if (!ehDic(v)) continue;
      if (v.dic.Encrypt) achado.encrypt = v.dic.Encrypt;
      if (v.dic.ID) achado.id = v.dic.ID;
      if (v.dic.Root) achado.raiz = v.dic.Root;
    }
    // PDF moderno guarda isso no fluxo de referência cruzada.
    for (var num in this.objetos) {
      var d = ehDic(this.objetos[num].valor) ? this.objetos[num].valor.dic : null;
      if (!d || !ehNome(d.Type) || d.Type.nome !== 'XRef') continue;
      if (d.Encrypt && !achado.encrypt) achado.encrypt = d.Encrypt;
      if (d.ID && !achado.id) achado.id = d.ID;
      if (d.Root && !achado.raiz) achado.raiz = d.Root;
    }
    return achado;
  };

  // ---------- senha ----------

  Documento.prototype.prepararCifra = function (senha) {
    var eu = this;
    var t = this.acharTrailer();
    if (!t.encrypt) return Promise.resolve({ ok: true, precisaSenha: false });

    var enc = this.dic(t.encrypt);
    if (!enc) return Promise.resolve({ ok: true, precisaSenha: false });

    var V = this.pegar(enc.V) || 0;
    var R = this.pegar(enc.R) || 2;
    var comprimento = (this.pegar(enc.Length) || 40) / 8;
    var O = ehBytes(this.pegar(enc.O)) ? this.pegar(enc.O).bytes : new Uint8Array(32);
    var U = ehBytes(this.pegar(enc.U)) ? this.pegar(enc.U).bytes : new Uint8Array(32);
    var Perm = this.pegar(enc.P);
    if (typeof Perm !== 'number') Perm = -1;
    var metadados = this.pegar(enc.EncryptMetadata);
    var idBytes = new Uint8Array(0);
    var id = this.pegar(t.id);
    if (Array.isArray(id) && ehBytes(this.pegar(id[0]))) idBytes = this.pegar(id[0]).bytes;

    // Que algoritmo cada coisa usa
    var modo = V >= 5 ? 'aes256' : (V === 4 ? 'v4' : 'rc4');
    if (modo === 'v4') {
      var cf = this.dic(enc.CF);
      var nomeStm = ehNome(this.pegar(enc.StmF)) ? this.pegar(enc.StmF).nome : 'Identity';
      var filtro = cf ? this.dic(cf[nomeStm]) : null;
      var cfm = filtro && ehNome(this.pegar(filtro.CFM)) ? this.pegar(filtro.CFM).nome : 'V2';
      modo = cfm === 'AESV2' ? 'aes128' : (cfm === 'AESV3' ? 'aes256' : (cfm === 'None' ? 'nenhum' : 'rc4'));
      if (filtro && this.pegar(filtro.Length)) {
        var L = this.pegar(filtro.Length);
        comprimento = L > 40 ? L / 8 : L;
      }
    }
    this.cifra = { modo: modo, R: R, comprimento: comprimento };

    var senhaBytes = P.bytesDeTexto(String(senha == null ? '' : senha));

    if (R >= 5) {
      return this.chaveR6(senhaBytes, enc, U, O).then(function (chave) {
        if (!chave) return { ok: false, precisaSenha: true };
        eu.chave = chave;
        return { ok: true, precisaSenha: false };
      });
    }

    var chave = this.chaveAntiga(senhaBytes, O, Perm, idBytes, R, comprimento, metadados);
    this.chave = chave;
    return this.conferirAntiga(chave, U, idBytes, R).then(function (bate) {
      if (bate) return { ok: true, precisaSenha: false };
      // A senha do dono também abre: ela gera a do usuário.
      var doDono = eu.senhaDoDono(senhaBytes, O, R, comprimento);
      var chave2 = eu.chaveAntiga(doDono, O, Perm, idBytes, R, comprimento, metadados);
      eu.chave = chave2;
      return eu.conferirAntiga(chave2, U, idBytes, R).then(function (bate2) {
        if (bate2) return { ok: true, precisaSenha: false };
        eu.chave = chave;
        return { ok: false, precisaSenha: true };
      });
    });
  };

  Documento.prototype.chaveAntiga = function (senhaBytes, O, Perm, idBytes, R, comprimento, metadados) {
    var enchida = new Uint8Array(32);
    var n = Math.min(senhaBytes.length, 32);
    enchida.set(senhaBytes.subarray(0, n));
    enchida.set(ENCHIMENTO.subarray(0, 32 - n), n);

    var permBytes = new Uint8Array(4);
    for (var i = 0; i < 4; i++) permBytes[i] = (Perm >> (8 * i)) & 255;

    var pedacos = [enchida, O.subarray(0, 32), permBytes, idBytes];
    if (R >= 4 && metadados === false) pedacos.push(new Uint8Array([255, 255, 255, 255]));

    var chave = P.md5(P.juntar(pedacos));
    var tam = R === 2 ? 5 : Math.max(5, Math.min(16, comprimento));
    if (R >= 3) {
      for (var k = 0; k < 50; k++) chave = P.md5(chave.subarray(0, tam));
    }
    return chave.subarray(0, tam);
  };

  Documento.prototype.senhaDoDono = function (senhaBytes, O, R, comprimento) {
    var enchida = new Uint8Array(32);
    var n = Math.min(senhaBytes.length, 32);
    enchida.set(senhaBytes.subarray(0, n));
    enchida.set(ENCHIMENTO.subarray(0, 32 - n), n);
    var chave = P.md5(enchida);
    var tam = R === 2 ? 5 : Math.max(5, Math.min(16, comprimento));
    if (R >= 3) { for (var k = 0; k < 50; k++) chave = P.md5(chave); }
    chave = chave.subarray(0, tam);
    var fora = O.subarray(0, 32);
    if (R === 2) return P.rc4(chave, fora);
    for (var i = 19; i >= 0; i--) {
      var c = new Uint8Array(chave.length);
      for (var j = 0; j < chave.length; j++) c[j] = chave[j] ^ i;
      fora = P.rc4(c, fora);
    }
    return fora;
  };

  Documento.prototype.conferirAntiga = function (chave, U, idBytes, R) {
    if (R === 2) {
      var esperado = P.rc4(chave, ENCHIMENTO);
      return Promise.resolve(iguais(esperado, U.subarray(0, 32), 32));
    }
    var base = P.md5(P.juntar([ENCHIMENTO, idBytes]));
    var fora = P.rc4(chave, base);
    for (var i = 1; i <= 19; i++) {
      var c = new Uint8Array(chave.length);
      for (var j = 0; j < chave.length; j++) c[j] = chave[j] ^ i;
      fora = P.rc4(c, fora);
    }
    return Promise.resolve(iguais(fora, U.subarray(0, 16), 16));
  };

  function iguais(a, b, n) {
    for (var i = 0; i < n; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Algoritmo 2.B: o embaralhamento pesado do PDF 2.0 / AES-256.
  function hash2B(senha, sal, extra, R) {
    return P.digerir('SHA-256', P.juntar([senha, sal, extra])).then(function (K) {
      if (R === 5) return K;
      var i = 0;
      function volta() {
        var uma = P.juntar([senha, K, extra]);
        var K1 = new Uint8Array(uma.length * 64);
        for (var r = 0; r < 64; r++) K1.set(uma, r * uma.length);
        return P.cifrarSemEnchimento(K.subarray(0, 16), K.subarray(16, 32), K1).then(function (E) {
          var soma = 0;
          for (var s = 0; s < 16; s++) soma += E[s];
          var qual = soma % 3;
          return P.digerir(qual === 0 ? 'SHA-256' : qual === 1 ? 'SHA-384' : 'SHA-512', E)
            .then(function (novo) {
              K = novo;
              i++;
              if (i >= 64 && E[E.length - 1] <= i - 32) return K.subarray(0, 32);
              if (i > 300) return K.subarray(0, 32);
              return volta();
            });
        });
      }
      return volta();
    });
  }

  Documento.prototype.chaveR6 = function (senhaBytes, enc, U, O) {
    var eu = this;
    var R = this.pegar(enc.R) || 6;
    var UE = ehBytes(this.pegar(enc.UE)) ? this.pegar(enc.UE).bytes : new Uint8Array(32);
    var OE = ehBytes(this.pegar(enc.OE)) ? this.pegar(enc.OE).bytes : new Uint8Array(32);
    var senha = senhaBytes.subarray(0, 127);

    var valU = U.subarray(32, 40), salU = U.subarray(40, 48);
    var valO = O.subarray(32, 40), salO = O.subarray(40, 48);

    return hash2B(senha, valU, new Uint8Array(0), R).then(function (h) {
      if (iguais(h, U.subarray(0, 32), 32)) {
        return hash2B(senha, salU, new Uint8Array(0), R).then(function (inter) {
          return P.decifrarSemEnchimento(inter, new Uint8Array(16), UE);
        });
      }
      // senha do dono
      return hash2B(senha, valO, U.subarray(0, 48), R).then(function (h2) {
        if (!iguais(h2, O.subarray(0, 32), 32)) return null;
        return hash2B(senha, salO, U.subarray(0, 48), R).then(function (inter) {
          return P.decifrarSemEnchimento(inter, new Uint8Array(16), OE);
        });
      });
    }).then(function (chave) {
      return chave ? chave.subarray(0, 32) : null;
    }).catch(function () { return null; });
  };

  // ---------- fluxos ----------

  Documento.prototype.decifrarDados = function (dados, num, ger) {
    if (!this.chave || !this.cifra || this.cifra.modo === 'nenhum') return Promise.resolve(dados);
    var modo = this.cifra.modo;
    if (modo === 'aes256') return P.decifrarAes(this.chave, dados);

    var extra = new Uint8Array([num & 255, (num >> 8) & 255, (num >> 16) & 255, ger & 255, (ger >> 8) & 255]);
    var pedacos = [this.chave, extra];
    if (modo === 'aes128') pedacos.push(new Uint8Array([0x73, 0x41, 0x6C, 0x54]));
    var chaveObj = P.md5(P.juntar(pedacos)).subarray(0, Math.min(this.chave.length + 5, 16));
    if (modo === 'aes128') return P.decifrarAes(chaveObj, dados);
    return Promise.resolve(P.rc4(chaveObj, dados));
  };

  Documento.prototype.fluxo = function (num) {
    var eu = this;
    var reg = this.objetos[num];
    if (!reg || reg.fluxoIni < 0) return Promise.resolve(new Uint8Array(0));
    if (reg.pronto) return Promise.resolve(reg.pronto);

    var cru = this.bytes.subarray(reg.fluxoIni, reg.fluxoFim);
    var d = ehDic(reg.valor) ? reg.valor.dic : {};
    var tipo = ehNome(this.pegar(d.Type)) ? this.pegar(d.Type).nome : '';

    // O fluxo de referência cruzada nunca é cifrado.
    var passo = tipo === 'XRef' ? Promise.resolve(cru) : this.decifrarDados(cru, num, reg.ger);

    return passo.then(function (dados) {
      var filtros = eu.pegar(d.Filter);
      var parms = eu.pegar(d.DecodeParms) || eu.pegar(d.DP);
      if (!filtros) return dados;
      if (!Array.isArray(filtros)) filtros = [filtros];
      if (!Array.isArray(parms)) parms = [parms];

      var tarefa = Promise.resolve(dados);
      filtros.forEach(function (f, idx) {
        var nome = ehNome(eu.pegar(f)) ? eu.pegar(f).nome : '';
        var pp = eu.dic(parms[idx]);
        tarefa = tarefa.then(function (dd) {
          if (nome === 'FlateDecode' || nome === 'Fl') {
            return Q.inflar(dd).then(function (x) { return Q.desprever(x, pp, function (v) { return eu.pegar(v); }); });
          }
          if (nome === 'LZWDecode' || nome === 'LZW') {
            var cedo = pp ? eu.pegar(pp.EarlyChange) : 1;
            return Q.desprever(Q.lzw(dd, cedo), pp, function (v) { return eu.pegar(v); });
          }
          if (nome === 'ASCIIHexDecode' || nome === 'AHx') return Q.asciiHex(dd);
          if (nome === 'ASCII85Decode' || nome === 'A85') return Q.ascii85(dd);
          if (nome === 'RunLengthDecode' || nome === 'RL') return Q.runLength(dd);
          return dd; // imagem ou filtro que não interessa
        });
      });
      return tarefa;
    }).then(function (dados) {
      reg.pronto = dados;
      return dados;
    }).catch(function () { return new Uint8Array(0); });
  };

  // Objetos guardados dentro de outros objetos (comum em PDF novo).
  Documento.prototype.abrirObjStm = function () {
    var eu = this;
    var lista = [];
    Object.keys(this.objetos).forEach(function (num) {
      var reg = eu.objetos[num];
      var d = ehDic(reg.valor) ? reg.valor.dic : null;
      if (d && ehNome(eu.pegar(d.Type)) && eu.pegar(d.Type).nome === 'ObjStm') lista.push(Number(num));
    });

    var tarefa = Promise.resolve();
    lista.forEach(function (num) {
      tarefa = tarefa.then(function () {
        return eu.fluxo(num).then(function (dados) {
          var d = eu.objetos[num].valor.dic;
          var N = eu.pegar(d.N) || 0, primeiro = eu.pegar(d.First) || 0;
          var txt = P.textoDeBytes(dados);
          var cabeca = txt.slice(0, primeiro).trim().split(/\s+/);
          for (var i = 0; i < N; i++) {
            var alvo = parseInt(cabeca[i * 2], 10);
            var desloc = parseInt(cabeca[i * 2 + 1], 10);
            if (!isFinite(alvo) || !isFinite(desloc)) continue;
            if (eu.objetos[alvo] && eu.objetos[alvo].fluxoIni >= 0) continue;
            var lex = new Q.Lex(txt, primeiro + desloc);
            var v;
            try { v = lex.valor(); } catch (e) { continue; }
            if (!eu.objetos[alvo]) eu.objetos[alvo] = { valor: v, ger: 0, fluxoIni: -1, fluxoFim: -1, num: alvo };
          }
        });
      });
    });
    return tarefa;
  };

  raiz.CaixaPdfDoc = { Documento: Documento, ehDic: ehDic, ehRef: ehRef, ehBytes: ehBytes, ehNome: ehNome };
})(typeof globalThis !== 'undefined' ? globalThis : this);
