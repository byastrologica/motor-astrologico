// moonPhaseCalculator.js

function getMoonPhase(sunLongitude, moonLongitude) {
    let separation = moonLongitude - sunLongitude;
    if (separation < 0) {
        separation += 360;
    }

    if (separation >= 355) return 'Lua Balsâmica (em transição para Nova)';
    if (separation >= 310 && separation < 315) return 'Quarto Minguante (em transição para Balsâmica)';
    if (separation >= 265 && separation < 270) return 'Gibosa Minguante (em transição para Quarto Minguante)';
    if (separation >= 220 && separation < 225) return 'Lua Cheia (em transição para Minguante)';
    if (separation >= 175 && separation < 180) return 'Gibosa Crescente (em transição para Cheia)';
    if (separation >= 130 && separation < 135) return 'Quarto Crescente (em transição para Gibosa)';
    if (separation >= 85 && separation < 90) return 'Lua Crescente (em transição para Quarto Crescente)';
    if (separation >= 40 && separation < 45) return 'Lua Nova (em transição para Crescente)';

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

