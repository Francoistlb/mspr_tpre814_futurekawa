const request = require("supertest");
const axios = require("axios");
const app = require("../src/app");

// Mock axios pour simuler les APIs pays sans les démarrer
jest.mock("axios");

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

const mockLotsOk = (pays) => ({
  data: [
    { id: `${pays.toUpperCase()}-001`, statut: "conforme", date_stockage: "2024-01-10" },
    { id: `${pays.toUpperCase()}-002`, statut: "alerte",   date_stockage: "2024-03-15" },
  ],
});

const mockAlertesOk = (pays) => ({
  data: [
    { id: `ALT-${pays.toUpperCase()}-001`, type: "temperature", lot_id: `${pays.toUpperCase()}-002` },
  ],
});

const mockMesuresOk = () => ({
  data: [
    { ts: "2024-06-01T10:00:00", temp: 28.5, hum: 54.2 },
    { ts: "2024-06-01T10:30:00", temp: 29.1, hum: 55.0 },
  ],
});

// ───────────────────────────────────────────────
// GET /health
// ───────────────────────────────────────────────

describe("GET /health", () => {
  it("retourne status ok avec les pays configurés", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("siege");
    expect(res.body.pays_configures).toEqual(
      expect.arrayContaining(["bresil", "equateur", "colombie"])
    );
  });
});

// ───────────────────────────────────────────────
// GET /siege/stocks — tous les pays OK
// ───────────────────────────────────────────────

describe("GET /siege/stocks", () => {
  it("agrège les stocks de tous les pays quand tous sont disponibles", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("8001") || url.includes("bresil"))     return Promise.resolve(mockLotsOk("bresil"));
      if (url.includes("8002") || url.includes("equateur"))   return Promise.resolve(mockLotsOk("equateur"));
      if (url.includes("8003") || url.includes("colombie"))   return Promise.resolve(mockLotsOk("colombie"));
    });

    const res = await request(app).get("/siege/stocks");
    expect(res.status).toBe(200);
    expect(res.body.total_pays).toBe(3);
    expect(res.body.pays_ok).toBe(3);
    expect(res.body.pays_en_erreur).toBe(0);
    expect(res.body.resultats).toHaveLength(3);
    res.body.resultats.forEach((r) => expect(r.status).toBe("ok"));
  });

  // ── Résilience : un pays est down ──────────────────────────────────────

  it("retourne une réponse partielle si un pays est down (timeout)", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("bresil-api") || url.includes(":8001")) {
        // Simule un timeout Axios
        const err = new Error("timeout of 3000ms exceeded");
        err.code = "ECONNABORTED";
        return Promise.reject(err);
      }
      if (url.includes("equateur-api") || url.includes(":8002")) return Promise.resolve(mockLotsOk("equateur"));
      if (url.includes("colombie-api") || url.includes(":8003")) return Promise.resolve(mockLotsOk("colombie"));
    });

    const res = await request(app).get("/siege/stocks");
    expect(res.status).toBe(200); // 200 même avec erreur partielle !
    expect(res.body.pays_ok).toBe(2);
    expect(res.body.pays_en_erreur).toBe(1);

    const bresil = res.body.resultats.find((r) => r.pays === "bresil");
    expect(bresil.status).toBe("error");
    expect(bresil.error).toMatch(/Timeout/i);
  });

  it("retourne une réponse partielle si un pays est injoignable (ECONNREFUSED)", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("colombie-api") || url.includes(":8003")) {
        const err = new Error("connect ECONNREFUSED");
        err.code = "ECONNREFUSED";
        return Promise.reject(err);
      }
      return Promise.resolve(mockLotsOk("pays"));
    });

    const res = await request(app).get("/siege/stocks");
    expect(res.status).toBe(200);
    expect(res.body.pays_en_erreur).toBe(1);

    const colombie = res.body.resultats.find((r) => r.pays === "colombie");
    expect(colombie.status).toBe("error");
    expect(colombie.error).toMatch(/ECONNREFUSED/i);
  });
});

// ───────────────────────────────────────────────
// GET /siege/stocks/:pays
// ───────────────────────────────────────────────

describe("GET /siege/stocks/:pays", () => {
  it("retourne les stocks d'un pays valide", async () => {
    axios.get.mockResolvedValue(mockLotsOk("bresil"));

    const res = await request(app).get("/siege/stocks/bresil");
    expect(res.status).toBe(200);
    expect(res.body.pays).toBe("bresil");
    expect(res.body.status).toBe("ok");
  });

  it("retourne 404 pour un pays inconnu", async () => {
    const res = await request(app).get("/siege/stocks/france");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/france/i);
    expect(res.body.pays_valides).toEqual(
      expect.arrayContaining(["bresil", "equateur", "colombie"])
    );
  });
});

// ───────────────────────────────────────────────
// GET /siege/mesures/:pays/:lot_id
// ───────────────────────────────────────────────

describe("GET /siege/mesures/:pays/:lot_id", () => {
  it("délègue vers l'API pays et retourne les mesures", async () => {
    axios.get.mockResolvedValue(mockMesuresOk());

    const res = await request(app).get("/siege/mesures/bresil/BR-001");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.data).toHaveLength(2);
  });

  it("retourne 404 pour un pays inconnu", async () => {
    const res = await request(app).get("/siege/mesures/france/FR-001");
    expect(res.status).toBe(404);
  });

  it("retourne 503 si l'API pays est down", async () => {
    const err = new Error("connect ECONNREFUSED");
    err.code = "ECONNREFUSED";
    axios.get.mockRejectedValue(err);

    const res = await request(app).get("/siege/mesures/equateur/EQ-001");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
  });
});

// ───────────────────────────────────────────────
// GET /siege/alertes
// ───────────────────────────────────────────────

describe("GET /siege/alertes", () => {
  it("agrège les alertes de tous les pays", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("bresil-api") || url.includes(":8001"))   return Promise.resolve(mockAlertesOk("bresil"));
      if (url.includes("equateur-api") || url.includes(":8002")) return Promise.resolve(mockAlertesOk("equateur"));
      if (url.includes("colombie-api") || url.includes(":8003")) return Promise.resolve(mockAlertesOk("colombie"));
    });

    const res = await request(app).get("/siege/alertes");
    expect(res.status).toBe(200);
    expect(res.body.total_pays).toBe(3);
    expect(res.body.pays_ok).toBe(3);
  });

  it("retourne réponse partielle si un pays est en erreur", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("equateur-api") || url.includes(":8002")) {
        const err = new Error("timeout");
        err.code = "ECONNABORTED";
        return Promise.reject(err);
      }
      return Promise.resolve(mockAlertesOk("pays"));
    });

    const res = await request(app).get("/siege/alertes");
    expect(res.status).toBe(200);
    expect(res.body.pays_en_erreur).toBe(1);
  });
});

// ───────────────────────────────────────────────
// 404 catch-all
// ───────────────────────────────────────────────

describe("Routes inconnues", () => {
  it("retourne 404 avec un message explicite", async () => {
    const res = await request(app).get("/siege/ratatouille");
    expect(res.status).toBe(404);
    expect(res.body.docs).toBe("/docs");
  });
});
