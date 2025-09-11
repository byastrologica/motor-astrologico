// technicalReportGenerator.js (Versão Final com Nodo Sul)

// ... (funções auxiliares decimalToDMS, capitalize, formatCondition, etc.) ...
// (Cole as funções auxiliares da versão anterior aqui)

function formatDetails(planet) {
    const details = [];
    const degree = Math.floor(planet.longitude % 30);
    const sabianDegree = degree + 1;
    details.push(planet.degree_type === 'Normal' ? 'Grau Normal' : `Grau ${planet.degree_type}`);
    details.push(`Símbolo Sabiano: Grau ${sabianDegree}`);
    if (planet.dignities) {
        if(planet.dignities.term) details.push(`Termo de ${capitalize(planet.dignities.term)}`);
        if(planet.dignities.face) details.push(`${planet.dignities.decan}º Decanato (Face de ${capitalize(planet.dignities.face)})`);
    }
    details.push(`Dwadasamsa em ${planet.dwadasamsaSign}`);
    details.push(`Movimento ${planet.speed < 0 ? 'retrógrado' : 'direto'}`);
    return `Detalhes: ${details.join('. ')}.`;
}


function generateTechnicalReport(data) {
    const { moon_phase, planets, aspects, aspect_patterns } = data;

    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    report += "--- Posições e Condições Planetárias ---\n\n";

    // --- ATUALIZADO: Ordem de planetas com Nodo Sul ---
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];

    // --- ATUALIZADO: Mapeamento de nomes para formatação ---
    const PLANET_NAMES_MAP = {
        sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
        jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
        pluto: 'Plutão', north_node: 'Nodo Norte', south_node: 'Nodo Sul'
    };

    planetOrder.forEach(planetName => {
        const p = planets[planetName];
        if (!p) return;

        const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n`;
        report += `${formatCondition(p.dignities)}\n`;
        report += `${formatDetails(p)}\n\n`;
    });

    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";
        // ... (lógica de formatação de padrões de aspetos, sem alterações) ...
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
