const axios = require("axios");
const config = require("../config");

/**
 * Appelle un endpoint d'une API pays.
 * Toujours résilient : retourne un objet d'erreur partiel si le pays est down.
 *
 * @param {string} pays   - clé du pays (ex: "bresil")
 * @param {string} path   - chemin de l'endpoint (ex: "/lots")
 * @returns {Promise<object>} - { pays, status: "ok"|"error", data?, error? }
 */
async function fetchPays(pays, path) {
  const paysCfg = config.pays[pays];
  if (!paysCfg) {
    return { pays, status: "error", error: `Pays inconnu : ${pays}` };
  }

  const url = `${paysCfg.url}${path}`;

  try {
    const response = await axios.get(url, { timeout: config.timeout });
    return { pays, code: paysCfg.code, status: "ok", data: response.data };
  } catch (err) {
    const reason =
      err.code === "ECONNABORTED"
        ? `Timeout (>${config.timeout / 1000}s)`
        : err.code === "ECONNREFUSED"
        ? "Service injoignable (ECONNREFUSED)"
        : err.response
        ? `HTTP ${err.response.status} — ${err.response.statusText}`
        : err.message;

    return { pays, code: paysCfg.code, status: "error", error: reason };
  }
}

/**
 * Appelle le même endpoint sur tous les pays en parallèle.
 *
 * @param {string} path
 * @returns {Promise<object[]>}
 */
async function fetchAllPays(path) {
  const noms = Object.keys(config.pays);
  return Promise.all(noms.map((pays) => fetchPays(pays, path)));
}

module.exports = { fetchPays, fetchAllPays };
