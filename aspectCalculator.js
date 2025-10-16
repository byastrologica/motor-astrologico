// aspectCalculator.js

const aspectsConfig = {
    conjunction: { angle: 0, orb: 10 },
    opposition: { angle: 180, orb: 10 },
    trine: { angle: 120, orb: 10 },
    square: { angle: 90, orb: 10 },
    sextile: { angle: 60, orb: 6 },
    quincunx: { angle: 150, orb: 3 }
};

function getAngularDistance(lon1, lon2) {
    let distance = Math.abs(lon1 - lon2);
    if (distance > 180) {
        distance = 360 - distance;
    }
    return distance;
}

function calculateAspects(planets) {
    const planetKeys = Object.keys(planets);
    const foundAspects = [];
    for (let i = 0; i < planetKeys.length; i++) {
        for (let j = i + 1; j < planetKeys.length; j++) {
            const p1_name = planetKeys[i];
            const p2_name = planetKeys[j];
            const p1 = planets[p1_name];
            const p2 = planets[p2_name];
            if (!p1 || !p2) continue;
            const distance = getAngularDistance(p1.longitude, p2.longitude);
            for (const aspectName in aspectsConfig) {
                const aspect = aspectsConfig[aspectName];
                const orb_atual = Math.abs(distance - aspect.angle);
                if (orb_atual <= aspect.orb) {
                    const p1_future_lon = p1.longitude + (p1.speed / 24);
                    const p2_future_lon = p2.longitude + (p2.speed / 24);
                    const future_distance = getAngularDistance(p1_future_lon, p2_future_lon);
                    const orb_futuro = Math.abs(future_distance - aspect.angle);
                    const status = (orb_futuro < orb_atual) ? 'Applying' : 'Separating';
                    foundAspects.push({
                        point1: p1_name,
                        point2: p2_name,
                        aspect_type: aspectName,
                        orb_degrees: parseFloat(orb_atual.toFixed(2)),
                        status: status
                    });
                }
            }
        }
    }
    return foundAspects;
}

module.exports = { calculateAspects };
