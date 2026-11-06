import { fixo } from '../formatacao/numero.js';

export const CORES = {
  malhaAberta: '#d0342c',
  desejado: '#a435c9',
  desejadoBorda: '#5b1a72',
  alocado: '#12b0c8',
  alocadoBorda: '#123c8c',
  observador: '#e08b1a',
  resposta: '#2b6cd9',
  referencia: '#46535f',
  valorFinal: '#46535f',
  faixa: '#1f9d55',
  limite: '#d0342c',
  eixoImaginario: '#7b8794',
};

export function desenharPolosAbertos(plano, polos, opcoes = {}) {
  polos.forEach((polo, indice) => {
    plano.cruz(polo, { stroke: CORES.malhaAberta, 'stroke-width': 2.4 });
    if (opcoes.rotular) {
      plano.rotulo(polo, `s${indice + 1}`, { fill: CORES.malhaAberta });
    }
  });
  if (polos.length > 0) {
    plano.registrarLegenda('x', CORES.malhaAberta, opcoes.legenda || 'Polos de malha aberta');
  }
}

export function desenharPolosDesejados(plano, polos, opcoes = {}) {
  for (const polo of polos) {
    plano.estrela(polo, {
      fill: CORES.desejado,
      stroke: CORES.desejadoBorda,
      'stroke-width': 1.2,
    });
  }
  if (polos.length > 0) {
    plano.registrarLegenda('linha', CORES.desejado, opcoes.legenda || 'Polos desejados');
  }
}

export function desenharPolosAlocados(plano, polos, opcoes = {}) {
  const cor = opcoes.cor || CORES.alocado;
  for (const polo of polos) {
    plano.quadrado(polo, {
      fill: cor,
      stroke: opcoes.borda || CORES.alocadoBorda,
      'stroke-width': 1.6,
    }, 4.5);
  }
  if (polos.length > 0) {
    plano.registrarLegenda('linha', cor, opcoes.legenda || 'Polos obtidos');
  }
}

export function desenharEixoImaginario(plano) {
  plano.reta(0, plano.janela.yMin, 0, plano.janela.yMax, {
    stroke: CORES.eixoImaginario,
    'stroke-width': 1.4,
    'stroke-dasharray': '6 5',
  });
  plano.registrarLegenda('tracejada', CORES.eixoImaginario, 'Eixo imaginário (limite de estabilidade)');
}

export function desenharResposta(grafico, simulacao, opcoes = {}) {
  const cor = opcoes.cor || CORES.resposta;
  grafico.curva(simulacao.tempos, simulacao.saidas, {
    stroke: cor,
    'stroke-width': opcoes.espessura || 2.4,
    'stroke-linejoin': 'round',
    ...(opcoes.tracejado ? { 'stroke-dasharray': opcoes.tracejado } : {}),
  });
  grafico.registrarLegenda('linha', cor, opcoes.legenda || 'y(t)');
}

export function desenharSerie(grafico, tempos, valores, cor, legenda, tracejado = null) {
  grafico.curva(tempos, valores, {
    stroke: cor,
    'stroke-width': 2,
    'stroke-linejoin': 'round',
    ...(tracejado ? { 'stroke-dasharray': tracejado } : {}),
  });
  grafico.registrarLegenda(tracejado ? 'tracejada' : 'linha', cor, legenda);
}

export function desenharNivel(grafico, valor, cor, rotulo, tracejado = '6 5') {
  grafico.reta(grafico.janela.xMin, valor, grafico.janela.xMax, valor, {
    stroke: cor,
    'stroke-width': 1.4,
    'stroke-dasharray': tracejado,
  });
  grafico.registrarLegenda('tracejada', cor, rotulo);
}

export function desenharFaixa(grafico, valorFinal, faixa) {
  const desvio = Math.abs(valorFinal) * faixa;
  for (const nivel of [valorFinal - desvio, valorFinal + desvio]) {
    grafico.reta(grafico.janela.xMin, nivel, grafico.janela.xMax, nivel, {
      stroke: CORES.faixa,
      'stroke-width': 1.2,
      'stroke-dasharray': '2 4',
    });
  }
  grafico.registrarLegenda('tracejada', CORES.faixa, `Faixa de ±${fixo(faixa * 100, 0)}%`);
}

export function desenharInstante(grafico, tempo, cor, rotulo) {
  if (!Number.isFinite(tempo) || tempo > grafico.janela.xMax) {
    return;
  }
  grafico.reta(tempo, grafico.janela.yMin, tempo, grafico.janela.yMax, {
    stroke: cor,
    'stroke-width': 1.4,
    'stroke-dasharray': '4 4',
  });
  grafico.registrarLegenda('tracejada', cor, rotulo);
}
