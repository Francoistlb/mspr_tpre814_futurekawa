-- ============================================================
-- FutureKawa — Schema BDD — Equateur
-- ============================================================

CREATE TABLE IF NOT EXISTS entrepots (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(10)  UNIQUE NOT NULL,
    nom             VARCHAR(100) NOT NULL,
    exploitation    VARCHAR(100) NOT NULL,
    pays            VARCHAR(50)  NOT NULL DEFAULT 'equateur',
    temp_ideale     DECIMAL(5,2) NOT NULL DEFAULT 31.0,
    hum_ideale      DECIMAL(5,2) NOT NULL DEFAULT 60.0,
    tolerance_temp  DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    tolerance_hum   DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lots (
    id              VARCHAR(50)  PRIMARY KEY,
    entrepot_id     INTEGER      NOT NULL REFERENCES entrepots(id),
    date_stockage   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    statut          VARCHAR(20)  NOT NULL DEFAULT 'conforme'
                    CHECK (statut IN ('conforme', 'en_alerte', 'perime')),
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesures (
    id              BIGSERIAL    PRIMARY KEY,
    entrepot_id     INTEGER      NOT NULL REFERENCES entrepots(id),
    temperature     DECIMAL(5,2) NOT NULL,
    humidite        DECIMAL(5,2) NOT NULL,
    hors_plage      BOOLEAN      NOT NULL DEFAULT FALSE,
    timestamp       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alertes (
    id                  BIGSERIAL   PRIMARY KEY,
    type                VARCHAR(20) NOT NULL CHECK (type IN ('hors_plage', 'peremption')),
    entrepot_id         INTEGER     REFERENCES entrepots(id),
    lot_id              VARCHAR(50) REFERENCES lots(id),
    message             TEXT        NOT NULL,
    email_envoye        BOOLEAN     NOT NULL DEFAULT FALSE,
    email_destinataire  VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lots_date_stockage  ON lots(date_stockage ASC);
CREATE INDEX IF NOT EXISTS idx_lots_statut         ON lots(statut);
CREATE INDEX IF NOT EXISTS idx_mesures_entrepot_ts ON mesures(entrepot_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_created_at  ON alertes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alertes_type        ON alertes(type);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lots_updated_at ON lots;
CREATE TRIGGER trg_lots_updated_at
    BEFORE UPDATE ON lots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Seed data : Equateur
-- Seuils : 31°C / 60% humidite  ±3°C / ±2%
-- ============================================================
INSERT INTO entrepots (code, nom, exploitation, pays, temp_ideale, hum_ideale, tolerance_temp, tolerance_hum)
VALUES
    ('EQ01', 'Entrepot Quito',     'Hacienda Andes',  'equateur', 31.0, 60.0, 3.0, 2.0),
    ('EQ02', 'Entrepot Guayaquil', 'Hacienda Costa',  'equateur', 31.0, 60.0, 3.0, 2.0)
ON CONFLICT (code) DO NOTHING;
