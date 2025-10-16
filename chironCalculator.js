// chironCalculator.js

const sweph = require('sweph');
const { SE_CHIRON, SEFLG_SPEED } = require('./constants');

/**
 * Calcula a posição de Quíron de forma isolada para evitar que erros
 * quebrem o cálculo principal dos planetas.
 * @param {number} julianDay - O Dia Juliano para o cálculo.
 * @returns {Promise<object|null>} Um objeto com os dados de Quíron ou null se o cálculo falhar.
 */
async function calculateChiron(julianDay) {
    try {
        // A constante para Quíron na Swiss Ephemeris é SE_CHIRON (geralmente ID 15)
        const position = await sweph.calc_ut(julianDay, SE_CHIRON, SEFLG_SPEED);
        
        // Retorna um objeto no mesmo formato dos outros planetas
        return {
            longitude: position.data[0],
            latitude: position.data[1],
            speed: position.data[3]
        };
    } catch (error) {
        console.error("ERRO ao calcular Quíron:", error.message);
        // Se houver qualquer erro, registramos no console e retornamos null.
        // Isso impede que o aplicativo principal quebre.
        return null;
    }
}

module.exports = { calculateChiron };