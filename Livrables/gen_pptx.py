from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Cm
import copy

# ── Palette ──────────────────────────────────────────────────
VERT_FONCE  = RGBColor(0x1A, 0x47, 0x2A)   # fond slides principales
VERT_MOYEN  = RGBColor(0x2D, 0x6A, 0x4F)   # titres / accents
BEIGE       = RGBColor(0xF5, 0xF0, 0xE8)   # fond clair
ORANGE      = RGBColor(0xD4, 0x7E, 0x0F)   # highlights
BLANC       = RGBColor(0xFF, 0xFF, 0xFF)
GRIS_TEXTE  = RGBColor(0x33, 0x33, 0x33)

W = Inches(13.33)   # widescreen 16:9
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

BLANK = prs.slide_layouts[6]   # layout vierge

# ── Helpers ───────────────────────────────────────────────────
def add_rect(slide, x, y, w, h, fill_rgb, alpha=None):
    shape = slide.shapes.add_shape(1, x, y, w, h)  # MSO_SHAPE_TYPE.RECTANGLE=1
    shape.line.fill.background()
    shape.line.width = 0
    if fill_rgb:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_rgb
    else:
        shape.fill.background()
    return shape

def add_text(slide, text, x, y, w, h, size=18, bold=False, color=BLANC,
             align=PP_ALIGN.LEFT, wrap=True, italic=False):
    txb = slide.shapes.add_textbox(x, y, w, h)
    tf  = txb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return txb

def slide_header(slide, title, subtitle=None):
    """Bande verte en haut + titre blanc."""
    add_rect(slide, 0, 0, W, Inches(1.3), VERT_MOYEN)
    add_text(slide, title, Inches(0.4), Inches(0.15), Inches(12.5), Inches(0.8),
             size=28, bold=True, color=BLANC, align=PP_ALIGN.LEFT)
    if subtitle:
        add_text(slide, subtitle, Inches(0.4), Inches(0.85), Inches(12.5), Inches(0.4),
                 size=14, bold=False, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.LEFT)

def add_bullet_box(slide, items, x, y, w, h, title=None,
                   bg=BEIGE, title_bg=VERT_MOYEN, size=14):
    add_rect(slide, x, y, w, h, bg)
    offset_y = y
    if title:
        add_rect(slide, x, y, w, Inches(0.45), title_bg)
        add_text(slide, title, x + Inches(0.1), y + Inches(0.05),
                 w - Inches(0.2), Inches(0.38), size=13, bold=True, color=BLANC)
        offset_y = y + Inches(0.48)
    for item in items:
        add_text(slide, f"▸  {item}", x + Inches(0.15), offset_y,
                 w - Inches(0.3), Inches(0.38), size=size, color=GRIS_TEXTE)
        offset_y += Inches(0.4)

def add_pill(slide, text, x, y, w=Inches(2.2), h=Inches(0.45),
             bg=VERT_MOYEN, fg=BLANC, size=12):
    add_rect(slide, x, y, w, h, bg)
    add_text(slide, text, x, y, w, h, size=size, bold=True, color=fg,
             align=PP_ALIGN.CENTER)

def footer(slide, page_num, total=12):
    add_rect(slide, 0, H - Inches(0.35), W, Inches(0.35), VERT_FONCE)
    add_text(slide, "FutureKawa — MSPR Bloc 4 RNCP35584 — EPSI 2025-2026",
             Inches(0.3), H - Inches(0.33), Inches(9), Inches(0.32),
             size=9, color=RGBColor(0xAA,0xCC,0xAA))
    add_text(slide, f"{page_num} / {total}",
             Inches(12.5), H - Inches(0.33), Inches(0.7), Inches(0.32),
             size=9, color=BLANC, align=PP_ALIGN.RIGHT)

# ══════════════════════════════════════════════════════════════
# SLIDE 1 — COUVERTURE
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, VERT_FONCE)
add_rect(s, 0, Inches(2.6), W, Inches(2.4), VERT_MOYEN)

add_text(s, "FutureKawa", Inches(0.8), Inches(0.4), Inches(11), Inches(1.1),
         size=52, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
add_text(s, "Suivi IoT des stocks de café vert — Solution multi-pays",
         Inches(0.8), Inches(1.45), Inches(11), Inches(0.7),
         size=20, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)

add_text(s, "Conception & développement d'une solution applicative\ndistribuée intégrant IoT, CI/CD et automatisation",
         Inches(0.8), Inches(2.7), Inches(11), Inches(1.2),
         size=18, color=BLANC, align=PP_ALIGN.CENTER)

add_text(s, "MSPR Bloc 4 — RNCP35584", Inches(0.8), Inches(5.2), Inches(11), Inches(0.5),
         size=14, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)
add_text(s, "EPSI 2025-2026", Inches(0.8), Inches(5.65), Inches(11), Inches(0.45),
         size=13, color=RGBColor(0x99,0xBB,0x99), align=PP_ALIGN.CENTER)

footer(s, 1)

# ══════════════════════════════════════════════════════════════
# SLIDE 2 — CONTEXTE & PROBLÉMATIQUE
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Contexte & Problématique", "FutureKawa — Caféiculture multi-pays (Brésil · Équateur · Colombie)")

# Problèmes
add_bullet_box(s,
    ["Suivi des conditions de stockage semi-manuel (tableurs)",
     "Difficile de détecter les dérives température / humidité",
     "Logique FIFO non garantie — lots anciens non expédiés en priorité",
     "Aucune alerte automatique en cas d'anomalie"],
    Inches(0.3), Inches(1.45), Inches(6.0), Inches(2.6),
    title="⚠  Problèmes identifiés", bg=RGBColor(0xFF,0xF0,0xE8))

# Besoins
add_bullet_box(s,
    ["Suivi temps réel (IoT) — temp. & humidité par entrepôt",
     "Alertes automatiques (hors seuil + péremption > 365j)",
     "Interface web centralisée siège + pays",
     "Architecture distribuée — chaque pays autonome"],
    Inches(6.5), Inches(1.45), Inches(6.5), Inches(2.6),
    title="✅  Besoins exprimés", bg=RGBColor(0xE8,0xF5,0xE9))

# Chiffres clés
add_rect(s, Inches(0.3), Inches(4.2), W - Inches(0.6), Inches(2.55), VERT_FONCE)
add_text(s, "Notre réponse en chiffres", Inches(0.5), Inches(4.3), Inches(11), Inches(0.4),
         size=14, bold=True, color=ORANGE)

chiffres = [
    ("3", "pays\ncouverts"),
    ("6", "entrepôts\ninstrumentés"),
    ("2", "types\nd'alertes"),
    ("38", "tests\nautomatisés"),
    ("5", "stages\nCI/CD Jenkins"),
    ("10", "livrables\nremis"),
]
for i, (num, label) in enumerate(chiffres):
    cx = Inches(0.5 + i * 2.1)
    add_text(s, num, cx, Inches(4.75), Inches(1.8), Inches(0.75),
             size=36, bold=True, color=ORANGE, align=PP_ALIGN.CENTER)
    add_text(s, label, cx, Inches(5.45), Inches(1.8), Inches(0.6),
             size=10, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)

footer(s, 2)

# ══════════════════════════════════════════════════════════════
# SLIDE 3 — ARCHITECTURE GLOBALE
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Architecture distribuée", "Stack indépendante par pays + siège central d'agrégation")

# Flux principal
boxes = [
    (Inches(0.3),  Inches(1.5), "Arduino\n+ DHT22",    VERT_MOYEN),
    (Inches(2.4),  Inches(1.5), "mqtt.py\n(Python)",    VERT_MOYEN),
    (Inches(4.5),  Inches(1.5), "Mosquitto\nBroker",    RGBColor(0x5,0x7A,0xB8)),
    (Inches(6.6),  Inches(1.5), "API REST\n(Node.js)",  RGBColor(0x8E,0x24,0xAA)),
    (Inches(8.7),  Inches(1.5), "SQLite\n(BDD locale)", RGBColor(0x37,0x47,0x4F)),
    (Inches(10.8), Inches(1.5), "Backend\nSiège",       VERT_FONCE),
]
for (bx, by, label, color) in boxes:
    add_rect(s, bx, by, Inches(1.8), Inches(1.0), color)
    add_text(s, label, bx, by, Inches(1.8), Inches(1.0),
             size=11, bold=True, color=BLANC, align=PP_ALIGN.CENTER)

# Flèches entre les boxes
for i in range(len(boxes) - 1):
    ax = boxes[i][0] + Inches(1.8)
    ay = boxes[i][1] + Inches(0.5)
    add_text(s, "→", ax, ay - Inches(0.2), Inches(0.55), Inches(0.4),
             size=18, bold=True, color=VERT_MOYEN, align=PP_ALIGN.CENTER)

# Protocoles
protocols = ["USB\nSérie", "MQTT\nPublish", "MQTT\nSubscribe", "INSERT\nSQLite", "HTTP\nREST"]
for i, proto in enumerate(protocols):
    px = boxes[i][0] + Inches(1.85)
    py = boxes[i][1] + Inches(1.1)
    add_text(s, proto, px, py, Inches(0.55), Inches(0.5),
             size=7, color=GRIS_TEXTE, align=PP_ALIGN.CENTER, italic=True)

# Frontend
add_rect(s, Inches(10.8), Inches(3.0), Inches(1.8), Inches(0.7), ORANGE)
add_text(s, "Frontend\nReact", Inches(10.8), Inches(3.0), Inches(1.8), Inches(0.7),
         size=11, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
add_text(s, "↑ HTTP", Inches(11.1), Inches(2.6), Inches(1.2), Inches(0.4),
         size=10, color=GRIS_TEXTE, align=PP_ALIGN.CENTER)

# Stack pays
add_rect(s, Inches(0.3), Inches(3.6), Inches(8.1), Inches(1.6), RGBColor(0xE3,0xF2,0xFD))
add_text(s, "Stack pays (×3 indépendantes — Brésil :8001 · Équateur :8002 · Colombie :8003)",
         Inches(0.5), Inches(3.65), Inches(7.7), Inches(0.4), size=10,
         color=RGBColor(0x5,0x7A,0xB8), bold=True)
for port, pays in [("1883", "Brésil"), ("1884", "Équateur"), ("1885", "Colombie")]:
    idx = ["1883","1884","1885"].index(port)
    add_text(s, f"• {pays} — MQTT :{port} / API :{8001+idx} / DB /data/futurekawa.db",
             Inches(0.5), Inches(4.1 + idx*0.35), Inches(7.7), Inches(0.35),
             size=10, color=GRIS_TEXTE)

# Siège
add_rect(s, Inches(8.6), Inches(3.6), Inches(4.4), Inches(1.6), RGBColor(0xE8,0xF5,0xE9))
add_text(s, "Siège (central — :8000 / :3000)",
         Inches(8.8), Inches(3.65), Inches(4.0), Inches(0.4), size=10,
         color=VERT_MOYEN, bold=True)
add_text(s, "• Agrégation 3 pays — timeout 3s par pays\n• Résilience : réponse partielle si pays indisponible\n• Frontend React + Chart.js — MailHog (emails dev)",
         Inches(8.8), Inches(4.05), Inches(4.0), Inches(0.9), size=10, color=GRIS_TEXTE)

footer(s, 3)

# ══════════════════════════════════════════════════════════════
# SLIDE 4 — MODULE IoT
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Module IoT — Arduino + DHT22 + MQTT", "Instrumentation des entrepôts — relevés automatiques toutes les 30s")

# Matériel
add_bullet_box(s,
    ["Arduino UNO — microcontrôleur, lecture capteur série",
     "Capteur DHT22 — température ±0.5°C / humidité ±2%",
     "Résistance pull-up 10 kΩ sur pin DATA",
     "Câble USB — liaison série Arduino ↔ PC hôte"],
    Inches(0.3), Inches(1.45), Inches(4.5), Inches(2.8),
    title="🔧  Matériel", bg=RGBColor(0xE8,0xF5,0xE9))

# Script
add_bullet_box(s,
    ["Python 3 + paho-mqtt + pyserial",
     "Lecture port série (COM3 / /dev/cu.usbmodem…)",
     "Payload JSON → publish MQTT toutes les 30s",
     "Reconnexion automatique MQTT (loop_start)"],
    Inches(5.0), Inches(1.45), Inches(4.0), Inches(2.8),
    title="🐍  Script mqtt.py", bg=RGBColor(0xE3,0xF2,0xFD))

# Topics
add_bullet_box(s,
    ["futurekawa/bresil/BR01/mesures",
     "futurekawa/equateur/EQ01/mesures",
     "futurekawa/colombie/CO01/mesures",
     'Payload : { "entrepot":"BR01", "temp":28.5, "hum":54.2, "ts":"..." }'],
    Inches(9.2), Inches(1.45), Inches(3.8), Inches(2.8),
    title="📡  Topics MQTT", bg=RGBColor(0xFF,0xF8,0xE1))

# Seuils
add_rect(s, Inches(0.3), Inches(4.4), W - Inches(0.6), Inches(2.35), VERT_FONCE)
add_text(s, "Seuils de stockage par pays (configurés en BDD)", Inches(0.5), Inches(4.5),
         Inches(12), Inches(0.4), size=13, bold=True, color=ORANGE)
cols = [
    ("🇧🇷  Brésil",   "29°C ± 3°C\n55% ± 2%"),
    ("🇪🇨  Équateur", "31°C ± 3°C\n60% ± 2%"),
    ("🇨🇴  Colombie", "26°C ± 3°C\n80% ± 2%"),
    ("⚠  Hors plage", "→ Alerte email\nimmédiate"),
    ("📅  > 365 jours", "→ Alerte email\npéremption"),
]
for i, (pays, val) in enumerate(cols):
    cx = Inches(0.5 + i * 2.5)
    add_text(s, pays, cx, Inches(4.95), Inches(2.3), Inches(0.4),
             size=11, bold=True, color=RGBColor(0xCC,0xFF,0xCC))
    add_text(s, val, cx, Inches(5.35), Inches(2.3), Inches(0.8),
             size=13, bold=True, color=BLANC, align=PP_ALIGN.LEFT)

footer(s, 4)

# ══════════════════════════════════════════════════════════════
# SLIDE 5 — BACKEND PAYS (API REST)
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Backend pays — API REST", "Code partagé · 3 instances indépendantes · Swagger /docs")

# Endpoints
endpoints = [
    ("GET  /health",          "État du service — utilisé par le CI/CD"),
    ("GET  /lots",            "Liste FIFO (tri ASC date_stockage)"),
    ("POST /lots",            "Créer un lot (id, entrepôt, date_stockage)"),
    ("PUT  /lots/:id/statut", "Mettre à jour : conforme | en_alerte | périmé"),
    ("GET  /mesures",         "Historique mesures IoT (limit 200, max 500)"),
    ("POST /mesures",         "Mesure manuelle → vérifie seuils → alerte si hors plage"),
    ("GET  /alertes",         "Toutes les alertes du pays (hors_plage + péremption)"),
]
add_rect(s, Inches(0.3), Inches(1.45), Inches(8.5), Inches(5.3), RGBColor(0xF5,0xF5,0xF5))
add_rect(s, Inches(0.3), Inches(1.45), Inches(8.5), Inches(0.42), VERT_MOYEN)
add_text(s, "Endpoints REST — documentés Swagger (OpenAPI 3)",
         Inches(0.45), Inches(1.48), Inches(8.2), Inches(0.38), size=12, bold=True, color=BLANC)

for i, (ep, desc) in enumerate(endpoints):
    ey = Inches(1.95 + i * 0.62)
    add_rect(s, Inches(0.35), ey, Inches(2.9), Inches(0.5),
             VERT_MOYEN if "POST" in ep or "PUT" in ep else RGBColor(0xD5,0xE8,0xD4))
    add_text(s, ep, Inches(0.45), ey + Inches(0.08), Inches(2.75), Inches(0.38),
             size=10, bold=True, color=BLANC if "POST" in ep or "PUT" in ep else VERT_FONCE)
    add_text(s, desc, Inches(3.35), ey + Inches(0.08), Inches(5.3), Inches(0.38),
             size=10, color=GRIS_TEXTE)

# Stack technique
add_bullet_box(s,
    ["Node.js 20 + Express 5",
     "SQLite via better-sqlite3 (WAL mode)",
     "Nodemailer → MailHog (dev) / SMTP (prod)",
     "Consumer MQTT (mqtt.js) — reconnexion auto",
     "Swagger UI (/docs) + OpenAPI JSON (/openapi.json)",
     "Check péremption : setInterval 1h"],
    Inches(9.1), Inches(1.45), Inches(3.9), Inches(5.3),
    title="⚙  Stack technique")

footer(s, 5)

# ══════════════════════════════════════════════════════════════
# SLIDE 6 — FRONTEND & BACKEND SIÈGE
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Siège — Frontend React + Backend d'agrégation", ":3000 Frontend · :8000 API siège · Résilience timeout 3s par pays")

# Pages frontend
pages = [
    ("🏠 Dashboard",    "Vue globale — indicateurs clés,\ncourbes IoT temps réel, alertes récentes"),
    ("📦 Stocks",       "Liste lots triée FIFO, filtre pays,\ncodes couleur statut"),
    ("🔍 Détail lot",  "Courbes temp/hum depuis stockage\n(Chart.js), alertes liées"),
    ("🔔 Alertes",      "Hors plage + péremption, filtre pays/type,\nconfirmation email envoyé"),
]
for i, (titre, desc) in enumerate(pages):
    px = Inches(0.3 + i * 3.25)
    add_rect(s, px, Inches(1.45), Inches(3.05), Inches(2.5), VERT_MOYEN)
    add_text(s, titre, px, Inches(1.5), Inches(3.05), Inches(0.5),
             size=13, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    add_text(s, desc, px + Inches(0.1), Inches(2.1), Inches(2.85), Inches(1.6),
             size=11, color=RGBColor(0xCC,0xFF,0xCC))

# Backend siège
add_rect(s, Inches(0.3), Inches(4.1), W - Inches(0.6), Inches(2.65), RGBColor(0xF5,0xF5,0xF5))
add_rect(s, Inches(0.3), Inches(4.1), W - Inches(0.6), Inches(0.42), VERT_MOYEN)
add_text(s, "Backend siège — Agrégation & Résilience",
         Inches(0.5), Inches(4.13), Inches(12), Inches(0.38), size=12, bold=True, color=BLANC)

routes_siege = [
    ("GET /siege/stocks",          "Consolide les lots des 3 pays — réponse partielle si pays KO"),
    ("GET /siege/stocks?pays=XX",  "Filtre par pays (bresil | equateur | colombie)"),
    ("GET /siege/mesures/:pays",   "Historique mesures d'un pays"),
    ("GET /siege/alertes",         "Alertes consolidées des 3 pays"),
    ("GET /siege/alertes?pays=XX", "Alertes filtrées par pays"),
]
for i, (ep, desc) in enumerate(routes_siege):
    ey = Inches(4.6 + i * 0.41)
    add_text(s, ep, Inches(0.5), ey, Inches(4.0), Inches(0.38),
             size=10, bold=True, color=VERT_MOYEN)
    add_text(s, desc, Inches(4.7), ey, Inches(8.0), Inches(0.38),
             size=10, color=GRIS_TEXTE)

footer(s, 6)

# ══════════════════════════════════════════════════════════════
# SLIDE 7 — ALERTES AUTOMATIQUES
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Alertes automatiques", "2 types · Email immédiat · Visible dans MailHog (dev) ou SMTP (prod)")

# Type 1
add_rect(s, Inches(0.3), Inches(1.45), Inches(6.1), Inches(2.7), RGBColor(0xFF,0xF0,0xE8))
add_rect(s, Inches(0.3), Inches(1.45), Inches(6.1), Inches(0.45), ORANGE)
add_text(s, "🌡  Alerte hors plage (immédiate)",
         Inches(0.45), Inches(1.48), Inches(5.8), Inches(0.4), size=13, bold=True, color=BLANC)
add_text(s,
    "Déclencheur :\n"
    "  |T mesurée − T idéale| > tolerance OU\n"
    "  |H mesurée − H idéale| > tolerance\n\n"
    "Flux : MQTT receive → vérifierSeuils()\n"
    "          → INSERT alertes → sendMail()\n\n"
    "Objet email : [ALERTE] Conditions hors seuils — BR01",
    Inches(0.45), Inches(1.98), Inches(5.7), Inches(2.0), size=11, color=GRIS_TEXTE)

# Type 2
add_rect(s, Inches(6.7), Inches(1.45), Inches(6.3), Inches(2.7), RGBColor(0xFF,0xEB,0xEE))
add_rect(s, Inches(6.7), Inches(1.45), Inches(6.3), Inches(0.45), RGBColor(0xB8,0x54,0x50))
add_text(s, "📅  Alerte péremption (vérification horaire)",
         Inches(6.85), Inches(1.48), Inches(5.9), Inches(0.4), size=13, bold=True, color=BLANC)
add_text(s,
    "Déclencheur :\n"
    "  lot.date_stockage < now − 365 jours\n"
    "  ET lot.statut ≠ 'perime'\n\n"
    "Flux : setInterval(1h) → verifierPeremption()\n"
    "          → UPDATE statut → INSERT alertes → sendMail()\n\n"
    "Objet email : [ALERTE] Lot périmé — LOT-BR-2024-001",
    Inches(6.85), Inches(1.98), Inches(5.9), Inches(2.0), size=11, color=GRIS_TEXTE)

# Demo box
add_rect(s, Inches(0.3), Inches(4.3), W - Inches(0.6), Inches(2.45), VERT_FONCE)
add_text(s, "🎯  Démo en direct", Inches(0.5), Inches(4.38), Inches(12), Inches(0.4),
         size=14, bold=True, color=ORANGE)
demo_steps = [
    "1.  bash test-cicd/demo.sh    →  insère 30 lots + déclenche check péremption immédiat",
    "2.  sim-arduino.sh --loop     →  mesures aléatoires (~15% hors seuil → email instantané)",
    "3.  http://localhost:8025      →  MailHog — emails reçus en temps réel",
    "4.  http://localhost:3000      →  Frontend — alertes visibles page Alertes",
]
for i, step in enumerate(demo_steps):
    add_text(s, step, Inches(0.5), Inches(4.82 + i*0.43), Inches(12.5), Inches(0.4),
             size=11, color=RGBColor(0xCC,0xFF,0xCC))

footer(s, 7)

# ══════════════════════════════════════════════════════════════
# SLIDE 8 — TESTS
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Tests — 38 tests automatisés", "Unitaires · Intégration · API · End-to-end")

# Compteurs
counts = [
    ("26", "Tests\nbackend pays", VERT_MOYEN),
    ("12", "Tests\nbackend siège", RGBColor(0x5,0x7A,0xB8)),
    ("4",  "Health checks\nCI intégration", ORANGE),
    ("38", "Total\nautomatisés", VERT_FONCE),
]
for i, (num, label, col) in enumerate(counts):
    cx = Inches(0.4 + i * 3.2)
    add_rect(s, cx, Inches(1.45), Inches(2.9), Inches(1.6), col)
    add_text(s, num, cx, Inches(1.55), Inches(2.9), Inches(0.9),
             size=48, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    add_text(s, label, cx, Inches(2.45), Inches(2.9), Inches(0.5),
             size=11, color=BLANC, align=PP_ALIGN.CENTER)

# Suites
suites = [
    ("alertes.test.js", "9 tests — vérification seuils IoT par pays (Brésil, Équateur, Colombie)"),
    ("mesures.test.js", "6 tests — GET/POST mesures, détection hors plage"),
    ("fifo.test.js",    "3 tests — tri ASC date_stockage, logique FIFO"),
    ("lots.test.js",    "8 tests — CRUD lots, statuts, health check"),
    ("siege.test.js",   "12 tests — agrégation multi-pays, résilience timeout, routes"),
]
add_rect(s, Inches(0.3), Inches(3.2), W - Inches(0.6), Inches(3.05), RGBColor(0xF5,0xF5,0xF5))
add_rect(s, Inches(0.3), Inches(3.2), W - Inches(0.6), Inches(0.42), VERT_MOYEN)
add_text(s, "Suites de tests Jest", Inches(0.5), Inches(3.23), Inches(12), Inches(0.38),
         size=12, bold=True, color=BLANC)
for i, (suite, desc) in enumerate(suites):
    ey = Inches(3.7 + i * 0.5)
    add_rect(s, Inches(0.4), ey, Inches(2.7), Inches(0.4), VERT_MOYEN)
    add_text(s, suite, Inches(0.5), ey + Inches(0.04), Inches(2.5), Inches(0.35),
             size=10, bold=True, color=BLANC)
    add_text(s, desc, Inches(3.25), ey + Inches(0.04), Inches(9.8), Inches(0.35),
             size=10, color=GRIS_TEXTE)

footer(s, 8)

# ══════════════════════════════════════════════════════════════
# SLIDE 9 — CI/CD JENKINS
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Pipeline CI/CD Jenkins", "Déclenchement automatique sur push develop / main")

stages = [
    ("Checkout",          "Clone le repo à la révision du commit", VERT_MOYEN),
    ("Prepare",           "Récupère .env.ci\n(credential Jenkins)", VERT_MOYEN),
    ("Build",             "docker compose\nbuild --no-cache", RGBColor(0x5,0x7A,0xB8)),
    ("Start",             "docker compose\nup -d", RGBColor(0x5,0x7A,0xB8)),
    ("Health\nChecks",    "Attente 4 APIs\n(max 60s)", ORANGE),
    ("Tests\nunitaires",  "npm test\n26 + 12 tests", ORANGE),
    ("Tests\nintégration","health-check.sh\n4/4 PASS", VERT_FONCE),
    ("Post",              "docker compose\ndown -v", RGBColor(0x78,0x78,0x78)),
]

box_w = Inches(1.5)
box_h = Inches(1.3)
gap   = Inches(0.15)
start_x = Inches(0.3)

for i, (name, desc, col) in enumerate(stages):
    bx = start_x + i * (box_w + gap)
    by = Inches(1.55)
    add_rect(s, bx, by, box_w, box_h, col)
    add_text(s, name, bx, by + Inches(0.08), box_w, Inches(0.5),
             size=11, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    add_text(s, desc, bx + Inches(0.05), by + Inches(0.55), box_w - Inches(0.1), Inches(0.65),
             size=9, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)
    if i < len(stages) - 1:
        add_text(s, "→", bx + box_w + Inches(0.02), by + Inches(0.4), gap + Inches(0.05), Inches(0.4),
                 size=14, bold=True, color=VERT_MOYEN, align=PP_ALIGN.CENTER)

# Succès / échec
add_rect(s, Inches(0.3), Inches(3.0), Inches(6.0), Inches(1.3), RGBColor(0xE8,0xF5,0xE9))
add_text(s, "✅  Succès", Inches(0.4), Inches(3.05), Inches(5.8), Inches(0.4),
         size=13, bold=True, color=VERT_MOYEN)
add_text(s, "• Statut GitHub : jenkins/ci : success\n• Badge vert sur la PR",
         Inches(0.4), Inches(3.45), Inches(5.7), Inches(0.75), size=11, color=GRIS_TEXTE)

add_rect(s, Inches(6.6), Inches(3.0), Inches(6.4), Inches(1.3), RGBColor(0xFF,0xEB,0xEE))
add_text(s, "❌  Échec", Inches(6.7), Inches(3.05), Inches(6.2), Inches(0.4),
         size=13, bold=True, color=RGBColor(0xB8,0x54,0x50))
add_text(s, "• Logs exportés (docker logs --tail=50)\n• Statut GitHub : jenkins/ci : failure",
         Inches(6.7), Inches(3.45), Inches(6.1), Inches(0.75), size=11, color=GRIS_TEXTE)

# Particularités
add_bullet_box(s,
    ["Docker-in-Docker via socket partagé (/var/run/docker.sock)",
     "Isolation build : COMPOSE_PROJECT_NAME = futurekawa-ci-${BUILD_NUMBER}",
     "Credentials Jenkins : fichier .env.ci injecté via withCredentials()",
     "Mosquitto : config inline (entrypoint) — contourne les bind mounts Jenkins"],
    Inches(0.3), Inches(4.45), W - Inches(0.6), Inches(2.3),
    title="⚙  Particularités techniques",
    bg=RGBColor(0xF5,0xF5,0xF5))

footer(s, 9)

# ══════════════════════════════════════════════════════════════
# SLIDE 10 — PHASE 2 AUTOMATISATION
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Phase 2 — Automatisation des entrepôts", "Capteurs → Décision → Actionneurs · Schéma de principe")

# Flux
flux = [
    ("Capteur\nDHT22", VERT_MOYEN),
    ("Broker\nMQTT", RGBColor(0x5,0x7A,0xB8)),
    ("Moteur de\nDécision", ORANGE),
    ("Contrôleur\nGPIO", RGBColor(0x8E,0x24,0xAA)),
]
for i, (label, col) in enumerate(flux):
    fx = Inches(0.4 + i * 2.8)
    add_rect(s, fx, Inches(1.5), Inches(2.3), Inches(0.9), col)
    add_text(s, label, fx, Inches(1.5), Inches(2.3), Inches(0.9),
             size=12, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    if i < len(flux) - 1:
        add_text(s, "→", fx + Inches(2.3), Inches(1.82), Inches(0.5), Inches(0.4),
                 size=16, bold=True, color=VERT_MOYEN, align=PP_ALIGN.CENTER)

# Actionneurs
actionneurs = [
    ("🔥 Chauffage", "Si T < T_min", RGBColor(0xFF,0x80,0x80)),
    ("💨 Aération",  "Si T > T_max\nou H > H_max", RGBColor(0x80,0xBF,0xFF)),
    ("💧 Humidif.",  "Si H < H_min", RGBColor(0x80,0xFF,0xCC)),
]
for i, (label, cond, col) in enumerate(actionneurs):
    ax = Inches(11.5)
    ay = Inches(1.5 + i * 1.0)
    add_rect(s, ax, ay, Inches(1.6), Inches(0.8), col)
    add_text(s, label, ax, ay, Inches(1.6), Inches(0.4),
             size=11, bold=True, color=VERT_FONCE, align=PP_ALIGN.CENTER)
    add_text(s, cond, ax, ay + Inches(0.4), Inches(1.6), Inches(0.38),
             size=9, color=GRIS_TEXTE, align=PP_ALIGN.CENTER)
add_text(s, "→", Inches(11.0), Inches(2.28), Inches(0.5), Inches(0.4),
         size=16, bold=True, color=VERT_MOYEN, align=PP_ALIGN.CENTER)

# Sécurités
add_bullet_box(s,
    ["Switch Manuel/Auto — priorité absolue sur le logiciel",
     "Arrêt d'urgence physique — coupe alimentation 24V (E-STOP)",
     "Watchdog 60s — si plus de mesures → SAFE STATE (tous OFF)",
     "Disjoncteurs par actionneur — protection électrique"],
    Inches(0.3), Inches(2.75), Inches(6.5), Inches(2.5),
    title="🛡  Sécurités", bg=RGBColor(0xFF,0xF0,0xE8))

# Cas dégradés
add_bullet_box(s,
    ["Perte MQTT → watchdog → SAFE STATE + alerte email",
     "Capteur défaillant → mode manuel forcé + alerte",
     "Actionneur KO → désactivation + ticket maintenance",
     "Panne électrique → position repos (sécurité passive)"],
    Inches(7.0), Inches(2.75), Inches(6.0), Inches(2.5),
    title="⚠  Cas dégradés", bg=RGBColor(0xFF,0xF8,0xE1))

add_text(s, "→  Schéma complet disponible : Livrables/schema-automatisation.drawio",
         Inches(0.3), Inches(5.4), Inches(12), Inches(0.4),
         size=11, italic=True, color=VERT_MOYEN)

footer(s, 10)

# ══════════════════════════════════════════════════════════════
# SLIDE 11 — BILAN COMPÉTENCES
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, BEIGE)
slide_header(s, "Bilan — Compétences acquises", "RNCP35584 Bloc 4 · 10 livrables remis")

competences = [
    ("Collect. besoins",   "Analyse CDC FutureKawa,\nidentification besoins métier"),
    ("Architecture\ndistribuée", "3 stacks pays isolées\n+ siège central résilient"),
    ("Développement\napplicatif", "Node.js, React, SQLite,\nMQTT, Docker Compose"),
    ("Intégration IoT",    "Arduino DHT22 → MQTT\n→ API → BDD → Alertes"),
    ("Tests",              "38 tests Jest,\nPostman, health checks"),
    ("CI/CD",              "Jenkins Jenkinsfile\n5 stages automatisés"),
    ("Documentation",      "Doc technique, guide\nutilisateur, Swagger"),
    ("Conduite\nchangement", "Guide utilisateur,\nquestionnaire Phase 2"),
]
cols_per_row = 4
for i, (title, desc) in enumerate(competences):
    row = i // cols_per_row
    col = i % cols_per_row
    cx = Inches(0.3 + col * 3.25)
    cy = Inches(1.5 + row * 2.3)
    add_rect(s, cx, cy, Inches(3.0), Inches(2.1), VERT_MOYEN)
    add_text(s, title, cx, cy + Inches(0.08), Inches(3.0), Inches(0.6),
             size=12, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    add_text(s, desc, cx + Inches(0.1), cy + Inches(0.72), Inches(2.8), Inches(1.1),
             size=11, color=RGBColor(0xCC,0xFF,0xCC))

footer(s, 11)

# ══════════════════════════════════════════════════════════════
# SLIDE 12 — MERCI / QUESTIONS
# ══════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK)
add_rect(s, 0, 0, W, H, VERT_FONCE)
add_rect(s, 0, Inches(2.8), W, Inches(2.0), VERT_MOYEN)

add_text(s, "Merci pour votre attention",
         Inches(0.8), Inches(0.5), Inches(11.5), Inches(1.2),
         size=40, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
add_text(s, "FutureKawa — Solution IoT de suivi des stocks de café vert",
         Inches(0.8), Inches(1.6), Inches(11.5), Inches(0.6),
         size=16, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)

add_text(s, "Questions ?",
         Inches(0.8), Inches(3.0), Inches(11.5), Inches(0.9),
         size=36, bold=True, color=ORANGE, align=PP_ALIGN.CENTER)

liens = [
    ("🌐 Frontend",       "http://localhost:3000"),
    ("📄 API Siège",      "http://localhost:8000/docs"),
    ("📋 API Brésil",     "http://localhost:8001/docs"),
    ("📧 MailHog",        "http://localhost:8025"),
    ("⚙ Jenkins",         "http://localhost:8080"),
]
for i, (label, url) in enumerate(liens):
    lx = Inches(0.5 + i * 2.55)
    add_rect(s, lx, Inches(5.0), Inches(2.3), Inches(0.7), VERT_MOYEN)
    add_text(s, label, lx, Inches(5.02), Inches(2.3), Inches(0.32),
             size=10, bold=True, color=BLANC, align=PP_ALIGN.CENTER)
    add_text(s, url, lx, Inches(5.35), Inches(2.3), Inches(0.3),
             size=8, color=RGBColor(0xCC,0xFF,0xCC), align=PP_ALIGN.CENTER)

add_text(s, "MSPR Bloc 4 — RNCP35584 — EPSI 2025-2026",
         Inches(0.8), Inches(6.8), Inches(11.5), Inches(0.45),
         size=11, color=RGBColor(0x77,0x99,0x77), align=PP_ALIGN.CENTER)

footer(s, 12)

# ── Sauvegarde ───────────────────────────────────────────────
out = r"c:\Users\franc\EPSI\M1 - Certif\MSPR TPRE814\Livrables\PP Soutenance.pptx"
prs.save(out)
print(f"OK  Fichier genere : {out}")
