const ORDEM_DE_TAYLOR = 18;
const NORMA_ALVO = 0.5;
const EPS = 1e-10;

export function zeros(linhas, colunas = linhas) {
  return Array.from({ length: linhas }, () => new Array(colunas).fill(0));
}

export function identidade(ordem) {
  const saida = zeros(ordem);
  for (let i = 0; i < ordem; i += 1) {
    saida[i][i] = 1;
  }
  return saida;
}

export function copiar(a) {
  return a.map((linha) => linha.slice());
}

export function somar(a, b) {
  return a.map((linha, i) => linha.map((valor, j) => valor + b[i][j]));
}

export function subtrair(a, b) {
  return a.map((linha, i) => linha.map((valor, j) => valor - b[i][j]));
}

export function escalar(a, k) {
  return a.map((linha) => linha.map((valor) => valor * k));
}

export function transposta(a) {
  return a[0].map((_, j) => a.map((linha) => linha[j]));
}

export function multiplicar(a, b) {
  const linhas = a.length;
  const colunas = b[0].length;
  const internas = b.length;
  const saida = zeros(linhas, colunas);
  for (let i = 0; i < linhas; i += 1) {
    for (let k = 0; k < internas; k += 1) {
      const fator = a[i][k];
      if (fator === 0) {
        continue;
      }
      for (let j = 0; j < colunas; j += 1) {
        saida[i][j] += fator * b[k][j];
      }
    }
  }
  return saida;
}

export function aplicar(a, vetor) {
  return a.map((linha) => linha.reduce((total, valor, j) => total + valor * vetor[j], 0));
}

export function coluna(vetor) {
  return vetor.map((valor) => [valor]);
}

export function linha(vetor) {
  return [vetor.slice()];
}

export function paraVetor(a) {
  return a.map((item) => item[0]);
}

export function traco(a) {
  return a.reduce((total, item, i) => total + item[i], 0);
}

export function maiorValor(a) {
  return a.reduce(
    (maior, item) => Math.max(maior, item.reduce((parcial, valor) => Math.max(parcial, Math.abs(valor)), 0)),
    0,
  );
}

export function juntarColunas(blocos) {
  return blocos[0].map((_, i) => blocos.flatMap((bloco) => bloco[i]));
}

export function juntarLinhas(blocos) {
  return blocos.flatMap((bloco) => bloco.map((item) => item.slice()));
}

function normaInfinito(a) {
  return a.reduce(
    (maior, item) => Math.max(maior, item.reduce((soma, valor) => soma + Math.abs(valor), 0)),
    0,
  );
}

export function exponencial(a) {
  const ordem = a.length;
  const norma = normaInfinito(a);
  const quadraturas = norma > NORMA_ALVO ? Math.ceil(Math.log2(norma / NORMA_ALVO)) : 0;
  const reduzida = escalar(a, 2 ** -quadraturas);

  let soma = identidade(ordem);
  let termo = identidade(ordem);
  for (let k = 1; k <= ORDEM_DE_TAYLOR; k += 1) {
    termo = escalar(multiplicar(termo, reduzida), 1 / k);
    soma = somar(soma, termo);
  }

  for (let i = 0; i < quadraturas; i += 1) {
    soma = multiplicar(soma, soma);
  }
  return soma;
}

export function potencia(a, expoente) {
  let saida = identidade(a.length);
  for (let k = 0; k < expoente; k += 1) {
    saida = multiplicar(saida, a);
  }
  return saida;
}

export function polinomioDeMatriz(a, p) {
  const ordem = a.length;
  let saida = zeros(ordem);
  let termo = identidade(ordem);
  for (let k = p.length - 1; k >= 0; k -= 1) {
    saida = somar(saida, escalar(termo, p[k]));
    termo = multiplicar(termo, a);
  }
  return saida;
}

export function potencias(a, expoente) {
  const saida = [identidade(a.length)];
  for (let k = 1; k <= expoente; k += 1) {
    saida.push(multiplicar(saida[k - 1], a));
  }
  return saida;
}

function toleranciaDe(a) {
  return Math.max(EPS, 1e-12 * Math.max(1, maiorValor(a)) * a.length);
}

export function escalonar(a) {
  const corpo = copiar(a);
  const linhas = corpo.length;
  const colunas = corpo[0].length;
  const tolerancia = toleranciaDe(a);
  let posto = 0;
  let determinante = linhas === colunas ? 1 : null;
  let coluna = 0;

  while (posto < linhas && coluna < colunas) {
    let melhor = posto;
    for (let i = posto + 1; i < linhas; i += 1) {
      if (Math.abs(corpo[i][coluna]) > Math.abs(corpo[melhor][coluna])) {
        melhor = i;
      }
    }
    if (Math.abs(corpo[melhor][coluna]) <= tolerancia) {
      if (determinante !== null) {
        determinante = 0;
      }
      coluna += 1;
      continue;
    }
    if (melhor !== posto) {
      const guardada = corpo[posto];
      corpo[posto] = corpo[melhor];
      corpo[melhor] = guardada;
      if (determinante !== null) {
        determinante = -determinante;
      }
    }
    if (determinante !== null) {
      determinante *= corpo[posto][coluna];
    }
    for (let i = posto + 1; i < linhas; i += 1) {
      const fator = corpo[i][coluna] / corpo[posto][coluna];
      if (fator === 0) {
        continue;
      }
      for (let j = coluna; j < colunas; j += 1) {
        corpo[i][j] -= fator * corpo[posto][j];
      }
    }
    posto += 1;
    coluna += 1;
  }

  return { posto, determinante: determinante === null ? null : determinante, triangular: corpo };
}

export function posto(a) {
  return escalonar(a).posto;
}

export function determinante(a) {
  return escalonar(a).determinante;
}

export function inversa(a) {
  const ordem = a.length;
  const corpo = copiar(a);
  const saida = identidade(ordem);
  const tolerancia = toleranciaDe(a);

  for (let k = 0; k < ordem; k += 1) {
    let melhor = k;
    for (let i = k + 1; i < ordem; i += 1) {
      if (Math.abs(corpo[i][k]) > Math.abs(corpo[melhor][k])) {
        melhor = i;
      }
    }
    if (Math.abs(corpo[melhor][k]) <= tolerancia) {
      return null;
    }
    if (melhor !== k) {
      [corpo[k], corpo[melhor]] = [corpo[melhor], corpo[k]];
      [saida[k], saida[melhor]] = [saida[melhor], saida[k]];
    }
    const pivo = corpo[k][k];
    for (let j = 0; j < ordem; j += 1) {
      corpo[k][j] /= pivo;
      saida[k][j] /= pivo;
    }
    for (let i = 0; i < ordem; i += 1) {
      if (i === k) {
        continue;
      }
      const fator = corpo[i][k];
      if (fator === 0) {
        continue;
      }
      for (let j = 0; j < ordem; j += 1) {
        corpo[i][j] -= fator * corpo[k][j];
        saida[i][j] -= fator * saida[k][j];
      }
    }
  }
  return saida;
}

export function caracteristico(a) {
  const ordem = a.length;
  const coeficientes = [1];
  const passos = [];
  let acumulada = zeros(ordem);

  for (let k = 1; k <= ordem; k += 1) {
    const anterior = somar(acumulada, escalar(identidade(ordem), coeficientes[k - 1]));
    acumulada = multiplicar(a, anterior);
    const tracoAtual = traco(acumulada);
    const coeficiente = -tracoAtual / k;
    coeficientes.push(coeficiente);
    passos.push({
      ordem: k, adjunta: anterior, matriz: acumulada, traco: tracoAtual, coeficiente,
    });
  }

  return { coeficientes, passos };
}
