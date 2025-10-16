// balanceCalculator.js

// Mapeamento de Signos para Elementos
const elementMapping = {
  "Áries": "Fogo", "Leão": "Fogo", "Sagitário": "Fogo",
  "Touro": "Terra", "Virgem": "Terra", "Capricórnio": "Terra",
  "Gêmeos": "Ar", "Libra": "Ar", "Aquário": "Ar",
  "Câncer": "Água", "Escorpião": "Água", "Peixes": "Água"
};

// Mapeamento de Signos para Modos
const modeMapping = {
  "Áries": "Cardinal", "Câncer": "Cardinal", "Libra": "Cardinal", "Capricórnio": "Cardinal",
  "Touro": "Fixo", "Leão": "Fixo", "Escorpião": "Fixo", "Aquário": "Fixo",
  "Gêmeos": "Mutável", "Virgem": "Mutável", "Sagitário": "Mutável", "Peixes": "Mutável"
};

/**
 * Calcula o balanço de elementos e modos dos 10 planetas principais.
 * @param {object} planets - O objeto `planets` com todos os dados.
 * @returns {object} Um objeto contendo os resultados da contagem.
 */
function calculateBalances(planets) {
    const elementCounts = { "Fogo": 0, "Terra": 0, "Ar": 0, "Água": 0 };
    const modeCounts = { "Cardinal": 0, "Fixo": 0, "Mutável": 0 };

    // Lista dos 10 planetas a serem contados
    const planetsToCount = [
        'sun', 'moon', 'mercury', 'venus', 'mars', 
        'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
    ];

    planetsToCount.forEach(planetName => {
        const planet = planets[planetName];
        if (planet && planet.sign) {
            const sign = planet.sign;
            
            // Contabiliza o Elemento
            const element = elementMapping[sign];
            if (element) {
                elementCounts[element]++;
            }

            // Contabiliza o Modo
            const mode = modeMapping[sign];
            if (mode) {
                modeCounts[mode]++;
            }
        }
    });

    return {
        elements: elementCounts,
        modes: modeCounts
    };
}

module.exports = { calculateBalances };



// constants.js

const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
const SE_TRUE_NODE = 11;

const SEFLG_SPEED = 256;

const ZODIAC_SIGNS = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

module.exports = {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED,
    ZODIAC_SIGNS
};
