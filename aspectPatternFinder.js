// aspectPatternFinder.js

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
    
    // A remoção de duplicados é chamada aqui, no final
    return removeDuplicatePatterns(patterns);
}

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
                    (new Set([t3.point1, t3.point2, p1, p2, p3])).size === 3
                );
                if (hasThirdTrine) {
                    grandTrines.push({ name: 'Grande Trígono', planets: [p1, p2, p3].sort() });
                }
            }
        }
    }
    return grandTrines;
}

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

function findGrandCrosses(aspectsByType) {
    const grandCrosses = [];
    for (const opp1 of aspectsByType.opposition) {
        const [p1, p3] = [opp1.point1, opp1.point2];
        for (const opp2 of aspectsByType.opposition) {
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

// --- CORREÇÃO PRINCIPAL AQUI ---
// A função é exportada diretamente, sem chamar a si mesma.
module.exports = { findAspectPatterns };
