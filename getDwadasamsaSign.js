// getDwadasamsaSign.js

const { ZODIAC_SIGNS } = require('./constants');

function getDwadasamsaSign(planetSign, planetDegrees) {
    if (!planetSign) return null;
    const ZODIAC_SIGNS_UPPER = ZODIAC_SIGNS.map(s => s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const signNormalized = planetSign.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const startSignIndex = ZODIAC_SIGNS_UPPER.indexOf(signNormalized);
    if (startSignIndex === -1) return null;

    const dwadasamsaIndex = Math.floor(planetDegrees / 2.5);
    const finalSignIndex = (startSignIndex + dwadasamsaIndex) % 12;
    return ZODIAC_SIGNS[finalSignIndex];
}

module.exports = { getDwadasamsaSign };

