// ---------------------------------------------------------------------------
// Leitor de PDF em JavaScript puro. Serve para tirar o texto de um extrato
// bancário, inclusive quando o arquivo tem senha. Não desenha nada: só lê.
// ---------------------------------------------------------------------------
(function (raiz) {
  'use strict';

  var subtle = (raiz.crypto && raiz.crypto.subtle) || null;

  // ---------- utilidades de bytes ----------

  function bytesDeTexto(t) {
    var b = new Uint8Array(t.length);
    for (var i = 0; i < t.length; i++) b[i] = t.charCodeAt(i) & 255;
    return b;
  }

  function textoDeBytes(b) {
    var partes = [];
    for (var i = 0; i < b.length; i += 8192) {
      partes.push(String.fromCharCode.apply(null, b.subarray(i, i + 8192)));
    }
    return partes.join('');
  }

  function juntar(lista) {
    var n = 0, i;
    for (i = 0; i < lista.length; i++) n += lista[i].length;
    var fora = new Uint8Array(n), p = 0;
    for (i = 0; i < lista.length; i++) { fora.set(lista[i], p); p += lista[i].length; }
    return fora;
  }

  function ouExclusivo(a, b) {
    var fora = new Uint8Array(a.length);
    for (var i = 0; i < a.length; i++) fora[i] = a[i] ^ b[i];
    return fora;
  }

  // ---------- MD5 (preciso dele para as senhas antigas do PDF) ----------

  function md5(entrada) {
    function girar(x, c) { return (x << c) | (x >>> (32 - c)); }
    function somar(a, b) { return (a + b) | 0; }

    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    var K = [];
    for (var i = 0; i < 64; i++) K[i] = (Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)) | 0;

    var n = entrada.length;
    var comFim = new Uint8Array((((n + 8) >> 6) + 1) << 6);
    comFim.set(entrada);
    comFim[n] = 0x80;
    var bits = n * 8;
    for (var j = 0; j < 4; j++) comFim[comFim.length - 8 + j] = (bits >>> (8 * j)) & 255;

    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    var M = new Int32Array(16);

    for (var bloco = 0; bloco < comFim.length; bloco += 64) {
      for (var k = 0; k < 16; k++) {
        M[k] = comFim[bloco + k * 4] | (comFim[bloco + k * 4 + 1] << 8) |
               (comFim[bloco + k * 4 + 2] << 16) | (comFim[bloco + k * 4 + 3] << 24);
      }
      var A = a0, B = b0, C = c0, D = d0;
      for (var t = 0; t < 64; t++) {
        var F, g;
        if (t < 16) { F = (B & C) | (~B & D); g = t; }
        else if (t < 32) { F = (D & B) | (~D & C); g = (5 * t + 1) % 16; }
        else if (t < 48) { F = B ^ C ^ D; g = (3 * t + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * t) % 16; }
        F = somar(somar(somar(F, A), K[t]), M[g]);
        A = D; D = C; C = B;
        B = somar(B, girar(F, S[t]));
      }
      a0 = somar(a0, A); b0 = somar(b0, B); c0 = somar(c0, C); d0 = somar(d0, D);
    }

    var fora = new Uint8Array(16);
    [a0, b0, c0, d0].forEach(function (v, idx) {
      for (var q = 0; q < 4; q++) fora[idx * 4 + q] = (v >>> (8 * q)) & 255;
    });
    return fora;
  }

  // ---------- RC4 ----------

  function rc4(chave, dados) {
    var s = new Uint8Array(256), i, j = 0, tmp;
    for (i = 0; i < 256; i++) s[i] = i;
    for (i = 0; i < 256; i++) {
      j = (j + s[i] + chave[i % chave.length]) & 255;
      tmp = s[i]; s[i] = s[j]; s[j] = tmp;
    }
    var fora = new Uint8Array(dados.length);
    i = 0; j = 0;
    for (var k = 0; k < dados.length; k++) {
      i = (i + 1) & 255;
      j = (j + s[i]) & 255;
      tmp = s[i]; s[i] = s[j]; s[j] = tmp;
      fora[k] = dados[k] ^ s[(s[i] + s[j]) & 255];
    }
    return fora;
  }

  // ---------- AES pelo WebCrypto ----------

  function importarAes(chave, uso) {
    return subtle.importKey('raw', chave, { name: 'AES-CBC' }, false, uso);
  }

  var ZERO16 = new Uint8Array(16);

  // O WebCrypto sempre cuida do enchimento. Para cifrar um bloco cru eu cifro
  // e jogo fora o bloco de enchimento que ele acrescenta no fim.
  function cifrarSemEnchimento(chave, iv, dados) {
    return importarAes(chave, ['encrypt']).then(function (k) {
      return subtle.encrypt({ name: 'AES-CBC', iv: iv }, k, dados);
    }).then(function (b) {
      return new Uint8Array(b).subarray(0, dados.length);
    });
  }

  // Para decifrar sem enchimento eu acrescento um bloco que decifra num
  // enchimento válido, e aí o WebCrypto aceita e devolve só o que interessa.
  function decifrarSemEnchimento(chave, iv, dados) {
    if (!dados.length) return Promise.resolve(new Uint8Array(0));
    var ultimo = dados.subarray(dados.length - 16);
    var enchimento = new Uint8Array(16);
    for (var i = 0; i < 16; i++) enchimento[i] = 16;
    var alvo = ouExclusivo(enchimento, ultimo);
    return cifrarSemEnchimento(chave, ZERO16, alvo).then(function (extra) {
      var completo = juntar([dados, extra]);
      return importarAes(chave, ['decrypt']).then(function (k) {
        return subtle.decrypt({ name: 'AES-CBC', iv: iv }, k, completo);
      });
    }).then(function (b) { return new Uint8Array(b); });
  }

  // Nos fluxos do PDF os 16 primeiros bytes são o vetor inicial.
  function decifrarAes(chave, dados) {
    if (dados.length <= 16) return Promise.resolve(new Uint8Array(0));
    var iv = dados.subarray(0, 16);
    var corpo = dados.subarray(16);
    var sobra = corpo.length % 16;
    if (sobra) corpo = corpo.subarray(0, corpo.length - sobra);
    return importarAes(chave, ['decrypt']).then(function (k) {
      return subtle.decrypt({ name: 'AES-CBC', iv: iv }, k, corpo);
    }).then(function (b) { return new Uint8Array(b); })
      .catch(function () { return decifrarSemEnchimento(chave, iv, corpo); });
  }

  function digerir(nome, dados) {
    return subtle.digest(nome, dados).then(function (b) { return new Uint8Array(b); });
  }

  raiz.CaixaPdf = { md5: md5, rc4: rc4, bytesDeTexto: bytesDeTexto, textoDeBytes: textoDeBytes,
                    juntar: juntar, decifrarAes: decifrarAes, decifrarSemEnchimento: decifrarSemEnchimento,
                    cifrarSemEnchimento: cifrarSemEnchimento, digerir: digerir };
})(typeof globalThis !== 'undefined' ? globalThis : this);
