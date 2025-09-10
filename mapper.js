// mapper.js

const { getDwadasamsaSign } = require('./getDwadasamsaSign');
const { ZODIAC_SIGNS } = require('./constants'); // Importa ZODIAC_SIGNS

const PLANET_ID_MAP = {
    sun: 'SOL', moon: 'LUA', mercury: 'MERCURIO', venus: 'VENUS', mars: 'MARTE',
    jupiter: 'JUPITER', saturn: 'SATURNO', uranus: 'URANO', neptune: 'NETUNO', pluto: 'PLUTAO'
};

const ASPECT_ID_MAP = {
    conjunction: 'CONJ', opposition: 'OPOS', trine: 'TRIGO',
    square: 'QUAD', sextile: 'SEXT'
};

let calculatedPlanetsRef = {};

// Esta função agora será usada também pelo index.js
function getZodiacSign(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    return {
        name: ZODIAC_SIGNS[signIndex],
        degree: Math.floor(degreeInSign) + 1,
        decimalDegrees: degreeInSign
    };
}

function mapPlanetToIds(planet, aspects) {
    const { name, longitude } = planet;
    const { name: signName, degree, decimalDegrees } = getZodiacSign(longitude);
    const planetId = PLANET_ID_MAP[name];
    const dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
    const planetSignId = `${planetId}_${signName}`;
    const sabianSymbolId = `${signName}_${degree}`;
    const aspectIds = aspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanetName = aspect.point1 === name ? aspect.point2 : aspect.point1;
            const otherPlanetId = PLANET_ID_MAP[otherPlanetName];
            const aspectId = ASPECT_ID_MAP[aspect.aspect_type];
            if (!planetId || !otherPlanetId || !aspectId) return null;
            return `${planetId}_${aspectId}_${otherPlanetId}`;
        })
        .filter(id => id);

    return {
        planetName: name.charAt(0).toUpperCase() + name.slice(1),
        planetSignId,
        sabianSymbolId,
        aspectIds,
        dwadasamsaSign
    };
}

function updatePlanetRef(planets) {
    calculatedPlanetsRef = planets;
}

// ATUALIZADO: Exportamos a função getZodiacSign para uso externo
module.exports = { mapPlanetToIds, updatePlanetRef, getZodiacSign };
