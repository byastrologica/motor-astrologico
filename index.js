// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');

const sweph = require('sweph'); 

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const ephePath = path.join(__dirname, 'sweph_bin', 'ephe');
sweph.set_ephe_path(ephePath);

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

function calculateHousesWithSwetest(jd_ut, lat, lon) {
    return new Promise((resolve, reject) => {
        const swetestPath = path.join(__dirname, 'sweph_bin', 'swetest');
        
        // ======================================================
        // CORREÇÃO FINAL NO COMANDO
        // ======================================================
        // O argumento -edir precisa de um espaço antes do caminho
        const command = `${swetestPath} -edir ${ephePath} -p -h1 -ut${jd_ut} -geopos${lon},${lat},0 -eswe`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Erro ao executar swetest: ${stderr || error.message}`);
            }
            
            try {
                const lines = stdout.split('\n');
                let ascendant = null;
                let mc = null;
                
                const cusps = [];
                for (const line of lines) {
                    if (line.trim().match(/^house\s+\d+/)) {
                        cusps.push(parseFloat(line.split(/\s+/)[2]));
                    }
                }

                const ascLine = lines.find(line => line.trim().startsWith('Ascendant'));
                const mcLine = lines.find(line => line.trim().startsWith('MC'));

                if (ascLine) {
                    ascendant = parseFloat(ascLine.split(/\s+/)[1]);
                }
                if (mcLine) {
                    mc = parseFloat(mcLine.split(/\s+/)[1]);
                }

                if (ascendant !== null && mc !== null) {
                    resolve({ ascendant, mc, cusps });
                } else {
                    reject("Não foi possível extrair Ascendente/MC da saída do swetest. Saída recebida: " + stdout);
                }
            } catch (parseError) {
                reject(`Erro ao processar saída do swetest: ${parseError}`);
            }
        });
    });
}

async function buscarCidade(textoDigitado) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY; 
    if (!CHAVE_API) { throw new Error("Configuração do servidor incompleta."); }
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(textoDigitado)}&lang=pt&limit=5&type=city&format=json&apiKey=${CHAVE_API}`;
    try {
        const response = await axios.get(url);
        const dados = response.data;
        let resultadosLimpos = [];
        if (dados.results) {
            resultadosLimpos = dados.results.map(resultado => ({
                nome_formatado: resultado.formatted,
                latitude: resultado.lat,
                longitude: resultado.lon,
                fuso_horario: resultado.timezone.name
            }));
        }
        return resultadosLimpos;
    } catch (error) { throw new Error("Erro ao comunicar com o serviço de geolocalização."); }
}

// =================================================================
// ENDPOINTS DA API
// =================================================================
app.get('/api/cidades', async (req, res) => {
    const { busca } = req.query;
    if (!busca || busca.trim().length < 2) { return res.status(400).json({ error: 'Parâmetro "busca" é obrigatório e deve ter ao menos 2 caracteres.' }); }
    try {
        const resultados = await buscarCidade(busca);
        res.status(200).json(resultados);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, utcHour, latitude, longitude } = req.body;

        if (year == null || month == null || day == null || utcHour == null || latitude == null || longitude == null) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        const jd_ut_obj = await sweph.utc_to_jd(year, month, day, parseFloat(utcHour), 0, 0, 1);
        const julianDayUT = jd_ut_obj.data[0];

        const housesResult = await calculateHousesWithSwetest(julianDayUT, lat, lon);
        
        const calculatedHouses = {
            ascendant: housesResult.ascendant,
            mc: housesResult.mc,
            cusps: {
                1: housesResult.cusps[0], 2: housesResult.cusps[1], 3: housesResult.cusps[2],
                4: housesResult.cusps[3], 5: housesResult.cusps[4], 6: housesResult.cusps[5],
                7: housesResult.cusps[6], 8: housesResult.cusps[7], 9: housesResult.cusps[8],
                10: housesResult.cusps[9], 11: housesResult.cusps[10], 12: housesResult.cusps[11]
            }
        };

        const deltaT_obj = await sweph.deltat(julianDayUT);
        const julianDayET = julianDayUT + deltaT_obj.data;
        
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
            const position = await sweph.calc(julianDayET, planet.id, SEFLG_SPEED);
            calculatedPlanets[planet.name] = { longitude: position.data[0], latitude: position.data[1], speed: position.data[3] };
        }

        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 }, opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 }, square: { angle: 90, orb: 10 }, sextile: { angle: 60, orb: 6 }
        };

        const planetPoints = Object.keys(calculatedPlanets).map(name => ({ name: name, longitude: calculatedPlanets[name].longitude }));
        
        const foundAspects = [];
        for (let i = 0; i < planetPoints.length; i++) {
            for (let j = i + 1; j < planetPoints.length; j++) {
                const planet1 = planetPoints[i]; const planet2 = planetPoints[j];
                let distance = Math.abs(planet1.longitude - planet2.longitude);
                if (distance > 180) { distance = 360 - distance; }
                for (const aspectName in aspectsConfig) {
                    const aspect = aspectsConfig[aspectName];
                    const orb = Math.abs(distance - aspect.angle);
                    if (orb <= aspect.orb) { foundAspects.push({ point1: planet1.name, point2: planet2.name, aspect_type: aspectName, orb_degrees: parseFloat(orb.toFixed(2)) }); }
                }
            }
        }

        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            houses: calculatedHouses,
            planets: calculatedPlanets,
            aspects: foundAspects
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

// =================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =================================================================
app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar.');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
