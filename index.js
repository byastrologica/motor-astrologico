// index.js (Versão Final com Nodo Sul)

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

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// ... (suas funções geocodeLocation e buscarCidade) ...

app.get('/api/cidades', async (req, res) => { /* ... */ });

app.post('/calculate', async (req, res) => {
    try {
        // ... (lógica de validação e cálculo do Julian Day) ...
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        // ... (código de geocodificação e moment) ...
        const jd_ut_obj = await sweph.utc_to_jd(/*...*/);
        const julianDay = jd_ut_obj.data[0];

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
        
        // --- NOVO: CÁLCULO EXPLÍCITO DO NODO SUL ---
        const northNodeLon = calculatedPlanets.north_node.longitude;
        const southNodeLon = (northNodeLon + 180) % 360;
        calculatedPlanets.south_node = {
            longitude: southNodeLon,
            latitude: -calculatedPlanets.north_node.latitude,
            speed: calculatedPlanets.north_node.speed
        };
        
        const aspectsConfig = { /* ... */ };
        const planetPoints = Object.keys(calculatedPlanets).map(name => ({ name: name, longitude: calculatedPlanets[name].longitude }));
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
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor) ...
