import assert from 'node:assert/strict';

import * as M from '../assets/js/nucleo/matriz.js';
import { interpretarPolos } from '../assets/js/nucleo/polos.js';
import {
  formaControlavel, formaObservavel, funcaoDeTransferencia, separarParteDireta,
} from '../assets/js/espaco/sistema.js';
import { controlabilidade, observabilidade, estabilidade } from '../assets/js/espaco/analise.js';
import { projetarRealimentacao, projetarObservador } from '../assets/js/espaco/alocacao.js';
import { projetarSeguidor } from '../assets/js/espaco/seguidor.js';
import { projetar } from '../assets/js/espaco/projeto.js';
import { simular, medir } from '../assets/js/espaco/simulacao.js';

let executados = 0;
let falhas = 0;

function teste(nome, corpo) {
  executados += 1;
  try {
    corpo();
    console.log(`ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`FALHA ${nome}`);
    console.log(`      ${erro.message}`);
  }
}

function perto(recebido, esperado, tolerancia = 1e-6) {
  assert.ok(
    Math.abs(recebido - esperado) < tolerancia,
    `esperado ${esperado}, recebido ${recebido}`,
  );
}

function conferirAlocacao(polosObtidos, texto, tolerancia = 1e-6) {
  const desejados = interpretarPolos(texto);
  assert.equal(polosObtidos.length, desejados.length, 'quantidade de polos');
  for (const alvo of desejados) {
    const menor = Math.min(
      ...polosObtidos.map((polo) => Math.hypot(polo.re - alvo.re, polo.im - alvo.im)),
    );
    perto(menor, 0, tolerancia);
  }
}

const SISTEMA_1 = {
  fonte: 'matrizes',
  a: [[-4, 3, 0], [-1, -4, -1], [0, 0, -2]],
  b: [[0], [0], [3]],
  c: [[1, 0, 0]],
};

const SISTEMA_2 = {
  fonte: 'matrizes',
  a: [[-5, 1, 0], [2, 7, -1], [0, -3, 6]],
  b: [[0], [0], [1]],
  c: [[1, -2, 3]],
};

const G_QUARTA = { numerador: [3, 4, -2], denominador: [1, 3, 7, 5] };

teste('1º exercício, questão 1: sistema 1 é estável, controlável e observável', () => {
  const projeto = projetar({ ...SISTEMA_1, objetivo: 'analise' });
  const { estabilidade: analise, controlabilidade: controle, observabilidade: observacao } = projeto.analise;

  analise.coeficientes.forEach((valor, i) => perto(valor, [1, 10, 35, 38][i], 1e-9));
  assert.equal(analise.estavel, true);
  perto(controle.determinante, -81, 1e-9);
  assert.equal(controle.completa, true);
  perto(observacao.determinante, -9, 1e-9);
  assert.equal(observacao.completa, true);
});

teste('1º exercício, questão 1: sistema 2 é instável, controlável e observável', () => {
  const projeto = projetar({ ...SISTEMA_2, objetivo: 'analise' });
  const { estabilidade: analise, controlabilidade: controle, observabilidade: observacao } = projeto.analise;

  analise.coeficientes.forEach((valor, i) => perto(valor, [1, -8, -28, 207][i], 1e-9));
  assert.equal(analise.estavel, false);
  assert.equal(controle.completa, true);
  assert.equal(observacao.completa, true);
});

teste('1º exercício, questão 2: K e L do sistema 1', () => {
  const projeto = projetar({
    ...SISTEMA_1,
    objetivo: 'completo',
    polosK: interpretarPolos('-2±1i, -10'),
    polosL: interpretarPolos('-1±1i, -10'),
  });

  assert.equal(projeto.realimentacao.viavel, true);
  conferirAlocacao(projeto.realimentacao.polosObtidos, '-2±1i, -10');
  projeto.realimentacao.ganho[0].forEach((valor, i) => perto(valor, [8 / 3, -22 / 3, -4 / 3][i], 1e-8));

  assert.equal(projeto.observador.viavel, true);
  conferirAlocacao(projeto.observador.polosObtidos, '-1±1i, -10');
});

teste('1º exercício, questão 3: K e L do sistema 2', () => {
  const projeto = projetar({
    ...SISTEMA_2,
    objetivo: 'completo',
    polosK: interpretarPolos('-2±1i, -10'),
    polosL: interpretarPolos('-1±1i, -10'),
  });
  conferirAlocacao(projeto.realimentacao.polosObtidos, '-2±1i, -10', 1e-5);
  conferirAlocacao(projeto.observador.polosObtidos, '-1±1i, -10', 1e-5);
  projeto.realimentacao.ganho[0].forEach((valor, i) => perto(valor, [72, 117, -22][i], 1e-6));
});

teste('princípio da separação: a dinâmica conjunta reúne os dois conjuntos', () => {
  const projeto = projetar({
    ...SISTEMA_1,
    objetivo: 'completo',
    polosK: interpretarPolos('-2±1i, -10'),
    polosL: interpretarPolos('-1±1i, -10'),
  });
  assert.equal(projeto.compensado.polos.length, 6);
  conferirAlocacao(
    projeto.compensado.polos.filter((polo) => Math.abs(polo.re + 2) < 0.5 || polo.re < -9),
    '-2±1i, -10, -10',
    1e-5,
  );
});

teste('forma canônica controlável sai dos coeficientes de G(s)', () => {
  const sistema = formaControlavel(G_QUARTA.numerador, G_QUARTA.denominador);
  assert.deepEqual(sistema.a, [[0, 1, 0], [0, 0, 1], [-5, -7, -3]]);
  assert.deepEqual(sistema.b, [[0], [0], [1]]);
  assert.deepEqual(sistema.c, [[-2, 4, 3]]);
});

teste('forma canônica observável é a dual e dá a mesma G(s)', () => {
  const sistema = formaObservavel(G_QUARTA.numerador, G_QUARTA.denominador);
  assert.deepEqual(sistema.c, [[0, 0, 1]]);
  const tf = funcaoDeTransferencia(sistema.a, sistema.b, sistema.c, sistema.direto);
  tf.numerador.forEach((valor, i) => perto(valor, G_QUARTA.numerador[i], 1e-9));
  tf.denominador.forEach((valor, i) => perto(valor, G_QUARTA.denominador[i], 1e-9));
});

teste('parte direta sai quando o numerador tem o grau do denominador', () => {
  const { direto, numerador } = separarParteDireta([2, 1, 0], [1, 3, 2]);
  perto(direto, 2);
  numerador.forEach((valor, i) => perto(valor, [-5, -4][i], 1e-12));
});

teste('1º exercício, questão 4: observador e realimentação da canônica controlável', () => {
  const base = { fonte: 'transferencia', ...G_QUARTA, forma: 'controlavel' };
  const comObservador = projetar({ ...base, objetivo: 'observador', polosL: interpretarPolos('-1,-1,-2') });
  conferirAlocacao(comObservador.observador.polosObtidos, '-1,-1,-2', 1e-5);

  const comGanho = projetar({ ...base, objetivo: 'realimentacao', polosK: interpretarPolos('-4,-4,-5') });
  comGanho.realimentacao.ganho[0].forEach((valor, i) => perto(valor, [-75, -49, -10][i], 1e-8));
  conferirAlocacao(comGanho.realimentacao.polosObtidos, '-4,-4,-5', 1e-5);
});

teste('2º exercício, questão 1: seguidor da canônica controlável', () => {
  const projeto = projetar({
    fonte: 'transferencia',
    ...G_QUARTA,
    forma: 'controlavel',
    objetivo: 'seguidor',
    polosSeguidor: interpretarPolos('-1±0,1i, -5, -12'),
  });
  assert.equal(projeto.seguidor.viavel, true);
  conferirAlocacao(projeto.seguidor.polosObtidos, '-1±0,1i, -5, -12', 1e-5);
  perto(projeto.seguidor.ganhoEstatico, 1, 1e-9);
  assert.equal(projeto.seguidor.ganhoEstados[0].length, 3);
});

teste('2º exercício, questão 2: seguidor a partir das matrizes', () => {
  const projeto = projetar({
    fonte: 'matrizes',
    a: [[-6, 1, 0], [-11, 0, 1], [-6, 0, 0]],
    b: [[2], [6], [2]],
    c: [[1, 0, 0]],
    objetivo: 'seguidor',
    polosSeguidor: interpretarPolos('-1±0,1i, -5, -12'),
  });
  conferirAlocacao(projeto.seguidor.polosObtidos, '-1±0,1i, -5, -12', 1e-5);
  perto(projeto.seguidor.ganhoEstatico, 1, 1e-9);
});

teste('2º exercício, questão 3: seguidor de planta com integrador', () => {
  const projeto = projetar({
    fonte: 'transferencia',
    numerador: [2, 1],
    denominador: [1, 3, 0],
    forma: 'controlavel',
    objetivo: 'seguidor',
    polosSeguidor: interpretarPolos('-1,-1,-1'),
  });
  assert.equal(projeto.seguidor.viavel, true);
  conferirAlocacao(projeto.seguidor.polosObtidos, '-1,-1,-1', 1e-4);
  perto(projeto.seguidor.ganhoIntegral, 1, 1e-8);
  perto(projeto.seguidor.ganhoEstatico, 1, 1e-9);
});

teste('2º exercício, questão 4: seguidor da canônica observável', () => {
  const projeto = projetar({
    fonte: 'transferencia',
    numerador: [3],
    denominador: [1, 2, -4],
    forma: 'observavel',
    objetivo: 'seguidor',
    polosSeguidor: interpretarPolos('-2,-2,-3'),
  });
  assert.deepEqual(projeto.sistema.a, [[0, 4], [1, -2]]);
  assert.deepEqual(projeto.sistema.b, [[3], [0]]);
  conferirAlocacao(projeto.seguidor.polosObtidos, '-2,-2,-3', 1e-5);
  perto(projeto.seguidor.ganhoIntegral, 4, 1e-7);
  perto(projeto.seguidor.ganhoEstatico, 1, 1e-9);
});

teste('sistema não controlável bloqueia a alocação', () => {
  const resultado = projetarRealimentacao(
    { a: [[1, 0], [0, 2]], b: [[1], [0]], c: [[1, 0]] },
    interpretarPolos('-1,-2'),
  );
  assert.equal(resultado.viavel, false);
  assert.match(resultado.motivo, /não é controlável/);
});

teste('sistema não observável bloqueia o observador', () => {
  const resultado = projetarObservador(
    { a: [[1, 0], [0, 2]], b: [[1], [1]], c: [[1, 0]] },
    interpretarPolos('-1,-2'),
  );
  assert.equal(resultado.viavel, false);
  assert.match(resultado.motivo, /não é observável/);
});

teste('seguidor recusa quantidade errada de polos', () => {
  const resultado = projetarSeguidor(
    { a: [[0, 1], [0, -3]], b: [[0], [1]], c: [[1, 2]] },
    interpretarPolos('-1,-1'),
  );
  assert.equal(resultado.viavel, false);
  assert.match(resultado.motivo, /3 polos/);
});

teste('seguidor recusa planta com zero na origem', () => {
  const resultado = projetarSeguidor(
    { a: [[0, 1], [-2, -3]], b: [[0], [1]], c: [[1, 0]] },
    interpretarPolos('-1,-2,-3'),
  );
  assert.equal(resultado.viavel, true, 'sem zero na origem o projeto fecha');

  const comZero = projetarSeguidor(
    { a: [[0, 1], [-2, -3]], b: [[0], [1]], c: [[0, 1]] },
    interpretarPolos('-1,-2,-3'),
  );
  assert.equal(comZero.viavel, false);
});

teste('simulação do degrau chega ao ganho estático', () => {
  const a = [[0, 1], [-2, -3]];
  const b = [[0], [1]];
  const c = [[2, 0]];
  const simulacao = simular(a, b, c, { duracao: 20 });
  const esperado = M.multiplicar(M.multiplicar(c, M.inversa(M.escalar(a, -1))), b)[0][0];
  perto(simulacao.saidas.at(-1), esperado, 1e-6);
  const metricas = medir(simulacao, esperado);
  assert.ok(metricas.sobressinal >= 0);
});

teste('a resposta do seguidor estaciona na referência', () => {
  const projeto = projetar({
    fonte: 'transferencia',
    ...G_QUARTA,
    forma: 'controlavel',
    objetivo: 'seguidor',
    polosSeguidor: interpretarPolos('-1±0,1i, -5, -12'),
  });
  perto(projeto.respostaDoSeguidor.simulacao.saidas.at(-1), 1, 5e-3);
});

teste('estabilidade classifica polo sobre o eixo imaginário', () => {
  const analise = estabilidade([[0, 1], [-1, 0]]);
  assert.equal(analise.estavel, false);
  assert.equal(analise.marginal, true);
});

teste('U e V da forma canônica têm posto completo', () => {
  const sistema = formaControlavel(G_QUARTA.numerador, G_QUARTA.denominador);
  assert.equal(controlabilidade(sistema.a, sistema.b).completa, true);
  assert.equal(observabilidade(sistema.a, sistema.c).completa, true);
});

console.log(`\n${executados - falhas} de ${executados} testes passaram.`);
if (falhas > 0) {
  process.exitCode = 1;
}
