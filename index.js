// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const NodeGeocoder = require('node-geocoder');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Configura o caminho para os arquivos de efemérides da Swiss Ephemeris
sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// Configura o provedor de Geocoding (com User-Agent para seguir a política do OSM)
const geocoder = NodeGeocoder({
  provider: 'openstreetmap',
  userAgent: 'Motor Astrologico byAstrologica/1.0'
});

// =================================================================
// ROTA DE AUTOCOMPLETE DE CIDADES (NOVO)
// =================================================================

// Função auxiliar para chamar a API da Geoapify
async function buscarCidade(textoDigitado) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY; 
    
    if (!CHAVE_API) {
        console.error("Chave de API da Geoapify não encontrada.");
        throw new Error("Configuração do servidor incompleta.");
    }

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
    } catch (error) {
        console.error("Erro ao buscar cidade na Geoapify:", error.response ? error.response.data : error.message);
        throw new Error("Erro ao comunicar com o serviço de geolocalização.");
    }
}

// Endpoint GET para o frontend consumir
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


// =================================================================
// ROTA PRINCIPAL DE CÁLCULO DO MAPA (ATUALIZADO)
// =================================================================
app.post('/calculate', async (req, res) => {
    try {
        const { year, month, day, hour, locationString } = req.body;

        if (year == null || month == null || day == null || hour == null || !locationString) {
            return res.status(400).json({ error: 'Dados de entrada incompletos. São necessários: year, month, day, hour, locationString.' });
        }

        // Geocodificação do local
        const geoResult = await geocoder.geocode(locationString);
        if (!geoResult || geoResult.length === 0) {
            return res.status(400).json({ error: `Localização "${locationString}" não encontrada.` });
        }
        const lat = geoResult[0].latitude;
        const lon = geoResult[0].longitude;
        
        // Início do cálculo astrológico
        const jd_ut_obj = await sweph.utc_to_jd(year, month, day, hour, 0, 0, 1);
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
            calculatedPlanets[planet.name] = {
                longitude: position.data[0],
                latitude: position.data[1],
                speed: position.data[3]
            };
        }

        const aspectsConfig = {
            conjunction: { angle: 0, orb: 10 },
            opposition: { angle: 180, orb: 10 },
            trine: { angle: 120, orb: 10 },
            square: { angle: 90, orb: 10 },
            sextile: { angle: 60, orb: 6 }
        };

        const planetPoints = Object.keys(calculatedPlanets).map(name => ({
            name: name,
            longitude: calculatedPlanets[name].longitude
        }));
        
        const foundAspects = [];
        for (let i = 0; i < planetPoints.length; i++) {
            for (let j = i + 1; j < planetPoints.length; j++) {
                const planet1 = planetPoints[i];
                const planet2 = planetPoints[j];

                let distance = Math.abs(planet1.longitude - planet2.longitude);
                if (distance > 180) {
                    distance = 360 - distance;
                }

                for (const aspectName in aspectsConfig) {
                    const aspect = aspectsConfig[aspectName];
                    const orb = Math.abs(distance - aspect.angle);

                    if (orb <= aspect.orb) {
                        foundAspects.push({
                            point1: planet1.name,
                            point2: planet2.name,
                            aspect_type: aspectName,
                            orb_degrees: parseFloat(orb.toFixed(2))
                        });
                    }
                }
            }
        }

        const responseData = {
            message: "Cálculo planetário e de aspectos realizado com sucesso!",
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
// ROTA PADRÃO E INICIALIZAÇÃO DO SERVIDOR
// =================================================================
app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar. Use o endpoint POST /calculate para cálculos e GET /api/cidades para autocomplete.');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
