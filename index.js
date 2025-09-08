// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SEFLG_SPEED // <-- CORREÇÃO: SEFLG_SPEED adicionado de volta
} = require('./constants');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

// =================================================================
// BASE DE DADOS E FUNÇÕES DE ANÁLISE ASTROLÓGICA
// =================================================================

const ZODIAC_SIGNS = [
    'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
    'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

const DECANATE_RULERS = {
    ARIES: ['Marte', 'Sol', 'Júpiter'], LEAO: ['Sol', 'Júpiter', 'Marte'], SAGITARIO: ['Júpiter', 'Marte', 'Sol'],
    TOURO: ['Vênus', 'Mercúrio', 'Saturno'], VIRGEM: ['Mercúrio', 'Saturno', 'Vênus'], CAPRICORNIO: ['Saturno', 'Vênus', 'Mercúrio'],
    GEMEOS: ['Mercúrio', 'Vênus', 'Urano'], LIBRA: ['Vênus', 'Urano', 'Mercúrio'], AQUARIO: ['Urano', 'Mercúrio', 'Vênus'],
    CANCER: ['Lua', 'Plutão', 'Netuno'], ESCORPIAO: ['Plutão', 'Netuno', 'Lua'], PEIXES: ['Netuno', 'Lua', 'Plutão']
};

const SABIAN_SYMBOLS = {
    ARIES: { 13: "Uma bomba que não explodiu revela que a sociedade está a salvo." },
    CAPRICORNIO: { 14: "Um antigo baixo-relevo esculpido em granito permanece como testemunha de uma longa cultura esquecida." }
    // NOTA: A base completa dos 360 símbolos seria adicionada aqui.
};

function getZodiacPosition(longitude) {
    const signIndex = Math.floor(longitude / 30);
    const degreeWithinSign = longitude % 30;
    return {
        sign: ZODIAC_SIGNS[signIndex],
        degree: Math.floor(degreeWithinSign),
        fullDegree: degreeWithinSign
    };
}

function analyzePlanet(planet, allPlanets, allAspects) {
    const { name, longitude } = planet;
    const { sign, degree, fullDegree } = getZodiacPosition(longitude);

    const decanateIndex = Math.floor(degree / 10);
    const decanateRuler = DECANATE_RULERS[sign.toUpperCase().replace('Ê', 'E').replace('Ô', 'O')][decanateIndex]; // Normaliza para a busca

    const dwadIndex = Math.floor(fullDegree / 2.5);
    const dwadSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(sign) + dwadIndex) % 12];

    const aspects = allAspects
        .filter(aspect => aspect.point1 === name || aspect.point2 === name)
        .map(aspect => {
            const otherPlanetName = aspect.point1 === name ? aspect.point2 : aspect.point1;
            const otherPlanetSign = getZodiacPosition(allPlanets[otherPlanetName].longitude).sign;
            return `${aspect.aspect_type.charAt(0).toUpperCase() + aspect.aspect_type.slice(1)} com ${otherPlanetName} em ${otherPlanetSign}`;
        });

    let degreeNote = null;
    const sabianDegree = degree + 1;
    if (sabianDegree === 30) degreeNote = "Este planeta está no grau anarético (29 graus).";
    else if ([1, 13, 26].includes(sabianDegree)) degreeNote = "Note que este planeta se encontra em um grau crítico.";

    const sabianSymbol = (SABIAN_SYMBOLS[sign.toUpperCase().replace('Ê', 'E').replace('Ô', 'O')] && SABIAN_SYMBOLS[sign.toUpperCase().replace('Ê', 'E').replace('Ô', 'O')][sabianDegree]) 
        ? SABIAN_SYMBOLS[sign.toUpperCase().replace('Ê', 'E').replace('Ô', 'O')][sabianDegree]
        : `Imagem simbólica para o grau ${sabianDegree} de ${sign}.`;

    return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        sign,
        decanate: `${decanateIndex + 1}º decanato, sub-regido por ${decanateRuler}`,
        dwad: dwadSign,
        aspects: aspects,
        sabianSymbol: sabianSymbol,
        degreeNote: degreeNote
    };
}

// =================================================================
// MOTOR DE INTERPRETAÇÃO COM GEMINI
// =================================================================
async function getGeminiInterpretation(analysisData) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    let prompt = `
    Atue como um astrólogo especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser focada em autoconhecimento, não ser fatalista e ter um tom empoderador.
    Gere uma interpretação psicológica detalhada e coesa para o mapa astral a seguir, tecendo todas as informações de cada planeta em uma narrativa fluida. Inicie com uma introdução geral sobre as energias principais do mapa e depois analise cada planeta individualmente.

    **DADOS COMPLETOS DO MAPA ASTRAL:**
    `;

    analysisData.forEach(planet => {
        prompt += `
        \n---
        **Planeta: ${planet.name} em ${planet.sign}**
        - **Posicionamento Detalhado:** ${planet.decanate}, com a dwadasamsa em ${planet.dwad}.
        - **Dinâmicas Internas (Aspectos):** ${planet.aspects.join(', ') || 'Nenhum aspecto maior.'}
        - **Imagem Arquetípica (Símbolo Sabiano):** "${planet.sabianSymbol}".
        ${planet.degreeNote ? `- **Nota Adicional:** ${planet.degreeNote}` : ''}
        `;
    });

    const payload = { contents: [{ "parts": [{ "text": prompt.trim() }] }] };

    try {
        const response = await axios.post(apiUrl, payload);
        if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return "A interpretação não pôde ser gerada.";
    } catch (error) {
        console.error("================ ERRO DETALHADO DO GEMINI ================");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }
        console.error("==========================================================");
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

        const analysisData = planetPoints.map(p => analyzePlanet(p, calculatedPlanets, foundAspects));
        
        const interpretation = await getGeminiInterpretation(analysisData);

        const responseData = {
            message: "Relatório astrológico completo gerado com sucesso!",
            interpretation: interpretation
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
