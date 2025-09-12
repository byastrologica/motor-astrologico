// mapper.js

const { ZODIAC_SIGNS } = require('./constants');

// Esta função é a única necessária deste arquivo, usada pelo index.js
function getZodiacSign(longitude) {
    if (longitude === undefined || longitude === null) {
        return { name: 'Desconhecido', degree: 0, decimalDegrees: 0 };
    }
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    return {
        name: ZODIAC_SIGNS[signIndex],
        degree: Math.floor(degreeInSign) + 1,
        decimalDegrees: degreeInSign
    };
}

// As outras funções não são mais usadas no fluxo principal, mas podem ser mantidas
function mapPlanetToIds() { /* ... */ }
function updatePlanetRef() { /* ... */ }

module.exports = { getZodiacSign, mapPlanetToIds, updatePlanetRef };
