const express = require('express');
const sweph = require('sweph');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Configura o caminho para os arquivos de efemérides que vêm com o pacote
sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// A rota principal da nossa API
app.post('/calculate', async (req, res) => {
    try {
        console.log("Recebi uma requisição:", req.body);
        const { year, month, day, hour, lat, lon } = req.body;

        if (!year || !month || !day || !hour || !lat || !lon) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }

        // --- 1. CÁLCULO DO DIA JULIANO ---
        const jd_ut_obj = await sweph.utc_to_jd(year, month, day, hour, 0, 0, 1); // 1 = Calendário Gregoriano
        const julianDay = jd_ut_obj.julianDayUT;

        // --- 2. CÁLCULO DAS CASAS (PLACIDUS) ---
        const houses = await sweph.houses(julianDay, lat, lon, 'P'); // 'P' para Placidus

        // --- 3. CÁLCULO DOS PLANETAS E PONTOS ---
        const planetsToCalc = [
            { id: sweph.SE_SUN, name: 'sun' },
            { id: sweph.SE_MOON, name: 'moon' },
            { id: sweph.SE_MERCURY, name: 'mercury' },
            { id: sweph.SE_VENUS, name: 'venus' },
            { id: sweph.SE_MARS, name: 'mars' },
            { id: sweph.SE_JUPITER, name: 'jupiter' },
            { id: sweph.SE_SATURN, name: 'saturn' },
            { id: sweph.SE_URANUS, name: 'uranus' },
            { id: sweph.SE_NEPTUNE, name: 'neptune' },
            { id: sweph.SE_PLUTO, name: 'pluto' },
            { id: sweph.SE_TRUE_NODE, name: 'north_node' },
            { id: sweph.SE_CHIRON, name: 'chiron' }
        ];

        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, sweph.SEFLG_SPEED);
            calculatedPlanets[planet.name] = {
                longitude: position.longitude,
                latitude: position.latitude,
                speed: position.longitude_speed
            };
        }

        // --- 4. MONTAR A RESPOSTA FINAL ---
        const responseData = {
            message: "Cálculo de planetas e casas realizado com sucesso!",
            julianDay: julianDay,
            planets: calculatedPlanets,
            houses: {
                ascendant: houses.ascendant,
                mc: houses.mc,
                cusps: houses.house_cusps
            }
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

// Rota de teste para a página inicial
app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar. Use o endpoint POST /calculate para fazer os cálculos.');
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
