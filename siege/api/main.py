"""
FutureKawa — API Backend Siege (central)
Etape 1 : placeholder de demarrage (Step 4 implementera l'agregation reelle)
"""
import os
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

PAYS_URLS: dict[str, str] = {
    "bresil":   os.getenv("BRESIL_API_URL",   "http://host.docker.internal:8001"),
    "equateur": os.getenv("EQUATEUR_API_URL", "http://host.docker.internal:8002"),
    "colombie": os.getenv("COLOMBIE_API_URL", "http://host.docker.internal:8003"),
}
TIMEOUT = float(os.getenv("API_TIMEOUT_S", "3"))

app = FastAPI(
    title="FutureKawa API — Siege",
    description=(
        "Backend central : agrege les donnees de tous les pays.\n\n"
        "Appelle les APIs pays via HTTP avec tolerance aux pannes (timeout par pays)."
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


async def _fetch_pays(client: httpx.AsyncClient, pays: str, path: str) -> dict:
    """Appelle un backend pays. Retourne une erreur partielle si le pays est down."""
    url = f"{PAYS_URLS[pays]}{path}"
    try:
        resp = await client.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        return {"pays": pays, "status": "ok", "data": resp.json()}
    except Exception as exc:
        return {"pays": pays, "status": "error", "error": str(exc)}


@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "ok",
        "service": "siege",
        "version": "0.1.0",
        "pays_configures": list(PAYS_URLS.keys()),
    }


@app.get("/siege/stocks", tags=["agregation"])
async def get_stocks_tous_pays():
    """Consolide les stocks de tous les pays (resilient : reponse partielle si un pays est down)"""
    async with httpx.AsyncClient() as client:
        resultats = await asyncio.gather(
            *[_fetch_pays(client, pays, "/lots") for pays in PAYS_URLS]
        )
    return {"pays": resultats}


@app.get("/siege/stocks/{pays}", tags=["agregation"])
async def get_stocks_par_pays(pays: str):
    """Stocks d'un seul pays"""
    if pays not in PAYS_URLS:
        raise HTTPException(status_code=404, detail=f"Pays inconnu : {pays}")
    async with httpx.AsyncClient() as client:
        return await _fetch_pays(client, pays, "/lots")


@app.get("/siege/alertes", tags=["agregation"])
async def get_alertes_tous_pays():
    """Alertes actives de tous les pays"""
    async with httpx.AsyncClient() as client:
        resultats = await asyncio.gather(
            *[_fetch_pays(client, pays, "/alertes") for pays in PAYS_URLS]
        )
    return {"pays": resultats}


@app.get("/siege/mesures/{pays}/{entrepot_code}", tags=["agregation"])
async def get_mesures(pays: str, entrepot_code: str):
    """Historique des mesures d'un entrepot d'un pays"""
    if pays not in PAYS_URLS:
        raise HTTPException(status_code=404, detail=f"Pays inconnu : {pays}")
    async with httpx.AsyncClient() as client:
        return await _fetch_pays(client, pays, f"/mesures/{entrepot_code}")
