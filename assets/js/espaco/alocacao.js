import * as M from '../nucleo/matriz.js';
import { raizes, ordenarParaExibicao } from '../nucleo/raizes.js';
import { polinomioDosPolos } from '../nucleo/polos.js';
import { controlabilidade, observabilidade } from './analise.js';

function ultimaLinha(ordem) {
  return [new Array(ordem).fill(0).map((_, j) => (j === ordem - 1 ? 1 : 0))];
}

function ultimaColuna(ordem) {
  return M.coluna(new Array(ordem).fill(0).map((_, i) => (i === ordem - 1 ? 1 : 0)));
}

export function avaliarNaMatriz(a, coeficientes) {
  const grau = coeficientes.length - 1;
  const potencias = M.potencias(a, grau);
  const termos = coeficientes.map((coeficiente, k) => ({
    coeficiente,
    expoente: grau - k,
    potencia: potencias[grau - k],
    parcela: M.escalar(potencias[grau - k], coeficiente),
  }));
  const total = termos.reduce((soma, termo) => M.somar(soma, termo.parcela), M.zeros(a.length));
  return { termos, total, potencias };
}

export function projetarRealimentacao(sistema, polosDesejados) {
  const { a, b } = sistema;
  const ordem = a.length;
  const controle = controlabilidade(a, b);

  if (!controle.completa) {
    return {
      viavel: false,
      controle,
      motivo: 'O sistema não é controlável, então os polos de malha fechada não podem ser alocados livremente.',
    };
  }

  const desejado = polinomioDosPolos(polosDesejados);
  const avaliacao = avaliarNaMatriz(a, desejado);
  const seletor = ultimaLinha(ordem);
  const intermediaria = M.multiplicar(seletor, controle.inversa);
  const ganho = M.escalar(M.multiplicar(intermediaria, avaliacao.total), -1);

  const malhaFechada = M.somar(a, M.multiplicar(b, ganho));
  const obtido = M.caracteristico(malhaFechada);

  return {
    viavel: true,
    controle,
    desejado,
    avaliacao,
    seletor,
    intermediaria,
    ganho,
    ganhoNegativo: M.escalar(ganho, -1),
    malhaFechada,
    caracteristicoObtido: obtido.coeficientes,
    polosObtidos: ordenarParaExibicao(raizes(obtido.coeficientes)),
    polosDesejados,
  };
}

export function projetarObservador(sistema, polosDesejados) {
  const { a, c } = sistema;
  const ordem = a.length;
  const observacao = observabilidade(a, c);

  if (!observacao.completa) {
    return {
      viavel: false,
      observacao,
      motivo: 'O sistema não é observável, então os polos do observador não podem ser alocados livremente.',
    };
  }

  const desejado = polinomioDosPolos(polosDesejados);
  const avaliacao = avaliarNaMatriz(a, desejado);
  const seletor = ultimaColuna(ordem);
  const intermediaria = M.multiplicar(observacao.inversa, seletor);
  const ganho = M.multiplicar(avaliacao.total, intermediaria);

  const erro = M.subtrair(a, M.multiplicar(ganho, c));
  const obtido = M.caracteristico(erro);

  return {
    viavel: true,
    observacao,
    desejado,
    avaliacao,
    seletor,
    intermediaria,
    ganho,
    erro,
    caracteristicoObtido: obtido.coeficientes,
    polosObtidos: ordenarParaExibicao(raizes(obtido.coeficientes)),
    polosDesejados,
  };
}
