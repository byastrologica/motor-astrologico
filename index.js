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
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED, ZODIAC_SIGNS
} = require('./constants');

const { getZodiacSign } = require('./mapper');
const { getDwadasamsaSign } = require('./getDwadasamsaSign');
const { getDignities } = require('./dignityCalculator');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// =================================================================
// FUNÇÕES AUXILIARES DA GEOAPIFY (sem alterações)
// =================================================================
async function geocodeLocation(locationString) { /* ... seu código aqui ... */ }
async function buscarCidade(textoDigitado) { /* ... seu código aqui ... */ }

// (Cole suas funções geocodeLocation e buscarCidade completas aqui)

// =================================================================
// ENDPOINTS DA API
// =================================================================
app.get('/api/cidades', async (req, res) => { /* ... seu código aqui ... */ });

app.post('/calculate', async (req, res) => {
    try {
        // ... (toda a sua lógica inicial de cálculo do Julian Day vai aqui) ...

        // --- INÍCIO DO CÓDIGO DA SUA ROTA /calculate ---
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        if (year == null || month == null || day == null || hour == null || (!locationString && (latitude == null || longitude == null))) { return res.status(400).json({ error: 'Dados incompletos.' }); }
        let lat, lon, timezone;
        if (latitude !== undefined && longitude !== undefined) {
            lat = parseFloat(latitude);
            lon = parseFloat(longitude);
        } else {
            const geoResult = await geocodeLocation(locationString);
            if (!geoResult) { return res.status(400).json({ error: `Coordenadas não encontradas.` }); }
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
            birthTimeUtc = moment(dateString).utcOffset(utcOffset * 60, true).utc();
        } else {
            if (!timezone) { timezone = moment.tz.guess(lat, lon); }
            const birthTimeLocal = moment.tz({ year, month: month - 1, day, hour: hours, minute: minutes }, timezone);
            birthTimeUtc = birthTimeLocal.clone().utc();
        }
        const jd_ut_obj = await sweph.utc_to_jd(birthTimeUtc.year(), birthTimeUtc.month() + 1, birthTimeUtc.date(), birthTimeUtc.hour() + (birthTimeUtc.minute() / 60), 0, 0, 1);
        const julianDay = jd_ut_obj.data[0];
        // --- FIM DA LÓGICA INICIAL ---

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
        
        // ... (seu código de cálculo de aspectos vai aqui) ...

        const sunSignInfo = getZodiacSign(calculatedPlanets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        
        // --- LÓGICA DE ENRIQUECIMENTO ATUALIZADA ---
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node'];

        for (const planetName in calculatedPlanets) {
            const planet = calculatedPlanets[planetName];
            const { name: signName, decimalDegrees } = getZodiacSign(planet.longitude);
            
            planet.sign = signName;
            planet.dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
            
            // ATUALIZAÇÃO: Apenas calcula dignidades para planetas clássicos
            if (classicalPlanets.includes(planetName)) {
                planet.dignities = getDignities(planetName, signName, decimalDegrees, isDiurnal);
            }
        }

        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            planets: calculatedPlanets,
            // aspects: foundAspects // Garanta que 'foundAspects' está definido
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor) ...
