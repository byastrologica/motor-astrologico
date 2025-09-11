// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const moment = require('moment-timezone');

// Nossos Módulos de Cálculo
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED, ZODIAC_SIGNS
} = require('./constants');
const { getZodiacSign } = require('./mapper');
const { getDwadasamsaSign } = require('./getDwadasamsaSign');
const { getDignities } = require('./dignityCalculator');
const { findAspectPatterns } = require('./aspectPatternFinder');
const { getDegreeType } = require('./degreeClassifier');
const { getMoonPhase } = require('./moonPhaseCalculator');
const { generateFreeReportPrompt } = require('./reportBuilder'); // <<< NOVO

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// ... (suas funções geocodeLocation e buscarCidade) ...

app.get('/api/cidades', async (req, res) => { /* ... */ });

app.post('/calculate', async (req, res) => {
    try {
        // --- 1. CÁLCULO DOS DADOS BRUTOS ---
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        // ... (código de geocodificação e moment para obter lat, lon, e julianDay) ...
        const jd_ut_obj = await sweph.utc_to_jd(/*...*/);
        const julianDay = jd_ut_obj.data[0];

        const planetsToCalc = [ /* ... */ ];
        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: position.data[0], latitude: position.data[1], speed: position.data[3] };
        }
        
        // --- 2. ENRIQUECIMENTO DOS DADOS ---
        const aspectsConfig = { /* ... */ };
        const foundAspects = [];
        // ... (lógica de cálculo de aspetos) ...

        const enrichedData = {
            moon_phase: getMoonPhase(calculatedPlanets.sun.longitude, calculatedPlanets.moon.longitude),
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: findAspectPatterns(foundAspects)
        };
        
        const sunSignInfo = getZodiacSign(enrichedData.planets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node'];

        for (const planetName in enrichedData.planets) {
            const planet = enrichedData.planets[planetName];
            const { name: signName, decimalDegrees } = getZodiacSign(planet.longitude);
            planet.sign = signName;
            planet.degree_type = getDegreeType(signName, decimalDegrees);
            planet.dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
            if (classicalPlanets.includes(planetName)) {
                planet.dignities = getDignities(planetName, signName, decimalDegrees, isDiurnal);
            }
        }
        
        // --- 3. CONSTRUÇÃO DO PROMPT ---
        const prompt = generateFreeReportPrompt(enrichedData);

        // --- 4. CHAMADA À API DO GEMINI ---
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        const geminiResponse = await axios.post(apiUrl, payload);

        if (geminiResponse.data.candidates && geminiResponse.data.candidates[0].content.parts[0].text) {
            const finalInterpretation = geminiResponse.data.candidates[0].content.parts[0].text;
            res.status(200).json({
                message: "Análise astrológica gerada com sucesso!",
                interpretation: finalInterpretation
            });
        } else {
            throw new Error("A resposta da API do Gemini não continha o texto esperado.");
        }

    } catch (error) {
        console.error("Erro no processo de cálculo ou interpretação:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro interno ao gerar a análise.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor, incluindo geocodeLocation, buscarCidade e app.listen) ...
