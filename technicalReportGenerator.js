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

// --- CORREÇÃO AQUI ---
// A função agora retorna apenas o valor, não o rótulo "Condição:".
function getConditionString(dignities) {
    if (!dignities) return "Sem dignidades clássicas";
    const majorDignities = [];
    if (dignities.domicile) majorDignities.push("Domicílio");
    if (dignities.exaltation) majorDignities.push("Exaltação");
    if (dignities.detriment) majorDignities.push("Exílio");
    if (dignities.fall) majorDignities.push("Queda");
    if (dignities.triplicity) majorDignities.push("Triplicidade");
    if (majorDignities.length > 0) {
        return majorDignities.join(' e ');
    }
    return "Peregrino";
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
    
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];
    const PLANET_NAMES_MAP = {
        sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
        jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
        pluto: 'Plutão', north_node: 'Nodo Norte', south_node: 'Nodo Sul'
    };
    const ASPECT_NAMES_MAP = {
        conjunction: 'Conjunção', opposition: 'Oposição', square: 'Quadratura',
        trine: 'Trígono', sextile: 'Sextil', quincunce: 'Quincunce'
    };

    planetOrder.forEach((planetName, index) => {
        const p = planets[planetName];
        if (!p) return;
        
        if (index > 0) {
            report += "----------------------------------------\n\n";
        }
        report += "--- Posição e Condições Planetárias ---\n\n";

        const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
        
        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n\n`;
        report += `Movimento: ${p.speed < 0 ? 'Retrógrado' : 'Direto'}\n`;
        // O rótulo "Condição:" agora é adicionado apenas aqui.
        report += `Condição: ${getConditionString(p.dignities)}\n`;
        
        if (p.dignities && p.dignities.decan) {
            report += `Decanato: ${p.dignities.decan}º Decanato (Face de ${PLANET_NAMES_MAP[p.dignities.face]})\n`;
        }
        if (p.dwadasamsaSign) {
            report += `Dwadasamsa: ${p.dwadasamsaSign}\n`;
        }
        report += `Tipo de Grau: ${p.degree_type}\n`;
        const degree = Math.floor(p.longitude % 30);
        const sabianDegree = degree + 1;
        report += `Símbolo Sabiano: Grau ${sabianDegree}\n`;
        if (p.dignities && p.dignities.term) {
            report += `Termo: ${PLANET_NAMES_MAP[p.dignities.term]}\n`;
        }
        report += "\n";

        const planetAspects = aspects.filter(asp => (asp.point1 === planetName || asp.point2 === planetName) && ASPECT_NAMES_MAP[asp.aspect_type]);
        
        if (planetAspects.length > 0) {
            report += "--- Aspetos Ptolomaicos ---\n\n";
            
            const aspectsByType = { conjunction: [], opposition: [], square: [], trine: [], sextile: [] };
            planetAspects.forEach(aspect => {
                if (aspectsByType[aspect.aspect_type]) {
                    aspectsByType[aspect.aspect_type].push(aspect);
                }
            });
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
        report += "\n----------------------------------------\n\n";
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
                if(opp1){
                    const p1_partner = opp1.point1 === p1 ? opp1.point2 : opp1.point1;
                    const remaining_planets = [p1,p2,p3,p4].filter(p => p !== opp1.point1 && p !== opp1.point2);
                    const opp2 = findAspectBetween(remaining_planets[0], remaining_planets[1], aspects);
                    if (opp2) {
                        const sq1 = findAspectBetween(opp1.point1, opp2.point1, aspects);
                        const sq2 = findAspectBetween(opp1.point1, opp2.point2, aspects);
                        const sq3 = findAspectBetween(opp1.point2, opp2.point1, aspects);
                        const sq4 = findAspectBetween(opp1.point2, opp2.point2, aspects);
                        if(opp1) report += `   Oposição: ${PLANET_NAMES_MAP[opp1.point1]} - ${PLANET_NAMES_MAP[opp1.point2]} (Orbe: ${opp1.orb_degrees}°)\n`;
                        if(opp2) report += `   Oposição: ${PLANET_NAMES_MAP[opp2.point1]} - ${PLANET_NAMES_MAP[opp2.point2]} (Orbe: ${opp2.orb_degrees}°)\n`;
                        if(sq1 && sq1.aspect_type === 'square') report += `   Quadratura: ${PLANET_NAMES_MAP[sq1.point1]} - ${PLANET_NAMES_MAP[sq1.point2]} (Orbe: ${sq1.orb_degrees}°)\n`;
                        if(sq2 && sq2.aspect_type === 'square') report += `   Quadratura: ${PLANET_NAMES_MAP[sq2.point1]} - ${PLANET_NAMES_MAP[sq2.point2]} (Orbe: ${sq2.orb_degrees}°)\n`;
                        if(sq3 && sq3.aspect_type === 'square') report += `   Quadratura: ${PLANET_NAMES_MAP[sq3.point1]} - ${PLANET_NAMES_MAP[sq3.point2]} (Orbe: ${sq3.orb_degrees}°)\n`;
                        if(sq4 && sq4.aspect_type === 'square') report += `   Quadratura: ${PLANET_NAMES_MAP[sq4.point1]} - ${PLANET_NAMES_MAP[sq4.point2]} (Orbe: ${sq4.orb_degrees}°)\n`;
                    }
                }
            } else if (pattern.name === 'T-Square' && pattern.apex) {
                const oppositionPlanets = pattern.planets.filter(p => p !== pattern.apex);
                const opposition = findAspectBetween(oppositionPlanets[0], oppositionPlanets[1], aspects);
                const square1 = findAspectBetween(oppositionPlanets[0], pattern.apex, aspects);
                const square2 = findAspectBetween(oppositionPlanets[1], pattern.apex, aspects);
                report += `   Ápice (Ponto Focal): ${PLANET_NAMES_MAP[pattern.apex]}\n`;
                if(opposition) report += `   Oposição: ${PLANET_NAMES_MAP[opposition.point1]} - ${PLANET_NAMES_MAP[opposition.point2]} (Orbe: ${opposition.orb_degrees}°)\n`;
                if(square1) report += `   Quadratura: ${PLANET_NAMES_MAP[square1.point1]} - ${PLANET_NAMES_MAP[pattern.apex]} (Orbe: ${square1.orb_degrees}°)\n`;
                if(square2) report += `   Quadratura: ${PLANET_NAMES_MAP[square2.point1]} - ${PLANET_NAMES_MAP[pattern.apex]} (Orbe: ${square2.orb_degrees}°)\n`;
            } else if (pattern.name === 'YOD' && pattern.apex) {
                const basePlanets = pattern.planets.filter(p => p !== pattern.apex);
                const baseAspect = findAspectBetween(basePlanets[0], basePlanets[1], aspects);
                const quincunx1 = findAspectBetween(basePlanets[0], pattern.apex, aspects);
                const quincunx2 = findAspectBetween(basePlanets[1], pattern.apex, aspects);
                report += `   Ápice (Ponto Focal): ${PLANET_NAMES_MAP[pattern.apex]}\n`;
                if(baseAspect) report += `   Base: ${capitalize(ASPECT_NAMES_MAP[baseAspect.aspect_type])} entre ${PLANET_NAMES_MAP[basePlanets[0]]} e ${PLANET_NAMES_MAP[basePlanets[1]]} (Orbe: ${baseAspect.orb_degrees}°)\n`;
                if(quincunx1) report += `   Quincunce: ${PLANET_NAMES_MAP[basePlanets[0]]} - ${PLANET_NAMES_MAP[pattern.apex]} (Orbe: ${quincunx1.orb_degrees}°)\n`;
                if(quincunx2) report += `   Quincunce: ${PLANET_NAMES_MAP[basePlanets[1]]} - ${PLANET_NAMES_MAP[pattern.apex]} (Orbe: ${quincunx2.orb_degrees}°)\n`;
            } else if (pattern.name === 'Grande Trígono') {
                const [p1, p2, p3] = pattern.planets;
                const trine1 = findAspectBetween(p1, p2, aspects);
                const trine2 = findAspectBetween(p2, p3, aspects);
                const trine3 = findAspectBetween(p1, p3, aspects);
                if(trine1) report += `   Trígono: ${PLANET_NAMES_MAP[p1]} - ${PLANET_NAMES_MAP[p2]} (Orbe: ${trine1.orb_degrees}°)\n`;
                if(trine2) report += `   Trígono: ${PLANET_NAMES_MAP[p2]} - ${PLANET_NAMES_MAP[p3]} (Orbe: ${trine2.orb_degrees}°)\n`;
                if(trine3) report += `   Trígono: ${PLANET_NAMES_MAP[p1]} - ${PLANET_NAMES_MAP[p3]} (Orbe: ${trine3.orb_degrees}°)\n`;
            }
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
