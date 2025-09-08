require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');
const { analyzePlanet } = require('./astrologyEngine');
const { generateInterpretation } = require('./geminiInterpreter');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, utcHour, latitude, longitude } = req.body;

        if (year == null || month == null || day == null || utcHour == null || latitude == null || longitude == null) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }
        
        const jd_ut_obj = await sweph.utc_to_jd(year, month, day, parseFloat(utcHour), 0, 0, 1);
        const julianDay = jd_ut_obj.data[0];

        const planetsToCalc = [
            { id: SE_SUN, name: 'sun' }, { id: SE_MOON, name: 'moon' },
            { id: SE_MERCURY, name: 'mercury' }, { id: SE_VENUS, name: 'venus' },
            { id: SE_MARS, name: 'mars' }, { id: SE_JUPITER, name: 'jupiter' },
            { id: SE_SATURN, name: 'saturn' }, { id: SE_URANUS, name: 'uranus' },
            { id: SE_NEPTUNE, name: 'neptune' }, { id: SE_PLUTO, name: 'pluto' },
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

        // Analisa cada planeta para obter os dados para o prompt
        const analysisData = planetPoints.map(p => analyzePlanet(p, calculatedPlanets, foundAspects));

        // Gera as interpretações para cada planeta em paralelo
        const interpretationPromises = analysisData.map(data => generateInterpretation(data));
        const interpretations = await Promise.all(interpretationPromises);

        // Monta o relatório final
        const fullReport = {};
        analysisData.forEach((data, index) => {
            fullReport[data.name.toLowerCase()] = interpretations[index];
        });

        const responseData = {
            message: "Relatório astrológico completo gerado com sucesso!",
            report: fullReport
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
