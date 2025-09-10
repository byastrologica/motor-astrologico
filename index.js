// index.js

// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const moment = require('moment-timezone');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');

// --- ATUALIZADO: IMPORTAÇÃO DAS NOVAS FERRAMENTAS ---
const { getZodiacSign } = require('./mapper');
const { getDwadasamsaSign } = require('./getDwadasamsaSign');
const { getDignities } = require('./dignityCalculator'); // <<< NOVO

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// =================================================================
// FUNÇÕES AUXILIARES E ENDPOINTS (sem alterações, omitido por brevidade)
// ... (seu código de geocodeLocation, buscarCidade, e /api/cidades vai aqui) ...
// =================================================================

// Cole suas funções geocodeLocation e buscarCidade aqui.

// =================================================================
// ROTA DE CÁLCULO PRINCIPAL
// =================================================================
app.post('/calculate', async (req, res) => {
    try {
        // ... (toda a sua lógica inicial de validação, geocodificação e cálculo de Julian Day vai aqui, sem alterações) ...
        
        // --- INÍCIO DO CÓDIGO DA SUA ROTA /calculate ---
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        if (year == null || month == null || day == null || hour == null || (!locationString && (latitude == null || longitude == null))) { return res.status(400).json({ error: 'Dados incompletos.' }); }
        let lat, lon, timezone;
        if (latitude !== undefined && longitude !== undefined) {
            lat = parseFloat(latitude);
            lon = parseFloat(longitude);
        } else {
            const geoResult = await geocodeLocation(locationString);
            if (!geoResult) { return res.status(400).json({ error: `Coordenadas não encontradas para "${locationString}".` }); }
            lat = geoResult.latitude;
            lon = geoResult.longitude;
            timezone = geoResult.timezone;
        }
        const hourFloat = parseFloat(hour);
        const hours = Math.floor(hourFloat);
        const minutes = Math.round((hourFloat - hours) * 60);
        let birthTimeUtc;
        if (utcOffset !== undefined && utcOffset !== null) {
            const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            const offsetInMinutes = utcOffset * 60;
            birthTimeUtc = moment(dateString).utcOffset(offsetInMinutes, true).utc();
        } else {
            if (!timezone) { timezone = moment.tz.guess(lat, lon); }
            const birthTimeLocal = moment.tz({ year, month: month - 1, day, hour: hours, minute: minutes }, timezone);
            birthTimeUtc = birthTimeLocal.clone().utc();
        }
        const utcYear = birthTimeUtc.year();
        const utcMonth = birthTimeUtc.month() + 1;
        const utcDay = birthTimeUtc.date();
        const utcHour = birthTimeUtc.hour() + (birthTimeUtc.minute() / 60) + (birthTimeUtc.second() / 3600);
        const jd_ut_obj = await sweph.utc_to_jd(utcYear, utcMonth, utcDay, utcHour, 0, 0, 1);
        const julianDay = jd_ut_obj.data[0];
        // --- FIM DA LÓGICA INICIAL ---

        // =================================================================
        // CÁLCULO DOS PLANETAS
        // =================================================================
        const planetsToCalc = [
            { id: SE_SUN, name: 'sun' }, { id: SE_MOON, name: 'moon' },
            { id: SE_MERCURY, name: 'mercury' }, { id: SE_VENUS, name: 'venus' },
            { id: SE_MARS, name: 'mars' }, { id: SE_JUPITER, name: 'jupiter' },
            { id: SE_SATURN, name: 'saturn' }, { id: SE_URANUS, name: 'uranus' },
            { id: SE_NEPTUNE, name: 'neptune' }, { id: SE_PLUTO, name: 'pluto' },
            { id: SE_TRUE_NODE, name: 'north_node' }
        ];
        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: position.data[0], latitude: position.data[1], speed: position.data[3] };
        }

        // =================================================================
        // CÁLCULO DOS ASPECTOS (sem alterações)
        // ... (seu código de cálculo de aspectos vai aqui) ...
        // =================================================================

        // =================================================================
        // NOVO: ENRIQUECIMENTO COMPLETO DOS DADOS PLANETÁRIOS
        // =================================================================
        // Lógica simplificada para determinar se o mapa é diurno.
        // Uma implementação completa calcularia o Ascendente e Descendente.
        // Aqui, consideramos "dia" se o Sol estiver nos signos 7-12 (Leão-Peixes, aproximadamente).
        const sunSignInfo = getZodiacSign(calculatedPlanets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) >= ZODIAC_SIGNS.indexOf('LIBRA');

        for (const planetName in calculatedPlanets) {
            const planet = calculatedPlanets[planetName];
            const { name: signName, decimalDegrees } = getZodiacSign(planet.longitude);
            
            // Adiciona signo e Dwadasamsa
            planet.sign = signName;
            planet.dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
            
            // Adiciona a análise completa de dignidades
            planet.dignities = getDignities(planetName, signName, decimalDegrees, isDiurnal);
        }

        // =================================================================
        // RESPOSTA FINAL (agora com todos os dados enriquecidos)
        // =================================================================
        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            planets: calculatedPlanets,
            // aspects: foundAspects // Se você tiver o código de aspectos, descomente esta linha
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

// =================================================================
// INICIALIZAÇÃO DO SERVIDOR (sem alterações)
// =================================================================
app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar.');
});
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
