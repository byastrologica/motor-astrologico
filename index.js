// index.js (Versão Final com Padrões de Aspetos)

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
const { findAspectPatterns } = require('./aspectPatternFinder'); // <<< NOVO

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// ... (suas funções geocodeLocation e buscarCidade vão aqui) ...

app.get('/api/cidades', async (req, res) => { /* ... */ });

app.post('/calculate', async (req, res) => {
    try {
        // ... (toda a sua lógica inicial de cálculo do Julian Day vai aqui) ...

        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        // ... (código de validação e geocodificação) ...
        const jd_ut_obj = await sweph.utc_to_jd(/*...*/);
        const julianDay = jd_ut_obj.data[0];

        const planetsToCalc = [ /* ... */ ];
        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: position.data[0], latitude: position.data[1], speed: position.data[3] };
        }
        
        // --- CÁLCULO DE ASPETOS ATUALIZADO ---
        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 }, opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 }, square: { angle: 90, orb: 10 },
            sextile: { angle: 60, orb: 6 },
            quincunx: { angle: 150, orb: 3 } // Quincunce adicionado
        };
        const planetPoints = Object.keys(calculatedPlanets).map(name => ({ name: name, longitude: calculatedPlanets[name].longitude }));
        const foundAspects = [];
        for (let i = 0; i < planetPoints.length; i++) {
            for (let j = i + 1; j < planetPoints.length; j++) {
                const p1 = planetPoints[i]; const p2 = planetPoints[j];
                let dist = Math.abs(p1.longitude - p2.longitude);
                if (dist > 180) dist = 360 - dist;
                for (const aspectName in aspectsConfig) {
                    const aspect = aspectsConfig[aspectName];
                    const orb = Math.abs(dist - aspect.angle);
                    if (orb <= aspect.orb) {
                        foundAspects.push({ point1: p1.name, point2: p2.name, aspect_type: aspectName, orb_degrees: parseFloat(orb.toFixed(2)) });
                    }
                }
            }
        }

        // --- NOVO: ENCONTRA PADRÕES DE ASPETOS ---
        const aspectPatterns = findAspectPatterns(foundAspects);

        const sunSignInfo = getZodiacSign(calculatedPlanets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node'];

        for (const planetName in calculatedPlanets) {
            // ... (sua lógica de enriquecimento de planetas com signo, dwadasamsa e dignidades vai aqui) ...
        }

        // --- RESPOSTA FINAL ATUALIZADA ---
        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: aspectPatterns // <<< CAMPO ADICIONADO
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor) ...
