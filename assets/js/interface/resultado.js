import {
  elemento, formula, paragrafo, secao,
} from './componentes.js';
import { montarBarraDeResultado } from './ferramentas.js';
import { passos } from './passos/indice.js';
import * as planoFinal from './passos/plano.js';
import { OBJETIVOS } from '../espaco/projeto.js';
import { sistemaLatex, listaDePolosLatex } from '../formatacao/matriz.js';
import { razaoLatex } from '../formatacao/latex.js';
import { FORMAS } from '../espaco/sistema.js';

const ROTULOS_DOS_POLOS = {
  polosK: '\\text{Polos de malha fechada}',
  polosL: '\\text{Polos do observador}',
  polosSeguidor: '\\text{Polos do seguidor}',
};

export function tituloDoArquivo(projeto, questao) {
  if (questao) {
    return `${questao.exercicio} - ${questao.nome}`;
  }
  return `Projeto - ${OBJETIVOS[projeto.objetivo].curto}`;
}

function montarCabecalho(destino, projeto, questao) {
  const { entrada, sistema } = projeto;
  const bloco = elemento('section', 'enunciado');
  bloco.appendChild(elemento(
    'p',
    'enunciado-etiqueta',
    questao ? `${questao.exercicio} · ${questao.nome}` : 'Dados do projeto',
  ));

  for (const texto of questao?.enunciado || []) {
    paragrafo(bloco, texto);
  }

  const dados = elemento('div', 'enunciado-dados');
  if (sistema.origem === 'transferencia') {
    formula(
      dados,
      `G(s) = ${razaoLatex(sistema.entrada.numerador, sistema.entrada.denominador)} `
      + `\\quad \\text{(${FORMAS[sistema.forma].nome})}`,
    );
  }
  formula(dados, sistemaLatex(sistema));
  formula(dados, `\\text{Objetivo: ${OBJETIVOS[projeto.objetivo].nome}}`);

  for (const nome of OBJETIVOS[projeto.objetivo].polos) {
    formula(dados, `${ROTULOS_DOS_POLOS[nome]}: ${listaDePolosLatex(entrada[nome])}`);
  }
  bloco.appendChild(dados);
  destino.appendChild(bloco);
}

export function renderizarResultado(destino, projeto, opcoes = {}) {
  const { questao = null, barra = true, aberto = false } = opcoes;
  if (barra) {
    montarBarraDeResultado(destino, tituloDoArquivo(projeto, questao));
  }
  montarCabecalho(destino, projeto, questao);

  for (const passo of passos) {
    if (passo.aplicavel && !passo.aplicavel(projeto)) {
      continue;
    }
    const titulo = passo.tituloPara ? passo.tituloPara(projeto) : passo.titulo;
    const corpo = secao(destino, titulo, aberto || passo.abertoPorPadrao === true);
    passo.renderizar(corpo, projeto);
  }

  planoFinal.renderizar(destino, projeto, aberto);
}
