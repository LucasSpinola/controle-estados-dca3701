<div align="center" markdown="1">

# Espaço de estados: alocação de polos, observador e seguidor

**Controlabilidade, observabilidade e projeto por Ackermann, com a conta inteira, passo a passo.**

### [Abrir a aplicação →](https://lucasspinola.github.io/controle-estados-dca3701/)

![Licença de código: MIT](https://img.shields.io/badge/c%C3%B3digo-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-f7df1e) ![Sem dependências](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-brightgreen) ![Funciona offline](https://img.shields.io/badge/offline-sim-brightgreen)

**Lucas Augusto Spinola Pinto**<br>
DCA-3701 Projeto de Sistemas de Controle · 3ª unidade · DCA · UFRN

</div>

---

Informe o sistema por $\mathbf{A}$, $\mathbf{B}$ e $\mathbf{C}$ ou por $G(s)$. A página monta a forma
canônica, acha o polinômio característico por Faddeev-LeVerrier, monta as matrizes $\mathbf{U}$ e
$\mathbf{V}$ para decidir controlabilidade e observabilidade, e projeta por Ackermann a realimentação
de estados, o observador e o seguidor de referência para o degrau, conferindo tudo na resposta
simulada.

**[Os passos](#os-passos)** · **[Rodar local](#rodar-local)** · **[Estrutura](#estrutura)** · **[Testes](#testes)**

## Destaques

|||
|---|---|
| **Duas entradas** | matrizes $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$ ou $G(s)$, que vira forma canônica |
| **Formas canônicas** | controlável e observável, montadas dos $\alpha_i$ e $\beta_i$ da folha de fórmulas |
| **Estabilidade** | $\det(s\mathbf{I} - \mathbf{A})$ por Faddeev-LeVerrier, com as raízes classificadas |
| **Controlabilidade** | $\mathbf{U} = [\mathbf{B}\;\mathbf{AB}\;\dots\;\mathbf{A}^{n-1}\mathbf{B}]$, com $\det$, posto e a inversa |
| **Observabilidade** | $\mathbf{V} = [\mathbf{C};\mathbf{CA};\dots;\mathbf{CA}^{n-1}]$, com $\det$, posto e a inversa |
| **Realimentação de estados** | $\mathbf{K} = -[0\;\dots\;1]\mathbf{U}^{-1}q_c(\mathbf{A})$, na convenção $u = \mathbf{K}\mathbf{x}$ da disciplina |
| **Observador** | $\mathbf{L} = q_o(\mathbf{A})\mathbf{V}^{-1}[0\;\dots\;1]^{\mathsf{T}}$ e a dinâmica do erro |
| **Princípio da separação** | a dinâmica conjunta de ordem $2n$ e seus polos, quando há $\mathbf{K}$ e $\mathbf{L}$ |
| **Seguidor de referência** | integrador do erro, par aumentado de ordem $n+1$, $\mathbf{K}$ e $k_I$, erro de regime nulo |
| **Entrada flexível** | $G(s)$ aceita `s(s+3)`, `(s+2)^2` ou a lista de coeficientes; os polos aceitam `-1±0,1i, -5, -12` |
| **A conta, não só o resultado** | fórmula, substituição e resultado de cada passo, em LaTeX |
| **Projeto conferido** | polinômio característico obtido, polos alocados e resposta ao degrau simulada |
| **Questões da lista** | cada questão do 1º e do 2º exercício preenche o formulário com um clique |
| **PDF** | **Baixar PDF** imprime o projeto aberto com o enunciado; **PDF da lista** resolve a lista inteira |
| **Link que reabre o projeto** | os campos vão para a barra de endereços |

## Os passos

| | Passo | O que aparece |
|---|---|---|
| 1 | Sistema em espaço de estados | $\mathbf{A}$, $\mathbf{B}$, $\mathbf{C}$, a forma canônica quando a entrada é $G(s)$, e a volta a $G(s)$ |
| 2 | Polinômio característico | os traços de Faddeev-LeVerrier, $\det(s\mathbf{I} - \mathbf{A})$, as raízes e o veredito de estabilidade |
| 3 | Controlabilidade | cada coluna $\mathbf{A}^k\mathbf{B}$, a matriz $\mathbf{U}$, $\det \mathbf{U}$, o posto e $\mathbf{U}^{-1}$ |
| 4 | Observabilidade | cada linha $\mathbf{C}\mathbf{A}^k$, a matriz $\mathbf{V}$, $\det \mathbf{V}$, o posto e $\mathbf{V}^{-1}$ |
| 5 | Realimentação de estados | $q_c(s)$, $q_c(\mathbf{A})$ termo a termo, $\mathbf{K}$, $\mathbf{A} + \mathbf{B}\mathbf{K}$ e os polos obtidos |
| 6 | Observador | $q_o(s)$, $q_o(\mathbf{A})$, $\mathbf{L}$, $\mathbf{A} - \mathbf{L}\mathbf{C}$ e os polos do erro |
| 7 | Seguidor de referência | o par aumentado, $\hat{\mathbf{U}}$, $\hat{\mathbf{K}} = [\mathbf{K}\;\;k_I]$ e o ganho estático |
| 8 | Verificação no tempo | polos da dinâmica conjunta, resposta ao degrau e queda do erro de estimação |

Depois dos passos vem o plano $s$ com os polos da planta e os que o projeto colocou. Quando o sistema
não é controlável ou não é observável, o passo correspondente explica por que a fórmula de Ackermann
não se aplica, em vez de devolver um número sem sentido.

A convenção de sinal segue a folha de fórmulas da disciplina: $u(t) = \mathbf{K}\mathbf{x}(t)$, com
$\mathbf{K} = -[0\;\dots\;1]\mathbf{U}^{-1}q_c(\mathbf{A})$ e malha fechada $\mathbf{A} + \mathbf{B}\mathbf{K}$.
O passo 5 mostra também o ganho na convenção $u = -\mathbf{K}\mathbf{x}$, usada por boa parte da
bibliografia.

## Rodar local

A página usa módulos ES, então precisa ser servida por HTTP — abrir o `index.html` direto do disco não
funciona, o navegador bloqueia `import` em `file://`.

```bash
git clone https://github.com/LucasSpinola/controle-estados-dca3701.git
cd controle-estados-dca3701
npm start                    # ou: python -m http.server 8000
```

Depois abra <http://localhost:8000>.

**Como usar:** escolha informar por matrizes ou por $G(s)$. Nas matrizes, `;` separa as linhas e o
espaço separa os elementos — `-4 3 0; -1 -4 -1; 0 0 -2`. Em $G(s)$, vale a expressão, como `s(s+3)`, ou
os coeficientes em ordem decrescente de $s$. Escolha o objetivo, informe os polos desejados com vírgula
entre eles e `±` para o par conjugado — `-1±0,1i, -5, -12` — e clique em **Resolver**. O seguidor pede
$n+1$ polos, porque o integrador do erro acrescenta um estado.

**PDF:** o botão **Baixar PDF**, acima do resultado, e o **PDF da lista**, ao lado das questões, abrem a
impressão do navegador. Escolha **Salvar como PDF** no destino. Todos os passos saem abertos, com os
gráficos em vetor.

## Estrutura

```
index.html              página única da aplicação
assets/
├── css/estilo.css      interface, planos e folha de impressão
├── vendor/katex/       KaTeX embarcado, sem CDN
└── js/
    ├── principal.js    ponto de entrada e orquestração
    ├── nucleo/         complexos, polinômios, raízes, matrizes e leitura de entrada
    ├── espaco/         sistema, análise, Ackermann, seguidor e simulação
    ├── formatacao/     números, matrizes e conversão para LaTeX
    ├── grafico/        janela, plano SVG e camadas de desenho
    └── interface/      apresentação, formulário, questões da lista e os passos
testes/                 três suítes em Node puro
```

A direção de dependência é fixa: `nucleo` não conhece ninguém, `espaco` usa `nucleo`, `grafico` e
`formatacao` só traduzem resultados, e `interface` é a única camada que toca o DOM. Um objetivo novo
entra como mais uma entrada em `espaco/projeto.js` e um passo em `interface/passos/`, e as questões de
outra lista entram em `interface/exercicios.js`.

## Testes

```bash
npm run teste
```

`executar.js` resolve as dez questões do 1º e do 2º exercício e confere os ganhos, os polos alocados e
o ganho estático do seguidor; cobre ainda os casos recusados, como planta não controlável, planta não
observável e número errado de polos. `matrizes.js` cobre inversa, posto, determinante, o polinômio
característico (inclusive contra Cayley-Hamilton) e a leitura de matrizes e de listas de polos.
`interface.js` renderiza as questões das duas listas sobre um DOM falso, caçando exceção, `undefined` e
`NaN`, e ainda monta a apresentação e o link que reabre o projeto.

## Publicação

Site estático puro. Em **Settings › Pages**, escolha **Deploy from a branch**, `main` e `/ (root)`.
O `.nojekyll` na raiz impede o Jekyll de mexer nos arquivos.

## Licença

Código sob licença MIT, em [LICENSE](LICENSE). As marcas da UFRN e do DCA em `assets/img/`
pertencem às respectivas instituições e aparecem apenas para identificar a disciplina.
