// index.js (Versão com Balanço de Elementos/Modos)

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
const { findAspectPatterns } = require('./aspectPatternFinder');
const { getDegreeType } = require('./degreeClassifier');
const { getMoonPhase } = require('./moonPhaseCalculator');
const { generateTechnicalReport } = require('./technicalReportGenerator');
const { calculateAspects } = require('./aspectCalculator');
const { calculateBalances } = require('./balanceCalculator'); // <<< NOVO

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// ... (suas funções geocodeLocation e buscarCidade) ...

app.post('/calculate', async (req, res) => {
    try {
        // ... (lógica de cálculo do Julian Day) ...
        const julianDay = /*...*/;

        // ... (lógica de cálculo dos planetas) ...
        const calculatedPlanets = {};
        
        // ... (lógica de cálculo do Nodo Sul) ...
        calculatedPlanets.south_node = { /* ... */ };
        
        const foundAspects = calculateAspects(calculatedPlanets);

        // --- ATUALIZAÇÃO: Adiciona o cálculo de balanços ---
        const enrichedData = {
            moon_phase: getMoonPhase(calculatedPlanets.sun.longitude, calculatedPlanets.moon.longitude),
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: findAspectPatterns(foundAspects),
            balances: calculateBalances(calculatedPlanets) // <<< NOVO
        };
        
        const sunSignInfo = getZodiacSign(enrichedData.planets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node', 'south_node'];

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
        
        const technicalReport = generateTechnicalReport(enrichedData);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.status(200).send(technicalReport);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor, incluindo geocodeLocation, buscarCidade, app.get, app.listen) ...
