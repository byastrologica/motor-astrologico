// degreeClassifier.js

// Mapeia cada signo à sua modalidade
const SIGN_MODALITIES = {
    ARIES: 'Cardinal', CANCER: 'Cardinal', LIBRA: 'Cardinal', CAPRICORNIO: 'Cardinal',
    TOURO: 'Fixo', LEAO: 'Fixo', ESCORPIAO: 'Fixo', AQUARIO: 'Fixo',
    GEMEOS: 'Mutavel', VIRGEM: 'Mutavel', SAGITARIO: 'Mutavel', PEIXES: 'Mutavel'
};

// Define os graus críticos para cada modalidade
const CRITICAL_DEGREES = {
    Cardinal: [0, 13, 26],
    Fixo: [9, 21],
    Mutavel: [4, 17]
};

// Função auxiliar para normalizar nomes de signos
function normalizeSignName(signName) {
    if (!signName) return '';
    return signName
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Classifica o grau de um planeta como Normal, Crítico ou Anarético.
 * @param {string} signName - O nome do signo do planeta (ex: 'Áries').
 * @param {number} degrees - Os graus decimais do planeta no signo.
 * @returns {string} O tipo de grau.
 */
function getDegreeType(signName, degrees) {
    const degreeInt = Math.floor(degrees);
    const signNormalized = normalizeSignName(signName);
    const modality = SIGN_MODALITIES[signNormalized];

    // 1. Checa se é o grau Anarético (29)
    if (degreeInt === 29) {
        return 'Anarético';
    }

    // 2. Checa se é um grau Crítico
    if (modality && CRITICAL_DEGREES[modality].includes(degreeInt)) {
        return 'Crítico';
    }

    // 3. Se não for nenhum dos anteriores, é Normal
    return 'Normal';
}

module.exports = { getDegreeType };
