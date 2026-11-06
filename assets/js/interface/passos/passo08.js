import {
  formula, paragrafo, separador, aviso, quadroDeGrafico,
} from '../componentes.js';
import { tabelaLatex } from '../../formatacao/matriz.js';
import { polinomioLatex, complexoLatex } from '../../formatacao/latex.js';
import { fixoLatex } from '../../formatacao/numero.js';
import { criarGraficoTemporal } from '../../grafico/fabrica.js';
import {
  CORES, desenharResposta, desenharNivel, desenharFaixa,
} from '../../grafico/camadas.js';

export const titulo = '**Passo 8:** Verificação no tempo';
export const abertoPorPadrao = true;

export function aplicavel(projeto) {
  return projeto.resposta !== null
    || projeto.erroDoObservador !== null
    || projeto.respostaDoSeguidor !== null
    || projeto.compensado !== null;
}

function tempoLatex(valor) {
  if (valor === null) {
    return '\\text{sem pico}';
  }
  if (!Number.isFinite(valor)) {
    return '\\text{não acomoda}';
  }
  return `${fixoLatex(valor, 3)}\\,\\text{s}`;
}

function tabelaDeMetricas(destino, metricas) {
  if (metricas === null) {
    return;
  }
  formula(
    destino,
    tabelaLatex(
      ['\\text{Grandeza}', '\\text{Simulado}'],
      [
        ['M_P', `${fixoLatex(metricas.sobressinal, 2)}\\%`],
        ['t_p', tempoLatex(metricas.tempoDePico)],
        ['t_s(2\\%)', tempoLatex(metricas.acomodacao2)],
        ['t_s(5\\%)', tempoLatex(metricas.acomodacao5)],
        ['y(\\infty)', fixoLatex(metricas.valorFinal, 4)],
      ],
    ),
  );
}

function desenharDegrau(destino, resposta, titulo, criterio = 2) {
  const saidas = Array.from(resposta.simulacao.saidas);
  const grafico = criarGraficoTemporal(
    resposta.simulacao.duracao,
    Math.min(...saidas),
    Math.max(...saidas),
    titulo,
  );
  const final = resposta.metricas?.valorFinal ?? resposta.ganhoEstatico;
  if (Number.isFinite(final) && Math.abs(final) > 1e-12) {
    desenharFaixa(grafico, final, criterio / 100);
    desenharNivel(grafico, final, CORES.valorFinal, 'Valor final');
  }
  desenharResposta(grafico, resposta.simulacao, { legenda: 'y(t)' });
  quadroDeGrafico(destino, grafico.elemento());
}

function blocoDaRealimentacao(destino, projeto) {
  const { resposta } = projeto;
  paragrafo(
    destino,
    'Resposta ao degrau de $\\dot{\\mathbf{x}} = (\\mathbf{A} + \\mathbf{B}\\mathbf{K})\\mathbf{x} + \\mathbf{B}r$, '
    + 'com $y = \\mathbf{C}\\mathbf{x}$, simulada em espaço de estados.',
  );
  if (resposta.ganhoEstatico !== null) {
    formula(destino, `y(\\infty) = ${fixoLatex(resposta.ganhoEstatico, 4)}`);
    if (Math.abs(resposta.ganhoEstatico - 1) > 1e-3) {
      aviso(
        destino,
        'informacao',
        'A realimentação de estados pura coloca os polos onde se pediu, mas não zera o erro de regime: '
        + `a saída estaciona em ${fixoLatex(resposta.ganhoEstatico, 4)} para um degrau unitário. Para seguir a `
        + 'referência é preciso o ganho de pré-alimentação ou o seguidor com integrador.',
      );
    }
  }
  tabelaDeMetricas(destino, resposta.metricas);
  desenharDegrau(destino, resposta, 'Resposta ao degrau com realimentação de estados');
}

function blocoDoObservador(destino, projeto) {
  const erro = projeto.erroDoObservador;
  paragrafo(
    destino,
    'Partindo de $\\mathbf{e}(0) = [1\\;1\\;\\ldots\\;1]^{\\mathsf{T}}$, a norma do erro de estimação '
    + '$\\|\\mathbf{e}(t)\\|$ sob $\\dot{\\mathbf{e}} = (\\mathbf{A} - \\mathbf{L}\\mathbf{C})\\mathbf{e}$:',
  );
  const saidas = Array.from(erro.saidas);
  const grafico = criarGraficoTemporal(
    erro.duracao,
    0,
    Math.max(...saidas),
    'Erro de estimação do observador',
    { x: 'Tempo (s)', y: 'Norma do erro' },
  );
  desenharResposta(grafico, erro, { cor: CORES.observador, legenda: '‖e(t)‖' });
  quadroDeGrafico(destino, grafico.elemento());
}

function blocoDoSeguidor(destino, projeto) {
  const resposta = projeto.respostaDoSeguidor;
  paragrafo(
    destino,
    'Resposta ao degrau unitário na referência, com o integrador do erro em malha: '
    + '$\\dot{\\hat{\\mathbf{x}}} = (\\hat{\\mathbf{A}} + \\hat{\\mathbf{B}}\\hat{\\mathbf{K}})\\hat{\\mathbf{x}} '
    + '+ \\mathbf{B}_r r$.',
  );
  tabelaDeMetricas(destino, resposta.metricas);
  desenharDegrau(destino, resposta, 'Resposta do seguidor ao degrau unitário');
  if (resposta.metricas && Math.abs(resposta.metricas.valorFinal - 1) < 1e-6) {
    aviso(destino, 'sucesso', 'A saída chega a $y(\\infty) = 1$: o erro de regime ao degrau é nulo.');
  }
}

function blocoDoCompensado(destino, projeto) {
  const { compensado } = projeto;
  paragrafo(
    destino,
    'Com o controlador alimentado pelo estado estimado, a dinâmica conjunta é '
    + '$\\begin{bmatrix} \\mathbf{A} & \\mathbf{B}\\mathbf{K} \\\\ \\mathbf{L}\\mathbf{C} & '
    + '\\mathbf{A} + \\mathbf{B}\\mathbf{K} - \\mathbf{L}\\mathbf{C} \\end{bmatrix}$, de ordem $2n$:',
  );
  formula(destino, `\\det(s\\mathbf{I} - \\ldots) = ${polinomioLatex(compensado.caracteristico)}`);
  formula(
    destino,
    tabelaLatex(
      ['\\text{Polo}', '\\text{Valor}'],
      compensado.polos.map((polo, indice) => [`s_{${indice + 1}}`, complexoLatex(polo, 4)]),
    ),
  );
  aviso(
    destino,
    'informacao',
    'O conjunto reúne exatamente os polos de $\\mathbf{A} + \\mathbf{B}\\mathbf{K}$ e os de '
    + '$\\mathbf{A} - \\mathbf{L}\\mathbf{C}$: é o princípio da separação, que permite projetar os dois '
    + 'ganhos de forma independente.',
  );
}

export function renderizar(destino, projeto) {
  let primeiro = true;
  const bloco = (funcao) => {
    if (!primeiro) {
      separador(destino);
    }
    primeiro = false;
    funcao(destino, projeto);
  };

  if (projeto.compensado !== null) {
    bloco(blocoDoCompensado);
  }
  if (projeto.resposta !== null) {
    bloco(blocoDaRealimentacao);
  } else if (projeto.realimentacao?.viavel) {
    bloco((alvo) => aviso(
      alvo,
      'atencao',
      'A malha fechada tem polo fora do semiplano esquerdo, então não há resposta ao degrau para medir.',
    ));
  }
  if (projeto.erroDoObservador !== null) {
    bloco(blocoDoObservador);
  }
  if (projeto.respostaDoSeguidor !== null) {
    bloco(blocoDoSeguidor);
  } else if (projeto.seguidor?.viavel) {
    bloco((alvo) => aviso(
      alvo,
      'atencao',
      'O seguidor ficou com polo fora do semiplano esquerdo, então não há resposta estável para medir.',
    ));
  }
  if (primeiro) {
    paragrafo(destino, 'Sem projeto de ganhos, não há malha fechada para simular.');
  }
}
