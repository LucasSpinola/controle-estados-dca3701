import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex, listaDePolosLatex } from '../../formatacao/matriz.js';
import { polinomioLatex } from '../../formatacao/latex.js';
import { blocoDoPolinomioDesejado, blocoDaMatrizDoPolinomio, conferirPolinomio } from './ackermann.js';

export const titulo = '**Passo 6:** Observador de estados pela fórmula de Ackermann';
export const abertoPorPadrao = true;

export function aplicavel(projeto) {
  return projeto.observador !== null;
}

export function renderizar(destino, projeto) {
  const { observador, sistema } = projeto;

  if (!observador.viavel) {
    aviso(destino, 'erro', observador.motivo);
    paragrafo(
      destino,
      'Sem observabilidade completa, $\\mathbf{V}^{-1}$ não existe e a fórmula de Ackermann não se aplica.',
    );
    return;
  }

  const ordem = sistema.ordem;
  const seletor = `\\begin{bmatrix} ${new Array(ordem).fill(0)
    .map((_, j) => (j === ordem - 1 ? '1' : '0')).join(' & ')} \\end{bmatrix}^{\\mathsf{T}}`;

  paragrafo(
    destino,
    'O observador reconstrói o estado com '
    + '$\\dot{\\tilde{\\mathbf{x}}} = \\mathbf{A}\\tilde{\\mathbf{x}} + \\mathbf{B}u '
    + '+ \\mathbf{L}(y - \\mathbf{C}\\tilde{\\mathbf{x}})$. O erro '
    + '$\\mathbf{e} = \\mathbf{x} - \\tilde{\\mathbf{x}}$ segue '
    + '$\\dot{\\mathbf{e}} = (\\mathbf{A} - \\mathbf{L}\\mathbf{C})\\mathbf{e}$, então os polos pedidos '
    + 'são os de $\\mathbf{A} - \\mathbf{L}\\mathbf{C}$:',
  );
  formula(destino, `\\mathbf{L} = q_o(\\mathbf{A})\\,\\mathbf{V}^{-1} ${seletor}`);

  separador(destino);
  blocoDoPolinomioDesejado(destino, observador.polosDesejados, observador.desejado, 'q_o');

  separador(destino);
  blocoDaMatrizDoPolinomio(destino, observador.avaliacao, 'q_o', ordem <= 4);

  separador(destino);
  paragrafo(destino, 'Juntando as parcelas:');
  formula(destino, `\\mathbf{V}^{-1}${seletor} = ${matrizLatex(observador.intermediaria)}`);
  formula(
    destino,
    `\\mathbf{L} = ${matrizLatex(observador.avaliacao.total)} \\cdot `
    + `${matrizLatex(observador.intermediaria)} = ${matrizLatex(observador.ganho)}`,
  );

  aviso(
    destino,
    'sucesso',
    `**Ganho do observador:** $\\mathbf{L} = ${matrizLatex(observador.ganho)}$.`,
  );

  separador(destino);
  paragrafo(destino, '**Dinâmica do erro de estimação:**');
  formula(destino, `\\mathbf{A} - \\mathbf{L}\\mathbf{C} = ${matrizLatex(observador.erro)}`);
  formula(
    destino,
    `\\det\\left(s\\mathbf{I} - (\\mathbf{A} - \\mathbf{L}\\mathbf{C})\\right) = `
    + polinomioLatex(observador.caracteristicoObtido),
  );
  formula(destino, listaDePolosLatex(observador.polosObtidos));
  conferirPolinomio(destino, observador.desejado, observador.caracteristicoObtido);
}
