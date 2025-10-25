from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Libera acesso do front-end
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "API do Agente LDM está rodando com sucesso!"}

@app.post("/analisar")
async def analisar(request: Request):
    data = await request.json()
    texto = data.get("texto", "")

    # Lógica simples de exemplo: contar palavras-chave
    esquerda = ["inclusão", "social", "minorias", "igualdade", "redistribuição", "clima", "gênero"]
    direita = ["liberdade", "propriedade", "mercado", "família", "patriotismo", "ordem", "trabalho"]

    palavras = texto.lower().split()
    score_esquerda = sum(p in palavras for p in esquerda)
    score_direita = sum(p in palavras for p in direita)

    total = score_esquerda + score_direita or 1
    tendencia_esquerda = round((score_esquerda / total) * 100, 2)
    tendencia_direita = round((score_direita / total) * 100, 2)

    resultado = {
        "tendencia_esquerda": tendencia_esquerda,
        "tendencia_direita": tendencia_direita,
        "conclusao": "Mais à esquerda" if tendencia_esquerda > tendencia_direita else "Mais à direita" if tendencia_direita > tendencia_esquerda else "Neutra",
    }

    return resultado
