// calculateCusps.js
function normalizeDeg(d) {
  return ((d % 360) + 360) % 360;
}

function formatDMS(angle) {
  angle = normalizeDeg(angle);
  const d = Math.floor(angle);
  const m = Math.floor((angle - d) * 60);
  const s = Math.round(((angle - d) * 3600) - m * 60);
  return `${d}° ${m}' ${s}"`;
}

function getZodiacSignObj(deg) {
  deg = normalizeDeg(deg);
  const signs = [
    'Áries','Touro','Gêmeos','Câncer','Leão','Virgem',
    'Libra','Escorpião','Sagitário','Capricórnio','Aquário','Peixes'
  ];
  const idx = Math.floor(deg / 30);
  const degInSign = deg - idx * 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  const s = Math.round(((degInSign - d) * 3600) - m * 60);
  return { sign: signs[idx], formatted: `${signs[idx]} ${d}° ${m}' ${s}"` };
}

function dmsToDec(deg, min = 0, sec = 0, dir) {
  let val = Math.abs(deg) + (min || 0) / 60 + (sec || 0) / 3600;
  if (dir === 'S' || dir === 'W') val = -val;
  return val;
}

function gmstFromJulian(jd) {
  const gmst = 18.697374558 + 24.06570982441908 * (jd - 2451545.0);
  return ((gmst % 24) + 24) % 24; // em horas
}

/**
 * calculateCusps(input)
 * input pode ter:
 *  - sideralTime: {h,m,s}  (usa LST diretamente)
 *  - ou julianDay (numero) -> irá calcular LST internamente
 *  - latitude: número decimal ou {deg,min,sec,dir}
 *  - longitude: número decimal ou {deg,min,sec,dir}  (leste positivo)
 */
function calculateCusps(input) {
  const swe = require('sweph');

  const obliquity = input.obliquity ?? 23.43650;
  const houseSystem = input.houseSystem ?? 'P';

  // latitude decimal
  let latDec;
  if (typeof input.latitude === 'number') latDec = input.latitude;
  else if (input.latitude && typeof input.latitude === 'object') latDec = dmsToDec(input.latitude.deg, input.latitude.min, input.latitude.sec, input.latitude.dir);
  else throw new Error('latitude inválida');

  // longitude decimal (east positive)
  let lonDec;
  if (typeof input.longitude === 'number') lonDec = input.longitude;
  else if (input.longitude && typeof input.longitude === 'object') lonDec = dmsToDec(input.longitude.deg, input.longitude.min, input.longitude.sec, input.longitude.dir);
  else throw new Error('longitude inválida');

  // calcular LST (horas)
  let lstHours = null;
  if (input.sideralTime && typeof input.sideralTime === 'object') {
    lstHours = (input.sideralTime.h || 0) + (input.sideralTime.m || 0) / 60 + (input.sideralTime.s || 0) / 3600;
  } else if (input.julianDay) {
    const jd = input.julianDay;
    const gmst = gmstFromJulian(jd);
    lstHours = gmst + lonDec / 15.0; // lon east-positive
    lstHours = ((lstHours % 24) + 24) % 24;
  } else {
    throw new Error('Forneça sideralTime ou julianDay para calcular LST.');
  }

  const armc = lstHours * 15.0; // ARMC em graus

  const houseResult = swe.houses_armc(armc, latDec, obliquity, houseSystem);
  const cuspsRaw = (houseResult && houseResult.data && houseResult.data.houses) ? houseResult.data.houses : null;
  const ascmc = (houseResult && houseResult.data && houseResult.data.points) ? houseResult.data.points : null;
  if (!cuspsRaw) throw new Error('Formato de resultado inesperado do swe.houses_armc - cusps não encontrado.');

  // normalizar índice 1..12 para array 0..11 quando necessário
  let normalizedCusps = cuspsRaw;
  if (Array.isArray(cuspsRaw) && cuspsRaw.length >= 13) {
    normalizedCusps = [];
    for (let i = 1; i <= 12; i++) normalizedCusps.push(cuspsRaw[i]);
  } else if (Array.isArray(cuspsRaw) && cuspsRaw.length === 12) {
    normalizedCusps = cuspsRaw.slice(0, 12);
  }

  const ascDeg = ascmc && ascmc.length >= 1 ? ascmc[0] : normalizedCusps[0];
  const mcDeg = ascmc && ascmc.length >= 2 ? ascmc[1] : normalizedCusps[9];

  return {
    armc_degrees: normalizeDeg(armc),
    lst_hours: lstHours,
    ascendente: ascDeg != null ? getZodiacSignObj(ascDeg) : null,
    mc: mcDeg != null ? getZodiacSignObj(mcDeg) : null,
    casas: normalizedCusps.map((c, i) => ({
      casa: i + 1,
      grau: normalizeDeg(c),
      signo: getZodiacSignObj(c),
      dms: formatDMS(c)
    }))
  };
}

module.exports = calculateCusps;
