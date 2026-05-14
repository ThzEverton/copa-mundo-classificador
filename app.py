import os
import re
import tempfile

import matplotlib

# Usa um modo do matplotlib que funciona sem abrir janela no computador.
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, send_file
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier, plot_tree


app = Flask(__name__)

# Caminhos dos arquivos usados pelo projeto.
DATA_PATH = os.path.join("data", "WorldCupMatches.csv")
TREE_IMAGE_PATH = os.path.join(tempfile.gettempdir(), "arvore_decisao.png")
KAGGLE_DATASET = "iamsouravbanerjee/fifa-football-world-cup-dataset"
ANNUAL_FILE_PATTERN = r"FIFA - (\d{4})\.csv$"

# Features sao as colunas que o modelo usa para tomar decisao.
FEATURE_COLUMNS = [
    "total_goals_scored",
    "total_goals_conceded",
    "goal_difference",
    "matches_played",
    "goals_per_match",
]

# Ordem das fases: quanto maior o numero, mais longe a selecao chegou.
STAGE_ORDER = {
    "Group": 0,
    "First round": 0,
    "Preliminary round": 0,
    "Round of 16": 1,
    "Quarter-finals": 2,
    "Quarter-final": 2,
    "Semi-finals": 3,
    "Semi-final": 3,
    "Third place": 4,
    "Match for third place": 4,
    "Final": 5,
}

STAGE_OPTIONS = [
    ("0", "Fase de grupos"),
    ("1", "Oitavas de final"),
    ("2", "Quartas de final"),
    ("3", "Semifinal"),
    ("4", "Disputa de terceiro lugar"),
    ("5", "Final"),
]

FEATURE_LABELS = {
    "total_goals_scored": "Gols marcados",
    "total_goals_conceded": "Gols sofridos",
    "goal_difference": "Saldo de gols",
    "matches_played": "Partidas jogadas",
    "goals_per_match": "Gols por jogo",
}


def normalize_stage(stage_name):
    """Converte o nome da fase em numero para o modelo entender."""
    if pd.isna(stage_name):
        return 0

    stage_text = str(stage_name).strip()
    return STAGE_ORDER.get(stage_text, 0)


def load_matches():
    """Carrega o CSV principal e faz uma limpeza inicial."""
    matches = pd.read_csv(DATA_PATH)

    # Remove linhas vazias que existem em algumas versoes do dataset.
    matches = matches.dropna(subset=["Year", "Home Team Name", "Away Team Name"])

    # Garante que colunas numericas estejam no formato correto.
    numeric_columns = [
        "Year",
        "Home Team Goals",
        "Away Team Goals",
        "Half-time Home Goals",
        "Half-time Away Goals",
    ]

    for column in numeric_columns:
        matches[column] = pd.to_numeric(matches[column], errors="coerce").fillna(0)

    matches["Year"] = matches["Year"].astype(int)
    matches["Home Team Goals"] = matches["Home Team Goals"].astype(int)
    matches["Away Team Goals"] = matches["Away Team Goals"].astype(int)

    return matches


def get_kagglehub_path():
    """
    Baixa o dataset pelo KaggleHub e devolve a pasta onde os CSVs ficaram.

    Importante: o import fica dentro da funcao para o projeto ainda conseguir
    abrir uma mensagem amigavel caso a biblioteca nao esteja instalada.
    """
    import kagglehub

    return kagglehub.dataset_download(KAGGLE_DATASET)


def create_team_rows(matches):
    """
    Transforma cada partida em duas linhas:
    uma para o mandante e outra para o visitante.

    Exemplo:
    Brasil 2 x 0 Alemanha vira:
    - Brasil marcou 2 e sofreu 0
    - Alemanha marcou 0 e sofreu 2
    """
    home_rows = pd.DataFrame(
        {
            "year": matches["Year"],
            "team": matches["Home Team Name"],
            "goals_scored": matches["Home Team Goals"],
            "goals_conceded": matches["Away Team Goals"],
            "stage_encoded": matches["Stage"].apply(normalize_stage),
        }
    )

    away_rows = pd.DataFrame(
        {
            "year": matches["Year"],
            "team": matches["Away Team Name"],
            "goals_scored": matches["Away Team Goals"],
            "goals_conceded": matches["Home Team Goals"],
            "stage_encoded": matches["Stage"].apply(normalize_stage),
        }
    )

    return pd.concat([home_rows, away_rows], ignore_index=True)


def build_dataset(matches):
    """Agrupa os dados por selecao e ano da Copa para criar as features."""
    team_rows = create_team_rows(matches)

    dataset = (
        team_rows.groupby(["year", "team"])
        .agg(
            total_goals_scored=("goals_scored", "sum"),
            total_goals_conceded=("goals_conceded", "sum"),
            matches_played=("team", "count"),
            stage_encoded=("stage_encoded", "max"),
        )
        .reset_index()
    )

    dataset["goal_difference"] = (
        dataset["total_goals_scored"] - dataset["total_goals_conceded"]
    )

    dataset["goals_per_match"] = (
        dataset["total_goals_scored"] / dataset["matches_played"]
    ).round(2)

    # Neste projeto, consideramos que avancou quem passou da fase de grupos.
    dataset["advanced"] = np.where(dataset["stage_encoded"] >= 1, 1, 0)

    return dataset


def estimate_stage_from_position(position):
    """
    Estima a fase atingida usando a classificacao final do dataset KaggleHub.

    Esse dataset nao informa a fase em texto. Por isso usamos uma regra simples:
    - posicoes 1 e 2 chegaram na final
    - posicoes 3 e 4 chegaram na semifinal
    - posicoes 5 a 8 chegaram nas quartas
    - posicoes 9 a 16 chegaram nas oitavas
    - acima de 16 ficaram na fase de grupos
    """
    if position <= 2:
        return 5
    if position <= 4:
        return 3
    if position <= 8:
        return 2
    if position <= 16:
        return 1
    return 0


def build_dataset_from_annual_csv_folder(dataset_path):
    """
    Cria o dataset de treino lendo uma pasta com CSVs anuais, por exemplo:
    FIFA - 1930.csv, FIFA - 1934.csv, ..., FIFA - 2022.csv.
    Cada arquivo ja traz uma linha por selecao, com gols, jogos e posicao final.
    """
    rows = []

    for file_name in os.listdir(dataset_path):
        match = re.match(ANNUAL_FILE_PATTERN, file_name)
        if not match:
            continue

        year = int(match.group(1))
        csv_path = os.path.join(dataset_path, file_name)
        year_data = pd.read_csv(csv_path)

        for _, row in year_data.iterrows():
            position = int(row["Position"])
            matches_played = int(row["Games Played"])
            goals_scored = int(row["Goals For"])
            goals_conceded = int(row["Goals Against"])

            rows.append(
                {
                    "year": year,
                    "team": row["Team"],
                    "total_goals_scored": goals_scored,
                    "total_goals_conceded": goals_conceded,
                    "matches_played": matches_played,
                    "stage_encoded": estimate_stage_from_position(position),
                }
            )

    dataset = pd.DataFrame(rows)
    if dataset.empty:
        raise FileNotFoundError("Nenhum arquivo anual FIFA - YYYY.csv foi encontrado.")

    dataset["goal_difference"] = (
        dataset["total_goals_scored"] - dataset["total_goals_conceded"]
    )
    dataset["goals_per_match"] = (
        dataset["total_goals_scored"] / dataset["matches_played"]
    ).round(2)
    dataset["advanced"] = np.where(dataset["stage_encoded"] >= 1, 1, 0)

    return dataset


def has_local_annual_csvs():
    """Verifica se a pasta data/ ja tem os CSVs anuais da Copa."""
    if not os.path.isdir("data"):
        return False

    return any(re.match(ANNUAL_FILE_PATTERN, file_name) for file_name in os.listdir("data"))


def build_dataset_from_kagglehub():
    """Baixa pelo KaggleHub e reaproveita a mesma leitura dos CSVs anuais."""
    dataset_path = get_kagglehub_path()
    return build_dataset_from_annual_csv_folder(dataset_path)


def load_project_dataset():
    """
    Carrega os dados finais do projeto.

    Primeiro tenta usar data/WorldCupMatches.csv, que era o dataset original.
    Se esse arquivo nao existir, usa os CSVs anuais locais.
    Como ultima alternativa, tenta baixar e montar os dados pelo KaggleHub.
    """
    if os.path.exists(DATA_PATH):
        matches = load_matches()
        return build_dataset(matches), "CSV local: data/WorldCupMatches.csv"

    if has_local_annual_csvs():
        return build_dataset_from_annual_csv_folder("data"), "CSVs anuais locais: data/FIFA - YYYY.csv"

    dataset = build_dataset_from_kagglehub()
    return dataset, f"KaggleHub: {KAGGLE_DATASET}"


def get_feature_importance(model):
    """Monta a importancia das variaveis em formato facil para o template."""
    importances = []
    for column, importance in zip(FEATURE_COLUMNS, model.feature_importances_):
        importances.append(
            {
                "column": column,
                "label": FEATURE_LABELS[column],
                "importance": round(float(importance) * 100, 2),
            }
        )

    return sorted(importances, key=lambda item: item["importance"], reverse=True)


def train_model():
    """Treina a Arvore de Decisao e devolve modelo, metricas e exemplos."""
    try:
        dataset, data_source = load_project_dataset()
    except Exception as error:
        return {
            "ready": False,
            "message": (
                "Nao foi possivel carregar os dados. "
                "Instale kagglehub[pandas-datasets] ou coloque "
                "WorldCupMatches.csv ou os CSVs FIFA - YYYY.csv dentro da pasta data/. "
                f"Erro: {error}"
            ),
        }

    X = dataset[FEATURE_COLUMNS]
    y = dataset["advanced"]

    # Split obrigatorio do projeto: 70% treino e 30% teste.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.30,
        random_state=42,
        stratify=y,
    )

    # max_depth deixa a arvore menor e mais facil de explicar na apresentacao.
    model = DecisionTreeClassifier(max_depth=4, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    matrix = confusion_matrix(y_test, predictions, labels=[0, 1])

    generate_tree_image(model)

    examples = dataset.sort_values(
        ["stage_encoded", "goal_difference", "total_goals_scored"],
        ascending=False,
    ).head(8)

    return {
        "ready": True,
        "model": model,
        "dataset": dataset,
        "accuracy": accuracy,
        "confusion_matrix": matrix,
        "total_rows": len(dataset),
        "data_source": data_source,
        "class_distribution": dataset["advanced"].value_counts().to_dict(),
        "examples": examples.to_dict(orient="records"),
        "feature_importance": get_feature_importance(model),
    }


def generate_tree_image(model):
    """Gera a imagem da arvore para aparecer na aplicacao e no relatorio."""
    plt.figure(figsize=(20, 10))
    plot_tree(
        model,
        feature_names=FEATURE_COLUMNS,
        class_names=["Eliminada", "Avancou"],
        filled=True,
        rounded=True,
        fontsize=9,
    )
    plt.tight_layout()
    plt.savefig(TREE_IMAGE_PATH, dpi=150)
    plt.close()


def find_similar_examples(dataset, input_data):
    """Busca selecoes historicas com numeros parecidos com os digitados."""
    comparison_columns = [
        "total_goals_scored",
        "total_goals_conceded",
        "matches_played",
    ]

    historical = dataset.copy()

    # Distancia simples: quanto menor, mais parecido com o formulario.
    historical["similarity_distance"] = 0
    for column in comparison_columns:
        historical["similarity_distance"] += (
            historical[column] - input_data[column]
        ).abs()

    return (
        historical.sort_values("similarity_distance")
        .head(5)
        .to_dict(orient="records")
    )


# Treina uma vez quando a aplicacao inicia.
MODEL_DATA = train_model()


@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    similar_examples = []

    if request.method == "POST" and MODEL_DATA["ready"]:
        total_goals_scored = int(request.form.get("total_goals_scored", 0))
        total_goals_conceded = int(request.form.get("total_goals_conceded", 0))
        matches_played = max(int(request.form.get("matches_played", 1)), 1)

        goal_difference = total_goals_scored - total_goals_conceded
        goals_per_match = round(total_goals_scored / matches_played, 2)

        input_data = {
            "total_goals_scored": total_goals_scored,
            "total_goals_conceded": total_goals_conceded,
            "goal_difference": goal_difference,
            "matches_played": matches_played,
            "goals_per_match": goals_per_match,
        }

        input_df = pd.DataFrame([input_data], columns=FEATURE_COLUMNS)
        prediction = MODEL_DATA["model"].predict(input_df)[0]
        probabilities = MODEL_DATA["model"].predict_proba(input_df)[0]

        advance_probability = round(probabilities[1] * 100, 2)

        result = {
            "prediction": int(prediction),
            "advance_probability": advance_probability,
            "goal_difference": goal_difference,
            "goals_per_match": goals_per_match,
        }

        similar_examples = find_similar_examples(MODEL_DATA["dataset"], input_data)

    return render_template(
        "index.html",
        model_data=MODEL_DATA,
        result=result,
        similar_examples=similar_examples,
        stage_options=STAGE_OPTIONS,
    )


@app.route("/arvore_decisao.png")
def tree_image():
    """Entrega a imagem da arvore gerada no treino do modelo."""
    return send_file(TREE_IMAGE_PATH, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True)
