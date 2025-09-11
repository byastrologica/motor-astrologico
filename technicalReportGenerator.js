// technicalReportGenerator.js (Versão Final e Corrigida)

// --- FUNÇÕES AUXILIARES DE FORMATAÇÃO ---

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
    details.push(`Dwadasamsa em ${planet.dwadasamsaSign}`);
    details.push(`Movimento ${planet.speed < 0 ? 'retrógrado' : 'direto'}`);
    return `Detalhes: ${details.join('. ')}.`;
}

function findAspectBetween(p1, p2, aspects) {
    return aspects.find(asp => 
        (asp.point1 === p1 && asp.point2 === p2) || (asp.point1 === p2 && asp.point2 === p1)
    );
}

// --- FUNÇÃO PRINCIPAL ---

function generateTechnicalReport(data) {
    const { moon_phase, planets, aspects, aspect_patterns } = data;

    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    report += "--- Posições e Condições Planetárias ---\n\n";

    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node'];
    planetOrder.forEach(planetName => {
        const p = planets[planetName];
        if (!p) return;
        const planetTitle = capitalize(planetName.replace('_node', ' Nodo Norte'));
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n`;
        report += `${formatCondition(p.dignities)}\n`;
        report += `${formatDetails(p)}\n\n`;
    });

    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";

        aspect_patterns.forEach((pattern, index) => {
            // --- LÓGICA DE FORMATAÇÃO CORRIGIDA E DINÂMICA ---
            const planetDetails = pattern.planets.map(pName => {
                const planetObj = planets[pName];
                return `${capitalize(pName)} (${decimalToDMS(planetObj.longitude % 30)} ${planetObj.sign})`;
            }).join(', ');

            report += `${pattern.name} ${index + 1}: ${planetDetails}\n`;
            
            if (pattern.name === 'YOD' && pattern.apex) {
                const apex = pattern.apex;
                const basePlanets = pattern.planets.filter(p => p !== apex);
                const aspect1 = findAspectBetween(basePlanets[0], apex, aspects);
                const aspect2 = findAspectBetween(basePlanets[1], apex, aspects);
                const baseAspect = findAspectBetween(basePlanets[0], basePlanets[1], aspects);

                report += `   Ápice (Ponto Focal): ${capitalize(apex)}\n`;
                if(baseAspect) report += `   Base: ${capitalize(baseAspect.aspect_type)} entre ${capitalize(basePlanets[0])} e ${capitalize(basePlanets[1])} (Orbe: ${baseAspect.orb_degrees}°)\n`;
                if(aspect1) report += `   Quincunce ${capitalize(basePlanets[0])}-${capitalize(apex)}: Orbe de ${aspect1.orb_degrees}°\n`;
                if(aspect2) report += `   Quincunce ${capitalize(basePlanets[1])}-${capitalize(apex)}: Orbe de ${aspect2.orb_degrees}°\n`;

            } else if (pattern.name === 'T-Square' && pattern.apex) {
                const apex = pattern.apex;
                const oppositionPlanets = pattern.planets.filter(p => p !== apex);
                const opposition = findAspectBetween(oppositionPlanets[0], oppositionPlanets[1], aspects);
                const square1 = findAspectBetween(oppositionPlanets[0], apex, aspects);
                const square2 = findAspectBetween(oppositionPlanets[1], apex, aspects);

                report += `   Ápice (Ponto Focal): ${capitalize(apex)}\n`;
                if(opposition) report += `   Oposição ${capitalize(oppositionPlanets[0])}-${capitalize(oppositionPlanets[1])}: Orbe de ${opposition.orb_degrees}°\n`;
                if(square1) report += `   Quadratura ${capitalize(oppositionPlanets[0])}-${capitalize(apex)}: Orbe de ${square1.orb_degrees}°\n`;
                if(square2) report += `   Quadratura ${capitalize(oppositionPlanets[1])}-${capitalize(apex)}: Orbe de ${square2.orb_degrees}°\n`;
            }
            // (Futuramente, pode adicionar `else if` para Grande Trígono e Grande Cruz aqui)
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
