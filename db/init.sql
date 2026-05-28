-- ============================================================
-- FutureKawa — Base centralisee (tous pays)
-- SQLite — un fichier par instance API pays
-- ============================================================

CREATE TABLE IF NOT EXISTS entrepots (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    code            TEXT        UNIQUE NOT NULL,
    nom             TEXT        NOT NULL,
    exploitation    TEXT        NOT NULL,
    pays            TEXT        NOT NULL,
    temp_ideale     REAL        NOT NULL,
    hum_ideale      REAL        NOT NULL,
    tolerance_temp  REAL        NOT NULL DEFAULT 3.0,
    tolerance_hum   REAL        NOT NULL DEFAULT 2.0,
    created_at      TEXT        NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lots (
    id              TEXT        PRIMARY KEY,
    entrepot_id     INTEGER     NOT NULL REFERENCES entrepots(id),
    date_stockage   TEXT        NOT NULL DEFAULT (datetime('now')),
    statut          TEXT        NOT NULL DEFAULT 'conforme'
                    CHECK (statut IN ('conforme', 'en_alerte', 'perime')),
    notes           TEXT,
    created_at      TEXT        NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT        NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mesures (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    entrepot_id     INTEGER     NOT NULL REFERENCES entrepots(id),
    temperature     REAL        NOT NULL,
    humidite        REAL        NOT NULL,
    hors_plage      INTEGER     NOT NULL DEFAULT 0,
    timestamp       TEXT        NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alertes (
    id                  INTEGER     PRIMARY KEY AUTOINCREMENT,
    type                TEXT        NOT NULL CHECK (type IN ('hors_plage', 'peremption')),
    entrepot_id         INTEGER     REFERENCES entrepots(id),
    lot_id              TEXT        REFERENCES lots(id),
    mesure_id           INTEGER     REFERENCES mesures(id),
    message             TEXT        NOT NULL,
    email_envoye        INTEGER     NOT NULL DEFAULT 0,
    email_destinataire  TEXT,
    created_at          TEXT        NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entrepots_pays        ON entrepots(pays);
CREATE INDEX IF NOT EXISTS idx_lots_date_stockage    ON lots(date_stockage ASC);
CREATE INDEX IF NOT EXISTS idx_lots_statut           ON lots(statut);
CREATE INDEX IF NOT EXISTS idx_mesures_entrepot_ts   ON mesures(entrepot_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_created_at    ON alertes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_type          ON alertes(type);

CREATE TRIGGER IF NOT EXISTS trg_lots_updated_at
    AFTER UPDATE ON lots
    BEGIN
        UPDATE lots SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

-- Seed : Bresil (29C / 55%)
INSERT OR IGNORE INTO entrepots (code, nom, exploitation, pays, temp_ideale, hum_ideale, tolerance_temp, tolerance_hum)
VALUES
    ('BR01', 'Entrepot Sao Paulo', 'Fazenda Norte', 'bresil', 29.0, 55.0, 3.0, 2.0),
    ('BR02', 'Entrepot Minas',     'Fazenda Sul',   'bresil', 29.0, 55.0, 3.0, 2.0);

-- Seed : Equateur (31C / 60%)
INSERT OR IGNORE INTO entrepots (code, nom, exploitation, pays, temp_ideale, hum_ideale, tolerance_temp, tolerance_hum)
VALUES
    ('EQ01', 'Entrepot Quito',     'Hacienda Andes', 'equateur', 31.0, 60.0, 3.0, 2.0),
    ('EQ02', 'Entrepot Guayaquil', 'Hacienda Costa', 'equateur', 31.0, 60.0, 3.0, 2.0);

-- Seed : Colombie (26C / 80%)
INSERT OR IGNORE INTO entrepots (code, nom, exploitation, pays, temp_ideale, hum_ideale, tolerance_temp, tolerance_hum)
VALUES
    ('CO01', 'Entrepot Bogota',   'Finca Sierra', 'colombie', 26.0, 80.0, 3.0, 2.0),
    ('CO02', 'Entrepot Medellin', 'Finca Cauca',  'colombie', 26.0, 80.0, 3.0, 2.0);
