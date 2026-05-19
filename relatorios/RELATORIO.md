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

O processamento dos dados foi feito no arquivo `app.py`, principalmente na funcao `build_dataset_from_annual_csv_folder`. A ideia foi transformar os CSVs anuais da Copa em uma tabela unica, pronta para o treinamento do modelo.

Primeiro, o sistema percorre a pasta `data/` e seleciona apenas os arquivos que seguem o padrao `FIFA - YYYY.csv`, como `FIFA - 1930.csv` e `FIFA - 2022.csv`. Arquivos fora desse padrao sao ignorados, evitando que algum arquivo indevido entre no treinamento.

Depois, o ano da Copa e retirado do proprio nome do arquivo. Por exemplo, em `FIFA - 2014.csv`, o sistema identifica o ano `2014`. Isso permite criar a coluna `year`, que indica a edicao da Copa analisada.

Em seguida, cada CSV e lido com pandas. Cada linha representa uma selecao naquela edicao da Copa. As colunas numericas usadas pelo projeto sao convertidas para numeros inteiros:

- `Position`, que representa a posicao final da selecao;
- `Games Played`, que representa a quantidade de partidas jogadas;
- `Goals For`, que representa os gols marcados;
- `Goals Against`, que representa os gols sofridos.

Essa conversao e importante porque o modelo de Machine Learning precisa trabalhar com valores numericos. Assim, dados que vieram do CSV em formato de texto passam a ser tratados como numeros.

Depois dessa leitura, o sistema cria uma nova linha padronizada para cada selecao, usando nomes de colunas mais adequados ao projeto:

- `team`, nome da selecao;
- `year`, ano da Copa;
- `total_goals_scored`, total de gols marcados;
- `total_goals_conceded`, total de gols sofridos;
- `matches_played`, numero de partidas jogadas.

Tambem foram criadas variaveis novas a partir dos dados originais. O saldo de gols (`goal_difference`) foi calculado subtraindo os gols sofridos dos gols marcados:

```text
goal_difference = total_goals_scored - total_goals_conceded
```

A media de gols por partida (`goals_per_match`) foi calculada dividindo os gols marcados pelo numero de partidas:

```text
goals_per_match = total_goals_scored / matches_played
```

O resultado foi arredondado para duas casas decimais, deixando a informacao mais simples de exibir na aplicacao.

Outra transformacao importante foi a criacao da variavel `advanced`, que e a classe principal do projeto. Ela indica se a selecao avancou de fase ou foi eliminada:

- `1`: a selecao avancou;
- `0`: a selecao foi eliminada.

Como os CSVs anuais nao trazem diretamente uma coluna dizendo "avancou" ou "eliminada", essa informacao foi estimada pela posicao final da selecao e pela quantidade de participantes daquela Copa. Isso e necessario porque Copas antigas tinham menos selecoes. Por exemplo, em edicoes menores, nao faria sentido considerar que todas as selecoes que ficaram entre as 16 primeiras avancaram, pois algumas Copas nem tinham 16 participantes.

Por isso, o codigo usa limites diferentes:

- Copas com 24 ou mais selecoes: considera avanco ate a posicao 16;
- Copas com 16 a 23 selecoes: considera avanco ate a posicao 8;
- Copas com menos de 16 selecoes: considera avanco ate a posicao 4.

Tambem foi criada a variavel `stage_encoded`, que representa numericamente a fase estimada da selecao:

- `0`: fase de grupos;
- `1`: oitavas de final;
- `2`: quartas de final;
- `3`: semifinal;
- `5`: final.

Essa variavel e estimada pela posicao final e pelo tamanho da Copa. Ela nao e usada como entrada principal da classificacao, porque poderia entregar parte da resposta ao modelo. No projeto, ela serve para organizar os exemplos historicos e para mostrar na aplicacao ate que fase a campanha pode chegar.

Por fim, o dataset final e separado em variaveis independentes e variavel alvo. As variaveis independentes sao os dados usados pelo modelo para tomar decisao:

- gols marcados;
- gols sofridos;
- saldo de gols;
- partidas jogadas;
- media de gols por partida.

A variavel alvo e `advanced`, que e o que a Arvore de Decisao aprende a prever.

### Variaveis criadas

| Variavel                 | Explicacao                                                   |
| ------------------------ | ------------------------------------------------------------ |
| `total_goals_scored`   | Total de gols marcados pela selecao                          |
| `total_goals_conceded` | Total de gols sofridos pela selecao                          |
| `goal_difference`      | Saldo de gols                                                |
| `matches_played`       | Numero de partidas jogadas                                   |
| `goals_per_match`      | Media de gols por partida                                    |
| `stage_encoded`        | Fase estimada a partir da posicao final e do tamanho da Copa |
| `advanced`             | Variavel alvo: 1 para avancou, 0 para eliminada              |

A variavel `advanced` foi estimada usando a posicao final da selecao e a quantidade de participantes da edicao. Isso evita tratar todas as selecoes de Copas antigas, que tinham menos participantes, como se tivessem avancado automaticamente.

A variavel `stage_encoded` nao entra como variavel de entrada do modelo, pois ela poderia entregar parte da resposta. Ela e usada apenas como informacao historica para organizar campanhas e exemplos.

Na aplicacao, essa informacao tambem e usada para deixar o resultado mais facil de entender. Alem de dizer se a selecao tem perfil de avanco ou eliminacao, o sistema mostra uma fase atual estimada pela quantidade de partidas jogadas e uma fase estimada com base nas selecoes historicas mais parecidas.

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

Na execucao atual, a acuracia ficou em aproximadamente **97,96%**.

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

Para complementar a resposta da classificacao, a aplicacao tambem consulta as selecoes historicas com numeros mais parecidos com os dados digitados. Essa comparacao usa uma distancia simples entre gols marcados, gols sofridos e partidas jogadas. Quanto menor a distancia, mais parecida a campanha historica e com os dados informados pelo usuario.

A fase estimada nao e uma nova classe principal do modelo. Ela e definida observando ate onde as campanhas semelhantes chegaram. Por exemplo, se os exemplos mais parecidos chegaram no maximo as quartas de final, a fase estimada exibida tambem fica em quartas de final. Isso evita mostrar uma fase que contradiga os exemplos historicos apresentados na propria tela.

Assim, o usuario nao recebe apenas "avancou" ou "eliminada", mas tambem uma indicacao coerente de ate que fase a selecao pode chegar com base em campanhas parecidas.

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
- classificacao prevista;
- fase atual estimada;
- fase estimada que a selecao pode alcancar.

O sistema tambem exibe:

- acuracia;
- matriz de confusao;
- importancia das variaveis;
- selecoes historicas com perfil parecido;
- fase alcancada por cada selecao historica parecida;
- ranking das melhores campanhas da base;
- imagem da Arvore de Decisao.

Nos cards de selecoes historicas parecidas, a aplicacao mostra o ano, gols marcados, gols sofridos, partidas jogadas, se a selecao avancou ou foi eliminada e a fase alcancada. A fase estimada do resultado principal acompanha esses exemplos: ela usa como referencia a melhor fase alcancada entre as campanhas historicas mais semelhantes.

### Deploy da aplicacao

O projeto foi publicado na Vercel e pode ser acessado pelo link:

```text
https://copa-mundo-classificador.vercel.app/
```

Arquivos usados para o deploy:

- `api/index.py`: ponto de entrada da aplicacao Flask na Vercel;
- `vercel.json`: arquivo de configuracao de rotas;
- `requirements.txt`: dependencias do projeto.

Os CSVs foram mantidos dentro da pasta `data/`, evitando que a aplicacao dependa de download externo ao iniciar no ambiente de producao.

## 5. Conclusao

O projeto mostrou que dados simples, como gols marcados, gols sofridos, saldo de gols e partidas jogadas, ja permitem identificar padroes importantes no desempenho das selecoes em Copas do Mundo.

A solucao e viavel porque transforma dados historicos em uma aplicacao interativa, permitindo que o usuario simule uma campanha e receba uma previsao de classificacao.

Como limitacao, o modelo nao considera fatores mais complexos, como qualidade dos adversarios, posse de bola, finalizacoes, lesoes, tecnico, ranking FIFA ou contexto da partida.

Como melhorias futuras, seria possivel:

- adicionar novas variaveis;
- comparar outros algoritmos de classificacao;
- salvar o modelo treinado em arquivo;
- melhorar a validacao dos campos do formulario;
- melhorar a apresentacao visual dos resultados na aplicacao.
