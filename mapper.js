// mapper.js

const { ZODIAC_SIGNS } = require('./constants');

function getZodiacSign(longitude) {
    if (longitude === undefined || longitude === null) {
        return { name: 'Desconhecido', degree: 0, decimalDegrees: 0 };
    }
    const signIndex = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    
    // Garante que o índice não saia do intervalo 0-11
    const safeSignIndex = (signIndex % 12 + 12) % 12;

    return {
        name: ZODIAC_SIGNS[safeSignIndex],
        degree: Math.floor(degreeInSign) + 1,
        decimalDegrees: degreeInSign
    };
}

// As funções abaixo não são mais usadas no fluxo principal, mas podem ser mantidas.
function mapPlanetToIds() { 
    return {};
}
function updatePlanetRef() { 
    return {};
}

module.exports = { getZodiacSign, mapPlanetToIds, updatePlanetRef };
