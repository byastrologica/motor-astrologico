// moonPhaseCalculator.js (Versão Final com Fases de Transição)

/**
 * Calcula a fase da Lua de nascimento com base nas longitudes do Sol e da Lua,
 * incluindo uma lógica de nuance para fases de transição.
 * @param {number} sunLongitude - A longitude do Sol em graus decimais.
 * @param {number} moonLongitude - A longitude da Lua em graus decimais.
 * @returns {string} O nome da fase lunar, com detalhes de transição quando aplicável.
 */
function getMoonPhase(sunLongitude, moonLongitude) {
    // Calcula a diferença angular
    let separation = moonLongitude - sunLongitude;

    // Normaliza o ângulo para estar sempre entre 0 e 360 graus
    if (separation < 0) {
        separation += 360;
    }

    // Lógica de Transição (checada primeiro)
    // Uma "orbe" de 5 graus antes do início de cada fase principal
    if (separation >= 40 && separation < 45) return 'Lua Nova (em transição para Crescente)';
    if (separation >= 85 && separation < 90) return 'Lua Crescente (em transição para Quarto Crescente)';
    if (separation >= 130 && separation < 135) return 'Quarto Crescente (em transição para Gibosa)';
    if (separation >= 175 && separation < 180) return 'Gibosa Crescente (em transição para Cheia)';
    if (separation >= 220 && separation < 225) return 'Lua Cheia (em transição para Minguante)';
    if (separation >= 265 && separation < 270) return 'Gibosa Minguante (em transição para Quarto Minguante)';
    if (separation >= 310 && separation < 315) return 'Quarto Minguante (em transição para Balsâmica)';
    if (separation >= 355 && separation < 360) return 'Lua Balsâmica (em transição para Nova)';

    // Lógica das Fases Principais
    if (separation < 45) return 'Lua Nova';
    if (separation < 90) return 'Lua Crescente';
    if (separation < 135) return 'Quarto Crescente';
    if (separation < 180) return 'Gibosa Crescente';
    if (separation < 225) return 'Lua Cheia';
    if (separation < 270) return 'Gibosa Minguante';
    if (separation < 315) return 'Quarto Minguante';
    
    return 'Lua Balsâmica';
}

module.exports = { getMoonPhase };
