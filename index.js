// index.js

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

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

async function geocodeLocation(locationString) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY;
    if (!CHAVE_API) { throw new Error("Chave de API da Geoapify não configurada."); }
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationString)}&lang=pt&limit=1&format=json&apiKey=${CHAVE_API}`;
    try {
        const response = await axios.get(url);
        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            return { latitude: result.lat, longitude: result.lon, timezone: result.timezone.name };
        }
        return null;
    } catch (error) {
        console.error("Erro ao geocodificar localização:", error.message);
        throw new Error("Erro ao comunicar com o serviço de geocodificação.");
    }
}
async function buscarCidade(textoDigitado) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY;
    if (!CHAVE_API) { throw new Error("Configuração do servidor incompleta."); }
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(textoDigitado)}&lang=pt&limit=5&type=city&format=json&apiKey=${CHAVE_API}`;
    try {
        const response = await axios.get(url);
        const resultadosLimpos = response.data.results ? response.data.results.map(r => ({
            nome_formatado: r.formatted, latitude: r.lat, longitude: r.lon, fuso_horario: r.timezone.name
        })) : [];
        return resultadosLimpos;
    } catch (error) { throw new Error("Erro ao comunicar com o serviço de geolocalização."); }
}

app.get('/api/cidades', async (req, res) => {
    const { busca } = req.query;
    if (!busca || busca.trim().length < 2) {
        return res.status(400).json({ error: 'Parâmetro "busca" é obrigatório e deve ter ao menos 2 caracteres.' });
    }
    try {
        const resultados = await buscarCidade(busca);
        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        if (year == null || month == null || day == null || hour == null || (!locationString && (latitude == null || longitude == null))) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }
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
        
        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 }, opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 }, square: { angle: 90, orb: 10 },
            sextile: { angle: 60, orb: 6 },
            quincunx: { angle: 150, orb: 3 }
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

        const aspectPatterns = findAspectPatterns(foundAspects);
        const moonPhase = getMoonPhase(calculatedPlanets.sun.longitude, calculatedPlanets.moon.longitude);
        const sunSignInfo = getZodiacSign(calculatedPlanets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node'];

        for (const planetName in calculatedPlanets) {
            const planet = calculatedPlanets[planetName];
            const { name: signName, decimalDegrees } = getZodiacSign(planet.longitude);
            planet.sign = signName;
            planet.degree_type = getDegreeType(signName, decimalDegrees);
            planet.dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
            
            if (classicalPlanets.includes(planetName)) {
                planet.dignities = getDignities(planetName, signName, decimalDegrees, isDiurnal);
            }
        }

        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            moon_phase: moonPhase,
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: aspectPatterns
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar.');
});
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
