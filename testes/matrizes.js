import assert from 'node:assert/strict';

import * as M from '../assets/js/nucleo/matriz.js';
import { raizes } from '../assets/js/nucleo/raizes.js';
import {
  interpretarPolos, interpretarComplexo, polinomioDosPolos, conjugadosCompletos,
} from '../assets/js/nucleo/polos.js';
import { interpretarMatriz } from '../assets/js/nucleo/entrada.js';

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

function perto(recebido, esperado, tolerancia = 1e-9) {
  assert.ok(
    Math.abs(recebido - esperado) < tolerancia,
    `esperado ${esperado}, recebido ${recebido}`,
  );
}

function pertoMatriz(recebida, esperada, tolerancia = 1e-9) {
  assert.equal(recebida.length, esperada.length, 'número de linhas');
  recebida.forEach((linha, i) => {
    assert.equal(linha.length, esperada[i].length, 'número de colunas');
    linha.forEach((valor, j) => perto(valor, esperada[i][j], tolerancia));
  });
}

teste('exponencial de matriz diagonal', () => {
  const resultado = M.exponencial([[-2, 0], [0, 3]]);
  perto(resultado[0][0], Math.exp(-2), 1e-12);
  perto(resultado[1][1], Math.exp(3), 1e-10);
  perto(resultado[0][1], 0, 1e-14);
});

teste('inversa desfaz a multiplicacao', () => {
  const a = [[4, 7, 2], [3, 6, 1], [2, 5, 3]];
  pertoMatriz(M.multiplicar(a, M.inversa(a)), M.identidade(3), 1e-10);
});

teste('inversa de matriz singular devolve null', () => {
  assert.equal(M.inversa([[1, 2], [2, 4]]), null);
});

teste('posto e determinante de matriz singular', () => {
  const { posto, determinante } = M.escalonar([[1, 2, 3], [2, 4, 6], [1, 1, 1]]);
  assert.equal(posto, 2);
  perto(determinante, 0, 1e-12);
});

teste('determinante bate com a expansao manual', () => {
  perto(M.determinante([[-4, 3, 0], [-1, -4, -1], [0, 0, -2]]), -38, 1e-10);
});

teste('polinomio caracteristico por Faddeev-LeVerrier', () => {
  const { coeficientes } = M.caracteristico([[-4, 3, 0], [-1, -4, -1], [0, 0, -2]]);
  coeficientes.forEach((valor, i) => perto(valor, [1, 10, 35, 38][i], 1e-10));
});

teste('caracteristico de matriz companheira recupera o denominador', () => {
  const { coeficientes } = M.caracteristico([[0, 1, 0], [0, 0, 1], [-5, -7, -3]]);
  coeficientes.forEach((valor, i) => perto(valor, [1, 3, 7, 5][i], 1e-10));
});

teste('Cayley-Hamilton: o proprio caracteristico anula a matriz', () => {
  const a = [[-5, 1, 0], [2, 7, -1], [0, -3, 6]];
  const { coeficientes } = M.caracteristico(a);
  pertoMatriz(M.polinomioDeMatriz(a, coeficientes), M.zeros(3), 1e-8);
});

teste('juntar colunas e linhas monta blocos', () => {
  pertoMatriz(M.juntarColunas([[[1], [2]], [[3], [4]]]), [[1, 3], [2, 4]]);
  pertoMatriz(M.juntarLinhas([[[1, 2]], [[3, 4]]]), [[1, 2], [3, 4]]);
});

teste('leitura de matriz por linhas', () => {
  pertoMatriz(interpretarMatriz('-4 3 0; -1 -4 -1; 0 0 -2'), [[-4, 3, 0], [-1, -4, -1], [0, 0, -2]]);
  assert.equal(interpretarMatriz('1 2; 3'), null);
  assert.equal(interpretarMatriz('a b'), null);
});

teste('leitura de polo complexo em varias grafias', () => {
  perto(interpretarComplexo('-2+1i').im, 1);
  perto(interpretarComplexo('-2+i').im, 1);
  perto(interpretarComplexo('-2-j').im, -1);
  perto(interpretarComplexo('3').re, 3);
  perto(interpretarComplexo('0,5i').im, 0.5);
  assert.equal(interpretarComplexo('xyz'), null);
});

teste('lista de polos expande o simbolo de mais ou menos', () => {
  const polos = interpretarPolos('-1±0,1i, -5, -12');
  assert.equal(polos.length, 4);
  perto(polos[0].im, 0.1);
  perto(polos[1].im, -0.1);
  perto(polos[3].re, -12);
});

teste('lista separada por espaco tambem vale', () => {
  const polos = interpretarPolos('-4 -4 -5');
  assert.equal(polos.length, 3);
  perto(polos[2].re, -5);
});

teste('polo complexo sem conjugado e recusado', () => {
  assert.equal(conjugadosCompletos(interpretarPolos('-1+1i, -5')), false);
  assert.equal(conjugadosCompletos(interpretarPolos('-1±1i')), true);
});

teste('polinomio dos polos tem coeficientes reais', () => {
  const p = polinomioDosPolos(interpretarPolos('-2±1i, -10'));
  p.forEach((valor, i) => perto(valor, [1, 14, 45, 50][i], 1e-9));
});

teste('as raizes do polinomio desejado voltam aos polos pedidos', () => {
  const polos = interpretarPolos('-1±0,1i, -5, -12');
  const encontradas = raizes(polinomioDosPolos(polos));
  for (const alvo of polos) {
    const menor = Math.min(...encontradas.map((z) => Math.hypot(z.re - alvo.re, z.im - alvo.im)));
    perto(menor, 0, 1e-7);
  }
});

console.log(`\n${executados - falhas} de ${executados} testes passaram.`);
if (falhas > 0) {
  process.exitCode = 1;
}
