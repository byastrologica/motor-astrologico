// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const moment = require('moment-timezone');
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

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

// Função para traduzir longitude em signo, grau e minuto
function getZodiacPosition(longitude) {
    const SIGNS = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];
    const signIndex = Math.floor(longitude / 30);
    const degree = Math.floor(longitude % 30);
    const minute = Math.floor(((longitude % 30) - degree) * 60);
    return `${degree}° ${SIGNS[signIndex]} ${String(minute).padStart(2, '0')}'`;
}

// Nova função para chamar a API do Gemini
async function getGeminiInterpretation(natalChartData) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        throw new Error("Chave de API do Gemini não configurada.");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    let prompt = `Aja como um astrólogo profissional e experiente. Sua linguagem deve ser inspiradora, clara e profunda, mas acessível, como se estivesse conversando com um cliente.
    
    A seguir estão os dados de um mapa astral. Sua tarefa é escrever uma interpretação fluida e coesa sobre as energias centrais do mapa: o Sol, a Lua e os aspectos que eles formam. Não liste os dados, crie um texto narrativo que conecte as informações de forma natural.
    
    **Dados do Mapa:**\n`;

    for (const planetName in natalChartData.planets) {
        const planet = natalChartData.planets[planetName];
        prompt += `- ${planetName.charAt(0).toUpperCase() + planetName.slice(1)}: ${getZodiacPosition(planet.longitude)}\n`;
    }

    prompt += "\n**Aspectos Principais:**\n";
    natalChartData.aspects.forEach(aspect => {
        prompt += `- ${aspect.point1} ${aspect.aspect_type} ${aspect.point2}\n`;
    });

    const payload = {
        contents: [{ "parts": [{ "text": prompt }] }]
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        } else {
            return "A interpretação não pôde ser gerada no momento.";
        }
    } catch (error) {
        console.error("Erro ao chamar a API do Gemini:", error.response ? error.response.data : error.message);
        throw new Error("Falha na comunicação com o serviço de interpretação.");
    }
}

// =================================================================
// ENDPOINT PRINCIPAL DA API
// =================================================================
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
            { id: SE_TRUE_NODE, name: 'north_node' }
        ];

        const calculatedPlanets = {};
        for (const planet of planetsToCalc) {
            const position = await sweph.calc_ut(julianDay, planet.id, SEFLG_SPEED);
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

        // Chama o Gemini para gerar a interpretação
        const interpretationText = await getGeminiInterpretation({
            planets: calculatedPlanets,
            aspects: foundAspects
        });

        const responseData = {
            message: "Cálculo e interpretação realizados com sucesso!",
            planets: calculatedPlanets,
            aspects: foundAspects,
            interpretation: interpretationText // <-- A INTERPRETAÇÃO DO GEMINI AQUI
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
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
