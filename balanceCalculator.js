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
