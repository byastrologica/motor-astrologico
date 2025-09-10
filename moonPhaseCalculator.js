// moonPhaseCalculator.js

/**
 * Calcula a fase da Lua de nascimento com base nas longitudes do Sol e da Lua.
 * @param {number} sunLongitude - A longitude do Sol em graus decimais.
 * @param {number} moonLongitude - A longitude da Lua em graus decimais.
 * @returns {string} O nome da fase lunar.
 */
function getMoonPhase(sunLongitude, moonLongitude) {
    // Calcula a diferença angular
    let separation = moonLongitude - sunLongitude;

    // Normaliza o ângulo para estar sempre entre 0 e 360 graus
    if (separation < 0) {
        separation += 360;
    }

    // Classifica o ângulo na fase correspondente
    if (separation < 45) {
        return 'Lua Nova';
    } else if (separation < 90) {
        return 'Lua Crescente';
    } else if (separation < 135) {
        return 'Quarto Crescente';
    } else if (separation < 180) {
        return 'Gibosa Crescente';
    } else if (separation < 225) {
        return 'Lua Cheia';
    } else if (separation < 270) {
        return 'Gibosa Minguante';
    } else if (separation < 315) {
        return 'Quarto Minguante';
    } else {
        return 'Lua Balsâmica';
    }
}

module.exports = { getMoonPhase };
