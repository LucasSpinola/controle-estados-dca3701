import {
  formula, paragrafo, separador, aviso,
} from '../componentes.js';
import { matrizLatex, tabelaLatex } from '../../formatacao/matriz.js';
import { polinomioLatex, complexoLatex } from '../../formatacao/latex.js';
import { numeroLatex, fixoLatex } from '../../formatacao/numero.js';

export const titulo = '**Passo 2:** Polinômio característico e estabilidade';
export const abertoPorPadrao = true;

const NOMES_DA_CLASSE = {
  estavel: '\\text{semiplano esquerdo}',
  instavel: '\\text{semiplano direito}',
  marginal: '\\text{sobre o eixo } j\\omega',
};

function blocoDeLeverrier(destino, analise, ordem) {
  paragrafo(
    destino,
    'Os coeficientes saem por Faddeev-LeVerrier, que só usa produtos e traços de matrizes: '
    + '$\\mathbf{M}_1 = \\mathbf{I}$, $a_k = -\\dfrac{1}{k}\\operatorname{tr}(\\mathbf{A}\\mathbf{M}_k)$ e '
    + '$\\mathbf{M}_{k+1} = \\mathbf{A}\\mathbf{M}_k + a_k\\mathbf{I}$.',
  );

  for (const passo of analise.passos) {
    const compacto = ordem <= 4;
    const esquerda = compacto
      ? `\\mathbf{A}\\mathbf{M}_{${passo.ordem}} = ${matrizLatex(passo.matriz)}`
      : `\\operatorname{tr}(\\mathbf{A}\\mathbf{M}_{${passo.ordem}})`;
    formula(
      destino,
      `${esquerda} \\;\\Rightarrow\\; a_{${passo.ordem}} = -\\frac{${numeroLatex(passo.traco)}}{${passo.ordem}}`
      + ` = ${numeroLatex(passo.coeficiente)}`,
    );
  }
}

export function renderizar(destino, projeto) {
  const analise = projeto.analise.estabilidade;
  const ordem = projeto.sistema.ordem;

  paragrafo(destino, 'O polinômio característico é $\\det(s\\mathbf{I} - \\mathbf{A})$.');
  blocoDeLeverrier(destino, analise, ordem);

  separador(destino);
  paragrafo(destino, '**Polinômio característico:**');
  formula(destino, `\\det(s\\mathbf{I} - \\mathbf{A}) = ${polinomioLatex(analise.coeficientes)}`);

  separador(destino);
  paragrafo(destino, '**Raízes, que são os polos do sistema em malha aberta:**');
  formula(
    destino,
    tabelaLatex(
      ['\\text{Polo}', '\\text{Valor}', '\\text{Posição}'],
      analise.polos.map((polo, indice) => [
        `s_{${indice + 1}}`,
        complexoLatex(polo, 4),
        NOMES_DA_CLASSE[analise.classes[indice]],
      ]),
    ),
  );

  if (analise.estavel) {
    aviso(
      destino,
      'sucesso',
      'Todas as raízes têm parte real negativa, então **o sistema é estável**.',
    );
  } else if (analise.marginal) {
    aviso(
      destino,
      'atencao',
      'Há raiz sobre o eixo $j\\omega$ e nenhuma à direita: **o sistema é marginalmente estável**, '
      + 'não assintoticamente estável.',
    );
  } else {
    const direita = analise.polos.filter((polo) => polo.re > 0);
    aviso(
      destino,
      'erro',
      `Existe${direita.length > 1 ? 'm' : ''} ${direita.length} raiz${direita.length > 1 ? 'es' : ''} `
      + `com parte real positiva (a maior em $\\operatorname{Re} = ${fixoLatex(Math.max(...direita.map((polo) => polo.re)), 4)}$), `
      + 'então **o sistema é instável**.',
    );
  }
}
