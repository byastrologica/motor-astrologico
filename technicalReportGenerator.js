// technicalReportGenerator.js

function decimalToDMS(decimal) {
    if (decimal === undefined || decimal === null) return '';
    const degrees = Math.floor(decimal);
    const minutesFloat = (decimal - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    return `${degrees}°${String(minutes).padStart(2, '0')}'`;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getConditionString(dignities) {
    if (!dignities) return "Sem dignidades clássicas";
    const majorDignities = [];
    if (dignities.domicile) majorDignities.push("Domicílio");
    if (dignities.exaltation) majorDignities.push("Exaltação");
    if (dignities.detriment) majorDignities.push("Exílio");
    if (dignities.fall) majorDignities.push("Queda");
    if (dignities.triplicity) majorDignities.push("Triplicidade");
    if (majorDignities.length > 0) {
        return `Condição: ${majorDignities.join(' e ')}`;
    }
    return "Condição: Peregrino";
}

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
    if (planet.dwadasamsaSign) {
        details.push(`Dwadasamsa em ${planet.dwadasamsaSign}`);
    }
    details.push(`Movimento ${planet.speed < 0 ? 'retrógrado' : 'direto'}`);
    return `Detalhes: ${details.join('. ')}.`;
}

function findAspectBetween(p1, p2, aspects) {
    return aspects.find(asp => 
        (asp.point1 === p1 && asp.point2 === p2) || (asp.point1 === p2 && asp.point2 === p1)
    );
}

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
    report += "--- Posições e Condições Planetárias ---\n\n";
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];
    const PLANET_NAMES_MAP = { sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno', pluto: 'Plutão', north_node: 'Nodo Norte', south_node: 'Nodo Sul' };
    const ASPECT_NAMES_MAP = { conjunction: 'Conjunção', opposition: 'Oposição', square: 'Quadratura', trine: 'Trígono', sextile: 'Sextil', quincunce: 'Quincunce' };
    planetOrder.forEach(planetName => {
        const p = planets[planetName];
        if (!p) return;
        const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n`;
        report += `${formatCondition(p.dignities)}\n`;
        report += `${formatDetails(p)}\n\n`;
    });
    if (aspects && aspects.length > 0) {
        report += "--- Lista Completa de Aspetos ---\n\n";
        const processedAspects = new Set();
        planetOrder.forEach(planetName => {
            if (!planets[planetName] || planetName === 'south_node') return;
            const planetAspects = aspects.filter(asp => asp.point1 === planetName || asp.point2 === planetName);
            if (planetAspects.length > 0) {
                const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
                let aspectText = `**${planetTitle} forma aspeto com:**\n`;
                let hasListedAspects = false;
                planetAspects.forEach(aspect => {
                    const otherPlanetName = aspect.point1 === planetName ? aspect.point2 : aspect.point1;
                    const aspectIdentifier = [aspect.point1, aspect.point2].sort().join('-');
                    if (processedAspects.has(aspectIdentifier)) { return; }
                    const otherPlanetTitle = PLANET_NAMES_MAP[otherPlanetName] || capitalize(otherPlanetName);
                    const aspectTitle = ASPECT_NAMES_MAP[aspect.aspect_type] || capitalize(aspect.aspect_type);
                    if (aspectTitle) {
                        const status_pt = aspect.status === 'Applying' ? 'Aplicativo' : 'Separativo';
                        aspectText += `   - ${otherPlanetTitle} (${aspectTitle}, Orbe: ${aspect.orb_degrees}°, ${status_pt})\n`;
                        processedAspects.add(aspectIdentifier);
                        hasListedAspects = true;
                    }
                });
                if (hasListedAspects) {
                    report += aspectText + '\n';
                }
            }
        });
    }
    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";
        // ... (lógica de formatação de padrões de aspetos) ...
    }
    return report.trim();
}
module.exports = { generateTechnicalReport };
