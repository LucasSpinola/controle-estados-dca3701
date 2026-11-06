import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex } from '../../formatacao/matriz.js';
import { numeroLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 4:** Matriz de observabilidade';
export const abertoPorPadrao = true;

function rotuloDaLinha(indice) {
  if (indice === 0) {
    return '\\mathbf{C}';
  }
  if (indice === 1) {
    return '\\mathbf{C}\\mathbf{A}';
  }
  return `\\mathbf{C}\\mathbf{A}^{${indice}}`;
}

export function renderizar(destino, projeto) {
  const observacao = projeto.analise.observabilidade;
  const { ordem } = observacao;

  paragrafo(destino, 'A matriz de observabilidade empilha as linhas $\\mathbf{C}\\mathbf{A}^k$:');
  formula(
    destino,
    `\\mathbf{V} = \\begin{bmatrix} ${observacao.linhas
      .map((_, indice) => rotuloDaLinha(indice))
      .join(' \\\\ ')} \\end{bmatrix}`,
  );

  for (let indice = 1; indice < observacao.linhas.length; indice += 1) {
    formula(
      destino,
      `${rotuloDaLinha(indice)} = ${rotuloDaLinha(indice - 1)}\\cdot \\mathbf{A} `
      + `= ${matrizLatex(observacao.linhas[indice])}`,
    );
  }

  separador(destino);
  formula(destino, `\\mathbf{V} = ${matrizLatex(observacao.matriz)}`);
  formula(
    destino,
    `\\det \\mathbf{V} = ${numeroLatex(observacao.determinante)}, \\qquad `
    + `\\operatorname{posto}(\\mathbf{V}) = ${observacao.posto} \\;\\text{de}\\; ${ordem}`,
  );

  if (observacao.completa) {
    aviso(
      destino,
      'sucesso',
      'O posto é completo ($\\det \\mathbf{V} \\ne 0$), então **o sistema é observável** e o estado '
      + 'inteiro pode ser reconstruído a partir da saída.',
    );
    separador(destino);
    paragrafo(destino, 'A inversa, que Ackermann usa no passo do observador:');
    formula(destino, `\\mathbf{V}^{-1} = ${matrizLatex(observacao.inversa)}`);
  } else {
    aviso(
      destino,
      'erro',
      `O posto é ${observacao.posto}, menor que a ordem ${ordem} ($\\det \\mathbf{V} = 0$), então `
      + '**o sistema não é observável**: há estado que não aparece na saída.',
    );
  }
}
