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
    const planetNameUpper = name.toUpperCase();

    // ID do Planeta no Signo (ex: SOL_ARIES)
    const planetSignId = `${planetNameUpper}_${signName}`;

    // ID do Símbolo Sabiano (ex: ARIES_25)
    const sabianSymbolId = `${signName}_${degree}`;
    
    // IDs dos Aspectos (ex: SOL_CONJUNCAO_LUA_TOURO)
    const aspectIds = aspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanetName = aspect.point1 === name ? aspect.point2 : aspect.point1;
            const otherPlanetData = calculatedPlanetsRef[otherPlanetName];
            if (!otherPlanetData) return null;
            const otherPlanetSign = getZodiacSign(otherPlanetData.longitude).name;
            return `${planetNameUpper}_${aspect.aspect_type.toUpperCase()}_${otherPlanetName.toUpperCase()}_${otherPlanetSign}`;
        })
        .filter(id => id);

    return {
        planetSignId,
        sabianSymbolId,
        aspectIds
    };
}

function updatePlanetRef(planets) {
    calculatedPlanetsRef = planets;
}

module.exports = { mapPlanetToIds, updatePlanetRef };
