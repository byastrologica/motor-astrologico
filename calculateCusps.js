// calculateCusps.js
// Módulo para cálculo das cúspides usando 'sweph'.

function dmsToDec(deg, min, sec, dir) {
  let val = Math.abs(deg) + (min || 0) / 60 + (sec || 0) / 3600;
  if (dir === 'S' || dir === 'W') val = -val;
  return val;
}

function formatDMS(angle) {
  angle = ((angle % 360) + 360) % 360;
  const d = Math.floor(angle);
  const m = Math.floor((angle - d) * 60);
  const s = Math.round(((angle - d) * 3600) - m * 60);
  return `${d}° ${m}' ${s}"`;
}

function getZodiacSign(deg) {
  deg = ((deg % 360) + 360) % 360;
  const signs = [
    'Áries','Touro','Gêmeos','Câncer','Leão','Virgem',
    'Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'
  ];
  const index = Math.floor(deg / 30);
  const degInSign = deg - index * 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  const s = Math.round(((degInSign - d) * 3600) - m * 60);
  return { sign: signs[index], formatted: `${signs[index]} ${d}° ${m}' ${s}"` };
}

let swe = null;
try {
  swe = require('sweph');
} catch (err) {
  throw new Error(
    'Erro ao carregar a biblioteca "sweph". Certifique-se de ter executado: npm install sweph'
  );
}

/**
 * Calcula as cúspides de casas
 * @param {Object} inputData
 * @param {Object} inputData.sideralTime {h,m,s}
 * @param {Object} inputData.latitude {deg,min,sec,dir}
 * @param {Object} inputData.longitude {deg,min,sec,dir}
 * @param {Number} inputData.obliquity
 * @param {String} inputData.houseSystem
 */
function calculateCusps(inputData) {
  const { sideralTime, latitude, longitude, obliquity, houseSystem } = inputData;

  const lstHours = sideralTime.h + sideralTime.m / 60 + sideralTime.s / 3600;
  const armc = lstHours * 15.0;

  const latDec = dmsToDec(latitude.deg, latitude.min, latitude.sec, latitude.dir);

  let houseResult;
  if (typeof swe.houses_armc === 'function') {
    houseResult = swe.houses_armc(armc, latDec, obliquity, houseSystem);
  } else if (typeof swe.houses === 'function') {
    // fallback: mas atenção, essa função normalmente precisa de JD
    houseResult = swe.houses(armc, latDec, obliquity, houseSystem);
  } else {
    throw new Error('Função adequada para cálculo de casas não encontrada no sweph.');
  }

  let cusps = null;
  let ascmc = null;
  if (houseResult && houseResult.data) {
    cusps = houseResult.data.houses || houseResult.data.cusps || houseResult.data;
    ascmc = houseResult.data.points || houseResult.data.ascmc || houseResult.data.aps;
  } else if (Array.isArray(houseResult) && houseResult.length >= 12) {
    cusps = houseResult;
  } else {
    throw new Error('Formato inesperado do resultado de swe.houses_armc');
  }

  if (cusps && cusps.length >= 13) {
    const normalized = [];
    for (let i = 1; i <= 12; i++) normalized.push(cusps[i]);
    cusps = normalized;
  }

  let ascDeg = null;
  let mcDeg = null;
  if (ascmc && ascmc.length >= 2) {
    ascDeg = ascmc[0];
    mcDeg = ascmc[1];
  } else {
    ascDeg = cusps ? cusps[0] : null;
    mcDeg = cusps ? cusps[9] : null;
  }

  return {
    ascendente: ascDeg != null ? getZodiacSign(ascDeg) : null,
    mc: mcDeg != null ? getZodiacSign(mcDeg) : null,
    casas: cusps
      ? cusps.map((c, i) => ({
          casa: i + 1,
          grau: c,
          signo: getZodiacSign(c)
        }))
      : []
  };
}

module.exports = calculateCusps;
