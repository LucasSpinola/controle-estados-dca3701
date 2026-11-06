const SISTEMA_1 = { matrizA: '-4 3 0; -1 -4 -1; 0 0 -2', matrizB: '0; 0; 3', matrizC: '1 0 0' };
const SISTEMA_2 = { matrizA: '-5 1 0; 2 7 -1; 0 -3 6', matrizB: '0; 0; 1', matrizC: '1 -2 3' };

const G_TERCEIRA_ORDEM = { numerador: '3 4 -2', denominador: '1 3 7 5' };

export const EXERCICIOS = [
  {
    nome: '1º exercício',
    questoes: [
      {
        nome: 'Questão 1, sistema 1',
        enunciado: [
          'Para o sistema 1, com $\\mathbf{A} = \\begin{bmatrix} -4 & 3 & 0 \\\\ -1 & -4 & -1 \\\\ 0 & 0 & -2 \\end{bmatrix}$, '
          + '$\\mathbf{B} = \\begin{bmatrix} 0 \\\\ 0 \\\\ 3 \\end{bmatrix}$ e $\\mathbf{C} = \\begin{bmatrix} 1 & 0 & 0 \\end{bmatrix}$:',
          '**a.** Encontre o polinômio característico e determine se o sistema é estável;',
          '**b.** Calcule a matriz de controlabilidade e determine se o sistema é controlável;',
          '**c.** Calcule a matriz de observabilidade e determine se o sistema é observável.',
        ],
        fonte: 'matrizes',
        ...SISTEMA_1,
        objetivo: 'analise',
      },
      {
        nome: 'Questão 1, sistema 2',
        enunciado: [
          'Para o sistema 2, com $\\mathbf{A} = \\begin{bmatrix} -5 & 1 & 0 \\\\ 2 & 7 & -1 \\\\ 0 & -3 & 6 \\end{bmatrix}$, '
          + '$\\mathbf{B} = \\begin{bmatrix} 0 \\\\ 0 \\\\ 1 \\end{bmatrix}$ e $\\mathbf{C} = \\begin{bmatrix} 1 & -2 & 3 \\end{bmatrix}$:',
          '**a.** Encontre o polinômio característico e determine se o sistema é estável;',
          '**b.** Calcule a matriz de controlabilidade e determine se o sistema é controlável;',
          '**c.** Calcule a matriz de observabilidade e determine se o sistema é observável.',
        ],
        fonte: 'matrizes',
        ...SISTEMA_2,
        objetivo: 'analise',
      },
      {
        nome: 'Questão 2',
        enunciado: [
          'Para o sistema 1:',
          '**a.** Projete uma realimentação de estados $u(t) = \\mathbf{K}\\mathbf{x}(t)$ tal que os polos de malha '
          + 'fechada sejam alocados em $s_{1,2} = -2 \\pm i$ e $s_3 = -10$;',
          '**b.** Projete um observador de estados tal que seus polos sejam $s_{1,2} = -1 \\pm i$ e $s_3 = -10$.',
        ],
        fonte: 'matrizes',
        ...SISTEMA_1,
        objetivo: 'completo',
        polosK: '-2±1i, -10',
        polosL: '-1±1i, -10',
      },
      {
        nome: 'Questão 3',
        enunciado: [
          'Para o sistema 2:',
          '**c.** Projete uma realimentação de estados $u(t) = \\mathbf{K}\\mathbf{x}(t)$ tal que os polos de malha '
          + 'fechada sejam alocados em $s_{1,2} = -2 \\pm i$ e $s_3 = -10$;',
          '**d.** Projete um observador de estados tal que seus polos sejam $s_{1,2} = -1 \\pm i$ e $s_3 = -10$.',
        ],
        fonte: 'matrizes',
        ...SISTEMA_2,
        objetivo: 'completo',
        polosK: '-2±1i, -10',
        polosL: '-1±1i, -10',
      },
      {
        nome: 'Questão 4, observador',
        enunciado: [
          'Dado $G(s) = \\dfrac{3s^2 + 4s - 2}{s^3 + 3s^2 + 7s + 5}$:',
          '**a.** Encontre uma representação usando a forma canônica controlável;',
          '**b.** Se for possível, projete um observador de estados com polos em $-1$, $-1$ e $-2$.',
        ],
        fonte: 'transferencia',
        ...G_TERCEIRA_ORDEM,
        forma: 'controlavel',
        objetivo: 'observador',
        polosL: '-1, -1, -2',
      },
      {
        nome: 'Questão 4, realimentação',
        enunciado: [
          'Dado $G(s) = \\dfrac{3s^2 + 4s - 2}{s^3 + 3s^2 + 7s + 5}$:',
          '**c.** Se for possível, projete uma realimentação de estados $u(t) = \\mathbf{K}\\mathbf{x}(t)$ tal que os '
          + 'polos de malha fechada sejam alocados em $-4$, $-4$ e $-5$.',
        ],
        fonte: 'transferencia',
        ...G_TERCEIRA_ORDEM,
        forma: 'controlavel',
        objetivo: 'realimentacao',
        polosK: '-4, -4, -5',
      },
    ],
  },
  {
    nome: '2º exercício',
    questoes: [
      {
        nome: 'Questão 1',
        enunciado: [
          'Dado $G(s) = \\dfrac{3s^2 + 4s - 2}{s^3 + 3s^2 + 7s + 5}$:',
          '**a.** Encontre uma representação usando a forma canônica controlável;',
          '**b.** Se for possível, projete um seguidor de referência para entradas do tipo degrau, tal que os polos '
          + 'do seguidor sejam $-1{,}0 \\pm 0{,}1i$, $-5$ e $-12$.',
        ],
        fonte: 'transferencia',
        ...G_TERCEIRA_ORDEM,
        forma: 'controlavel',
        objetivo: 'seguidor',
        polosSeguidor: '-1±0.1i, -5, -12',
      },
      {
        nome: 'Questão 2',
        enunciado: [
          'Dado o sistema com $\\mathbf{A} = \\begin{bmatrix} -6 & 1 & 0 \\\\ -11 & 0 & 1 \\\\ -6 & 0 & 0 \\end{bmatrix}$, '
          + '$\\mathbf{B} = \\begin{bmatrix} 2 \\\\ 6 \\\\ 2 \\end{bmatrix}$ e '
          + '$\\mathbf{C} = \\begin{bmatrix} 1 & 0 & 0 \\end{bmatrix}$, projete um controlador seguidor de referências '
          + 'do tipo degrau, tal que os polos de malha fechada do seguidor sejam $-1{,}0 \\pm 0{,}1i$, $-5$ e $-12$.',
        ],
        fonte: 'matrizes',
        matrizA: '-6 1 0; -11 0 1; -6 0 0',
        matrizB: '2; 6; 2',
        matrizC: '1 0 0',
        objetivo: 'seguidor',
        polosSeguidor: '-1±0.1i, -5, -12',
      },
      {
        nome: 'Questão 3',
        enunciado: [
          'Dado $G(s) = \\dfrac{2s + 1}{s(s + 3)}$:',
          '**a.** Obtenha uma representação deste sistema na forma canônica controlável;',
          '**b.** Projete um seguidor de referência para entradas do tipo degrau, tal que todos os polos de malha '
          + 'fechada se localizem em $-1$.',
        ],
        fonte: 'transferencia',
        numerador: '2 1',
        denominador: 's(s+3)',
        forma: 'controlavel',
        objetivo: 'seguidor',
        polosSeguidor: '-1, -1, -1',
      },
      {
        nome: 'Questão 4',
        enunciado: [
          'Um dado sistema tem a função de transferência $G(s) = \\dfrac{3}{s^2 + 2s - 4}$:',
          '**a.** Obtenha uma representação deste sistema na forma canônica observável;',
          '**b.** Projete um controlador seguidor de referência, tal que os polos de malha fechada sejam $-2$, $-2$ e $-3$.',
        ],
        fonte: 'transferencia',
        numerador: '3',
        denominador: '1 2 -4',
        forma: 'observavel',
        objetivo: 'seguidor',
        polosSeguidor: '-2, -2, -3',
      },
    ],
  },
];
