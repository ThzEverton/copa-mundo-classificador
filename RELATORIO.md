# Relatorio Final - Ciencia de Dados: Copa do Mundo FIFA

## 1. Introducao

A Copa do Mundo FIFA e o maior torneio de futebol do mundo e possui uma base historica rica, com informacoes sobre selecoes, gols, jogos, campanhas e classificacoes finais.

O problema deste projeto e prever se uma selecao tem perfil de avancar de fase ou ser eliminada em uma Copa do Mundo, usando dados historicos de desempenho.

O tipo de problema escolhido para a atividade foi **classificacao**, pois o modelo precisa escolher entre duas classes:

- `1`: a selecao avancou de fase;
- `0`: a selecao foi eliminada.

O dataset escolhido foi o **FIFA Football World Cup Dataset**, disponivel no Kaggle. A base contem dados reais sobre edicoes da Copa e desempenho das selecoes por ano.

### Fundamentacao da base escolhida

A base e adequada porque possui informacoes diretamente relacionadas ao desempenho esportivo das selecoes, como:

- gols marcados;
- gols sofridos;
- quantidade de partidas;
- saldo de gols;
- posicao final na competicao.

Esses dados permitem criar variaveis numericas para treinar um modelo de classificacao.

## 2. Processamento de Dados

O projeto pode usar tres fontes de dados:

1. Se existir `data/WorldCupMatches.csv`, o sistema usa esse arquivo local.
2. Se existirem CSVs anuais locais, como `FIFA - 1930.csv` e `FIFA - 2022.csv`, o sistema usa esses arquivos.
3. Se nenhum arquivo local existir, o sistema tenta baixar automaticamente pelo KaggleHub o dataset `iamsouravbanerjee/fifa-football-world-cup-dataset`.

Na versao atual do projeto, os CSVs anuais locais da pasta `data/` sao usados. Cada arquivo representa uma edicao da Copa e contem uma linha por selecao.

### Limpeza e transformacoes realizadas

As principais transformacoes foram:

- leitura dos CSVs anuais;
- identificacao do ano da Copa pelo nome do arquivo;
- conversao de colunas numericas para inteiros;
- criacao do saldo de gols;
- criacao da media de gols por partida;
- criacao da variavel alvo `advanced`;
- separacao das variaveis independentes e da classe que o modelo deve prever.

### Variaveis criadas

| Variavel | Explicacao |
|---|---|
| `total_goals_scored` | Total de gols marcados pela selecao |
| `total_goals_conceded` | Total de gols sofridos pela selecao |
| `goal_difference` | Saldo de gols |
| `matches_played` | Numero de partidas jogadas |
| `goals_per_match` | Media de gols por partida |
| `stage_encoded` | Fase estimada a partir da posicao final, usada apenas para criar a classe |
| `advanced` | Variavel alvo: 1 para avancou, 0 para eliminada |

A variavel `stage_encoded` nao entra como variavel de entrada do modelo, pois ela entregaria a resposta. Ela e usada apenas para construir a variavel alvo.

## 3. Resultados do Modelo

O algoritmo escolhido foi a **Arvore de Decisao**, pois e adequado para classificacao e permite explicar a logica do modelo com mais facilidade.

Os dados foram divididos em:

- 70% para treino;
- 30% para teste.

As variaveis independentes usadas pelo modelo foram:

- total de gols marcados;
- total de gols sofridos;
- saldo de gols;
- partidas jogadas;
- media de gols por partida.

### Metricas de desempenho

A aplicacao calcula automaticamente:

- acuracia;
- matriz de confusao;
- importancia das variaveis.

Na execucao atual, a acuracia ficou em aproximadamente **85,71%**.

A matriz de confusao mostra os acertos e erros do modelo para as duas classes:

- selecoes eliminadas previstas como eliminadas;
- selecoes eliminadas previstas como avancaram;
- selecoes que avancaram previstas como eliminadas;
- selecoes que avancaram previstas como avancaram.

### Interpretacao tecnica

A Arvore de Decisao funciona como uma sequencia de perguntas. Por exemplo:

- A selecao disputou mais partidas?
- O saldo de gols foi positivo?
- A media de gols por partida foi alta?
- A selecao sofreu muitos gols?

Com base nessas respostas, o modelo classifica a selecao como perfil de avanco ou perfil de eliminacao.

Na importancia das variaveis, `matches_played` aparece como uma das mais importantes. Isso faz sentido porque selecoes que jogam mais partidas normalmente chegaram a fases posteriores da Copa.

### Visualizacao da Arvore de Decisao

A imagem abaixo representa a Arvore de Decisao treinada pelo modelo. Ela nao e uma imagem manual: e gerada automaticamente a partir do `DecisionTreeClassifier` depois do treinamento.

![Imagem da Arvore de Decisao](https://copa-mundo-classificador.vercel.app/arvore_decisao.png)

Cada caixa da arvore representa uma regra aprendida pelo modelo. Por exemplo, a arvore pode avaliar se a selecao disputou mais partidas, se teve saldo de gols positivo ou se marcou muitos gols. No final de cada caminho, o modelo chega a uma classe: `Avancou` ou `Eliminada`.

Essa visualizacao foi incluida porque a Arvore de Decisao e um modelo interpretavel. Assim, alem de mostrar a previsao final, o projeto tambem mostra a logica usada pelo algoritmo para chegar ao resultado.

## 4. Guia da Aplicacao

A aplicacao foi desenvolvida em Flask, com HTML, CSS e Jinja2.

Para rodar localmente:

```bash
pip install -r requirements.txt
python app.py
```

Depois, acesse:

```text
http://localhost:5000
```

### Funcionamento da interface

Na tela inicial, o usuario informa:

- total de gols marcados;
- total de gols sofridos;
- numero de partidas jogadas.

A aplicacao calcula automaticamente:

- saldo de gols;
- gols por partida;
- probabilidade de avanco;
- classificacao prevista.

O sistema tambem exibe:

- acuracia;
- matriz de confusao;
- importancia das variaveis;
- selecoes historicas com perfil parecido;
- ranking das melhores campanhas da base;
- imagem da Arvore de Decisao.

### Deploy futuro

O projeto ja foi preparado para um futuro deploy na Vercel.

Arquivos adicionados para isso:

- `api/index.py`: ponto de entrada da aplicacao Flask na Vercel;
- `vercel.json`: arquivo de configuracao de rotas;
- `requirements.txt`: dependencias do projeto.

No deploy, e importante manter os CSVs dentro da pasta `data/`, para evitar que a aplicacao dependa de download externo ao iniciar.

## 5. Conclusao

O projeto mostrou que dados simples, como gols marcados, gols sofridos, saldo de gols e partidas jogadas, ja permitem identificar padroes importantes no desempenho das selecoes em Copas do Mundo.

A solucao e viavel porque transforma dados historicos em uma aplicacao interativa, permitindo que o usuario simule uma campanha e receba uma previsao de classificacao.

Como limitacao, o modelo nao considera fatores mais complexos, como qualidade dos adversarios, posse de bola, finalizacoes, lesoes, tecnico, ranking FIFA ou contexto da partida.

Como melhorias futuras, seria possivel:

- adicionar novas variaveis;
- comparar outros algoritmos de classificacao;
- salvar o modelo treinado em arquivo;
- melhorar a validacao dos campos do formulario;
- publicar a aplicacao na Vercel;
- adicionar screenshots da aplicacao no relatorio final.
