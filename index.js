// Arquivo: index.js

const express = require("express");
const cors = require("cors");
const swisseph = require("swisseph");

const app = express();
const port = process.env.PORT || 3000;

const { planets, signs, aspects } = require("./constants");

// Configuração do diretório de efemérides
const ephemerisPath = "./node_modules/swisseph/ephe";
swisseph.swe_set_ephe_path(ephemerisPath);

app.use(cors());
app.use(express.json());

// Função para calcular a data juliana
const getJulianDay = (date, time, timezone) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcHour = hour - timezone;
  return swisseph.swe_julday(year, month, day, utcHour + minute / 60, swisseph.SEFLG_GREG_CAL);
};

// Função para obter as posições dos planetas nos signos
const getPlanetsInSigns = (julianDay) => {
  const planetPositions = {};
  Object.values(planets).forEach((planet) => {
    const planetIndex = swisseph[`SE_${planet.toUpperCase()}`];
    if (planetIndex !== undefined) {
      swisseph.swe_calc_ut(julianDay, planetIndex, swisseph.SEFLG_SPEED, (result) => {
        const longitude = result.longitude;
        const signIndex = Math.floor(longitude / 30);
        const sign = Object.values(signs)[signIndex];
        const degree = longitude % 30;
        planetPositions[planet] = {
          sign,
          degree: degree.toFixed(2),
        };
      });
    }
  });
  return planetPositions;
};

// Rota principal
app.get("/", (req, res) => {
  res.send("Motor Astrológico no ar!");
});

// Rota para obter planetas nos signos
app.post("/planets-in-signs", (req, res) => {
  const { date, time, timezone, lat, lon } = req.body;
  if (!date || !time || timezone === undefined || !lat || !lon) {
    return res.status(400).json({ error: "Parâmetros ausentes. Forneça data, hora, fuso horário, latitude e longitude." });
  }

  try {
    const julianDay = getJulianDay(date, time, timezone);
    const planetsInSigns = getPlanetsInSigns(julianDay);
    res.json(planetsInSigns);
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular posições planetárias.", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
