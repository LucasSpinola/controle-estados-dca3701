import * as C from './complexo.js';

const TOLERANCIA = 1e-7;

function termosDe(texto) {
  return texto.match(/[+-]?[^+-]+/g) || [];
}

export function interpretarComplexo(bruto) {
  const texto = String(bruto).replace(/\s+/g, '').replace(/j/gi, 'i').replace(/,(?=\d)/g, '.');
  if (texto === '') {
    return null;
  }
  let re = 0;
  let im = 0;
  for (const termo of termosDe(texto)) {
    const imaginario = termo.endsWith('i');
    const corpo = imaginario ? termo.slice(0, -1) : termo;
    let valor;
    if (corpo === '' || corpo === '+') {
      valor = imaginario ? 1 : NaN;
    } else if (corpo === '-') {
      valor = imaginario ? -1 : NaN;
    } else {
      valor = Number(corpo);
    }
    if (!Number.isFinite(valor)) {
      return null;
    }
    if (imaginario) {
      im += valor;
    } else {
      re += valor;
    }
  }
  return C.complexo(re, im);
}

export function interpretarPolos(texto) {
  if (typeof texto !== 'string' || texto.trim() === '') {
    return null;
  }

  const normalizado = texto.replace(/,(?=\d)/g, '.');
  const separador = /[,;]/.test(normalizado) ? /[,;]+/ : /\s+/;
  const itens = normalizado.trim().split(separador).filter((item) => item.trim() !== '');
  const saida = [];

  for (const item of itens) {
    if (item.includes('±')) {
      const positivo = interpretarComplexo(item.replace('±', '+'));
      const negativo = interpretarComplexo(item.replace('±', '-'));
      if (positivo === null || negativo === null) {
        return null;
      }
      saida.push(positivo, negativo);
      continue;
    }
    const polo = interpretarComplexo(item);
    if (polo === null) {
      return null;
    }
    saida.push(polo);
  }
  return saida.length > 0 ? saida : null;
}

export function conjugadosCompletos(polos) {
  const pendentes = polos.map((polo) => ({ ...polo, usado: false }));
  for (let i = 0; i < pendentes.length; i += 1) {
    const atual = pendentes[i];
    if (atual.usado || Math.abs(atual.im) < TOLERANCIA) {
      continue;
    }
    const parceiro = pendentes.findIndex(
      (outro, j) => j !== i && !outro.usado && C.distancia(outro, C.conjugado(atual)) < TOLERANCIA,
    );
    if (parceiro < 0) {
      return false;
    }
    atual.usado = true;
    pendentes[parceiro].usado = true;
  }
  return true;
}

export function polinomioDosPolos(polos) {
  let coeficientes = [C.complexo(1)];
  for (const polo of polos) {
    const proximo = new Array(coeficientes.length + 1).fill(null).map(() => C.complexo(0));
    coeficientes.forEach((valor, i) => {
      proximo[i] = C.somar(proximo[i], valor);
      proximo[i + 1] = C.subtrair(proximo[i + 1], C.multiplicar(valor, polo));
    });
    coeficientes = proximo;
  }
  return coeficientes.map((valor) => valor.re);
}

export function todosEstaveis(polos) {
  return polos.every((polo) => polo.re < -TOLERANCIA);
}
