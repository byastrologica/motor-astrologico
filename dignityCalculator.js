// dignityCalculator.js

const { ZODIAC_SIGNS } = require('./constants');

function normalizeSignName(signName) {
    if (!signName) return '';
    return signName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const DIGNITIES = {
    sun:     { domicile: 'LEAO', exaltation: 'ARIES' },
    moon:    { domicile: 'CANCER', exaltation: 'TOURO' },
    mercury: { domicile: ['GEMEOS', 'VIRGEM'], exaltation: 'VIRGEM' },
    venus:   { domicile: ['TOURO', 'LIBRA'], exaltation: 'PEIXES' },
    mars:    { domicile: ['ARIES', 'ESCORPIAO'], exaltation: 'CAPRICORNIO' },
    jupiter: { domicile: ['SAGITARIO', 'PEIXES'], exaltation: 'CANCER' },
    saturn:  { domicile: ['CAPRICORNIO', 'AQUARIO'], exaltation: 'LIBRA' },
    north_node: { domicile: 'GEMEOS', exaltation: 'VIRGEM' },
    south_node: { domicile: 'SAGITARIO', exaltation: 'PEIXES' } 
};
const TRIPLICITY_RULERS = {
    FIRE:  { signs: ['ARIES', 'LEAO', 'SAGITARIO'], day: 'sun', night: 'jupiter' },
    EARTH: { signs: ['TOURO', 'VIRGEM', 'CAPRICORNIO'], day: 'venus', night: 'moon' },
    AIR:   { signs: ['GEMEOS', 'LIBRA', 'AQUARIO'], day: 'saturn', night: 'mercury' },
    WATER: { signs: ['CANCER', 'ESCORPIAO', 'PEIXES'], day: 'venus', night: 'mars' }
};
const TERMS = {
    ARIES:       [{ ruler: 'jupiter', limit: 6 }, { ruler: 'venus', limit: 14 }, { ruler: 'mercury', limit: 21 }, { ruler: 'mars', limit: 26 }, { ruler: 'saturn', limit: 30 }], TOURO:       [{ ruler: 'venus', limit: 8 }, { ruler: 'mercury', limit: 15 }, { ruler: 'jupiter', limit: 22 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }], GEMEOS:      [{ ruler: 'mercury', limit: 7 }, { ruler: 'jupiter', limit: 14 }, { ruler: 'venus', limit: 21 }, { ruler: 'mars', limit: 25 }, { ruler: 'saturn', limit: 30 }], CANCER:      [{ ruler: 'mars', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'mercury', limit: 20 }, { ruler: 'jupiter', limit: 27 }, { ruler: 'saturn', limit: 30 }], LEAO:        [{ ruler: 'jupiter', limit: 6 }, { ruler: 'venus', limit: 13 }, { ruler: 'saturn', limit: 19 }, { ruler: 'mercury', limit: 25 }, { ruler: 'mars', limit: 30 }], VIRGEM:      [{ ruler: 'mercury', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'jupiter', limit: 18 }, { ruler: 'mars', limit: 24 }, { ruler: 'saturn', limit: 30 }], LIBRA:       [{ ruler: 'saturn', limit: 6 }, { ruler: 'mercury', limit: 14 }, { ruler: 'jupiter', limit: 21 }, { ruler: 'venus', limit: 28 }, { ruler: 'mars', limit: 30 }], ESCORPIAO:   [{ ruler: 'mars', limit: 7 }, { ruler: 'venus', limit: 11 }, { ruler: 'mercury', limit: 19 }, { ruler: 'jupiter', limit: 24 }, { ruler: 'saturn', limit: 30 }], SAGITARIO:   [{ ruler: 'jupiter', limit: 12 }, { ruler: 'venus', limit: 17 }, { ruler: 'mercury', limit: 21 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }], CAPRICORNIO: [{ ruler: 'mercury', limit: 7 }, { ruler: 'jupiter', limit: 14 }, { ruler: 'venus', limit: 22 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }], AQUARIO:     [{ ruler: 'mercury', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 25 }, { ruler: 'saturn', limit: 30 }], PEIXES:      [{ ruler: 'venus', limit: 12 }, { ruler: 'jupiter', limit: 16 }, { ruler: 'mercury', limit: 19 }, { ruler: 'mars', limit: 28 }, { ruler: 'saturn', limit: 30 }]
};
const FACES = {
    ARIES:       [{ ruler: 'mars', limit: 10 }, { ruler: 'sun', limit: 20 }, { ruler: 'venus', limit: 30 }], TOURO:       [{ ruler: 'mercury', limit: 10 }, { ruler: 'moon', limit: 20 }, { ruler: 'saturn', limit: 30 }], GEMEOS:      [{ ruler: 'jupiter', limit: 10 }, { ruler: 'mars', limit: 20 }, { ruler: 'sun', limit: 30 }], CANCER:      [{ ruler: 'venus', limit: 10 }, { ruler: 'mercury', limit: 20 }, { ruler: 'moon', limit: 30 }], LEAO:        [{ ruler: 'saturn', limit: 10 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 30 }], VIRGEM:      [{ ruler: 'sun', limit: 10 }, { ruler: 'venus', limit: 20 }, { ruler: 'mercury', limit: 30 }], LIBRA:       [{ ruler: 'moon', limit: 10 }, { ruler: 'saturn', limit: 20 }, { ruler: 'jupiter', limit: 30 }], ESCORPIAO:   [{ ruler: 'mars', limit: 10 }, { ruler: 'sun', limit: 20 }, { ruler: 'venus', limit: 30 }], SAGITARIO:   [{ ruler: 'mercury', limit: 10 }, { ruler: 'moon', limit: 20 }, { ruler: 'saturn', limit: 30 }], CAPRICORNIO: [{ ruler: 'jupiter', limit: 10 }, { ruler: 'mars', limit: 20 }, { ruler: 'sun', limit: 30 }], AQUARIO:     [{ ruler: 'venus', limit: 10 }, { ruler: 'mercury', limit: 20 }, { ruler: 'moon', limit: 30 }], PEIXES:      [{ ruler: 'saturn', limit: 10 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 30 }]
};

function getDignities(planetName, signName, degrees, isDiurnal) {
    const result = { domicile: false, exaltation: false, triplicity: false, term: null, face: null, decan: null, detriment: false, fall: false };
    const planetDignities = DIGNITIES[planetName];
    if (!planetDignities) return {};
    const signNormalized = normalizeSignName(signName);
    const domicileSigns = Array.isArray(planetDignities.domicile) ? planetDignities.domicile : [planetDignities.domicile];
    if (domicileSigns.includes(signNormalized)) { result.domicile = true; } else { const normalizedZodiac = ZODIAC_SIGNS.map(normalizeSignName); const detrimentSigns = domicileSigns.map(sign => normalizedZodiac[(normalizedZodiac.indexOf(sign) + 6) % 12]); if (detrimentSigns.includes(signNormalized)) { result.detriment = true; } }
    if (planetDignities.exaltation === signNormalized) { result.exaltation = true; } else { const normalizedZodiac = ZODIAC_SIGNS.map(normalizeSignName); const fallSign = normalizedZodiac[(normalizedZodiac.indexOf(planetDignities.exaltation) + 6) % 12]; if (fallSign === signNormalized) { result.fall = true; } }
    for (const element in TRIPLICITY_RULERS) { const triplicityInfo = TRIPLICITY_RULERS[element]; if (triplicityInfo.signs.includes(signNormalized)) { const ruler = isDiurnal ? triplicityInfo.day : triplicityInfo.night; if (ruler === planetName) { result.triplicity = true; } break; } }
    const signTerms = TERMS[signNormalized]; if (signTerms) { for (const term of signTerms) { if (degrees < term.limit) { result.term = term.ruler; break; } } }
    const signFaces = FACES[signNormalized]; if (signFaces) { for (let i = 0; i < signFaces.length; i++) { const face = signFaces[i]; if (degrees < face.limit) { result.face = face.ruler; result.decan = i + 1; break; } } }
    const cleanedResult = {}; for (const key in result) { if (result[key] !== false && result[key] !== null) { cleanedResult[key] = result[key]; } }
    return cleanedResult;
}

module.exports = { getDignities };

