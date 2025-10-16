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
const { generateTechnicalReport } = require('./technicalReportGenerator');
const { calculateAspects } = require('./aspectCalculator');
const { calculateBalances } = require('./balanceCalculator');
// --- NOVA IMPORTAÇÃO ---
const { calculateChiron } = require('./chironCalculator');

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

        // --- CÁLCULO DE QUÍRON ---
        const chironData = await calculateChiron(julianDay);
        if (chironData) {
            calculatedPlanets.chiron = chironData;
        }

        const northNodeLon = calculatedPlanets.north_node.longitude;
        const southNodeLon = (northNodeLon + 180) % 360;
        calculatedPlanets.south_node = {
            longitude: southNodeLon,
            latitude: -calculatedPlanets.north_node.latitude,
            speed: calculatedPlanets.north_node.speed
        };
        const foundAspects = calculateAspects(calculatedPlanets);
        for (const planetName in calculatedPlanets) {
            const planet = calculatedPlanets[planetName];
            const { name: signName } = getZodiacSign(planet.longitude);
            planet.sign = signName;
        }
        const enrichedData = {
            moon_phase: getMoonPhase(calculatedPlanets.sun.longitude, calculatedPlanets.moon.longitude),
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: findAspectPatterns(foundAspects),
            balances: calculateBalances(calculatedPlanets)
        };
        const sunSignInfo = getZodiacSign(enrichedData.planets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'north_node', 'south_node'];
        for (const planetName in enrichedData.planets) {
            const planet = enrichedData.planets[planetName];
            const { decimalDegrees } = getZodiacSign(planet.longitude);
            planet.degree_type = getDegreeType(planet.sign, decimalDegrees);
            planet.dwadasamsaSign = getDwadasamsaSign(planet.sign, decimalDegrees);
            if (classicalPlanets.includes(planetName)) {
                planet.dignities = getDignities(planetName, planet.sign, decimalDegrees, isDiurnal);
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

app.get('/', (req, res) => { res.send('Servidor astrológico no ar.'); });
app.listen(PORT, () => { console.log(`Servidor rodando na porta ${PORT}`); });