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

    if (aspects && aspects.length > 0) {
        report += "--- Lista Completa de Aspetos ---\n\n";
        const aspectNamesMap = {
            conjunction: 'Conjunção', opposition: 'Oposição', square: 'Quadratura',
            trine: 'Trígono', sextile: 'Sextil', quincunx: 'Quincunce'
        };
        const processedAspects = new Set();
        planetOrder.forEach(planetName => {
            if (!planets[planetName] || planetName === 'south_node') return; // Ignora o Nodo Sul aqui para evitar duplicados
            const planetAspects = aspects.filter(asp => asp.point1 === planetName || asp.point2 === planetName);
            if (planetAspects.length > 0) {
                const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
                let aspectText = `**${planetTitle} forma aspeto com:**\n`;
                let hasListedAspects = false;
                planetAspects.forEach(aspect => {
                    const otherPlanetName = aspect.point1 === planetName ? aspect.point2 : aspect.point1;
                    const aspectIdentifier = [aspect.point1, aspect.point2].sort().join('-');
                    if (processedAspects.has(aspectIdentifier)) {
                        return;
                    }
                    const otherPlanetTitle = PLANET_NAMES_MAP[otherPlanetName] || capitalize(otherPlanetName);
                    const aspectTitle = aspectNamesMap[aspect.aspect_type] || capitalize(aspect.aspect_type);
                    aspectText += `   - ${otherPlanetTitle} (${aspectTitle}, Orbe: ${aspect.orb_degrees}°)\n`;
                    processedAspects.add(aspectIdentifier);
                    hasListedAspects = true;
                });
                if (hasListedAspects) {
                    report += aspectText + '\n';
                }
            }
        });
    }

    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";
        aspect_patterns.forEach((pattern, index) => {
            const planetDetails = pattern.planets.map(pName => {
                const planetObj = planets[pName];
                return `${PLANET_NAMES_MAP[pName] || capitalize(pName)} (${decimalToDMS(planetObj.longitude % 30)} ${planetObj.sign})`;
            }).join(' - ');
            report += `${pattern.name} ${index + 1}: ${planetDetails}\n`;
            if (pattern.name === 'Grande Cruz') {
                const [p1, p2, p3, p4] = pattern.planets;
                const opp1 = findAspectBetween(p1, p3, aspects) || findAspectBetween(p1, p4, aspects) || findAspectBetween(p1, p2, aspects);
                const p1_partner = opp1.point1 === p1 ? opp1.point2 : opp1.point1;
                const remaining_planets = [p2,p3,p4].filter(p => p !== p1_partner);
                const opp2 = findAspectBetween(remaining_planets[0], remaining_planets[1], aspects);
                const sq1 = findAspectBetween(p1, p2, aspects);
                const sq2 = findAspectBetween(p1, p4, aspects);
                const sq3 = findAspectBetween(p3, p2, aspects);
                const sq4 = findAspectBetween(p3, p4, aspects);
                if(opp1) report += `   Oposição: ${capitalize(opp1.point1)} - ${capitalize(opp1.point2)} (Orbe: ${opp1.orb_degrees}°)\n`;
                if(opp2) report += `   Oposição: ${capitalize(opp2.point1)} - ${capitalize(opp2.point2)} (Orbe: ${opp2.orb_degrees}°)\n`;
                if(sq1 && sq1.aspect_type === 'square') report += `   Quadratura: ${capitalize(sq1.point1)} - ${capitalize(sq1.point2)} (Orbe: ${sq1.orb_degrees}°)\n`;
                if(sq2 && sq2.aspect_type === 'square') report += `   Quadratura: ${capitalize(sq2.point1)} - ${capitalize(sq2.point2)} (Orbe: ${sq2.orb_degrees}°)\n`;
                if(sq3 && sq3.aspect_type === 'square') report += `   Quadratura: ${capitalize(sq3.point1)} - ${capitalize(sq3.point2)} (Orbe: ${sq3.orb_degrees}°)\n`;
                if(sq4 && sq4.aspect_type === 'square') report += `   Quadratura: ${capitalize(sq4.point1)} - ${capitalize(sq4.point2)} (Orbe: ${sq4.orb_degrees}°)\n`;
            } else if (pattern.name === 'T-Square' && pattern.apex) {
                const oppositionPlanets = pattern.planets.filter(p => p !== pattern.apex);
                const opposition = findAspectBetween(oppositionPlanets[0], oppositionPlanets[1], aspects);
                const square1 = findAspectBetween(oppositionPlanets[0], pattern.apex, aspects);
                const square2 = findAspectBetween(oppositionPlanets[1], pattern.apex, aspects);
                report += `   Ápice (Ponto Focal): ${capitalize(pattern.apex)}\n`;
                if(opposition) report += `   Oposição: ${capitalize(opposition.point1)} - ${capitalize(opposition.point2)} (Orbe: ${opposition.orb_degrees}°)\n`;
                if(square1) report += `   Quadratura: ${capitalize(square1.point1)} - ${capitalize(pattern.apex)} (Orbe: ${square1.orb_degrees}°)\n`;
                if(square2) report += `   Quadratura: ${capitalize(square2.point1)} - ${capitalize(pattern.apex)} (Orbe: ${square2.orb_degrees}°)\n`;
            } else if (pattern.name === 'YOD' && pattern.apex) {
                const basePlanets = pattern.planets.filter(p => p !== pattern.apex);
                const baseAspect = findAspectBetween(basePlanets[0], basePlanets[1], aspects);
                const quincunx1 = findAspectBetween(basePlanets[0], pattern.apex, aspects);
                const quincunx2 = findAspectBetween(basePlanets[1], pattern.apex, aspects);
                report += `   Ápice (Ponto Focal): ${capitalize(pattern.apex)}\n`;
                if(baseAspect) report += `   Base: ${capitalize(baseAspect.aspect_type)} entre ${capitalize(basePlanets[0])} e ${capitalize(basePlanets[1])} (Orbe: ${baseAspect.orb_degrees}°)\n`;
                if(quincunx1) report += `   Quincunce: ${capitalize(basePlanets[0])} - ${capitalize(pattern.apex)} (Orbe: ${quincunx1.orb_degrees}°)\n`;
                if(quincunx2) report += `   Quincunce: ${capitalize(basePlanets[1])} - ${capitalize(pattern.apex)} (Orbe: ${quincunx2.orb_degrees}°)\n`;
            } else if (pattern.name === 'Grande Trígono') {
                const [p1, p2, p3] = pattern.planets;
                const trine1 = findAspectBetween(p1, p2, aspects);
                const trine2 = findAspectBetween(p2, p3, aspects);
                const trine3 = findAspectBetween(p1, p3, aspects);
                if(trine1) report += `   Trígono: ${capitalize(p1)} - ${capitalize(p2)} (Orbe: ${trine1.orb_degrees}°)\n`;
                if(trine2) report += `   Trígono: ${capitalize(p2)} - ${capitalize(p3)} (Orbe: ${trine2.orb_degrees}°)\n`;
                if(trine3) report += `   Trígono: ${capitalize(p1)} - ${capitalize(p3)} (Orbe: ${trine3.orb_degrees}°)\n`;
            }
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
