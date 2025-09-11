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
    
    // CORREÇÃO: Se não houver dignidades maiores, é Peregrino.
    return "Condição: Peregrino";
}

function formatDetails(planet) {
    const details = [];
    details.push(planet.degree_type === 'Normal' ? 'Grau Normal' : `Grau ${planet.degree_type}`);

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
            const apex = pattern.apex;
            const otherPlanets = pattern.planets.filter(p => p !== apex);
            
            const p1_name = capitalize(otherPlanets[0]);
            const p2_name = capitalize(otherPlanets[1]);
            const apex_name = capitalize(apex);

            const p1_pos = `${decimalToDMS(planets[otherPlanets[0]].longitude % 30)} ${planets[otherPlanets[0]].sign}`;
            const p2_pos = `${decimalToDMS(planets[otherPlanets[1]].longitude % 30)} ${planets[otherPlanets[1]].sign}`;
            const apex_pos = `${decimalToDMS(planets[apex].longitude % 30)} ${planets[apex].sign}`;

            report += `${pattern.name} ${index + 1}: Oposição ${p1_name} (${p1_pos}) - ${p2_name} (${p2_pos}) com Ápice no ${apex_name} (${apex_pos})\n`;
            
            // CORREÇÃO: Lógica para encontrar e formatar os aspetos específicos
            const opposition = findAspectBetween(otherPlanets[0], otherPlanets[1], aspects);
            const square1 = findAspectBetween(otherPlanets[0], apex, aspects);
            const square2 = findAspectBetween(otherPlanets[1], apex, aspects);

            if(opposition) report += `   Oposição ${p1_name}-${p2_name}: Orbe de ${opposition.orb_degrees}°\n`;
            if(square1) report += `   Quadratura ${p1_name}-${apex_name}: Orbe de ${square1.orb_degrees}°\n`;
            if(square2) report += `   Quadratura ${p2_name}-${apex_name}: Orbe de ${square2.orb_degrees}°\n`;
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
