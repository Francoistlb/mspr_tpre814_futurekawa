"""
FutureKawa — API Backend Pays
Etape 1 : placeholder de demarrage (Step 2 implementera les vrais endpoints)
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

PAYS = os.getenv("PAYS", "inconnu")
PAYS_CODE = os.getenv("PAYS_CODE", "XX")

app = FastAPI(
    title=f"FutureKawa API — {PAYS.capitalize()}",
    description=(
        f"Backend local pour le pays : **{PAYS}** ({PAYS_CODE})\n\n"
        "Gestion des lots de cafe vert, surveillance IoT temperature/humidite, alertes."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "ok",
        "pays": PAYS,
        "pays_code": PAYS_CODE,
        "version": "0.1.0",
        "message": "Etape 1 — placeholder. Les endpoints metier seront ajoutes en Etape 2.",
    }


# --- Etape 2 : implementer les routes ci-dessous ---

@app.get("/lots", tags=["lots"])
def get_lots():
    """Liste des lots tries par date de stockage ASC (logique FIFO) — a implementer"""
    return {"detail": "Non implemente — Etape 2"}


@app.post("/lots", tags=["lots"])
def create_lot():
    """Creer un nouveau lot — a implementer"""
    return {"detail": "Non implemente — Etape 2"}


@app.get("/lots/{lot_id}", tags=["lots"])
def get_lot(lot_id: str):
    """Detail d'un lot — a implementer"""
    return {"detail": "Non implemente — Etape 2"}


@app.post("/mesures", tags=["iot"])
def post_mesure():
    """Recevoir une mesure capteur — a implementer"""
    return {"detail": "Non implemente — Etape 2"}


@app.get("/mesures/{entrepot_code}", tags=["iot"])
def get_mesures(entrepot_code: str):
    """Historique des mesures d'un entrepot — a implementer"""
    return {"detail": "Non implemente — Etape 2"}


@app.get("/alertes", tags=["alertes"])
def get_alertes():
    """Liste des alertes actives — a implementer"""
    return {"detail": "Non implemente — Etape 2"}
