import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex, listaDePolosLatex } from '../../formatacao/matriz.js';
import { polinomioLatex } from '../../formatacao/latex.js';
import { numeroLatex, fixoLatex } from '../../formatacao/numero.js';
import { blocoDoPolinomioDesejado, blocoDaMatrizDoPolinomio, conferirPolinomio } from './ackermann.js';

export const titulo = '**Passo 7:** Seguidor de referência para o degrau';
export const abertoPorPadrao = true;

export function aplicavel(projeto) {
  return projeto.seguidor !== null;
}

export function renderizar(destino, projeto) {
  const { seguidor, sistema } = projeto;
  const ordem = sistema.ordem;

  paragrafo(
    destino,
    'Para o erro em regime ir a zero no degrau, entra um integrador do erro, '
    + '$\\dot{\\xi} = r - y = r - \\mathbf{C}\\mathbf{x}$, e o estado aumentado passa a ser '
    + '$\\hat{\\mathbf{x}} = \\begin{bmatrix} \\mathbf{x} \\\\ \\xi \\end{bmatrix}$:',
  );
  formula(
    destino,
    '\\hat{\\mathbf{A}} = \\begin{bmatrix} \\mathbf{A} & \\mathbf{0} \\\\ -\\mathbf{C} & 0 \\end{bmatrix}, '
    + '\\qquad \\hat{\\mathbf{B}} = \\begin{bmatrix} \\mathbf{B} \\\\ 0 \\end{bmatrix}, '
    + '\\qquad \\mathbf{B}_r = \\begin{bmatrix} \\mathbf{0} \\\\ 1 \\end{bmatrix}',
  );
  formula(
    destino,
    `\\hat{\\mathbf{A}} = ${matrizLatex(seguidor.aumentado.a)}, \\qquad `
    + `\\hat{\\mathbf{B}} = ${matrizLatex(seguidor.aumentado.b)}`,
  );

  if (!seguidor.viavel) {
    aviso(destino, 'erro', seguidor.motivo);
    if (seguidor.alocacao?.controle) {
      formula(
        destino,
        `\\hat{\\mathbf{U}} = ${matrizLatex(seguidor.alocacao.controle.matriz)}, \\qquad `
        + `\\det \\hat{\\mathbf{U}} = ${numeroLatex(seguidor.alocacao.controle.determinante)}`,
      );
      paragrafo(
        destino,
        'O sistema aumentado é controlável quando $\\begin{bmatrix} \\mathbf{A} & \\mathbf{B} \\\\ '
        + '-\\mathbf{C} & 0 \\end{bmatrix}$ é não singular, o que exige, entre outras coisas, que '
        + '$G(s)$ não tenha zero na origem.',
      );
    }
    return;
  }

  const { alocacao } = seguidor;
  const seletor = `\\begin{bmatrix} ${new Array(ordem + 1).fill(0)
    .map((_, j) => (j === ordem ? '1' : '0')).join(' & ')} \\end{bmatrix}`;

  separador(destino);
  formula(
    destino,
    `\\hat{\\mathbf{U}} = ${matrizLatex(alocacao.controle.matriz)}, \\qquad `
    + `\\det \\hat{\\mathbf{U}} = ${numeroLatex(alocacao.controle.determinante)} \\ne 0`,
  );
  paragrafo(destino, 'O par aumentado é controlável, então os $n + 1$ polos podem ser alocados.');

  separador(destino);
  blocoDoPolinomioDesejado(destino, seguidor.polosDesejados, alocacao.desejado, 'q');

  separador(destino);
  blocoDaMatrizDoPolinomio(destino, alocacao.avaliacao, 'q', ordem + 1 <= 4);

  separador(destino);
  paragrafo(destino, 'Ackermann sobre o par aumentado:');
  formula(destino, `\\hat{\\mathbf{K}} = -${seletor}\\,\\hat{\\mathbf{U}}^{-1} q(\\hat{\\mathbf{A}})`);
  formula(destino, `\\hat{\\mathbf{K}} = ${matrizLatex(seguidor.ganhoCompleto)}`);

  separador(destino);
  paragrafo(destino, 'Separando a parte de estados e o ganho do integrador:');
  formula(
    destino,
    `\\mathbf{K} = ${matrizLatex(seguidor.ganhoEstados)}, \\qquad `
    + `k_I = ${numeroLatex(seguidor.ganhoIntegral)}`,
  );
  formula(destino, 'u(t) = \\mathbf{K}\\mathbf{x}(t) + k_I\\,\\xi(t), \\qquad \\dot{\\xi} = r - y');

  aviso(
    destino,
    'sucesso',
    `**Lei de controle:** $u = ${matrizLatex(seguidor.ganhoEstados)}\\mathbf{x} `
    + `+ ${numeroLatex(seguidor.ganhoIntegral)}\\,\\xi$.`,
  );

  separador(destino);
  paragrafo(destino, '**Malha fechada do seguidor:**');
  formula(
    destino,
    `\\hat{\\mathbf{A}} + \\hat{\\mathbf{B}}\\hat{\\mathbf{K}} = ${matrizLatex(seguidor.malhaFechada)}`,
  );
  formula(destino, `\\det(s\\mathbf{I} - \\ldots) = ${polinomioLatex(alocacao.caracteristicoObtido)}`);
  formula(destino, listaDePolosLatex(seguidor.polosObtidos));
  conferirPolinomio(destino, alocacao.desejado, alocacao.caracteristicoObtido);

  if (seguidor.ganhoEstatico !== null) {
    formula(
      destino,
      `\\frac{y(\\infty)}{r} = \\hat{\\mathbf{C}}\\left(-(\\hat{\\mathbf{A}} + `
      + `\\hat{\\mathbf{B}}\\hat{\\mathbf{K}})\\right)^{-1}\\mathbf{B}_r = ${fixoLatex(seguidor.ganhoEstatico, 6)}`,
    );
    aviso(
      destino,
      Math.abs(seguidor.ganhoEstatico - 1) < 1e-6 ? 'sucesso' : 'atencao',
      `O ganho estático vale ${fixoLatex(seguidor.ganhoEstatico, 6)}: o integrador zera o erro de regime `
      + 'para a entrada em degrau, sem precisar de ganho de pré-alimentação.',
    );
  }
}
