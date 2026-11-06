import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex } from '../../formatacao/matriz.js';
import { numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 3:** Matriz de controlabilidade';
export const abertoPorPadrao = true;

function rotuloDaColuna(indice) {
  if (indice === 0) {
    return '\\mathbf{B}';
  }
  if (indice === 1) {
    return '\\mathbf{A}\\mathbf{B}';
  }
  return `\\mathbf{A}^{${indice}}\\mathbf{B}`;
}

export function renderizar(destino, projeto) {
  const controle = projeto.analise.controlabilidade;
  const { ordem } = controle;

  paragrafo(destino, 'A matriz de controlabilidade empilha as colunas $\\mathbf{A}^k\\mathbf{B}$:');
  formula(
    destino,
    `\\mathbf{U} = \\begin{bmatrix} ${controle.colunas
      .map((_, indice) => rotuloDaColuna(indice))
      .join(' & ')} \\end{bmatrix}`,
  );

  for (let indice = 1; indice < controle.colunas.length; indice += 1) {
    formula(
      destino,
      `${rotuloDaColuna(indice)} = \\mathbf{A}\\cdot ${rotuloDaColuna(indice - 1)} `
      + `= ${matrizLatex(controle.colunas[indice])}`,
    );
  }

  separador(destino);
  formula(destino, `\\mathbf{U} = ${matrizLatex(controle.matriz)}`);
  formula(
    destino,
    `\\det \\mathbf{U} = ${numeroLatex(controle.determinante)}, \\qquad `
    + `\\operatorname{posto}(\\mathbf{U}) = ${controle.posto} \\;\\text{de}\\; ${ordem}`,
  );

  if (controle.completa) {
    aviso(
      destino,
      'sucesso',
      `O posto é completo ($\\det \\mathbf{U} \\ne 0$), então **o sistema é controlável** e os polos de `
      + 'malha fechada podem ser colocados onde se quiser pela realimentação de estados.',
    );
    separador(destino);
    paragrafo(destino, 'A inversa, que Ackermann usa no passo da realimentação:');
    formula(destino, `\\mathbf{U}^{-1} = ${matrizLatex(controle.inversa)}`);
  } else {
    aviso(
      destino,
      'erro',
      `O posto é ${controle.posto}, menor que a ordem ${ordem} ($\\det \\mathbf{U} = 0$), então `
      + '**o sistema não é controlável**: existe uma parte do estado que a entrada não alcança.',
    );
  }
}
