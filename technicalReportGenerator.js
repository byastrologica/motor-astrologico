// technicalReportGenerator.js (Versão Final com Novo Layout)

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

// Nova função de condição, mais completa
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
    const { moon_phase, planets, aspects, aspect_patterns } = data;

    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;
    
    const planetOrder = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'south_node'];
    const PLANET_NAMES_MAP = {
        sun: 'Sol', moon: 'Lua', mercury: 'Mercúrio', venus: 'Vênus', mars: 'Marte',
        jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Netuno',
        pluto: 'Plutão', north_node: 'Nodo Norte', south_node: 'Nodo Sul'
    };
    const ASPECT_NAMES_MAP = {
        conjunction: 'Conjunção', opposition: 'Oposição', square: 'Quadratura',
        trine: 'Trígono', sextile: 'Sextil', quincunx: 'Quincunce'
    };

    // --- NOVO LAYOUT DE GERAÇÃO ---
    report += "--- Posição e Condições Planetárias ---\n\n";

    planetOrder.forEach(planetName => {
        const p = planets[planetName];
        if (!p) return;

        const planetTitle = PLANET_NAMES_MAP[planetName] || capitalize(planetName);
        const degree = Math.floor(p.longitude % 30);
        const sabianDegree = degree + 1;

        report += `${planetTitle}: ${decimalToDMS(p.longitude % 30)} de ${p.sign}\n\n`;
        report += `Movimento: ${p.speed < 0 ? 'Retrógrado' : 'Direto'}\n`;
        report += `Condição: ${getConditionString(p.dignities)}\n`;
        if (p.dignities && p.dignities.decan) {
            report += `Decanato: ${p.dignities.decan}º Decanato (Face de ${capitalize(p.dignities.face)})\n`;
        }
        if (p.dwadasamsaSign) {
            report += `Dwadasamsa: ${p.dwadasamsaSign}\n`;
        }
        report += `Detalhes: ${p.degree_type}\n`;
        report += `Símbolo Sabiano: Grau ${sabianDegree}\n`;
        if (p.dignities && p.dignities.term) {
            report += `Termo: ${capitalize(p.dignities.term)}\n`;
        }
        report += "\n";

        // --- GERAÇÃO DE ASPETOS POR PLANETA ---
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
        report += "\n";
    });


    if (aspect_patterns && aspect_patterns.length > 0) {
        report += "--- Configurações de Aspetos Principais ---\n\n";
        aspect_patterns.forEach((pattern, index) => {
            const planetDetails = pattern.planets.map(pName => {
                const planetObj = planets[pName];
                return `${PLANET_NAMES_MAP[pName] || capitalize(pName)} (${decimalToDMS(planetObj.longitude % 30)} ${planetObj.sign})`;
            }).join(' - ');
            report += `${pattern.name} ${index + 1}: ${planetDetails}\n`;
            // Lógica para detalhar os aspetos do padrão
            // (Esta parte permanece a mesma)
            report += '\n';
        });
    }

    return report.trim();
}

module.exports = { generateTechnicalReport };
