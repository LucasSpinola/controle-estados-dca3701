import { aviso, formula, paragrafo } from '../componentes.js';
import { matrizLatex, listaDePolosLatex } from '../../formatacao/matriz.js';
import { polinomioLatex } from '../../formatacao/latex.js';
import { numeroLatex } from '../../formatacao/numero.js';

function potenciaLatex(expoente) {
  if (expoente === 0) {
    return '\\mathbf{I}';
  }
  if (expoente === 1) {
    return '\\mathbf{A}';
  }
  return `\\mathbf{A}^{${expoente}}`;
}

export function blocoDoPolinomioDesejado(destino, polos, coeficientes, simbolo) {
  paragrafo(destino, '**Polos pedidos:**');
  formula(destino, listaDePolosLatex(polos));
  paragrafo(destino, 'O polinômio desejado é o produto dos fatores $(s - s_i)$:');
  formula(destino, `${simbolo}(s) = ${polinomioLatex(coeficientes)}`);
}

export function blocoDaMatrizDoPolinomio(destino, avaliacao, simbolo, mostrarPotencias = true) {
  const termos = avaliacao.termos.filter((termo) => Math.abs(termo.coeficiente) > 1e-12);
  const soma = termos
    .map((termo) => {
      const coeficiente = Math.abs(termo.coeficiente - 1) < 1e-12 && termo.expoente > 0
        ? ''
        : `${numeroLatex(termo.coeficiente)}\\,`;
      return `${coeficiente}${potenciaLatex(termo.expoente)}`;
    })
    .join(' + ')
    .replace(/\+ -/g, '- ');

  paragrafo(destino, `Substituindo $s$ por $\\mathbf{A}$ no polinômio desejado (Cayley-Hamilton):`);
  formula(destino, `${simbolo}(\\mathbf{A}) = ${soma}`);

  if (mostrarPotencias) {
    for (const termo of avaliacao.termos) {
      if (termo.expoente < 2) {
        continue;
      }
      formula(destino, `${potenciaLatex(termo.expoente)} = ${matrizLatex(termo.potencia)}`);
    }
  }
  formula(destino, `${simbolo}(\\mathbf{A}) = ${matrizLatex(avaliacao.total)}`);
}

export function conferirPolinomio(destino, desejado, obtido, nome = 'ao desejado') {
  const escala = Math.max(1, ...desejado.map((valor) => Math.abs(valor)));
  const desvio = Math.max(
    ...desejado.map((valor, i) => Math.abs(valor - (obtido[i] ?? 0))),
  );

  if (desvio < 1e-8 * escala) {
    aviso(
      destino,
      'sucesso',
      `O polinômio característico obtido é igual ${nome}: a alocação fechou e os polos caíram onde se pediu.`,
    );
    return true;
  }
  aviso(
    destino,
    'atencao',
    `O polinômio obtido difere do desejado em até ${numeroLatex(desvio)} num coeficiente, `
    + 'o que indica mal condicionamento numérico na inversa usada por Ackermann.',
  );
  return false;
}
