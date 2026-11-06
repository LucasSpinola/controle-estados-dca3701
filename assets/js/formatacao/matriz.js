import { numeroLatex } from './numero.js';
import { complexoLatex } from './latex.js';

const EPS = 1e-10;

function arredondar(valor, decimais) {
  if (decimais === null) {
    return valor;
  }
  const limpo = Number(valor.toFixed(decimais));
  return Math.abs(limpo) < EPS ? 0 : limpo;
}

export function matrizLatex(matriz, opcoes = {}) {
  const { decimais = 4, delimitador = 'b' } = opcoes;
  const corpo = matriz
    .map((linha) => linha.map((valor) => numeroLatex(arredondar(valor, decimais))).join(' & '))
    .join(' \\\\ ');
  return `\\begin{${delimitador}matrix} ${corpo} \\end{${delimitador}matrix}`;
}

export function vetorColunaLatex(vetor, opcoes = {}) {
  return matrizLatex(vetor.map((valor) => [valor]), opcoes);
}

export function vetorLinhaLatex(vetor, opcoes = {}) {
  return matrizLatex([vetor], opcoes);
}

export function sistemaLatex(sistema, opcoes = {}) {
  const partes = [
    `\\mathbf{A} = ${matrizLatex(sistema.a, opcoes)}`,
    `\\mathbf{B} = ${matrizLatex(sistema.b, opcoes)}`,
    `\\mathbf{C} = ${matrizLatex(sistema.c, opcoes)}`,
  ];
  if (Math.abs(sistema.direto || 0) > EPS) {
    partes.push(`D = ${numeroLatex(sistema.direto)}`);
  }
  return partes.join(', \\qquad ');
}

export function polosLatex(polos, decimais = 4) {
  return polos.map((polo) => complexoLatex(polo, decimais)).join(', \\; ');
}

export function listaDePolosLatex(polos, simbolo = 's', decimais = 4) {
  return polos
    .map((polo, indice) => `${simbolo}_{${indice + 1}} = ${complexoLatex(polo, decimais)}`)
    .join(', \\qquad ');
}

export function tabelaLatex(cabecalho, linhas) {
  const formato = `l|${new Array(cabecalho.length - 1).fill('c').join('|')}`;
  return [
    `\\begin{array}{${formato}}`,
    `${cabecalho.join(' & ')} \\\\ \\hline`,
    linhas.map((linha) => linha.join(' & ')).join(' \\\\ '),
    '\\end{array}',
  ].join(' ');
}
