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

function formatCondition(dignities) {
    if (!dignities) return "Condição: Sem dignidades clássicas";
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
    const { moon_phase, planets, aspects, aspect_patterns } = data;
    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    report += "--- Posições e Condições Planetárias ---\n\n";
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];
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
        aspect_patterns.forEach((pattern, index) => {
            const planetDetails = pattern.planets.map(pName => {
                const planetObj = planets[pName];
                return `${PLANET_NAMES_MAP[pName] || capitalize(pName)} (${decimalToDMS(planetObj.longitude % 30)} ${planetObj.sign})`;
            }).join(' - ');
            report += `${pattern.name} ${index + 1}: ${planetDetails}\n`;
            if (pattern.apex) {
                report += `   Ápice (Ponto Focal): ${PLANET_NAMES_MAP[pattern.apex] || capitalize(pattern.apex)}\n`;
            }
            if (pattern.name === 'T-Square' && pattern.apex) {
                const oppositionPlanets = pattern.planets.filter(p => p !== pattern.apex);
                const opposition = findAspectBetween(oppositionPlanets[0], oppositionPlanets[1], aspects);
                const square1 = findAspectBetween(oppositionPlanets[0], pattern.apex, aspects);
                const square2 = findAspectBetween(oppositionPlanets[1], pattern.apex, aspects);
                if(opposition) report += `   Oposição ${capitalize(oppositionPlanets[0])}-${capitalize(oppositionPlanets[1])}: Orbe de ${opposition.orb_degrees}°\n`;
                if(square1) report += `   Quadratura ${capitalize(oppositionPlanets[0])}-${capitalize(pattern.apex)}: Orbe de ${square1.orb_degrees}°\n`;
                if(square2) report += `   Quadratura ${capitalize(oppositionPlanets[1])}-${capitalize(pattern.apex)}: Orbe de ${square2.orb_degrees}°\n`;
            }
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
