// index.js (Versão atualizada — chama calculateCusps com julianDay)
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
const calculateCusps = require('./calculateCusps'); // versão corrigida

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Ajuste do caminho das efemérides (se você tiver ephe local)
sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

async function geocodeLocation(locationString) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY;
    if (!CHAVE_API) { throw new Error("Chave de API da Geoapify não configurada."); }
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(locationString)}&lang=pt&limit=1&format=json&apiKey=${CHAVE_API}`;
    const response = await axios.get(url);
    if (response.data.results && response.data.results.length > 0) {
        const r = response.data.results[0];
        return { latitude: r.lat, longitude: r.lon, timezone: r.timezone.name };
    }
    return null;
}

async function buscarCidade(textoDigitado) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY;
    if (!CHAVE_API) throw new Error("Configuração do servidor incompleta.");
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(textoDigitado)}&lang=pt&limit=5&type=city&format=json&apiKey=${CHAVE_API}`;
    const response = await axios.get(url);
    return response.data.results
      ? response.data.results.map(r => ({ nome_formatado: r.formatted, latitude: r.lat, longitude: r.lon, fuso_horario: r.timezone.name }))
      : [];
}

app.get('/api/cidades', async (req, res) => {
    const { busca } = req.query;
    if (!busca || busca.trim().length < 2) return res.status(400).json({ error: 'Parâmetro "busca" é obrigatório.' });
    try {
        const resultados = await buscarCidade(busca);
        res.json(resultados);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, hour, locationString, latitude, longitude, utcOffset } = req.body;
        if (year == null || month == null || day == null || hour == null || (!locationString && (latitude == null || longitude == null))) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }

        // latitude/longitude decimais
        let lat = null, lon = null, timezone = null;
        if (latitude != null && longitude != null) {
            lat = parseFloat(latitude);
            lon = parseFloat(longitude);
        } else {
            const geo = await geocodeLocation(locationString);
            if (!geo) return res.status(400).json({ error: `Coordenadas não encontradas para "${locationString}".` });
            lat = geo.latitude;
            lon = geo.longitude;
            timezone = geo.timezone;
        }

        // hora como decimal (ex: 8.58333)
        const hourFloat = parseFloat(hour);
        const hours = Math.floor(hourFloat);
        const minutes = Math.round((hourFloat - hours) * 60);

        // UTC instant (calculamos birthTimeUtc com moment)
        let birthTimeUtc;
        if (utcOffset != null) {
            const dateString = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:00`;
            birthTimeUtc = moment(dateString).utcOffset(utcOffset * 60, true).utc();
        } else {
            if (!timezone) timezone = moment.tz.guess(lat, lon);
            const birthLocal = moment.tz({ year, month: month - 1, day, hour: hours, minute: minutes }, timezone);
            birthTimeUtc = birthLocal.clone().utc();
        }

        // Julain Day UT via sweph
        const utcYear = birthTimeUtc.year();
        const utcMonth = birthTimeUtc.month() + 1;
        const utcDay = birthTimeUtc.date();
        const utcHourDec = birthTimeUtc.hour() + (birthTimeUtc.minute() / 60) + (birthTimeUtc.second() / 3600);

        const jdObj = await sweph.utc_to_jd(utcYear, utcMonth, utcDay, utcHourDec, 0, 0, 1);
        const julianDay = jdObj.data[0];

        // calcular planetas (mantive sua lógica)
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
            const pos = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: pos.data[0], latitude: pos.data[1], speed: pos.data[3] };
        }

        // aspect calc (mantive sua lógica original)
        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 }, opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 }, square: { angle: 90, orb: 10 },
            sextile: { angle: 60, orb: 6 }, quincunx: { angle: 150, orb: 3 }
        };
        const planetPoints = Object.keys(calculatedPlanets).map(name => ({ name, longitude: calculatedPlanets[name].longitude }));
        const foundAspects = [];
        for (let i = 0; i < planetPoints.length; i++) {
            for (let j = i + 1; j < planetPoints.length; j++) {
                let d = Math.abs(planetPoints[i].longitude - planetPoints[j].longitude);
                if (d > 180) d = 360 - d;
                for (const aName in aspectsConfig) {
                    const a = aspectsConfig[aName];
                    const orb = Math.abs(d - a.angle);
                    if (orb <= a.orb) foundAspects.push({ point1: planetPoints[i].name, point2: planetPoints[j].name, aspect_type: aName, orb_degrees: parseFloat(orb.toFixed(2)) });
                }
            }
        }

        const aspectPatterns = findAspectPatterns(foundAspects);
        const moonPhase = getMoonPhase(calculatedPlanets.sun.longitude, calculatedPlanets.moon.longitude);
        const sunSignInfo = getZodiacSign(calculatedPlanets.sun.longitude);
        const isDiurnal = ZODIAC_SIGNS.indexOf(sunSignInfo.name) < 6;
        const classicalPlanets = ['sun','moon','mercury','venus','mars','jupiter','saturn','north_node'];

        for (const pName in calculatedPlanets) {
            const p = calculatedPlanets[pName];
            const { name: signName, decimalDegrees } = getZodiacSign(p.longitude);
            p.sign = signName;
            p.degree_type = getDegreeType(signName, decimalDegrees);
            p.dwadasamsaSign = getDwadasamsaSign(signName, decimalDegrees);
            if (classicalPlanets.includes(pName)) p.dignities = getDignities(pName, signName, decimalDegrees, isDiurnal);
        }

        // ---> chamando calculateCusps com JULIAN DAY e coordenadas decimais
        const cuspsResult = calculateCusps({
            julianDay: julianDay,
            latitude: lat,   // decimal (ex: -23.55)
            longitude: lon,  // decimal (ex: -46.63)  (leste positivo)
            obliquity: 23.4365,
            houseSystem: 'P'
        });

        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            moon_phase: moonPhase,
            planets: calculatedPlanets,
            aspects: foundAspects,
            aspect_patterns: aspectPatterns,
            cusps: cuspsResult
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
