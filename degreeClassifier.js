// degreeClassifier.js

const SIGN_MODALITIES = {
    ARIES: 'Cardinal', CANCER: 'Cardinal', LIBRA: 'Cardinal', CAPRICORNIO: 'Cardinal',
    TOURO: 'Fixo', LEAO: 'Fixo', ESCORPIAO: 'Fixo', AQUARIO: 'Fixo',
    GEMEOS: 'Mutavel', VIRGEM: 'Mutavel', SAGITARIO: 'Mutavel', PEIXES: 'Mutavel'
};

const CRITICAL_DEGREES = {
    Cardinal: [0, 13, 26],
    Fixo: [9, 21],
    Mutavel: [4, 17]
};

function normalizeSignName(signName) {
    if (!signName) return '';
    return signName
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getDegreeType(signName, degrees) {
    const degreeInt = Math.floor(degrees);
    const signNormalized = normalizeSignName(signName);
    const modality = SIGN_MODALITIES[signNormalized];

    if (degreeInt === 29) {
        return 'Anarético';
    }

    if (modality && CRITICAL_DEGREES[modality].includes(degreeInt)) {
        return 'Crítico';
    }

    return 'Normal';
}

module.exports = { getDegreeType };
