import { interpretarPolinomio, interpretarMatriz } from '../nucleo/entrada.js';
import { interpretarPolos } from '../nucleo/polos.js';
import { razaoLatex } from '../formatacao/latex.js';
import { matrizLatex, listaDePolosLatex } from '../formatacao/matriz.js';
import { montarSistema } from '../espaco/sistema.js';
import { estabilidade } from '../espaco/analise.js';
import { criarPlano, LIMITES_COMPACTOS } from '../grafico/fabrica.js';
import { desenharPolosAbertos, desenharEixoImaginario } from '../grafico/camadas.js';
import {
  elemento, escrever, formula, limparNo,
} from './componentes.js';
import {
  CAMPOS, VALORES_PADRAO, campo, atualizarModo, camposDePolos,
} from './formulario.js';
import { EXERCICIOS } from './exercicios.js';
import { passos } from './passos/indice.js';
import { imprimirLista } from './relatorio.js';

const ESPERA_DA_MINIATURA = 320;
let agendamentoDaMiniatura = null;
let questaoAtual = null;

function previaDaPlanta() {
  const destino = limparNo(document.getElementById('previa-planta'));
  destino.classList.remove('previa-invalida');

  if (campo('fonte').value === 'transferencia') {
    const numerador = interpretarPolinomio(campo('numerador').value);
    const denominador = interpretarPolinomio(campo('denominador').value);
    if (numerador === null || denominador === null) {
      destino.classList.add('previa-invalida');
      escrever(destino, 'Expressão inválida');
      return;
    }
    formula(destino, `G(s) = ${razaoLatex(numerador, denominador)}`);
    return;
  }

  const a = interpretarMatriz(campo('matrizA').value);
  const b = interpretarMatriz(campo('matrizB').value);
  const c = interpretarMatriz(campo('matrizC').value);
  if (a === null || b === null || c === null) {
    destino.classList.add('previa-invalida');
    escrever(destino, 'Matriz inválida');
    return;
  }
  formula(
    destino,
    `\\mathbf{A} = ${matrizLatex(a)}, \\; \\mathbf{B} = ${matrizLatex(b)}, \\; `
    + `\\mathbf{C} = ${matrizLatex(c)}`,
  );
}

function previaDosPolos() {
  const destino = limparNo(document.getElementById('previa-polos'));
  const nomes = camposDePolos(campo('objetivo').value);
  if (nomes.length === 0) {
    escrever(destino, 'A análise não pede polos.');
    return;
  }
  const polos = interpretarPolos(campo(nomes[0]).value);
  if (polos === null) {
    destino.classList.add('previa-invalida');
    escrever(destino, 'Lista de polos inválida');
    return;
  }
  destino.classList.remove('previa-invalida');
  formula(destino, listaDePolosLatex(polos));
}

function desenharMiniatura() {
  const destino = limparNo(document.getElementById('miniatura'));
  try {
    const entrada = campo('fonte').value === 'transferencia'
      ? {
        fonte: 'transferencia',
        numerador: interpretarPolinomio(campo('numerador').value),
        denominador: interpretarPolinomio(campo('denominador').value),
        forma: campo('forma').value,
      }
      : {
        fonte: 'matrizes',
        a: interpretarMatriz(campo('matrizA').value),
        b: interpretarMatriz(campo('matrizB').value),
        c: interpretarMatriz(campo('matrizC').value),
      };

    const sistema = montarSistema(entrada);
    const analise = estabilidade(sistema.a);
    const plano = criarPlano(analise.polos, '', { limites: LIMITES_COMPACTOS, semLegenda: true });
    desenharEixoImaginario(plano);
    desenharPolosAbertos(plano, analise.polos);
    destino.appendChild(plano.elemento());
  } catch (falha) {
    destino.appendChild(elemento('p', 'capa-figura-vazia', 'Prévia indisponível'));
  }
}

function agendarMiniatura() {
  window.clearTimeout(agendamentoDaMiniatura);
  agendamentoDaMiniatura = window.setTimeout(desenharMiniatura, ESPERA_DA_MINIATURA);
}

function limparSelecaoDeExemplo() {
  questaoAtual = null;
  document.querySelectorAll('.pilula-ativa').forEach((item) => {
    item.classList.remove('pilula-ativa');
  });
}

export function questaoSelecionada() {
  return questaoAtual;
}

function atualizarTudo() {
  previaDaPlanta();
  previaDosPolos();
  agendarMiniatura();
}

function conectarCampos() {
  for (const nome of Object.keys(CAMPOS)) {
    const evento = campo(nome).tagName === 'SELECT' ? 'change' : 'input';
    campo(nome).addEventListener(evento, () => {
      limparSelecaoDeExemplo();
      atualizarTudo();
    });
  }
}

function aplicarQuestao(questao) {
  for (const [nome, valor] of Object.entries({ ...VALORES_PADRAO, ...questao })) {
    if (nome in CAMPOS) {
      campo(nome).value = valor;
    }
  }
  atualizarModo();
  atualizarTudo();
}

function montarExemplos(destacarPrimeira) {
  const lista = document.getElementById('exemplos');
  EXERCICIOS.forEach((exercicio, posicao) => {
    const grupo = elemento('div', 'exemplos-grupo');
    grupo.appendChild(elemento('span', 'exemplos-rotulo', exercicio.nome));
    if (destacarPrimeira && posicao === 0) {
      questaoAtual = { ...exercicio.questoes[0], exercicio: exercicio.nome };
    }
    exercicio.questoes.forEach((questao, indice) => {
      const botao = elemento('button', 'pilula', questao.nome);
      botao.type = 'button';
      if (destacarPrimeira && posicao === 0 && indice === 0) {
        botao.classList.add('pilula-ativa');
      }
      botao.addEventListener('click', () => {
        limparSelecaoDeExemplo();
        botao.classList.add('pilula-ativa');
        aplicarQuestao(questao);
        questaoAtual = { ...questao, exercicio: exercicio.nome };
      });
      grupo.appendChild(botao);
    });

    const pdf = elemento('button', 'pilula pilula-pdf', 'PDF da lista');
    pdf.type = 'button';
    pdf.title = `Resolve todas as questões do ${exercicio.nome} e abre a impressão para salvar em PDF.`;
    pdf.addEventListener('click', () => imprimirLista(exercicio));
    grupo.appendChild(pdf);
    lista.appendChild(grupo);
  });
}

function montarRoteiro() {
  const lista = document.getElementById('roteiro-lista');
  passos.forEach((passo, indice) => {
    const texto = passo.titulo.replace(/\*\*/g, '');
    const item = elemento('li', 'roteiro-item');
    item.appendChild(elemento('span', 'roteiro-numero', String(indice + 1)));
    escrever(item.appendChild(elemento('span', 'roteiro-texto')), texto.split(': ')[1] || texto);
    lista.appendChild(item);
  });
}

function formatarTextosEstaticos() {
  for (const no of document.querySelectorAll('[data-formatar]')) {
    const conteudo = no.textContent.trim().replace(/\s+/g, ' ');
    escrever(limparNo(no), conteudo);
  }
}

export function montarApresentacao(destacarPrimeira = true) {
  formatarTextosEstaticos();
  montarExemplos(destacarPrimeira);
  montarRoteiro();
  conectarCampos();
  previaDaPlanta();
  previaDosPolos();
  desenharMiniatura();
}

export function esconderRoteiro() {
  const roteiro = document.getElementById('roteiro');
  if (roteiro) {
    roteiro.hidden = true;
  }
}
