# backend/app.py (FastAPI minimal)
from fastapi import FastAPI
from pydantic import BaseModel
import json, re, os

app = FastAPI(title="AGENTE LDM - API")

BASE = os.path.dirname(__file__)
try:
    with open(os.path.join(BASE,'../data/left.json'),'r',encoding='utf8') as f: LEFT = json.load(f)
    with open(os.path.join(BASE,'../data/right.json'),'r',encoding='utf8') as f: RIGHT = json.load(f)
except Exception:
    LEFT, RIGHT = {}, {}

class Query(BaseModel):
    portal: str = None
    text: str
    user_lexicon: dict = None

def normalize_tokens(text):
    s = text.lower()
    s = re.sub(r'https?://\S+',' ', s)
    s = re.sub(r'[^a-z0-9\sáéíóúãõç]',' ', s)
    s = s.encode('ascii', 'ignore').decode('ascii')
    return [t for t in re.split(r'\s+', s) if t]

@app.post("/analyze")
def analyze(q: Query):
    tokens = normalize_tokens(q.text or "")
    left_score = 0.0
    right_score = 0.0
    for t in tokens:
        left_score += LEFT.get(t, 0)
        right_score += RIGHT.get(t, 0)
    if q.user_lexicon:
        for k,v in q.user_lexicon.items():
            try:
                w = float(v)
            except:
                continue
            if w > 0: left_score += w
            elif w < 0: right_score += abs(w)
    total = abs(left_score) + abs(right_score) or 1.0
    bias = (left_score - right_score) / total
    score_pct = int(((bias + 1) / 2) * 100)
    return {"score":score_pct, "bias":bias, "left":left_score, "right":right_score}
