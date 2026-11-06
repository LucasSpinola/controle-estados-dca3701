import assert from 'node:assert/strict';

class NoFalso {
  constructor(tag, espaco = null) {
    this.tagName = tag;
    this.namespaceURI = espaco;
    this.children = [];
    this.attributes = {};
    this.ouvintes = {};
    this.className = '';
    this.hidden = false;
    this.open = false;
    this.type = '';
    this.value = '';
    this.title = '';
    this.conteudo = '';
    this.dataset = {};
    this.classList = {
      add: (nome) => {
        this.className = `${this.className} ${nome}`.trim();
      },
      remove: (nome) => {
        this.className = this.className.split(' ').filter((item) => item !== nome).join(' ');
      },
      contains: (nome) => this.className.split(' ').includes(nome),
    };
  }

  setAttribute(nome, valor) {
    this.attributes[nome] = String(valor);
  }

  getAttribute(nome) {
    return this.attributes[nome];
  }

  appendChild(filho) {
    this.children.push(filho);
    return filho;
  }

  insertBefore(filho) {
    this.children.unshift(filho);
    return filho;
  }

  removeChild(filho) {
    this.children = this.children.filter((item) => item !== filho);
  }

  addEventListener(nome, funcao) {
    this.ouvintes[nome] = funcao;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  set textContent(valor) {
    this.conteudo = String(valor);
    this.children = [];
  }

  get textContent() {
    return this.conteudo;
  }

  serializar() {
    const atributos = Object.entries({
      ...(this.className ? { class: this.className } : {}),
      ...this.attributes,
    })
      .map(([chave, valor]) => `${chave}="${valor}"`)
      .join(' ');
    const interno = this.conteudo
      + this.children.map((filho) => (filho.serializar ? filho.serializar() : String(filho))).join('');
    return `<${this.tagName}${atributos ? ` ${atributos}` : ''}>${interno}</${this.tagName}>`;
  }
}

const registrados = new Map();

globalThis.document = {
  createElement: (tag) => new NoFalso(tag),
  createElementNS: (espaco, tag) => new NoFalso(tag, espaco),
  createTextNode: (texto) => ({ texto, serializar: () => texto }),
  getElementById: (identificador) => {
    if (!registrados.has(identificador)) {
      registrados.set(identificador, new NoFalso('div'));
    }
    return registrados.get(identificador);
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete',
  styleSheets: [],
  body: new NoFalso('body'),
};

globalThis.window = {
  requestAnimationFrame: (funcao) => funcao(),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  setTimeout: (funcao) => {
    funcao();
    return 0;
  },
  clearTimeout: () => {},
  location: { search: '?objetivo=realimentacao&polosK=-1,-2,-3', pathname: '/' },
  history: { replaceState: (...argumentos) => enderecosEscritos.push(argumentos[2]) },
};

const enderecosEscritos = [];

const { projetar } = await import('../assets/js/espaco/projeto.js');
const { renderizarResultado } = await import('../assets/js/interface/resultado.js');
const { passos } = await import('../assets/js/interface/passos/indice.js');
const { EXERCICIOS } = await import('../assets/js/interface/exercicios.js');
const { CAMPOS, VALORES_PADRAO, interpretarFormulario } = await import('../assets/js/interface/formulario.js');
const { montarQuestao } = await import('../assets/js/interface/relatorio.js');
const { montarApresentacao } = await import('../assets/js/interface/apresentacao.js');
const { aplicarEndereco, atualizarEndereco } = await import('../assets/js/interface/endereco.js');

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

function conferirTexto(texto, contexto) {
  assert.ok(texto.length > 400, `${contexto}: a saída ficou curta demais (${texto.length})`);
  assert.ok(!texto.includes('undefined'), `${contexto}: apareceu "undefined" na saída`);
  assert.ok(!texto.includes('NaN'), `${contexto}: apareceu "NaN" na saída`);
  assert.ok(!texto.includes('null'), `${contexto}: apareceu "null" na saída`);
  assert.ok(
    !texto.includes('Não foi possível'),
    `${contexto}: a renderização terminou em falha de execução`,
  );
}

for (const exercicio of EXERCICIOS) {
  for (const questao of exercicio.questoes) {
    teste(`${exercicio.nome} · ${questao.nome} resolve e renderiza`, () => {
      const leitura = interpretarFormulario(questao);
      assert.equal(leitura.erro, undefined, `leitura: ${leitura.erro}`);

      const projeto = projetar(leitura.entrada);
      const destino = new NoFalso('div');
      renderizarResultado(destino, projeto, {
        questao: { ...questao, exercicio: exercicio.nome },
        barra: false,
        aberto: true,
      });
      conferirTexto(destino.serializar(), `${exercicio.nome} · ${questao.nome}`);
    });
  }
}

teste('todas as questões citam só campos conhecidos do formulário', () => {
  for (const exercicio of EXERCICIOS) {
    for (const questao of exercicio.questoes) {
      for (const nome of Object.keys(questao)) {
        if (nome === 'nome' || nome === 'enunciado') {
          continue;
        }
        assert.ok(nome in CAMPOS, `${questao.nome}: campo desconhecido "${nome}"`);
      }
    }
  }
});

teste('os valores padrão cobrem todos os campos', () => {
  for (const nome of Object.keys(CAMPOS)) {
    assert.ok(nome in VALORES_PADRAO, `falta valor padrão para "${nome}"`);
  }
});

teste('o relatório da lista monta todas as questões', () => {
  for (const exercicio of EXERCICIOS) {
    const destino = new NoFalso('div');
    for (const questao of exercicio.questoes) {
      montarQuestao(destino, exercicio, questao);
    }
    assert.equal(destino.children.length, exercicio.questoes.length);
    conferirTexto(destino.serializar(), `relatório do ${exercicio.nome}`);
  }
});

teste('cada passo expõe título e renderizador', () => {
  for (const passo of passos) {
    assert.equal(typeof passo.titulo, 'string');
    assert.equal(typeof passo.renderizar, 'function');
  }
});

teste('entradas inválidas viram mensagem, não exceção', () => {
  const casos = [
    { ...VALORES_PADRAO, matrizA: '1 2; 3' },
    { ...VALORES_PADRAO, fonte: 'transferencia', denominador: 'abc' },
    { ...VALORES_PADRAO, objetivo: 'realimentacao', polosK: '-1' },
    { ...VALORES_PADRAO, objetivo: 'realimentacao', polosK: '-1+1i, -2, -3' },
    { ...VALORES_PADRAO, objetivo: 'seguidor', polosSeguidor: '-1, -2' },
  ];
  for (const caso of casos) {
    const leitura = interpretarFormulario(caso);
    assert.ok(leitura.erro, `o caso deveria ser recusado: ${JSON.stringify(caso).slice(0, 80)}`);
  }
});

teste('uma planta não controlável renderiza o aviso, sem quebrar', () => {
  const projeto = projetar({
    fonte: 'matrizes',
    a: [[1, 0], [0, 2]],
    b: [[1], [0]],
    c: [[1, 1]],
    objetivo: 'realimentacao',
    polosK: [{ re: -1, im: 0 }, { re: -2, im: 0 }],
  });
  const destino = new NoFalso('div');
  renderizarResultado(destino, projeto, { barra: false, aberto: true });
  const texto = destino.serializar();
  assert.ok(
    texto.includes('não é controlável'),
    'esperava o aviso de sistema não controlável',
  );
  assert.ok(!texto.includes('NaN'));
});

teste('a apresentação monta capa, questões e roteiro sem quebrar', () => {
  montarApresentacao(true);
  const exemplos = document.getElementById('exemplos');
  const roteiro = document.getElementById('roteiro-lista');
  assert.ok(exemplos.children.length >= 2, 'os dois exercícios precisam virar grupos de botões');
  assert.equal(roteiro.children.length, passos.length);
  assert.ok(!exemplos.serializar().includes('undefined'));
});

teste('o endereço é lido e reescrito com os campos do objetivo', () => {
  assert.equal(aplicarEndereco(), true);
  atualizarEndereco();
  const ultimo = enderecosEscritos.at(-1);
  assert.ok(ultimo.includes('objetivo=realimentacao'), ultimo);
  assert.ok(ultimo.includes('polosK='), ultimo);
  assert.ok(!ultimo.includes('polosL='), ultimo);
});

console.log(`\n${executados - falhas} de ${executados} testes passaram.`);
if (falhas > 0) {
  process.exitCode = 1;
}
