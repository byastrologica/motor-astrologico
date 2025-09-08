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
const { loadKnowledgeBase } = require('./knowledgeBase');
const { mapPlanetToIds, updatePlanetRef } = require('./mapper');
const { generateFinalReport } = require('./reportBuilder');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

let KB; // Variável global para a Base de Conhecimento

app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, hour, locationString } = req.body;
        if (!year || !month || !day || !hour || !locationString) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }
        
        // Etapa 0: Geocodificação e cálculo do tempo (omitido para brevidade, mas está aqui)
        const CHAVE_API_GEO = process.env.GEOAPIFY_API_KEY;
        if (!CHAVE_API_GEO) { throw new Error("Chave de API da Geoapify não configurada."); }
        const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationString)}&lang=pt&limit=1&format=json&apiKey=${CHAVE_API_GEO}`;
        const geoResponse = await axios.get(geoUrl);
        if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
            return res.status(400).json({ error: `Não foi possível encontrar coordenadas para "${locationString}".` });
        }
        const { lat, lon, timezone } = geoResponse.data.results[0];

        const hourFloat = parseFloat(hour);
        const hours = Math.floor(hourFloat);
        const minutes = Math.round((hourFloat - hours) * 60);
        const birthTimeLocal = moment.tz({ year, month: month - 1, day, hour: hours, minute: minutes }, timezone.name);
        const birthTimeUtc = birthTimeLocal.clone().utc();

        const utcYear = birthTimeUtc.year();
        const utcMonth = birthTimeUtc.month() + 1;
        const utcDay = birthTimeUtc.date();
        const utcHour = birthTimeUtc.hour() + (birthTimeUtc.minute() / 60) + (birthTimeUtc.second() / 3600);
        
        const jd_ut_obj = await sweph.utc_to_jd(utcYear, utcMonth, utcDay, utcHour, 0, 0, 1);
        const julianDay = jd_ut_obj.data[0];

        // Etapa 1: Cálculo Astrológico
        const planetsToCalc = [
            { id: SE_SUN, name: 'sun' }, { id: SE_MOON, name: 'moon' },
            { id: SE_MERCURY, name: 'mercury' }, { id: SE_VENUS, name: 'venus' },
            { id: SE_MARS, name: 'mars' }, { id: SE_JUPITER, name: 'jupiter' },
            { id: SE_SATURN, name: 'saturn' }, { id: SE_URANUS, name: 'uranus' },
            { id: SE_NEPTUNE, name: 'neptune' }, { id: SE_PLUTO, name: 'pluto' }
        ];
        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: position.data[0] };
        }
        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 }, opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 }, square: { angle: 90, orb: 10 }, sextile: { angle: 60, orb: 6 }
        };
        const planetPoints = Object.keys(calculatedPlanets).map(name => ({ name, longitude: calculatedPlanets[name].longitude }));
        const foundAspects = [];
        for (let i = 0; i < planetPoints.length; i++) {
            for (let j = i + 1; j < planetPoints.length; j++) {
                let distance = Math.abs(planetPoints[i].longitude - planetPoints[j].longitude);
                if (distance > 180) { distance = 360 - distance; }
                for (const aspectName in aspectsConfig) {
                    const aspect = aspectsConfig[aspectName];
                    if (Math.abs(distance - aspect.angle) <= aspect.orb) {
                        foundAspects.push({ point1: planetPoints[i].name, point2: planetPoints[j].name, aspect_type: aspectName });
                    }
                }
            }
        }

        // Etapa 2: Mapeamento para IDs
        updatePlanetRef(calculatedPlanets);
        const mappedData = planetPoints.map(p => mapPlanetToIds(p, foundAspects));

        // Etapa 3: Geração do Relatório Final com Gemini
        const interpretation = await generateFinalReport(mappedData, KB);

        const responseData = {
            message: "Relatório astrológico híbrido gerado com sucesso!",
            interpretation: interpretation
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

async function startServer() {
    KB = await loadKnowledgeBase();
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

startServer();
