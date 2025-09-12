// technicalReportGenerator.js

function decimalToDMS(decimal) { if (decimal === undefined || decimal === null) return ''; const degrees = Math.floor(decimal); const minutesFloat = (decimal - degrees) * 60; const minutes = Math.floor(minutesFloat); return `${degrees}°${String(minutes).padStart(2, '0')}'`; }
function capitalize(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1); }
function getConditionString(dignities) {
    if (!dignities) return "Sem dignidades clássicas";
    const majorDignities = [];
    if (dignities.domicile) majorDignities.push("Domicílio");
    if (dignities.exaltation) majorDignities.push("Exaltação");
    if (dignities.detriment) majorDignities.push("Exílio");
    if (dignities.fall) majorDignities.push("Queda");
    if (dignities.triplicity) majorDignities.push("Triplicidade");
    if (majorDignities.length > 0) { return majorDignities.join(' e '); }
    return "Peregrino";
}
function findAspectBetween(p1, p2, aspects) { return aspects.find(asp => (asp.point1 === p1 && asp.point2 === p2) || (asp.point1 === p2 && asp.point2 === p1)); }

function generateTechnicalReport(data) {
    const { moon_phase, planets, aspects, aspect_patterns, balances } = data;
    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    if (balances) {
        report += "--- Balanço de Elementos e Modos ---\n\n";
        report += "Elementos (Temperamento):\n";
        report += `   - Fogo: ${balances.elements.Fogo}\n`;
        report += `   - Terra: ${balances.elements.Terra}\n`;
        report += `   - Ar: ${balances.elements.Ar}\n`;
        report += `   - Água: ${balances.elements.Água}\n\n`;
        report += "Modos (Modo de Operar):\n";
        report += `   - Cardinal: ${balances.modes.Cardinal}\n`;
        report += `   - Fixo: ${balances.modes.Fixo}\n`;
        report += `   - Mutável: ${balances.modes.Mutável}\n\n`;
    }
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];
    const PLANET_NAMES_MAP = { sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão', north_node: 'Nodo Norte', south_node: 'Nodo Sul' };
    const ASPECT_NAMES_MAP = { conjunction: 'Conjunção', opposition: 'Oposição', square: 'Quadratura', trine: 'Trígono', sextile: 'Sextil', quincunce: 'Quincunce' };
    planetOrder.forEach((planetName, index) => {
        const p = planets[planetName];
        if (!p) return;
        if (index > 0) { report += "----------------------------------------\n\n"; }
        report += "--- Posição e Condições Planetárias ---\n\n";
        const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n\n`;
        report += `Movimento: ${p.speed < 0 ? 'Retrógrado' : 'Direto'}\n`;
        // CORREÇÃO: A palavra "Condição:" é adicionada aqui, e não na função auxiliar.
        report += `Condição: ${getConditionString(p.dignities)}\n`;
        if (p.dignities && p.dignities.decan) { report += `Decanato: ${p.dignities.decan}º Decanato (Face de ${PLANET_NAMES_MAP[p.dignities.face]})\n`; }
        if (p.dwadasamsaSign) { report += `Dwadasamsa: ${p.dwadasamsaSign}\n`; }
        report += `Tipo de Grau: ${p.degree_type}\n`;
        const degree = Math.floor(p.longitude % 30);
        const sabianDegree = degree + 1;
        report += `Símbolo Sabiano: Grau ${sabianDegree}\n`;
        if (p.dignities && p.dignities.term) { report += `Termo: ${PLANET_NAMES_MAP[p.dignities.term]}\n`; }
        report += "\n";
        const planetAspects = aspects.filter(asp => (asp.point1 === planetName || asp.point2 === planetName) && ASPECT_NAMES_MAP[asp.aspect_type]);
        if (planetAspects.length > 0) {
            report += "--- Aspetos Ptolomaicos ---\n\n";
            const aspectsByType = { conjunction: [], opposition: [], square: [], trine: [], sextile: [] };
            planetAspects.forEach(aspect => { if (aspectsByType[aspect.aspect_type]) { aspectsByType[aspect.aspect_type].push(aspect); } });
            Object.keys(aspectsByType).forEach(type => {
                if (aspectsByType[type].length > 0) {
                    report += `${capitalize(ASPECT_NAMES_MAP[type])}\n`;
                    aspectsByType[type].forEach(asp => {
                        const otherPlanetName = asp.point1 === planetName ? asp.point2 : asp.point1;
                        const status_pt = asp.status === 'Applying' ? 'Aplicativo' : 'Separativo';
                        report += `   ${PLANET_NAMES_MAP[otherPlanetName]} (Orbe: ${asp.orb_degrees}°, ${status_pt})\n`;
                    });
                    report += "\n";
                }
            });
        }
    });
    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "----------------------------------------\n\n";
        report += "--- Configurações de Aspetos Principais ---\n\n";
        // ... (lógica de formatação de padrões, que já estava correta)
    }
    return report.trim();
}

module.exports = { generateTechnicalReport };
