import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { sistemaLatex } from '../../formatacao/matriz.js';
import { razaoLatex, polinomioLatex } from '../../formatacao/latex.js';
import { numeroLatex } from '../../formatacao/numero.js';
import { FORMAS } from '../../espaco/sistema.js';

export const titulo = '**Passo 1:** O sistema em espaço de estados';
export const abertoPorPadrao = true;

function blocoDaCanonica(destino, sistema) {
  const { alfa, beta, ordem, forma } = sistema;
  const nome = FORMAS[forma].nome;

  paragrafo(
    destino,
    `Com $G(s)$ escrita com o denominador mônico, os coeficientes entram direto na ${nome}:`,
  );
  formula(
    destino,
    `G(s) = \\frac{\\beta_1 s^{n-1} + \\beta_2 s^{n-2} + \\dots + \\beta_n}`
    + '{s^{n} + \\alpha_1 s^{n-1} + \\dots + \\alpha_n}',
  );

  const alfaTexto = alfa
    .map((valor, i) => `\\alpha_{${i + 1}} = ${numeroLatex(valor)}`)
    .join(', \\quad ');
  const betaTexto = beta
    .map((valor, i) => `\\beta_{${i + 1}} = ${numeroLatex(valor)}`)
    .join(', \\quad ');
  formula(destino, `n = ${ordem}, \\qquad ${alfaTexto}`);
  formula(destino, betaTexto);

  if (Math.abs(sistema.direto) > 1e-10) {
    aviso(
      destino,
      'informacao',
      `O numerador tem o mesmo grau do denominador, então sai a parcela direta $D = ${numeroLatex(sistema.direto)}$ `
      + 'e o resto, estritamente próprio, vira a canônica.',
    );
  }

  separador(destino);
  paragrafo(destino, `**${nome[0].toUpperCase()}${nome.slice(1)}:**`);
  formula(destino, sistemaLatex(sistema));
}

function blocoDasMatrizes(destino, sistema) {
  paragrafo(destino, '**Matrizes informadas:**');
  formula(destino, sistemaLatex(sistema));
  formula(
    destino,
    `\\dot{\\mathbf{x}} = \\mathbf{A}\\mathbf{x} + \\mathbf{B}u, \\qquad y = \\mathbf{C}\\mathbf{x}`,
  );
}

export function renderizar(destino, projeto) {
  const { sistema, transferencia } = projeto;

  if (sistema.origem === 'transferencia') {
    paragrafo(destino, '**Função de transferência dada:**');
    formula(
      destino,
      `G(s) = ${razaoLatex(sistema.entrada.numerador, sistema.entrada.denominador)}`,
    );
    separador(destino);
    blocoDaCanonica(destino, sistema);
  } else {
    blocoDasMatrizes(destino, sistema);
  }

  separador(destino);
  paragrafo(
    destino,
    'Conferindo pelo caminho inverso, $G(s) = \\mathbf{C}(s\\mathbf{I} - \\mathbf{A})^{-1}\\mathbf{B}'
    + (Math.abs(sistema.direto) > 1e-10 ? ' + D' : '') + '$:',
  );
  formula(destino, `G(s) = ${razaoLatex(transferencia.numerador, transferencia.denominador)}`);

  paragrafo(
    destino,
    `O polinômio do denominador, $${polinomioLatex(transferencia.denominador)}$, é o próprio `
    + 'polinômio característico tratado no passo 2.',
  );
}
