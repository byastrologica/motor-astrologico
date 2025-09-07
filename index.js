// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process'); // Módulo nativo para executar comandos
const path = require('path');
const axios = require('axios');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');

// A biblioteca 'sweph' NÃO é mais usada para o cálculo das casas
const sweph = require('sweph'); 

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Configura o caminho para os arquivos de efemérides (ainda usado pelos planetas)
const ephePath = path.join(__dirname, 'sweph_bin', 'ephe');
sweph.set_ephe_path(ephePath);

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

// Função para executar o programa de linha de comando da Swiss Ephemeris
function calculateHousesWithSwetest(jd_ut, lat, lon) {
    return new Promise((resolve, reject) => {
        // Caminho para o executável e para os arquivos de efemérides
        const swetestPath = path.join(__dirname, 'sweph_bin', 'swetest');
        const ephePathArg = `-edir${ephePath}`;

        // Monta o comando a ser executado
        const command = `${swetestPath} ${ephePathArg} -p -h1 -ut${jd_ut} -geopos${lon},${lat},0`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Erro ao executar swetest: ${stderr}`);
            }
            
            // Extrai o Ascendente e o MC da saída de texto
            const lines = stdout.split('\n');
            let ascendant = null;
            let mc = null;
            
            const ascLine = lines.find(line => line.trim().startsWith('Ascendant'));
            const mcLine = lines.find(line => line.trim().startsWith('MC'));

            if (ascLine) {
                ascendant = parseFloat(ascLine.split(/\s+/)[1]);
            }
            if (mcLine) {
                mc = parseFloat(mcLine.split(/\s+/)[1]);
            }

            if (ascendant !== null && mc !== null) {
                // Para manter a consistência com o formato anterior, retornamos um objeto similar
                resolve({ data: { points: [ascendant, mc, 0, 0, 0, 0, 0, 0], houses: [] } }); // Houses não é o foco aqui
            } else {
                reject("Não foi possível extrair Ascendente/MC da saída do swetest.");
            }
        });
    });
}

async function buscarCidade(textoDigitado) {
    // ... (função sem alterações)
}

// =================================================================
// ENDPOINTS DA API
// =================================================================
app.get('/api/cidades', async (req, res) => {
    // ... (endpoint sem alterações)
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

        // ======================================================
        // NOVO MÉTODO DE CÁLCULO PARA CASAS E ÂNGULOS
        // ======================================================
        const housesResult = await calculateHousesWithSwetest(julianDayUT, lat, lon);

        if (!housesResult || !housesResult.data || !housesResult.data.points) {
            throw new Error("Não foi possível calcular as casas astrológicas via swetest.");
        }
        
        const calculatedHouses = {
            ascendant: housesResult.data.points[0],
            mc: housesResult.data.points[1],
            cusps: {} // Simplificado, pois o foco é a precisão dos ângulos
        };

        // O cálculo dos planetas continua o mesmo, pois já estava preciso
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

        // ... (cálculo de aspectos permanece o mesmo)

        const responseData = {
            message: "Cálculo completo do mapa astral realizado com sucesso!",
            houses: calculatedHouses,
            planets: calculatedPlanets,
            aspects: [] // Simplificado por brevidade
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
