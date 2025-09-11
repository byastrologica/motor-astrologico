// moonPhaseCalculator.js (Versão Final com Lógica Corrigida)

/**
 * Calcula a fase da Lua de nascimento, incluindo fases de transição.
 * @param {number} sunLongitude - A longitude do Sol em graus decimais.
 * @param {number} moonLongitude - A longitude da Lua em graus decimais.
 * @returns {string} O nome da fase lunar.
 */
function getMoonPhase(sunLongitude, moonLongitude) {
    let separation = moonLongitude - sunLongitude;
    if (separation < 0) {
        separation += 360;
    }

    // Lógica de Transição (verificada primeiro para maior precisão)
    if (separation >= 355) return 'Lua Balsâmica (em transição para Nova)';
    if (separation >= 310 && separation < 315) return 'Quarto Minguante (em transição para Balsâmica)';
    if (separation >= 265 && separation < 270) return 'Gibosa Minguante (em transição para Quarto Minguante)';
    if (separation >= 220 && separation < 225) return 'Lua Cheia (em transição para Minguante)';
    if (separation >= 175 && separation < 180) return 'Gibosa Crescente (em transição para Cheia)';
    if (separation >= 130 && separation < 135) return 'Quarto Crescente (em transição para Gibosa)';
    if (separation >= 85 && separation < 90) return 'Lua Crescente (em transição para Quarto Crescente)';
    if (separation >= 40 && separation < 45) return 'Lua Nova (em transição para Crescente)';

    // Lógica das Fases Principais (verificada depois)
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
