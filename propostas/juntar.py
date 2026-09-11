#!/usr/bin/env python3
"""Junta antes.png e depois.png numa imagem só, para mandar no chat.

    python3 propostas/juntar.py 0001

Os dois prints saem do mesmo cenário e da mesma tela, então lado a lado a
diferença que aparecer é da mudança e de mais nada.
"""
import os
import sys
import glob
from PIL import Image

ESPACO = 16
FUNDO = (10, 10, 12)


def main():
    if len(sys.argv) < 2:
        sys.exit('uso: python3 propostas/juntar.py 0001')
    numero = sys.argv[1]
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    achadas = glob.glob(os.path.join(raiz, 'propostas', numero + '-*'))
    if not achadas:
        sys.exit('não achei a pasta da proposta ' + numero)
    pasta = achadas[0]

    antes = Image.open(os.path.join(pasta, 'antes.png')).convert('RGB')
    depois = Image.open(os.path.join(pasta, 'depois.png')).convert('RGB')

    largura = antes.width + depois.width + ESPACO * 3
    altura = max(antes.height, depois.height) + ESPACO * 2
    folha = Image.new('RGB', (largura, altura), FUNDO)
    folha.paste(antes, (ESPACO, ESPACO))
    folha.paste(depois, (ESPACO * 2 + antes.width, ESPACO))
    folha.thumbnail((1500, 1500))

    saida = os.path.join(pasta, 'par.png')
    folha.save(saida)
    print(saida)


if __name__ == '__main__':
    main()
