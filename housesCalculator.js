// housesCalculator.js

const sweph = require('sweph');

/**
 * Função auxiliar interna para determinar em qual casa um planeta se encontra.
 * @param {number} planetLongitude - Longitude do planeta.
 * @param {Array<number>} houseCusps - Array com as 12 cúspides das casas.
 * @returns {number} O número da casa (1-12).
 */
function getPlanetHouse(planetLongitude, houseCusps) {
    const cusps = [...houseCusps, houseCusps[0] + 360];

    for (let i = 0; i < 12; i++) {
        const cusp1 = cusps[i];
        const cusp2 = cusps[i + 1];

        if (cusp2 < cusp1) { // Lida com a "virada" do zodíaco
            if (planetLongitude >= cusp1 || planetLongitude < cusp2) {
                return i + 1;
            }
        } else {
            if (planetLongitude >= cusp1 && planetLongitude < cusp2) {
                return i + 1;
            }
        }
    }
    return null; // Caso de erro
}

/**
 * Função principal que calcula as cúspides das casas e a posição de cada planeta nelas.
 * @param {number} julianDay - O dia juliano para o cálculo.
 * @param {number} lat - A latitude do local de nascimento.
 * @param {number} lon - A longitude do local de nascimento.
 * @param {object} planets - O objeto com os planetas já calculados.
 * @returns {object} Um objeto contendo os dados das casas e os planetas atualizados com a sua casa.
 */
async function calculateHousesAndPlacements(julianDay, lat, lon, planets) {
    const houseSystem = 'P'; // 'P' para o sistema Placidus
    const housesResult = await sweph.houses(julianDay, lat, lon, houseSystem);
    const houseCusps = housesResult.data.slice(0, 12);

    // Adiciona a informação da casa a cada planeta
    for (const planetName in planets) {
        const planet = planets[planetName];
        planet.house = getPlanetHouse(planet.longitude, houseCusps);
    }

    // Monta o objeto final de casas para a resposta da API
    const housesData = {
        system: 'Placidus',
        cusps: {
            1: houseCusps[0], 2: houseCusps[1], 3: houseCusps[2],
            4: houseCusps[3], 5: houseCusps[4], 6: houseCusps[5],
            7: houseCusps[6], 8: houseCusps[7], 9: houseCusps[8],
            10: houseCusps[9], 11: houseCusps[10], 12: houseCusps[11]
        }
    };

    return {
        housesData,       // O objeto com as informações das cúspides
        planetsWithHouses: planets // O objeto de planetas, agora com o campo 'house'
    };
}

module.exports = { calculateHousesAndPlacements };
