// technicalReportGenerator.js

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO ---

/**
 * Converte graus decimais para uma string formatada (Graus° Minutos').
 * @param {number} decimal - Graus em formato decimal.
 * @returns {string} String formatada.
 */
function decimalToDMS(decimal) {
    const degrees = Math.floor(decimal);
    const minutesFloat = (decimal - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    // Opcional: segundos, mas minutos são suficientes para a maioria dos relatórios.
    // const seconds = Math.round((minutesFloat - minutes) * 60);
    return `${degrees}° ${String(minutes).padStart(2, '0')}'`;
}

/**
 * Formata a secção "Condição" de um planeta.
 * @param {object} dignities - O objeto de dignidades de um planeta.
 * @returns {string} A string formatada da condição.
 */
function formatCondition(dignities) {
    if (!dignities) return "Condição: Sem dignidades clássicas";
    if (Object.keys(dignities).length === 0) return "Condição: Peregrino";

    const conditions = [];
    if (dignities.domicile) conditions.push("Domicílio");
    if (dignities.exaltation) conditions.push("Exaltação");
    if (dignities.detriment) conditions.push("Exílio");
    if (dignities.fall) conditions.push("Queda");
    if (dignities.triplicity && !dignities.domicile && !dignities.exaltation) {
        // Adiciona triplicidade apenas se não houver uma dignidade maior
        conditions.push("Triplicidade");
    }
    
    // Se houver múltiplas dignidades maiores, junta-as.
    if (conditions.length > 1) {
       const last = conditions.pop();
       return `Condição: ${conditions.join(', ')} e ${last}`;
    }
    return `Condição: ${conditions.join(', ')}`;
}

/**
 * Formata a secção "Detalhes" de um planeta.
 * @param {object} planet - O objeto completo de um planeta.
 * @returns {string} A string formatada dos detalhes.
 */
function formatDetails(planet) {
    const details = [];
    if (planet.degree_type !== 'Normal') {
        details.push(`Grau ${planet.degree_type}`);
    } else {
        details.push('Grau Normal');
    }

    if (planet.dignities) {
        if(planet.dignities.term) details.push(`Termo de ${planet.dignities.term}`);
        if(planet.dignities.face) details.push(`${planet.dignities.decan}º Decanato (Face de ${planet.dignities.face})`);
    }

    details.push(`Dwadasamsa em ${planet.dwadasamsaSign}`);
    details.push(`Movimento ${planet.speed < 0 ? 'retrógrado' : 'direto'}`);

    return `Detalhes: ${details.join('. ')}.`;
}

// --- FUNÇÃO PRINCIPAL ---

/**
 * Gera um relatório técnico completo a partir dos dados do mapa.
 * @param {object} data - O objeto de dados completo da API.
 * @returns {string} O relatório técnico formatado como texto.
 */
function generateTechnicalReport(data) {
    const { moon_phase, planets, aspects, aspect_patterns } = data;

    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    report += "--- Posições e Condições Planetárias ---\n\n";

    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node'];

    planetOrder.forEach(planetName => {
        const p = planets[planetName];
        if (!p) return;

        const planetTitle = planetName.charAt(0).toUpperCase() + planetName.slice(1).replace('_node', ' Nodo Norte');
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n`;
        report += `${formatCondition(p.dignities)}\n`;
        report += `${formatDetails(p)}\n\n`;
    });

    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";

        aspect_patterns.forEach((pattern, index) => {
            const planetDetails = pattern.planets.map(pName => {
                const planetObj = planets[pName];
                return `${pName.charAt(0).toUpperCase() + pName.slice(1)} (${decimalToDMS(planetObj.longitude % 30)} ${planetObj.sign})`;
            }).join(' - ');

            report += `${pattern.name} ${index + 1}: ${planetDetails}\n`;
            if (pattern.apex) {
                report += `   Ápice: ${pattern.apex.charAt(0).toUpperCase() + pattern.apex.slice(1)}\n`;
            }

            // Encontra os aspetos que formam o padrão
            // Esta é uma lógica complexa, aqui está uma versão simplificada para ilustrar
            // Você pode expandir isto para encontrar as orbes exatas se necessário.
            report += `   (Formado por uma combinação de oposições, quadraturas ou outros aspetos entre estes planetas).\n\n`;
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
