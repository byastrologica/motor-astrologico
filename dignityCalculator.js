// dignityCalculator.js

const { ZODIAC_SIGNS } = require('./constants');

// --- TABELAS DE DIGNIDADES E DEBILIDADES ---

// Domicílio e Exílio (signo oposto)
const DIGNITIES = {
    sun:     { domicile: 'LEAO', exaltation: 'ARIES' },
    moon:    { domicile: 'CANCER', exaltation: 'TOURO' },
    mercury: { domicile: ['GEMEOS', 'VIRGEM'], exaltation: 'VIRGEM' },
    venus:   { domicile: ['TOURO', 'LIBRA'], exaltation: 'PEIXES' },
    mars:    { domicile: ['ARIES', 'ESCORPIAO'], exaltation: 'CAPRICORNIO' },
    jupiter: { domicile: ['SAGITARIO', 'PEIXES'], exaltation: 'CANCER' },
    saturn:  { domicile: ['CAPRICORNIO', 'AQUARIO'], exaltation: 'LIBRA' },
    // O Nodo Norte tem dignidade em Gêmeos segundo alguns astrólogos helenísticos
    north_node: { domicile: 'GEMEOS', exaltation: 'VIRGEM' }
};

// Regentes de Triplicidade (Sistema de Dorotheus)
const TRIPLICITY_RULERS = {
    FIRE:  { signs: ['ARIES', 'LEAO', 'SAGITARIO'], day: 'sun', night: 'jupiter' },
    EARTH: { signs: ['TOURO', 'VIRGEM', 'CAPRICORNIO'], day: 'venus', night: 'moon' },
    AIR:   { signs: ['GEMEOS', 'LIBRA', 'AQUARIO'], day: 'saturn', night: 'mercury' },
    WATER: { signs: ['CANCER', 'ESCORPIAO', 'PEIXES'], day: 'venus', night: 'mars' }
};

// Termos (Limites) - Sistema Egípcio
const TERMS = {
    ARIES:       [{ ruler: 'jupiter', limit: 6 }, { ruler: 'venus', limit: 14 }, { ruler: 'mercury', limit: 21 }, { ruler: 'mars', limit: 26 }, { ruler: 'saturn', limit: 30 }],
    TOURO:       [{ ruler: 'venus', limit: 8 }, { ruler: 'mercury', limit: 15 }, { ruler: 'jupiter', limit: 22 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }],
    GEMEOS:      [{ ruler: 'mercury', limit: 7 }, { ruler: 'jupiter', limit: 14 }, { ruler: 'venus', limit: 21 }, { ruler: 'mars', limit: 25 }, { ruler: 'saturn', limit: 30 }],
    CANCER:      [{ ruler: 'mars', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'mercury', limit: 20 }, { ruler: 'jupiter', limit: 27 }, { ruler: 'saturn', limit: 30 }],
    LEAO:        [{ ruler: 'jupiter', limit: 6 }, { ruler: 'venus', limit: 13 }, { ruler: 'saturn', limit: 19 }, { ruler: 'mercury', limit: 25 }, { ruler: 'mars', limit: 30 }],
    VIRGEM:      [{ ruler: 'mercury', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'jupiter', limit: 18 }, { ruler: 'mars', limit: 24 }, { ruler: 'saturn', limit: 30 }],
    LIBRA:       [{ ruler: 'saturn', limit: 6 }, { ruler: 'mercury', limit: 14 }, { ruler: 'jupiter', limit: 21 }, { ruler: 'venus', limit: 28 }, { ruler: 'mars', limit: 30 }],
    ESCORPIAO:   [{ ruler: 'mars', limit: 7 }, { ruler: 'venus', limit: 11 }, { ruler: 'mercury', limit: 19 }, { ruler: 'jupiter', limit: 24 }, { ruler: 'saturn', limit: 30 }],
    SAGITARIO:   [{ ruler: 'jupiter', limit: 12 }, { ruler: 'venus', limit: 17 }, { ruler: 'mercury', limit: 21 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }],
    CAPRICORNIO: [{ ruler: 'mercury', limit: 7 }, { ruler: 'jupiter', limit: 14 }, { ruler: 'venus', limit: 22 }, { ruler: 'saturn', limit: 26 }, { ruler: 'mars', limit: 30 }],
    AQUARIO:     [{ ruler: 'mercury', limit: 7 }, { ruler: 'venus', limit: 13 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 25 }, { ruler: 'saturn', limit: 30 }],
    PEIXES:      [{ ruler: 'venus', limit: 12 }, { ruler: 'jupiter', limit: 16 }, { ruler: 'mercury', limit: 19 }, { ruler: 'mars', limit: 28 }, { ruler: 'saturn', limit: 30 }]
};

// Faces (Decanatos) - Ordem Caldeia
const FACES = {
    ARIES:       [{ ruler: 'mars', limit: 10 }, { ruler: 'sun', limit: 20 }, { ruler: 'venus', limit: 30 }],
    TOURO:       [{ ruler: 'mercury', limit: 10 }, { ruler: 'moon', limit: 20 }, { ruler: 'saturn', limit: 30 }],
    GEMEOS:      [{ ruler: 'jupiter', limit: 10 }, { ruler: 'mars', limit: 20 }, { ruler: 'sun', limit: 30 }],
    CANCER:      [{ ruler: 'venus', limit: 10 }, { ruler: 'mercury', limit: 20 }, { ruler: 'moon', limit: 30 }],
    LEAO:        [{ ruler: 'saturn', limit: 10 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 30 }],
    VIRGEM:      [{ ruler: 'sun', limit: 10 }, { ruler: 'venus', limit: 20 }, { ruler: 'mercury', limit: 30 }],
    LIBRA:       [{ ruler: 'moon', limit: 10 }, { ruler: 'saturn', limit: 20 }, { ruler: 'jupiter', limit: 30 }],
    ESCORPIAO:   [{ ruler: 'mars', limit: 10 }, { ruler: 'sun', limit: 20 }, { ruler: 'venus', limit: 30 }],
    SAGITARIO:   [{ ruler: 'mercury', limit: 10 }, { ruler: 'moon', limit: 20 }, { ruler: 'saturn', limit: 30 }],
    CAPRICORNIO: [{ ruler: 'jupiter', limit: 10 }, { ruler: 'mars', limit: 20 }, { ruler: 'sun', limit: 30 }],
    AQUARIO:     [{ ruler: 'venus', limit: 10 }, { ruler: 'mercury', limit: 20 }, { ruler: 'moon', limit: 30 }],
    PEIXES:      [{ ruler: 'saturn', limit: 10 }, { ruler: 'jupiter', limit: 20 }, { ruler: 'mars', limit: 30 }]
};

// --- FUNÇÃO PRINCIPAL DE CÁLCULO ---

/**
 * Calcula todas as dignidades e debilidades essenciais de um planeta.
 * @param {string} planetName - Nome do planeta (ex: 'sun').
 * @param {string} signName - Nome do signo (ex: 'ARIES').
 * @param {number} degrees - Graus decimais no signo.
 * @param {boolean} isDiurnal - True se o mapa for diurno, false se for noturno.
 * @returns {object} Um objeto com a análise completa das dignidades.
 */
function getDignities(planetName, signName, degrees, isDiurnal) {
    const result = {
        domicile: false,
        exaltation: false,
        triplicity: false,
        term: null,
        face: null,
        detriment: false,
        fall: false,
    };

    const planetDignities = DIGNITIES[planetName];
    if (!planetDignities) return result; // Retorna se o planeta não tem dignidades definidas

    const signUpper = signName.toUpperCase();
    
    // 1. Checa Domicílio e Exílio
    const domicileSigns = Array.isArray(planetDignities.domicile) ? planetDignities.domicile : [planetDignities.domicile];
    if (domicileSigns.includes(signUpper)) {
        result.domicile = true;
    } else {
        const detrimentSigns = domicileSigns.map(sign => ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(sign) + 6) % 12]);
        if (detrimentSigns.includes(signUpper)) {
            result.detriment = true;
        }
    }

    // 2. Checa Exaltação e Queda
    if (planetDignities.exaltation === signUpper) {
        result.exaltation = true;
    } else {
        const fallSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(planetDignities.exaltation) + 6) % 12];
        if (fallSign === signUpper) {
            result.fall = true;
        }
    }

    // 3. Checa Triplicidade
    for (const element in TRIPLICITY_RULERS) {
        const triplicityInfo = TRIPLICITY_RULERS[element];
        if (triplicityInfo.signs.includes(signUpper)) {
            const ruler = isDiurnal ? triplicityInfo.day : triplicityInfo.night;
            if (ruler === planetName) {
                result.triplicity = true;
            }
            break;
        }
    }

    // 4. Checa Termo
    const signTerms = TERMS[signUpper];
    if (signTerms) {
        for (const term of signTerms) {
            if (degrees < term.limit) {
                result.term = term.ruler;
                break;
            }
        }
    }
    
    // 5. Checa Face
    const signFaces = FACES[signUpper];
    if (signFaces) {
        for (const face of signFaces) {
            if (degrees < face.limit) {
                result.face = face.ruler;
                break;
            }
        }
    }

    return result;
}

module.exports = { getDignities };
