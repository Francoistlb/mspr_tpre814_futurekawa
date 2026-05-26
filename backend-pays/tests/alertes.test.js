const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
  createTransport: () => ({ sendMail: jest.fn().mockResolvedValue(true) })
}));

const verifierSeuilsPur = (pays, temperature, humidite) => {
  const SEUILS = {
    Bresil:   { temp: 29, hum: 55 },
    Equateur: { temp: 31, hum: 60 },
    Colombie: { temp: 26, hum: 80 },
  };
  const s = SEUILS[pays];
  if (!s) return { ok: false, raison: 'Pays inconnu' };
  const tempOk = Math.abs(temperature - s.temp) <= 3;
  const humOk  = Math.abs(humidite - s.hum) <= 2;
  return { ok: tempOk && humOk, tempOk, humOk };
};

describe('Seuils Brésil (29°C / 55%)', () => {
  test('✅ Conditions idéales', () => {
    expect(verifierSeuilsPur('Bresil', 29, 55).ok).toBe(true);
  });
  test('✅ Limite haute acceptable (32°C / 57%)', () => {
    expect(verifierSeuilsPur('Bresil', 32, 57).ok).toBe(true);
  });
  test('❌ Température trop haute (33°C)', () => {
    expect(verifierSeuilsPur('Bresil', 33, 55).tempOk).toBe(false);
  });
  test('❌ Humidité trop basse (52%)', () => {
    expect(verifierSeuilsPur('Bresil', 29, 52).humOk).toBe(false);
  });
});

describe('Seuils Équateur (31°C / 60%)', () => {
  test('✅ Conditions idéales', () => {
    expect(verifierSeuilsPur('Equateur', 31, 60).ok).toBe(true);
  });
  test('❌ Température trop basse (27°C)', () => {
    expect(verifierSeuilsPur('Equateur', 27, 60).tempOk).toBe(false);
  });
});

describe('Seuils Colombie (26°C / 80%)', () => {
  test('✅ Conditions idéales', () => {
    expect(verifierSeuilsPur('Colombie', 26, 80).ok).toBe(true);
  });
  test('❌ Humidité trop haute (83%)', () => {
    expect(verifierSeuilsPur('Colombie', 26, 83).humOk).toBe(false);
  });
});

describe('Pays inconnu', () => {
  test('❌ Retourne ok: false', () => {
    expect(verifierSeuilsPur('France', 20, 50).ok).toBe(false);
  });
});