import { interpretarPolinomio, interpretarMatriz } from '../nucleo/entrada.js';
import { interpretarPolos, conjugadosCompletos } from '../nucleo/polos.js';
import { OBJETIVOS, precisaDe } from '../espaco/projeto.js';

export const CAMPOS = {
  fonte: 'fonte',
  matrizA: 'matriz-a',
  matrizB: 'matriz-b',
  matrizC: 'matriz-c',
  numerador: 'numerador',
  denominador: 'denominador',
  forma: 'forma',
  objetivo: 'objetivo',
  polosK: 'polos-k',
  polosL: 'polos-l',
  polosSeguidor: 'polos-seguidor',
};

export const CAMPOS_FIXOS = ['fonte', 'objetivo'];

export const CAMPOS_POR_FONTE = {
  matrizes: ['matrizA', 'matrizB', 'matrizC'],
  transferencia: ['numerador', 'denominador', 'forma'],
};

export const VALORES_PADRAO = {
  fonte: 'matrizes',
  matrizA: '-4 3 0; -1 -4 -1; 0 0 -2',
  matrizB: '0; 0; 3',
  matrizC: '1 0 0',
  numerador: '3 4 -2',
  denominador: '1 3 7 5',
  forma: 'controlavel',
  objetivo: 'analise',
  polosK: '-2±1i, -10',
  polosL: '-1±1i, -10',
  polosSeguidor: '-1±0,1i, -5, -12',
};

const ROTULOS_DOS_POLOS = {
  polosK: 'polos de malha fechada',
  polosL: 'polos do observador',
  polosSeguidor: 'polos do seguidor',
};

export function campo(nome) {
  return document.getElementById(CAMPOS[nome]);
}

export function valoresDoFormulario() {
  return Object.fromEntries(Object.keys(CAMPOS).map((nome) => [nome, campo(nome).value]));
}

export function camposDePolos(objetivo) {
  return (OBJETIVOS[objetivo] || OBJETIVOS.analise).polos;
}

function mostrar(seletor, visivel) {
  document.querySelectorAll(seletor).forEach((painel) => {
    painel.hidden = !visivel;
  });
}

export function atualizarModo() {
  const fonte = campo('fonte').value;
  mostrar('[data-fonte="matrizes"]', fonte === 'matrizes');
  mostrar('[data-fonte="transferencia"]', fonte === 'transferencia');

  const objetivo = campo('objetivo').value;
  document.querySelectorAll('[data-polos]').forEach((bloco) => {
    bloco.hidden = !precisaDe(objetivo, bloco.dataset.polos);
  });
  mostrar('[data-sem-polos]', camposDePolos(objetivo).length === 0);
}

export function conectarModos() {
  for (const nome of ['fonte', 'objetivo']) {
    campo(nome).addEventListener('change', atualizarModo);
  }
  atualizarModo();
}

function interpretarPlanta(valores) {
  if (valores.fonte === 'transferencia') {
    const numerador = interpretarPolinomio(String(valores.numerador ?? ''));
    const denominador = interpretarPolinomio(String(valores.denominador ?? ''));
    if (numerador === null || denominador === null) {
      return {
        erro: 'Confira $G(s)$: use coeficientes em ordem decrescente de $s$, como “1 3 7 5”, '
          + 'ou a expressão, como “s(s+3)”.',
      };
    }
    if (denominador.every((valor) => valor === 0)) {
      return { erro: 'O denominador de $G(s)$ não pode ser nulo.' };
    }
    return {
      planta: {
        fonte: 'transferencia',
        numerador,
        denominador,
        forma: valores.forma === 'observavel' ? 'observavel' : 'controlavel',
      },
    };
  }

  const a = interpretarMatriz(String(valores.matrizA ?? ''));
  const b = interpretarMatriz(String(valores.matrizB ?? ''));
  const c = interpretarMatriz(String(valores.matrizC ?? ''));

  if (a === null || b === null || c === null) {
    return {
      erro: 'Confira as matrizes: separe as linhas por “;” e os elementos por espaço, '
        + 'como “-4 3 0; -1 -4 -1; 0 0 -2”.',
    };
  }
  if (a.length !== a[0].length) {
    return { erro: 'A matriz $\\mathbf{A}$ precisa ser quadrada.' };
  }
  const ordem = a.length;
  const coluna = b.length === 1 && b[0].length === ordem ? b[0].map((valor) => [valor]) : b;
  if (coluna.length !== ordem || coluna.some((linha) => linha.length !== 1)) {
    return { erro: `A matriz $\\mathbf{B}$ precisa ter ${ordem} linhas e uma coluna.` };
  }
  const linha = c.length === ordem && c[0].length === 1 ? [c.map((item) => item[0])] : c;
  if (linha.length !== 1 || linha[0].length !== ordem) {
    return { erro: `A matriz $\\mathbf{C}$ precisa ter uma linha e ${ordem} colunas.` };
  }
  return {
    planta: {
      fonte: 'matrizes', a, b: coluna, c: linha,
    },
  };
}

function ordemDaPlanta(planta) {
  if (planta.fonte === 'matrizes') {
    return planta.a.length;
  }
  const denominador = planta.denominador.slice();
  let inicio = 0;
  while (inicio < denominador.length - 1 && denominador[inicio] === 0) {
    inicio += 1;
  }
  return denominador.length - inicio - 1;
}

function interpretarPolosDe(valores, nome, ordemEsperada) {
  const polos = interpretarPolos(String(valores[nome] ?? ''));
  if (polos === null) {
    return {
      erro: `Confira os ${ROTULOS_DOS_POLOS[nome]}: separe por vírgula, como `
        + '“-2±1i, -10” ou “-4, -4, -5”.',
    };
  }
  if (!conjugadosCompletos(polos)) {
    return {
      erro: `Cada polo complexo dos ${ROTULOS_DOS_POLOS[nome]} precisa aparecer com o conjugado; `
        + 'use “±” para informar o par de uma vez.',
    };
  }
  if (polos.length !== ordemEsperada) {
    return {
      erro: `São esperados ${ordemEsperada} ${ROTULOS_DOS_POLOS[nome]}, mas foram informados ${polos.length}.`,
    };
  }
  return { polos };
}

export function interpretarFormulario(dados) {
  const valores = { ...VALORES_PADRAO, ...dados };
  const leitura = interpretarPlanta(valores);
  if (leitura.erro) {
    return leitura;
  }

  const objetivo = OBJETIVOS[valores.objetivo] ? valores.objetivo : 'analise';
  const ordem = ordemDaPlanta(leitura.planta);
  if (!(ordem >= 1)) {
    return { erro: 'O sistema precisa ter ordem pelo menos 1.' };
  }

  const entrada = { ...leitura.planta, objetivo };
  for (const nome of camposDePolos(objetivo)) {
    const esperada = nome === 'polosSeguidor' ? ordem + 1 : ordem;
    const polos = interpretarPolosDe(valores, nome, esperada);
    if (polos.erro) {
      return polos;
    }
    entrada[nome] = polos.polos;
  }
  return { entrada };
}

export function lerFormulario() {
  return interpretarFormulario(valoresDoFormulario());
}
