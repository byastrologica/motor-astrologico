// aspectPatternFinder.js

/**
 * Função principal para encontrar todas as configurações de aspetos num mapa.
 * @param {Array<object>} aspects - A lista de aspetos calculados.
 * @returns {Array<object>} Uma lista de padrões encontrados.
 */
function findAspectPatterns(aspects) {
    const patterns = [];

    // Agrupa os aspetos por tipo para facilitar a busca
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

    return patterns;
}

// Encontra T-Squares
function findTSquares(aspectsByType) {
    const tsquares = [];
    for (const opp of aspectsByType.opposition) {
        const [p1, p2] = [opp.point1, opp.point2];
        const squaresP1 = aspectsByType.square.filter(s => s.point1 === p1 || s.point2 === p1);
        const squaresP2 = aspectsByType.square.filter(s => s.point1 === p2 || s.point2 === p2);

        for (const s1 of squaresP1) {
            const apex = s1.point1 === p1 ? s1.point2 : s1.point1;
            for (const s2 of squaresP2) {
                const apexCandidate = s2.point1 === p2 ? s2.point2 : s2.point1;
                if (apex === apexCandidate) {
                    tsquares.push({
                        name: 'T-Square',
                        planets: [p1, p2, apex].sort(),
                        apex: apex
                    });
                }
            }
        }
    }
    return tsquares;
}

// Encontra Grandes Trígonos
function findGrandTrines(aspectsByType) {
    const grandTrines = [];
    for (let i = 0; i < aspectsByType.trine.length; i++) {
        for (let j = i + 1; j < aspectsByType.trine.length; j++) {
            const t1 = aspectsByType.trine[i];
            const t2 = aspectsByType.trine[j];
            const planets = new Set([t1.point1, t1.point2, t2.point1, t2.point2]);
            if (planets.size === 3) {
                const [p1, p2, p3] = Array.from(planets);
                const hasThirdTrine = aspectsByType.trine.some(t3 =>
                    (t3.point1 === p1 && t3.point2 === p3) || (t3.point1 === p3 && t3.point2 === p1)
                );
                if (hasThirdTrine) {
                    grandTrines.push({
                        name: 'Grande Trígono',
                        planets: [p1, p2, p3].sort()
                    });
                }
            }
        }
    }
    return grandTrines;
}

// Encontra YODs
function findYods(aspectsByType) {
    const yods = [];
    for (const sex of aspectsByType.sextile) {
        const [p1, p2] = [sex.point1, sex.point2];
        const quincunxesP1 = aspectsByType.quincunx.filter(q => q.point1 === p1 || q.point2 === p1);
        const quincunxesP2 = aspectsByType.quincunx.filter(q => q.point1 === p2 || q.point2 === p2);

        for (const q1 of quincunxesP1) {
            const apex = q1.point1 === p1 ? q1.point2 : q1.point1;
            for (const q2 of quincunxesP2) {
                const apexCandidate = q2.point1 === p2 ? q2.point2 : q2.point1;
                if (apex === apexCandidate) {
                    yods.push({
                        name: 'YOD',
                        planets: [p1, p2, apex].sort(),
                        apex: apex
                    });
                }
            }
        }
    }
    return yods;
}

// Encontra Grandes Cruzes
function findGrandCrosses(aspectsByType) {
    const grandCrosses = [];
    for (const opp1 of aspectsByType.opposition) {
        const [p1, p3] = [opp1.point1, opp1.point2]; // p1 é oposto a p3
        for (const opp2 of aspectsByType.opposition) {
            const [p2, p4] = [opp2.point1, opp2.point2]; // p2 é oposto a p4
            
            // Verifica se os 4 planetas são únicos
            const planets = new Set([p1, p2, p3, p4]);
            if (planets.size !== 4) continue;
            
            // Verifica se p1 faz quadratura com p2 e p4
            const p1_sq_p2 = aspectsByType.square.some(s => (s.point1 === p1 && s.point2 === p2) || (s.point1 === p2 && s.point2 === p1));
            const p1_sq_p4 = aspectsByType.square.some(s => (s.point1 === p1 && s.point2 === p4) || (s.point1 === p4 && s.point2 === p1));
            
            if (p1_sq_p2 && p1_sq_p4) {
                 grandCrosses.push({
                    name: 'Grande Cruz',
                    planets: [p1, p2, p3, p4].sort()
                });
            }
        }
    }
    return grandCrosses;
}


// Remove duplicados (importante para Grandes Trígonos e Cruzes)
function removeDuplicatePatterns(patterns) {
    const seen = new Set();
    return patterns.filter(pattern => {
        const identifier = `${pattern.name}-${pattern.planets.join(',')}`;
        if (seen.has(identifier)) {
            return false;
        } else {
            seen.add(identifier);
            return true;
        }
    });
}

// Exporta a função principal, já com a limpeza de duplicados
module.exports = { 
    findAspectPatterns: (aspects) => removeDuplicatePatterns(findAspectPatterns(aspects)) 
};
