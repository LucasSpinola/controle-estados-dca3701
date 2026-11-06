import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex, listaDePolosLatex } from '../../formatacao/matriz.js';
import { polinomioLatex } from '../../formatacao/latex.js';
import { blocoDoPolinomioDesejado, blocoDaMatrizDoPolinomio, conferirPolinomio } from './ackermann.js';

export const titulo = '**Passo 5:** Realimentação de estados pela fórmula de Ackermann';
export const abertoPorPadrao = true;

export function aplicavel(projeto) {
  return projeto.realimentacao !== null;
}

export function renderizar(destino, projeto) {
  const { realimentacao, sistema } = projeto;

  if (!realimentacao.viavel) {
    aviso(destino, 'erro', realimentacao.motivo);
    paragrafo(
      destino,
      'Sem controlabilidade completa, $\\mathbf{U}^{-1}$ não existe e a fórmula de Ackermann não se aplica. '
      + 'Só os modos controláveis poderiam ser movidos.',
    );
    return;
  }

  const ordem = sistema.ordem;
  const seletor = `\\begin{bmatrix} ${new Array(ordem).fill(0)
    .map((_, j) => (j === ordem - 1 ? '1' : '0')).join(' & ')} \\end{bmatrix}`;

  paragrafo(
    destino,
    'Com $u(t) = \\mathbf{K}\\mathbf{x}(t)$, a malha fechada vira '
    + '$\\dot{\\mathbf{x}} = (\\mathbf{A} + \\mathbf{B}\\mathbf{K})\\mathbf{x}$, e o ganho sai de:',
  );
  formula(destino, `\\mathbf{K} = -${seletor}\\,\\mathbf{U}^{-1} q_c(\\mathbf{A})`);

  separador(destino);
  blocoDoPolinomioDesejado(destino, realimentacao.polosDesejados, realimentacao.desejado, 'q_c');

  separador(destino);
  blocoDaMatrizDoPolinomio(destino, realimentacao.avaliacao, 'q_c', ordem <= 4);

  separador(destino);
  paragrafo(destino, 'Juntando as parcelas:');
  formula(
    destino,
    `${seletor}\\,\\mathbf{U}^{-1} = ${matrizLatex(realimentacao.intermediaria)}`,
  );
  formula(
    destino,
    `\\mathbf{K} = -${matrizLatex(realimentacao.intermediaria)} \\cdot `
    + `${matrizLatex(realimentacao.avaliacao.total)} = ${matrizLatex(realimentacao.ganho)}`,
  );

  aviso(
    destino,
    'sucesso',
    `**Ganho de realimentação:** $\\mathbf{K} = ${matrizLatex(realimentacao.ganho)}$, para $u = \\mathbf{K}\\mathbf{x}$.`,
  );
  paragrafo(
    destino,
    `Na convenção $u = -\\mathbf{K}\\mathbf{x}$, usada por boa parte da bibliografia, o mesmo projeto dá `
    + `$\\mathbf{K} = ${matrizLatex(realimentacao.ganhoNegativo)}$.`,
  );

  separador(destino);
  paragrafo(destino, '**Malha fechada:**');
  formula(destino, `\\mathbf{A} + \\mathbf{B}\\mathbf{K} = ${matrizLatex(realimentacao.malhaFechada)}`);
  formula(
    destino,
    `\\det\\left(s\\mathbf{I} - (\\mathbf{A} + \\mathbf{B}\\mathbf{K})\\right) = `
    + polinomioLatex(realimentacao.caracteristicoObtido),
  );
  formula(destino, listaDePolosLatex(realimentacao.polosObtidos));
  conferirPolinomio(destino, realimentacao.desejado, realimentacao.caracteristicoObtido);
}
