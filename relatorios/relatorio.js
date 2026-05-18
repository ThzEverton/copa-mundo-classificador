const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Header, Footer
} = require('docx');
const fs = require('fs');

const PRETO = "000000";
const CINZA_ESCURO = "333333";
const CINZA = "666666";
const CINZA_CLARO = "EEEEEE";
const VERDE_SUAVE = "D6E8D6";
const BEGE_SUAVE = "F5F0E8";

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: opts.before || 60, after: opts.after || 60 },
    alignment: opts.align || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        font: "Times New Roman",
        size: opts.size || 24,
        bold: opts.bold || false,
        italics: opts.italic || false,
        color: opts.color || PRETO,
        underline: opts.underline ? {} : undefined,
      })
    ]
  });
}

function titulo(text) {
  return new Paragraph({
    spacing: { before: 0, after: 120 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text, font: "Times New Roman", size: 36, bold: true, color: PRETO })
    ]
  });
}

function subtitulo(text) {
  return new Paragraph({
    spacing: { before: 0, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text, font: "Times New Roman", size: 26, bold: false, italics: true, color: CINZA_ESCURO })
    ]
  });
}

function sec(num, text) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    children: [
      new TextRun({ text: `${num}. ${text}`, font: "Times New Roman", size: 26, bold: true, color: PRETO })
    ]
  });
}

function subsec(text) {
  return new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({ text, font: "Times New Roman", size: 24, bold: true, italics: true, color: CINZA_ESCURO })
    ]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, font: "Times New Roman", size: 24, color: PRETO })]
  });
}

function num(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, font: "Times New Roman", size: 24, color: PRETO })]
  });
}

function vazio() {
  return new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun("")] });
}

function tabelaVariaveis() {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        shading: { fill: "CCCCCC", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          left: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          right: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
        },
        children: [new Paragraph({ children: [new TextRun({ text: "Variável", font: "Times New Roman", size: 22, bold: true })] })]
      }),
      new TableCell({
        width: { size: 6360, type: WidthType.DXA },
        shading: { fill: "CCCCCC", type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          left: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
          right: { style: BorderStyle.SINGLE, size: 4, color: PRETO },
        },
        children: [new Paragraph({ children: [new TextRun({ text: "Descrição", font: "Times New Roman", size: 22, bold: true })] })]
      })
    ]
  });

  const dados = [
    ["total_goals_scored", "Total de gols marcados pela seleção"],
    ["total_goals_conceded", "Total de gols sofridos pela seleção"],
    ["goal_difference", "Saldo de gols"],
    ["matches_played", "Número de partidas jogadas"],
    ["goals_per_match", "Média de gols por partida"],
    ["stage_encoded", "Fase estimada pela posição final e tamanho da Copa"],
    ["advanced", "Variável alvo: 1 = avançou, 0 = eliminada"],
  ];

  const b = { style: BorderStyle.SINGLE, size: 4, color: PRETO };
  const borders = { top: b, bottom: b, left: b, right: b };

  const linhas = dados.map(([v, d]) => new TableRow({
    children: [
      new TableCell({
        width: { size: 3000, type: WidthType.DXA },
        borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: v, font: "Courier New", size: 20, italics: true })] })]
      }),
      new TableCell({
        width: { size: 6360, type: WidthType.DXA },
        borders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: d, font: "Times New Roman", size: 22 })] })]
      })
    ]
  }));

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3000, 6360],
    rows: [headerRow, ...linhas]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "-", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: 60 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: CINZA, space: 4 } },
            children: [
              new TextRun({ text: "Relatório Final – Ciência de Dados", font: "Times New Roman", size: 18, color: CINZA, italics: true })
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: CINZA, space: 4 } },
            children: [
              new TextRun({ text: "Página ", font: "Times New Roman", size: 18, color: CINZA }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18, color: CINZA })
            ]
          })
        ]
      })
    },
    children: [

      // CAPA
      vazio(), vazio(), vazio(),
      titulo("Relatório Final – Ciência de Dados"),
      vazio(),
      subtitulo("Copa do Mundo FIFA"),
      subtitulo("Previsão de Classificação de Seleções com Árvore de Decisão"),
      vazio(), vazio(), vazio(), vazio(),
      p("Disciplina: Ciência de Dados", { align: AlignmentType.CENTER, color: CINZA }),
      p("Projeto: Classificador de Seleções – Copa do Mundo FIFA", { align: AlignmentType.CENTER, color: CINZA }),
      vazio(), vazio(),

      // SEÇÃO 1
      sec("1", "Introdução"),
      p("A Copa do Mundo FIFA é o maior torneio de futebol do mundo e possui uma base histórica rica, com informações sobre seleções, gols, jogos, campanhas e classificações finais."),
      vazio(),
      p("O problema deste projeto é prever se uma seleção tem perfil de avançar de fase ou ser eliminada em uma Copa do Mundo, usando dados históricos de desempenho."),
      vazio(),
      p("O tipo de problema escolhido foi classificação, pois o modelo precisa escolher entre duas classes:"),
      bullet("1 – a seleção avançou de fase;"),
      bullet("0 – a seleção foi eliminada."),
      vazio(),
      p("O dataset utilizado foi o FIFA Football World Cup Dataset, disponível no Kaggle. A base contém dados reais sobre edições da Copa e desempenho das seleções por ano."),
      vazio(),
      subsec("Fundamentação da base escolhida"),
      p("A base é adequada porque possui informações diretamente relacionadas ao desempenho esportivo das seleções, como:"),
      bullet("Gols marcados;"),
      bullet("Gols sofridos;"),
      bullet("Quantidade de partidas;"),
      bullet("Saldo de gols;"),
      bullet("Posição final na competição."),
      p("Esses dados permitem criar variáveis numéricas para treinar um modelo de classificação."),
      vazio(),

      // SEÇÃO 2
      sec("2", "Processamento de Dados"),
      p("O projeto pode usar três fontes de dados:"),
      num("Se existir data/WorldCupMatches.csv, o sistema usa esse arquivo local."),
      num("Se existirem CSVs anuais locais (FIFA - 1930.csv até FIFA - 2022.csv), o sistema usa esses arquivos."),
      num("Se nenhum arquivo local existir, o sistema tenta baixar automaticamente via KaggleHub."),
      vazio(),
      p("Na versão atual, os CSVs anuais locais da pasta data/ são usados. Cada arquivo representa uma edição da Copa e contém uma linha por seleção."),
      vazio(),
      subsec("Limpeza e transformações realizadas"),
      bullet("Leitura dos CSVs anuais;"),
      bullet("Identificação do ano da Copa pelo nome do arquivo;"),
      bullet("Conversão de colunas numéricas para inteiros;"),
      bullet("Criação do saldo de gols;"),
      bullet("Criação da média de gols por partida;"),
      bullet("Criação da variável alvo advanced;"),
      bullet("Separação das variáveis independentes e da classe alvo."),
      vazio(),
      subsec("Variáveis criadas"),
      vazio(),
      tabelaVariaveis(),
      vazio(),
      p("A variável advanced foi estimada usando a posição final da seleção e a quantidade de participantes da edição. Isso evita tratar seleções de Copas antigas, que tinham menos participantes, de forma equivocada.", { italic: true }),
      p("A variável stage_encoded não entra como variável de entrada do modelo, pois poderia entregar parte da resposta.", { italic: true }),
      vazio(),

      // SEÇÃO 3
      sec("3", "Resultados do Modelo"),
      p("O algoritmo escolhido foi a Árvore de Decisão, pois é adequado para classificação e permite explicar a lógica do modelo com mais facilidade."),
      vazio(),
      p("Os dados foram divididos em:"),
      bullet("70% para treino;"),
      bullet("30% para teste."),
      vazio(),
      p("As variáveis independentes usadas pelo modelo foram:"),
      bullet("Total de gols marcados;"),
      bullet("Total de gols sofridos;"),
      bullet("Saldo de gols;"),
      bullet("Partidas jogadas;"),
      bullet("Média de gols por partida."),
      vazio(),
      subsec("Métricas de desempenho"),
      p("A aplicação calcula automaticamente acurácia, matriz de confusão e importância das variáveis. Na execução atual, a acurácia ficou em aproximadamente 97,96%."),
      vazio(),
      p("A matriz de confusão mostra os acertos e erros do modelo para as duas classes:"),
      bullet("Seleções eliminadas previstas como eliminadas;"),
      bullet("Seleções eliminadas previstas como avançaram;"),
      bullet("Seleções que avançaram previstas como eliminadas;"),
      bullet("Seleções que avançaram previstas como avançaram."),
      vazio(),
      subsec("Interpretação técnica"),
      p("A Árvore de Decisão funciona como uma sequência de perguntas. Por exemplo:"),
      bullet("A seleção disputou mais partidas?"),
      bullet("O saldo de gols foi positivo?"),
      bullet("A média de gols por partida foi alta?"),
      bullet("A seleção sofreu muitos gols?"),
      vazio(),
      p("Com base nessas respostas, o modelo classifica a seleção como perfil de avanço ou perfil de eliminação. Na importância das variáveis, matches_played aparece como uma das mais relevantes, pois seleções que jogam mais partidas normalmente chegaram a fases posteriores da Copa."),
      vazio(),

      // SEÇÃO 4
      sec("4", "Guia da Aplicação"),
      p("A aplicação foi desenvolvida em Flask, com HTML, CSS e Jinja2."),
      vazio(),
      p("Para rodar localmente:"),
      bullet("pip install -r requirements.txt"),
      bullet("python app.py"),
      p("Depois, acesse: http://localhost:5000"),
      vazio(),
      subsec("Funcionamento da interface"),
      p("Na tela inicial, o usuário informa:"),
      bullet("Total de gols marcados;"),
      bullet("Total de gols sofridos;"),
      bullet("Número de partidas jogadas."),
      vazio(),
      p("A aplicação calcula automaticamente:"),
      bullet("Saldo de gols;"),
      bullet("Gols por partida;"),
      bullet("Probabilidade de avanço;"),
      bullet("Classificação prevista."),
      vazio(),
      p("O sistema também exibe: acurácia, matriz de confusão, importância das variáveis, seleções históricas com perfil parecido, ranking das melhores campanhas da base e a imagem da Árvore de Decisão."),
      vazio(),
      subsec("Deploy da aplicação"),
      p("O projeto foi publicado na Vercel e pode ser acessado pelo link: https://copa-mundo-classificador.vercel.app/"),
      vazio(),
      p("Arquivos usados para o deploy:"),
      bullet("api/index.py – ponto de entrada da aplicação Flask na Vercel;"),
      bullet("vercel.json – arquivo de configuração de rotas;"),
      bullet("requirements.txt – dependências do projeto."),
      p("Os CSVs foram mantidos dentro da pasta data/, evitando dependência de download externo em produção."),
      vazio(),

      // SEÇÃO 5
      sec("5", "Conclusão"),
      p("O projeto mostrou que dados simples, como gols marcados, gols sofridos, saldo de gols e partidas jogadas, já permitem identificar padrões importantes no desempenho das seleções em Copas do Mundo."),
      vazio(),
      p("A solução é viável porque transforma dados históricos em uma aplicação interativa, permitindo que o usuário simule uma campanha e receba uma previsão de classificação."),
      vazio(),
      p("Como limitação, o modelo não considera fatores mais complexos, como qualidade dos adversários, posse de bola, finalizações, lesões, técnico, ranking FIFA ou contexto da partida."),
      vazio(),
      p("Como melhorias futuras, seria possível:"),
      bullet("Adicionar novas variáveis;"),
      bullet("Comparar outros algoritmos de classificação;"),
      bullet("Salvar o modelo treinado em arquivo;"),
      bullet("Melhorar a validação dos campos do formulário;"),
      bullet("Adicionar screenshots da aplicação no relatório final."),
      vazio()
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/Relatorio_Copa_do_Mundo_v2.docx", buffer);
  console.log("Gerado com sucesso!");
}).catch(console.error);