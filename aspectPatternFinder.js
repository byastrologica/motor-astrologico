// aspectPatternFinder.js (Versão Final e Corrigida)

/**
 * Função principal para encontrar todas as configurações de aspetos num mapa.
 * @param {Array<object>} aspects - A lista de aspetos calculados.
 * @returns {Array<object>} Uma lista de padrões encontrados.
 */
function findAspectPatterns(aspects) {
    const patterns = [];

    const aspectsByType = {
        opposition: aspects.filter(a => a.aspect_type === 'opposition'),
        square: aspects.filter(a => a.aspect_type === 'square'),
        trine: aspects.filter(a => a.aspect_type === 'trine'),
        sextile: aspects.filter(a => a.aspect_type === 'sextile'),
        quincunx: aspects.filter(a => a.aspect_type === 'quincunx'),
    };

    patterns.push(...findTSquares(aspectsByType));
    patterns.push(...findGrandTrines(aspectsByType));
    patterns.push(...findYods(aspectsByType));
    patterns.push(...findGrandCrosses(aspectsByType));

    return removeDuplicatePatterns(patterns);
}

// Encontra T-Squares (Oposição + 2 Quadraturas)
function findTSquares(aspectsByType) {
    const tsquares = [];
    for (const opp of aspectsByType.opposition) {
        const [p1, p2] = [opp.point1, opp.point2];
        const squaresP1 = aspectsByType.square.filter(s => s.point1 === p1 || s.point2 === p1);
        
        for (const s1 of squaresP1) {
            const apex = s1.point1 === p1 ? s1.point2 : s1.point1;
            const hasSecondSquare = aspectsByType.square.some(s2 =>
                (s2.point1 === p2 && s2.point2 === apex) || (s2.point1 === apex && s2.point2 === p2)
            );
            if (hasSecondSquare) {
                tsquares.push({ name: 'T-Square', planets: [p1, p2, apex].sort(), apex: apex });
            }
        }
    }
    return tsquares;
}

// Encontra Grandes Trígonos (3 Trígonos)
function findGrandTrines(aspectsByType) {
    const grandTrines = [];
    const trines = aspectsByType.trine;
    if (trines.length < 3) return grandTrines;

    const planetConnections = {};
    trines.forEach(trine => {
        if (!planetConnections[trine.point1]) planetConnections[trine.point1] = new Set();
        if (!planetConnections[trine.point2]) planetConnections[trine.point2] = new Set();
        planetConnections[trine.point1].add(trine.point2);
        planetConnections[trine.point2].add(trine.point1);
    });

    const planets = Object.keys(planetConnections);
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            for (let k = j + 1; k < planets.length; k++) {
                const p1 = planets[i];
                const p2 = planets[j];
                const p3 = planets[k];
                if (planetConnections[p1] && planetConnections[p1].has(p2) && planetConnections[p1].has(p3) && planetConnections[p2] && planetConnections[p2].has(p3)) {
                    grandTrines.push({ name: 'Grande Trígono', planets: [p1, p2, p3].sort() });
                }
            }
        }
    }
    return grandTrines;
}

// Encontra YODs (Sextil + 2 Quincunces)
function findYods(aspectsByType) {
    const yods = [];
    for (const sex of aspectsByType.sextile) {
        const [p1, p2] = [sex.point1, sex.point2];
        const quincunxesP1 = aspectsByType.quincunx.filter(q => q.point1 === p1 || q.point2 === p1);

        for (const q1 of quincunxesP1) {
            const apex = q1.point1 === p1 ? q1.point2 : q1.point1;
            const hasSecondQuincunx = aspectsByType.quincunx.some(q2 =>
                ((q2.point1 === p2 && q2.point2 === apex) || (q2.point1 === apex && q2.point2 === p2))
            );
            if (hasSecondQuincunx) {
                yods.push({ name: 'YOD', planets: [p1, p2, apex].sort(), apex: apex });
            }
        }
    }
    return yods;
}

// Encontra Grandes Cruzes (2 Oposições + 4 Quadraturas)
function findGrandCrosses(aspectsByType) {
    const grandCrosses = [];
    for (let i = 0; i < aspectsByType.opposition.length; i++) {
        for (let j = i + 1; j < aspectsByType.opposition.length; j++) {
            const opp1 = aspectsByType.opposition[i];
            const opp2 = aspectsByType.opposition[j];
            
            const [p1, p3] = [opp1.point1, opp1.point2];
            const [p2, p4] = [opp2.point1, opp2.point2];
            const planets = new Set([p1, p2, p3, p4]);
            if (planets.size !== 4) continue;

            const p1_sq_p2 = aspectsByType.square.some(s => (s.point1 === p1 && s.point2 === p2) || (s.point1 === p2 && s.point2 === p1));
            const p1_sq_p4 = aspectsByType.square.some(s => (s.point1 === p1 && s.point2 === p4) || (s.point1 === p4 && s.point2 === p1));
            const p3_sq_p2 = aspectsByType.square.some(s => (s.point1 === p3 && s.point2 === p2) || (s.point1 === p2 && s.point2 === p3));
            const p3_sq_p4 = aspectsByType.square.some(s => (s.point1 === p3 && s.point2 === p4) || (s.point1 === p4 && s.point2 === p3));

            if (p1_sq_p2 && p1_sq_p4 && p3_sq_p2 && p3_sq_p4) {
                 grandCrosses.push({ name: 'Grande Cruz', planets: [p1, p2, p3, p4].sort() });
            }
        }
    }
    return grandCrosses;
}

// Garante que cada padrão único seja listado apenas uma vez
function removeDuplicatePatterns(patterns) {
    const seen = new Set();
    return patterns.filter(pattern => {
        // Ordena os planetas para garantir uma identificação consistente
        const identifier = `${pattern.name}-${pattern.planets.sort().join(',')}`;
        if (seen.has(identifier)) {
            return false;
        } else {
            seen.add(identifier);
            return true;
        }
    });
}

module.exports = { findAspectPatterns };
