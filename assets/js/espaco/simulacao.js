import * as M from '../nucleo/matriz.js';

const AMOSTRAS = 1200;
const CONSTANTES_DE_TEMPO = 10;
const DURACAO_MINIMA = 0.2;
const DURACAO_MAXIMA = 400;

export function horizonte(polos) {
  const partes = polos.map((polo) => -polo.re).filter((valor) => valor > 1e-9);
  if (partes.length === 0) {
    return 10;
  }
  const lento = Math.min(...partes);
  return Math.min(Math.max(CONSTANTES_DE_TEMPO / lento, DURACAO_MINIMA), DURACAO_MAXIMA);
}

export function discretizar(a, b, passo) {
  const ordem = a.length;
  const aumentada = M.zeros(ordem + 1);
  for (let i = 0; i < ordem; i += 1) {
    for (let j = 0; j < ordem; j += 1) {
      aumentada[i][j] = a[i][j] * passo;
    }
    aumentada[i][ordem] = b[i][0] * passo;
  }
  const exponencial = M.exponencial(aumentada);
  return {
    transicao: exponencial.slice(0, ordem).map((linha) => linha.slice(0, ordem)),
    entrada: exponencial.slice(0, ordem).map((linha) => linha[ordem]),
  };
}

export function simular(a, b, c, opcoes = {}) {
  const {
    duracao = 10, amplitude = 1, estadoInicial = null, direto = 0,
  } = opcoes;
  const ordem = a.length;
  const passo = duracao / (AMOSTRAS - 1);
  const { transicao, entrada } = discretizar(a, b, passo);

  const tempos = new Float64Array(AMOSTRAS);
  const saidas = new Float64Array(AMOSTRAS);
  const estados = Array.from({ length: ordem }, () => new Float64Array(AMOSTRAS));

  let estado = estadoInicial ? estadoInicial.slice() : new Array(ordem).fill(0);

  for (let k = 0; k < AMOSTRAS; k += 1) {
    tempos[k] = k * passo;
    saidas[k] = estado.reduce((total, valor, i) => total + valor * c[0][i], direto * amplitude);
    estado.forEach((valor, i) => {
      estados[i][k] = valor;
    });
    estado = M.aplicar(transicao, estado).map((valor, i) => valor + entrada[i] * amplitude);
  }
  return {
    tempos, saidas, estados, duracao,
  };
}

function acomodacao(tempos, normalizadas, faixa) {
  const ultima = normalizadas.length - 1;
  for (let k = ultima; k >= 0; k -= 1) {
    const excesso = Math.abs(normalizadas[k] - 1) - faixa;
    if (excesso <= 0) {
      continue;
    }
    if (k === ultima) {
      return Infinity;
    }
    const seguinte = Math.abs(normalizadas[k + 1] - 1) - faixa;
    return tempos[k] + ((tempos[k + 1] - tempos[k]) * excesso) / (excesso - seguinte);
  }
  return 0;
}

export function medir(simulacao, valorFinal) {
  if (!Number.isFinite(valorFinal) || Math.abs(valorFinal) < 1e-12) {
    return null;
  }
  const { tempos, saidas } = simulacao;
  const normalizadas = Array.from(saidas, (valor) => valor / valorFinal);

  let indicePico = 0;
  for (let k = 1; k < normalizadas.length; k += 1) {
    if (normalizadas[k] > normalizadas[indicePico]) {
      indicePico = k;
    }
  }
  const sobressinal = Math.max(0, (normalizadas[indicePico] - 1) * 100);

  return {
    valorFinal,
    pico: saidas[indicePico],
    tempoDePico: sobressinal > 0 ? tempos[indicePico] : null,
    sobressinal,
    acomodacao2: acomodacao(tempos, normalizadas, 0.02),
    acomodacao5: acomodacao(tempos, normalizadas, 0.05),
  };
}

export function simularErro(dinamica, duracao) {
  const ordem = dinamica.length;
  const inicial = new Array(ordem).fill(1);
  const simulacao = simular(
    dinamica,
    M.zeros(ordem, 1),
    [new Array(ordem).fill(0)],
    { duracao, amplitude: 0, estadoInicial: inicial },
  );
  const norma = new Float64Array(simulacao.tempos.length);
  for (let k = 0; k < norma.length; k += 1) {
    norma[k] = Math.hypot(...simulacao.estados.map((serie) => serie[k]));
  }
  return { ...simulacao, saidas: norma };
}
