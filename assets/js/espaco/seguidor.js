import * as M from '../nucleo/matriz.js';
import { projetarRealimentacao } from './alocacao.js';

export function montarAumentado(sistema) {
  const { a, b, c } = sistema;
  const ordem = a.length;
  const zeroColuna = M.zeros(ordem, 1);

  const aAumentada = M.juntarLinhas([
    M.juntarColunas([a, zeroColuna]),
    M.juntarColunas([M.escalar(c, -1), [[0]]]),
  ]);
  const bAumentada = M.juntarLinhas([b, [[0]]]);
  const referencia = M.juntarLinhas([zeroColuna, [[1]]]);
  const saida = M.juntarColunas([c, [[0]]]);

  return {
    a: aAumentada, b: bAumentada, c: saida, referencia, ordem: ordem + 1, direto: 0,
  };
}

export function projetarSeguidor(sistema, polosDesejados) {
  const aumentado = montarAumentado(sistema);
  const ordem = sistema.a.length;

  if (polosDesejados.length !== ordem + 1) {
    return {
      viavel: false,
      aumentado,
      motivo: `O seguidor tem ${ordem + 1} polos (a planta de ordem ${ordem} mais o integrador), `
        + `mas foram informados ${polosDesejados.length}.`,
    };
  }

  const alocacao = projetarRealimentacao(aumentado, polosDesejados);
  if (!alocacao.viavel) {
    return {
      viavel: false,
      aumentado,
      alocacao,
      motivo: 'O sistema aumentado não é controlável: com esta planta o seguidor com integrador não '
        + 'pode ter todos os polos alocados.',
    };
  }

  const ganhoCompleto = alocacao.ganho[0];
  const ganhoEstados = [ganhoCompleto.slice(0, ordem)];
  const ganhoIntegral = ganhoCompleto[ordem];

  const malhaFechada = alocacao.malhaFechada;
  const inversa = M.inversa(M.escalar(malhaFechada, -1));
  const ganhoEstatico = inversa === null
    ? null
    : M.multiplicar(M.multiplicar(aumentado.c, inversa), aumentado.referencia)[0][0];

  return {
    viavel: true,
    aumentado,
    alocacao,
    ganhoEstados,
    ganhoIntegral,
    ganhoCompleto: alocacao.ganho,
    malhaFechada,
    ganhoEstatico,
    polosObtidos: alocacao.polosObtidos,
    polosDesejados,
  };
}
