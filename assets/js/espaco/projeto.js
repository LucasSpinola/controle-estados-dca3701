import * as M from '../nucleo/matriz.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';
import { montarSistema, funcaoDeTransferencia } from './sistema.js';
import { analisar } from './analise.js';
import { projetarRealimentacao, projetarObservador } from './alocacao.js';
import { projetarSeguidor } from './seguidor.js';
import {
  horizonte, simular, simularErro, medir,
} from './simulacao.js';

export const OBJETIVOS = {
  analise: {
    nome: 'Análise: estabilidade, controlabilidade e observabilidade',
    curto: 'Análise',
    polos: [],
  },
  realimentacao: {
    nome: 'Realimentação de estados, u = Kx',
    curto: 'Realimentação de estados',
    polos: ['polosK'],
  },
  observador: {
    nome: 'Observador de estados',
    curto: 'Observador de estados',
    polos: ['polosL'],
  },
  completo: {
    nome: 'Realimentação de estados e observador',
    curto: 'Realimentação e observador',
    polos: ['polosK', 'polosL'],
  },
  seguidor: {
    nome: 'Seguidor de referência para degrau',
    curto: 'Seguidor de referência',
    polos: ['polosSeguidor'],
  },
};

export function precisaDe(objetivo, campo) {
  return (OBJETIVOS[objetivo] || OBJETIVOS.analise).polos.includes(campo);
}

function respostaDaRealimentacao(sistema, realimentacao) {
  if (!realimentacao || !realimentacao.viavel) {
    return null;
  }
  const estaveis = realimentacao.polosObtidos.every((polo) => polo.re < 0);
  if (!estaveis) {
    return null;
  }
  const duracao = horizonte(realimentacao.polosObtidos);
  const simulacao = simular(realimentacao.malhaFechada, sistema.b, sistema.c, {
    duracao,
    direto: sistema.direto,
  });
  const inversa = M.inversa(M.escalar(realimentacao.malhaFechada, -1));
  const ganhoEstatico = inversa === null
    ? null
    : M.multiplicar(M.multiplicar(sistema.c, inversa), sistema.b)[0][0] + sistema.direto;
  return { simulacao, ganhoEstatico, metricas: medir(simulacao, ganhoEstatico) };
}

function respostaDoObservador(observador) {
  if (!observador || !observador.viavel) {
    return null;
  }
  if (!observador.polosObtidos.every((polo) => polo.re < 0)) {
    return null;
  }
  return simularErro(observador.erro, horizonte(observador.polosObtidos));
}

function respostaDoSeguidor(seguidor) {
  if (!seguidor || !seguidor.viavel) {
    return null;
  }
  if (!seguidor.polosObtidos.every((polo) => polo.re < 0)) {
    return null;
  }
  const duracao = horizonte(seguidor.polosObtidos);
  const simulacao = simular(
    seguidor.malhaFechada,
    seguidor.aumentado.referencia,
    seguidor.aumentado.c,
    { duracao },
  );
  return { simulacao, metricas: medir(simulacao, seguidor.ganhoEstatico) };
}

function montarCompensado(sistema, realimentacao, observador) {
  if (!realimentacao?.viavel || !observador?.viavel) {
    return null;
  }
  const { a, b, c } = sistema;
  const bk = M.multiplicar(b, realimentacao.ganho);
  const lc = M.multiplicar(observador.ganho, c);
  const matriz = M.juntarLinhas([
    M.juntarColunas([a, bk]),
    M.juntarColunas([lc, M.subtrair(M.somar(a, bk), lc)]),
  ]);
  const { coeficientes } = M.caracteristico(matriz);
  return {
    matriz,
    caracteristico: coeficientes,
    polos: ordenarParaExibicao(raizes(coeficientes)),
  };
}

export function projetar(entrada) {
  const sistema = montarSistema(entrada);
  const transferencia = funcaoDeTransferencia(sistema.a, sistema.b, sistema.c, sistema.direto);
  const analise = analisar(sistema);
  const objetivo = OBJETIVOS[entrada.objetivo] ? entrada.objetivo : 'analise';

  const querRealimentacao = objetivo === 'realimentacao' || objetivo === 'completo';
  const querObservador = objetivo === 'observador' || objetivo === 'completo';

  const realimentacao = querRealimentacao
    ? projetarRealimentacao(sistema, entrada.polosK)
    : null;
  const observador = querObservador ? projetarObservador(sistema, entrada.polosL) : null;
  const seguidor = objetivo === 'seguidor' ? projetarSeguidor(sistema, entrada.polosSeguidor) : null;

  return {
    entrada,
    objetivo,
    sistema,
    transferencia,
    analise,
    realimentacao,
    observador,
    seguidor,
    compensado: montarCompensado(sistema, realimentacao, observador),
    resposta: respostaDaRealimentacao(sistema, realimentacao),
    erroDoObservador: respostaDoObservador(observador),
    respostaDoSeguidor: respostaDoSeguidor(seguidor),
  };
}
