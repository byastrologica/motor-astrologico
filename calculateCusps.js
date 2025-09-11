// calculateCusps.js
// Implementation based on the PDF solution using 'sweph'.
// Edit the input block below and run: node calculateCusps.js

function dmsToDec(deg, min, sec, dir) {
  let val = Math.abs(deg) + (min || 0) / 60 + (sec || 0) / 3600;
  if (dir === 'S' || dir === 'W') val = -val;
  return val;
}
function formatDMS(angle) {
  // angle in degrees (can be >360 or negative)
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
  return `${signs[index]} ${d}° ${m}' ${s}"`;
}

// ----------------- INPUT (edite aqui) -----------------
const sideralTime = { h:18, m:57, s:16 }; // LST (local sidereal time)
const latitude = { deg:23, min:33, sec:9, dir:'S' }; // 23S33'09
const longitude = { deg:46, min:37, sec:29, dir:'W' }; // 46W37'29
const obliquity = 23.43650; // obliquity (deg) - o PDF usa 23.43650
const houseSystem = 'P'; // 'P' = Placidus
// -----------------------------------------------------

const lstHours = sideralTime.h + sideralTime.m/60 + sideralTime.s/3600;
const armc = lstHours * 15.0; // ARMC in degrees (RAMC)

const latDec = dmsToDec(latitude.deg, latitude.min, latitude.sec, latitude.dir);
const lonDec = dmsToDec(longitude.deg, longitude.min, longitude.sec, longitude.dir);

// Try to require sweph
let swe = null;
try {
  swe = require('sweph');
} catch (err) {
  console.error('\nErro ao carregar a biblioteca "sweph".\nCertifique-se de ter executado: npm install sweph\nSe houver erro na instalação, siga as instruções de build tools / Python (veja README).');
  console.error('Erro original:', err.message || err);
  process.exit(1);
}

if (!swe) {
  console.error('sweph não disponível. Abortando.');
  process.exit(1);
}

// The PDF suggests using swe.houses_armc(armc, latitude, obliquity, houseSystem)
// Some bindings wrap returns differently — check available methods.
if (typeof swe.houses_armc !== 'function') {
  console.warn('A função swe.houses_armc não foi encontrada no binding sweph instalado.');
  console.warn('Tentando adaptação: verificando outras funções disponíveis em swe...');
  console.log('Funções exportadas (exemplo):', Object.keys(swe).slice(0,50));
  // continue but attempt to use swe.houses if present
}

try {
  // Call according to PDF (may differ conforme versão do sweph)
  // A API retornada pelo PDF: { data: { houses: [...], points: [...] } }
  let houseResult = null;
  if (typeof swe.houses_armc === 'function') {
    houseResult = swe.houses_armc(armc, latDec, obliquity, houseSystem);
  } else if (typeof swe.houses === 'function') {
    // fallback signature (jd_ut, lat, lon, houseSystem) - but we don't have JD here
    console.warn('swe.houses disponível — signature diferente. Tentando usar houses com parâmetros mínimos.');
    // Some wrappers support houses_armc only; if not, cannot proceed without JD.
    houseResult = swe.houses(armc, latDec, obliquity, houseSystem);
  } else {
    throw new Error('Função adequada para cálculo de casas não encontrada no sweph instalado.');
  }

  // adapt to possible shapes
  // many sweph bindings return { data: { houses: [...], points: [...] } }
  let cusps = null;
  let ascmc = null;
  if (houseResult && houseResult.data) {
    cusps = houseResult.data.houses || houseResult.data.cusps || houseResult.data;
    ascmc = houseResult.data.points || houseResult.data.ascmc || houseResult.data.aps;
  } else if (Array.isArray(houseResult) && houseResult.length >= 12) {
    // sometimes returns array
    cusps = houseResult;
  } else {
    throw new Error('Formato inesperado do resultado de swe.houses_armc. Veja a saída bruta abaixo.');
  }

  // If cusps includes 1..12 but shifted, adapt
  // We'll attempt to pick sensible indices based on common shapes (cusps[0] = casa 1 etc.)
  // Many bindings use arrays with index starting at 1 (cusps[1] = casa 1). We'll normalize.
  if (cusps && !Array.isArray(cusps)) {
    // if object, try keys
    if (cusps.houses) cusps = cusps.houses;
    else if (cusps.cusps) cusps = cusps.cusps;
  }

  // Normalize array indexing: if cusps length > 12 and index 1..12 used, handle that
  if (cusps && cusps.length >= 13) {
    // likely cusps[1..12]
    const normalized = [];
    for (let i=1;i<=12;i++) normalized.push(cusps[i]);
    cusps = normalized;
  } else if (cusps && cusps.length === 12) {
    // ok
  } else if (cusps && cusps.length === 0) {
    throw new Error('Cusps retornou array vazio.');
  }

  // ascmc: usually [asc, mc, ...] or points array; adapt
  let ascDeg = null;
  let mcDeg = null;
  if (ascmc && ascmc.length >= 2) {
    ascDeg = ascmc[0];
    mcDeg = ascmc[1];
  } else {
    // fallback: use cusps[0] as asc and some as MC guess
    ascDeg = cusps ? cusps[0] : null;
    mcDeg = cusps ? cusps[9] : null; // casa 10 index 9
  }

  // Print nicely
  console.log('\n== Resultado das Cúspides ==\n');
  if (ascDeg != null) console.log(`Ascendente: ${getZodiacSign(ascDeg)}  (${formatDMS(ascDeg)})`);
  else console.log('Ascendente: não disponível');

  for (let i=0;i<12;i++) {
    const c = cusps && cusps[i] != null ? cusps[i] : null;
    const idx = i+1;
    const label = `Casa ${idx}`;
    if (c != null) {
      console.log(`${label}: ${getZodiacSign(c)}  (${formatDMS(c)})`);
    } else {
      console.log(`${label}: não disponível`);
    }
  }

  if (mcDeg != null) console.log(`\nMC: ${getZodiacSign(mcDeg)}  (${formatDMS(mcDeg)})\n`);
} catch (err) {
  console.error('Erro durante o cálculo das cúspides:', err && err.message ? err.message : err);
  process.exit(1);
}
