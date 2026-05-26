require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT || "8000", 10),
  timeout: parseInt(process.env.API_TIMEOUT_S || "3", 10) * 1000, // en ms

  pays: {
    bresil: {
      url: process.env.BRESIL_API_URL || "http://host.docker.internal:8001",
      code: "BR",
    },
    equateur: {
      url: process.env.EQUATEUR_API_URL || "http://host.docker.internal:8002",
      code: "EQ",
    },
    colombie: {
      url: process.env.COLOMBIE_API_URL || "http://host.docker.internal:8003",
      code: "CO",
    },
  },
};

module.exports = config;
