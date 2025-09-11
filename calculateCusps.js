// calculateCusps.js
// Função para calcular cúspides de casas astrológicas usando sweph

const swe = require('sweph');

function dmsToDec(degrees, minutes, seconds, direction) {
  let dec = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') dec = -dec;
  return dec;
}

function formatDegrees(deg) {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round((deg - d - m / 60) * 3600);
  return `${d}° ${m}' ${s}"`;
}

function getZodiacSign(degree) {
  const signs = [
    'Áries','Touro','Gêmeos','Câncer','Leão','Virgem',
    'Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'
  ];
  let normalizedDegree = degree % 360;
  if (normalizedDegree < 0) normalizedDegree += 360;
  const signIndex = Math.floor(normalizedDegree / 30);
  const degreeInSign = normalizedDegree % 30;
  const minutes = Math.floor((degreeInSign - Math.floor(degreeInSign)) * 60);
  const seconds = Math.round(((degreeInSign - Math.floor(degreeInSign)) * 60 - minutes) * 60);
  return {
    sign: signs[signIndex],
    formatted: `${signs[signIndex]} ${Math.floor(degreeInSign)}° ${minutes}' ${seconds}"`
  };
}

function calculateCusps({ sideralTime, latitude, longitude, obliquity = 23.43650, houseSystem = 'P' }) {
  const lstHours = sideralTime.h + sideralTime.m / 60 + sideralTime.s / 3600;
  const armc = lstHours * 15;

  const latDec = dmsToDec(latitude.deg, latitude.min, latitude.sec, latitude.dir);

  const houseResult = swe.houses_armc(armc, latDec, obliquity, houseSystem);

  const cusps = houseResult.data.houses;
  const ascmc = houseResult.data.points;

  return {
    ascendente: getZodiacSign(ascmc[0]),
    mc: getZodiacSign(ascmc[1]),
    casas: cusps.map((c, i) => ({
      casa: i + 1,
      grau: c,
      signo: getZodiacSign(c)
    }))
  };
}

module.exports = calculateCusps;
