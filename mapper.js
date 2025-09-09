// Dicionários de Tradução para alinhar com os IDs dos CSVs
const PLANET_ID_MAP = {
    sun: 'SOL', moon: 'LUA', mercury: 'MERCURIO', venus: 'VENUS', mars: 'MARTE',
    jupiter: 'JUPITER', saturn: 'SATURNO', uranus: 'URANO', neptune: 'NETUNO', pluto: 'PLUTAO'
};

const ASPECT_ID_MAP = {
    conjunction: 'CONJ', opposition: 'OPOS', trine: 'TRIGO',
    square: 'QUAD', sextile: 'SEXT'
};

const ZODIAC_SIGNS = [
    'ARIES', 'TOURO', 'GEMEOS', 'CANCER', 'LEAO', 'VIRGEM',
    'LIBRA', 'ESCORPIAO', 'SAGITARIO', 'CAPRICORNIO', 'AQUARIO', 'PEIXES'
];

let calculatedPlanetsRef = {};

function getZodiacSign(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    return {
        name: ZODIAC_SIGNS[signIndex],
        degree: Math.floor(degreeInSign) + 1
    };
}

function mapPlanetToIds(planet, aspects) {
    const { name, longitude } = planet;
    const { name: signName, degree } = getZodiacSign(longitude);
    
    // Usa os dicionários de tradução
    const planetId = PLANET_ID_MAP[name];

    // Gera os IDs no formato correto do CSV
    const planetSignId = `${planetId}_${signName}`;
    const sabianSymbolId = `${signName}_${degree}`; // Assumindo formato SIGNO_GRAU
    
    const aspectIds = aspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanetName = aspect.point1 === name ? aspect.point2 : aspect.point1;
            const otherPlanetId = PLANET_ID_MAP[otherPlanetName];
            const aspectId = ASPECT_ID_MAP[aspect.aspect_type];
            
            if (!otherPlanetId || !aspectId) return null;

            // Formato: PLANETA1_ASPECTO_PLANETA2 (ex: SOL_CONJ_LUA)
            return `${planetId}_${aspectId}_${otherPlanetId}`;
        })
        .filter(id => id);

    return {
        planetName: name.charAt(0).toUpperCase() + name.slice(1),
        planetSignId,
        sabianSymbolId,
        aspectIds
    };
}

function updatePlanetRef(planets) {
    calculatedPlanetsRef = planets;
}

module.exports = { mapPlanetToIds, updatePlanetRef };
