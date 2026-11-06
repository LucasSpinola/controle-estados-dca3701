import { elemento, paragrafo, secao } from '../componentes.js';
import { montarBotaoDeDownload } from '../ferramentas.js';
import { criarPlano } from '../../grafico/fabrica.js';
import {
  CORES,
  desenharPolosAbertos,
  desenharPolosAlocados,
  desenharEixoImaginario,
} from '../../grafico/camadas.js';

export const titulo = 'Plano s: antes e depois do projeto';

export function pontosDoProjeto(projeto) {
  const pontos = [...projeto.analise.estabilidade.polos];
  if (projeto.realimentacao?.viavel) {
    pontos.push(...projeto.realimentacao.polosObtidos);
  }
  if (projeto.observador?.viavel) {
    pontos.push(...projeto.observador.polosObtidos);
  }
  if (projeto.seguidor?.viavel) {
    pontos.push(...projeto.seguidor.polosObtidos);
  }
  return pontos;
}

export function montarPlano(projeto, opcoes = {}) {
  const plano = criarPlano(pontosDoProjeto(projeto), 'Polos no plano s', opcoes);
  desenharEixoImaginario(plano);
  desenharPolosAbertos(plano, projeto.analise.estabilidade.polos, {
    legenda: 'Polos da planta (malha aberta)',
  });

  if (projeto.realimentacao?.viavel) {
    desenharPolosAlocados(plano, projeto.realimentacao.polosObtidos, {
      legenda: 'Polos de A + BK',
    });
  }
  if (projeto.seguidor?.viavel) {
    desenharPolosAlocados(plano, projeto.seguidor.polosObtidos, {
      legenda: 'Polos do seguidor',
    });
  }
  if (projeto.observador?.viavel) {
    desenharPolosAlocados(plano, projeto.observador.polosObtidos, {
      cor: CORES.observador,
      borda: '#8a5200',
      legenda: 'Polos de A − LC',
    });
  }
  return plano;
}

export function renderizar(destino, projeto, aberto = false) {
  const corpo = secao(destino, titulo, aberto);
  paragrafo(
    corpo,
    'Os polos da planta em malha aberta, junto com os que o projeto colocou. Tudo à esquerda do '
    + 'eixo tracejado é estável.',
  );
  const plano = montarPlano(projeto);
  const svg = plano.elemento();
  const moldura = elemento('div', 'grafico');
  moldura.appendChild(svg);
  corpo.appendChild(moldura);
  montarBotaoDeDownload(corpo, svg, 'plano-s.svg');
}
