# Projeto Copa do Mundo FIFA - Ciencia de Dados

Aplicacao web em Flask para prever se uma selecao tem perfil de avancar de fase ou ser eliminada em uma Copa do Mundo.

Categoria da atividade: **Classificacao**.

O sistema guia o usuario por entradas simples de desempenho e retorna uma conclusao: perfil de avanco ou perfil de eliminacao.

## Tecnologias

- Python
- Flask
- pandas
- scikit-learn
- matplotlib
- numpy
- KaggleHub

## Estrutura

```text
.
├── api/
│   └── index.py
├── data/
│   ├── FIFA - 1930.csv
│   ├── FIFA - 1934.csv
│   ├── ...
│   └── FIFA - 2022.csv
├── static/
│   └── style.css
├── templates/
│   └── index.html
├── app.py
├── requirements.txt
├── vercel.json
├── RELATORIO.md
└── README.md
```

## Como rodar localmente

1. Instale as dependencias:

```bash
pip install -r requirements.txt
```

2. Rode a aplicacao:

```bash
python app.py
```

3. Abra no navegador:

```text
http://localhost:5000
```

## Fonte dos dados

O projeto tenta carregar os dados de tres formas:

1. Se existir `data/WorldCupMatches.csv`, usa esse arquivo local.
2. Se existirem arquivos `data/FIFA - YYYY.csv`, usa esses CSVs anuais locais.
3. Se nenhum arquivo local existir, baixa automaticamente pelo KaggleHub:

```text
iamsouravbanerjee/fifa-football-world-cup-dataset
```

Para deploy, a melhor opcao e manter os CSVs dentro da pasta `data/`, evitando depender de download externo em tempo de execucao.

## O que o modelo faz

O projeto usa uma Arvore de Decisao para classificar selecoes em duas classes:

- `1`: avancou de fase
- `0`: foi eliminada

As variaveis usadas pelo modelo sao:

- total de gols marcados
- total de gols sofridos
- saldo de gols
- partidas jogadas
- gols por partida

O modelo usa divisao de 70% dos dados para treino e 30% para teste.
As metricas exibidas sao acuracia, matriz de confusao, importancia das variaveis,
exemplos historicos parecidos e ranking das melhores campanhas da base.

## Deploy na Vercel

Aplicacao publicada:

```text
https://copa-mundo-classificador.vercel.app/
```

O projeto possui os arquivos necessarios para deploy:

- `api/index.py`: ponto de entrada usado pela Vercel para executar o Flask.
- `vercel.json`: redireciona as rotas para a funcao Python.
- `requirements.txt`: lista as dependencias instaladas no deploy.

Para atualizar o deploy pelo terminal:

```bash
vercel
```

Ou, pelo fluxo GitHub + Vercel:

1. Fazer commit das alteracoes.
2. Enviar para o GitHub.
3. A Vercel atualiza o projeto automaticamente ou permite um novo deploy pelo painel.

Observacao: a imagem da Arvore de Decisao e gerada em tempo de execucao e servida pela rota `/arvore_decisao.png`, o que evita depender de um arquivo estatico gerado manualmente.
