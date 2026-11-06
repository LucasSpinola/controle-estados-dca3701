import * as M from '../nucleo/matriz.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';

const TOLERANCIA = 1e-8;

export function classificarPolo(polo) {
  if (polo.re < -TOLERANCIA) {
    return 'estavel';
  }
  if (polo.re > TOLERANCIA) {
    return 'instavel';
  }
  return 'marginal';
}

export function estabilidade(a) {
  const { coeficientes, passos } = M.caracteristico(a);
  const polos = ordenarParaExibicao(raizes(coeficientes));
  const classes = polos.map(classificarPolo);
  return {
    coeficientes,
    passos,
    polos,
    classes,
    estavel: classes.every((classe) => classe === 'estavel'),
    marginal: classes.some((classe) => classe === 'marginal') && !classes.includes('instavel'),
  };
}

export function controlabilidade(a, b) {
  const ordem = a.length;
  const colunas = [b];
  for (let k = 1; k < ordem; k += 1) {
    colunas.push(M.multiplicar(a, colunas[k - 1]));
  }
  const matriz = M.juntarColunas(colunas);
  const { posto, determinante } = M.escalonar(matriz);
  return {
    simbolo: 'U',
    colunas,
    matriz,
    posto,
    determinante,
    ordem,
    completa: posto === ordem,
    inversa: posto === ordem ? M.inversa(matriz) : null,
  };
}

export function observabilidade(a, c) {
  const ordem = a.length;
  const linhas = [c];
  for (let k = 1; k < ordem; k += 1) {
    linhas.push(M.multiplicar(linhas[k - 1], a));
  }
  const matriz = M.juntarLinhas(linhas);
  const { posto, determinante } = M.escalonar(matriz);
  return {
    simbolo: 'V',
    linhas,
    matriz,
    posto,
    determinante,
    ordem,
    completa: posto === ordem,
    inversa: posto === ordem ? M.inversa(matriz) : null,
  };
}

export function analisar(sistema) {
  return {
    estabilidade: estabilidade(sistema.a),
    controlabilidade: controlabilidade(sistema.a, sistema.b),
    observabilidade: observabilidade(sistema.a, sistema.c),
  };
}
