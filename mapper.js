// Dicionário de Signos do Zodíaco
const ZODIAC_SIGNS = [
    'ARIES', 'TOURO', 'GEMEOS', 'CANCER', 'LEAO', 'VIRGEM',
    'LIBRA', 'ESCORPIAO', 'SAGITARIO', 'CAPRICORNIO', 'AQUARIO', 'PEIXES'
];

// Dicionário de Graus Críticos por modalidade
const CRITICAL_DEGREES = {
    CARDINAL: [0, 13, 26], // Áries, Câncer, Libra, Capricórnio
    FIXED: [8, 21],        // Touro, Leão, Escorpião, Aquário
    MUTABLE: [4, 17]       // Gêmeos, Virgem, Sagitário, Peixes
};

/**
 * Determina o signo zodiacal com base na longitude.
 * @param {number} longitude - A longitude do planeta em graus decimais (0-360).
 * @returns {object} - Um objeto contendo o nome e o índice do signo (ex: { name: 'ARIES', index: 0 }).
 */
function getZodiacSign(longitude) {
    const signIndex = Math.floor(longitude / 30);
    return {
        name: ZODIAC_SIGNS[signIndex],
        index: signIndex
    };
}

/**
 * Determina o status de um grau (Normal, Crítico, Anarético).
 * @param {number} longitude - A longitude do planeta.
 * @returns {string} - O status do grau.
 */
function getDegreeStatus(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const degree = Math.floor(longitude % 30);

    if (degree === 29) {
        return 'ANARETICO';
    }

    const isCardinal = [0, 3, 6, 9].includes(signIndex);
    const isFixed = [1, 4, 7, 10].includes(signIndex);
    const isMutable = [2, 5, 8, 11].includes(signIndex);

    if (isCardinal && CRITICAL_DEGREES.CARDINAL.includes(degree)) {
        return 'CRITICO';
    }
    if (isFixed && CRITICAL_DEGREES.FIXED.includes(degree)) {
        return 'CRITICO';
    }
    if (isMutable && CRITICAL_DEGREES.MUTABLE.includes(degree)) {
        return 'CRITICO';
    }

    return 'NORMAL';
}


/**
 * Função principal que mapeia um planeta calculado para seus IDs de interpretação.
 * @param {object} planet - O objeto do planeta (ex: { name: 'sun', longitude: 24.04 }).
 * @param {array} aspects - A lista completa de aspectos encontrados no mapa.
 * @returns {object} - Um objeto contendo todos os IDs de interpretação para aquele planeta.
 */
function mapPlanetToIds(planet, aspects) {
    const { name, longitude } = planet;
    const planetNameUpper = name.toUpperCase();

    // 1. Mapeamento de Planeta/Signo
    const signInfo = getZodiacSign(longitude);
    const planetSignId = `${planetNameUpper}_${signInfo.name}`;

    // 2. Mapeamento do Símbolo Sabiano (grau é sempre arredondado para cima)
    const sabianDegree = Math.floor(longitude % 30) + 1;
    const sabianSymbolId = `${signInfo.name}_${sabianDegree}`;

    // 3. Status do Grau
    const degreeStatus = getDegreeStatus(longitude);

    // 4. Mapeamento de Aspectos
    const aspectIds = aspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanet = (aspect.point1 === name) ? aspect.point2 : aspect.point1;
            const aspectType = aspect.aspect_type.toUpperCase();
            // Formato: PLANETA1_ASPECTO_PLANETA2 (ex: SOL_CONJUNCAO_LUA)
            return `${planetNameUpper}_${aspectType}_${otherPlanet.toUpperCase()}`;
        });

    return {
        planetSignId,
        sabianSymbolId,
        degreeStatus,
        aspectIds
    };
}


// Exportamos a função principal para que o index.js possa usá-la.
module.exports = { mapPlanetToIds };
