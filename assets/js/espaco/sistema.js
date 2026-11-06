import * as M from '../nucleo/matriz.js';
import * as P from '../nucleo/polinomio.js';

export function separarParteDireta(numerador, denominador) {
  const den = P.normalizar(denominador);
  const num = P.normalizar(numerador);
  const ordem = den.length - 1;

  if (num.length <= ordem) {
    return { direto: 0, numerador: P.preencher(num, ordem), denominador: den };
  }
  if (num.length > ordem + 1) {
    throw new Error('G(s) precisa ser própria: o grau do numerador não pode passar o do denominador.');
  }
  const direto = num[0] / den[0];
  const restante = P.somar(num, P.escalar(den, -direto)).slice(1);
  return { direto, numerador: P.preencher(P.normalizar(restante), ordem), denominador: den };
}

export function coeficientesCanonicos(numerador, denominador) {
  const { direto, numerador: num, denominador: den } = separarParteDireta(numerador, denominador);
  const normalizado = den.map((valor) => valor / den[0]);
  return {
    direto,
    ordem: den.length - 1,
    alfa: normalizado.slice(1),
    beta: num.map((valor) => valor / den[0]),
  };
}

export function formaControlavel(numerador, denominador) {
  const { alfa, beta, ordem, direto } = coeficientesCanonicos(numerador, denominador);
  const a = M.zeros(ordem);
  for (let i = 0; i < ordem - 1; i += 1) {
    a[i][i + 1] = 1;
  }
  for (let j = 0; j < ordem; j += 1) {
    a[ordem - 1][j] = -alfa[ordem - 1 - j];
  }
  const b = M.coluna(new Array(ordem).fill(0).map((_, i) => (i === ordem - 1 ? 1 : 0)));
  const c = M.linha(beta.slice().reverse());
  return { a, b, c, direto, alfa, beta, ordem, forma: 'controlavel' };
}

export function formaObservavel(numerador, denominador) {
  const { alfa, beta, ordem, direto } = coeficientesCanonicos(numerador, denominador);
  const a = M.zeros(ordem);
  for (let i = 1; i < ordem; i += 1) {
    a[i][i - 1] = 1;
  }
  for (let i = 0; i < ordem; i += 1) {
    a[i][ordem - 1] = -alfa[ordem - 1 - i];
  }
  const b = M.coluna(beta.slice().reverse());
  const c = M.linha(new Array(ordem).fill(0).map((_, j) => (j === ordem - 1 ? 1 : 0)));
  return { a, b, c, direto, alfa, beta, ordem, forma: 'observavel' };
}

export const FORMAS = {
  controlavel: { nome: 'forma canônica controlável', montar: formaControlavel },
  observavel: { nome: 'forma canônica observável', montar: formaObservavel },
};

export function funcaoDeTransferencia(a, b, c, direto = 0) {
  const { coeficientes, passos } = M.caracteristico(a);
  const numerador = passos.map(
    (passo) => M.multiplicar(M.multiplicar(c, passo.adjunta), b)[0][0],
  );
  const comDireto = P.somar([0, ...numerador], P.escalar(coeficientes, direto));
  return { numerador: P.normalizar(comDireto), denominador: coeficientes };
}

export function montarSistema(entrada) {
  if (entrada.fonte === 'matrizes') {
    const { a, b, c } = entrada;
    const ordem = a.length;
    if (a.some((linha) => linha.length !== ordem)) {
      throw new Error('A matriz A precisa ser quadrada.');
    }
    if (b.length !== ordem || b.some((linha) => linha.length !== 1)) {
      throw new Error('A matriz B precisa ter uma coluna e a mesma ordem de A.');
    }
    if (c.length !== 1 || c[0].length !== ordem) {
      throw new Error('A matriz C precisa ter uma linha e a mesma ordem de A.');
    }
    return {
      a, b, c, direto: 0, ordem, forma: null, origem: 'matrizes',
    };
  }

  const forma = FORMAS[entrada.forma] || FORMAS.controlavel;
  const sistema = forma.montar(entrada.numerador, entrada.denominador);
  return {
    ...sistema,
    origem: 'transferencia',
    entrada: { numerador: entrada.numerador, denominador: entrada.denominador },
  };
}
