const ZODIAC_SIGNS = [
    'ARIES', 'TOURO', 'GEMEOS', 'CANCER', 'LEAO', 'VIRGEM',
    'LIBRA', 'ESCORPIAO', 'SAGITARIO', 'CAPRICORNIO', 'AQUARIO', 'PEIXES'
];

// Regentes dos Decanatos baseados na triplicidade
const DECANATE_RULERS = {
    ARIES: ['MARS', 'SUN', 'JUPITER'],       // Fogo
    LEAO: ['SUN', 'JUPITER', 'MARS'],        // Fogo
    SAGITARIO: ['JUPITER', 'MARS', 'SUN'],   // Fogo
    TOURO: ['VENUS', 'MERCURY', 'SATURN'],   // Terra
    VIRGEM: ['MERCURY', 'SATURN', 'VENUS'],  // Terra
    CAPRICORNIO: ['SATURN', 'VENUS', 'MERCURY'],// Terra
    GEMEOS: ['MERCURY', 'VENUS', 'URANUS'],    // Ar
    LIBRA: ['VENUS', 'URANUS', 'MERCURY'],   // Ar
    AQUARIO: ['URANUS', 'MERCURY', 'VENUS'],   // Ar
    CANCER: ['MOON', 'PLUTO', 'NEPTUNE'],    // Água
    ESCORPIAO: ['PLUTO', 'NEPTUNE', 'MOON'], // Água
    PEIXES: ['NEPTUNE', 'MOON', 'PLUTO']     // Água
};

function analyzePlanet(planet, allPlanets, allAspects) {
    const { name, longitude } = planet;
    const planetNameUpper = name.toUpperCase();

    // Camada 1: Signo e Grau
    const signIndex = Math.floor(longitude / 30);
    const degreeWithinSign = longitude % 30;
    const signName = ZODIAC_SIGNS[signIndex];
    const degree = Math.floor(degreeWithinSign);

    // Camada 2: Decanatos
    const decanateIndex = Math.floor(degree / 10);
    const decanateRuler = DECANATE_RULERS[signName][decanateIndex];

    // Camada 3: Dwadasamsas ("Dwads")
    const dwadIndex = Math.floor(degreeWithinSign / 2.5);
    const dwadSign = ZODIAC_SIGNS[(signIndex + dwadIndex) % 12];

    // Camada 4: Aspectos
    const aspects = allAspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanetName = aspect.point1 === name ? aspect.point2 : aspect.point1;
            const otherPlanetSign = ZODIAC_SIGNS[Math.floor(allPlanets[otherPlanetName].longitude / 30)];
            return `${aspect.aspect_type.charAt(0).toUpperCase() + aspect.aspect_type.slice(1)} com ${otherPlanetName} em ${otherPlanetSign}`;
        });

    // Camada 6: Graus de Ênfase
    let degreeNote = null;
    const criticalDegrees = [1, 13, 26]; // Exemplo
    if (degree === 29) {
        degreeNote = "Este planeta está no grau anarético (29 graus).";
    } else if (criticalDegrees.includes(degree + 1)) {
        degreeNote = "Note que este planeta se encontra em um grau crítico.";
    }

    return {
        name: planetNameUpper,
        sign: signName,
        decanate: {
            number: decanateIndex + 1,
            ruler: decanateRuler
        },
        dwad: dwadSign,
        aspects: aspects,
        sabianDegree: degree + 1, // Símbolos Sabianos são de 1 a 30
        degreeNote: degreeNote
    };
}

module.exports = { analyzePlanet };
