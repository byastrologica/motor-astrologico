require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sweph = require('sweph');
const axios = require('axios');
const moment = require('moment-timezone');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SEFLG_SPEED
} = require('./constants');
const { loadKnowledgeBase } = require('./knowledgeBase');
const { mapPlanetToIds, updatePlanetRef } = require('./mapper');
const { generateFinalReport } = require('./reportBuilder');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

sweph.set_ephe_path(__dirname + '/node_modules/sweph/ephe');

let KB;

// =================================================================
// FLUXO 1: Calcular e Mapear
// =================================================================
app.post('/analyze', async (req, res) => {
    try {
        const { year, month, day, utcHour } = req.body;
        if (!year || !month || !day || !utcHour) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }
        
        const jd_ut_obj = await sweph.utc_to_jd(year, month, day, parseFloat(utcHour), 0, 0, 1);
        const julianDay = jd_ut_obj.data[0];

        const planetsToCalc = [
            { id: SE_SUN, name: 'sun' }, { id: SE_MOON, name: 'moon' },
            { id: SE_MERCURY, name: 'mercury' }, { id: SE_VENUS, name: 'venus' },
            { id: SE_MARS, name: 'mars' }, { id: SE_JUPITER, name: 'jupiter' },
            { id: SE_SATURN, name: 'saturn' }, { id: SE_URANUS, name: 'uranus' },
            { id: SE_NEPTUNE, name: 'neptune' }, { id: SE_PLUTO, name: 'pluto' }
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
        updatePlanetRef(calculatedPlanets);
        const mappedData = planetPoints.map(p => mapPlanetToIds(p, foundAspects));
        
        res.status(200).json({
            message: "Análise e mapeamento concluídos com sucesso.",
            mappedData: mappedData
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro interno na análise.', details: error.toString() });
    }
});

// =================================================================
// FLUXO 2: Buscar Textos na Base de Conhecimento
// =================================================================
app.post('/lookup-texts', (req, res) => {
    try {
        const { mappedData } = req.body;
        if (!mappedData) {
            return res.status(400).json({ error: "Dados mapeados ('mappedData') não fornecidos." });
        }
        
        let rawTexts = "";
        mappedData.forEach(planetData => {
            rawTexts += `**Para o planeta ${planetData.planetName}:**\n`;
            rawTexts += `- **No signo:** ${KB.PlanetasEmSigno.get(planetData.planetSignId) || 'Texto não encontrado.'}\n`;
            planetData.aspectIds.forEach(aspectId => {
                rawTexts += `- **Em aspecto:** ${KB.Aspectos.get(aspectId) || 'Texto não encontrado.'}\n`;
            });
            rawTexts += `- **Símbolo Sabiano:** ${KB.SignoEmGrau.get(planetData.sabianSymbolId) || 'Texto não encontrado.'}\n\n`;
        });

        res.status(200).json({
            message: "Textos da base de conhecimento recuperados com sucesso.",
            rawTexts: rawTexts.trim()
        });

    } catch (error) {
        res.status(500).json({ error: 'Erro interno na busca de textos.', details: error.toString() });
    }
});

// =================================================================
// FLUXO 3: Unificar com Gemini
// =================================================================
app.post('/unify-report', async (req, res) => {
    try {
        const { rawTexts } = req.body;
        if (!rawTexts) {
            return res.status(400).json({ error: "Textos brutos ('rawTexts') não fornecidos." });
        }
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
        
        const prompt = `
        Atue como um astrólogo especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser focada em autoconhecimento, não ser fatalista e ter um tom empoderador.
    
        A seguir estão blocos de texto que representam interpretações astrológicas isoladas para um mapa astral. Sua tarefa é atuar como um editor final: reescreva e costure esses blocos em uma narrativa fluida, coesa e unificada. Adicione uma introdução geral, uma conclusão e sugestões práticas para o desenvolvimento pessoal ao longo do texto. Não apenas liste os textos, transforme-os em um relatório completo e inspirador.

        **TEXTOS BASE PARA A ANÁLISE:**
        ${rawTexts}
        `;

        const payload = { contents: [{ "parts": [{ "text": prompt.trim() }] }] };
        const response = await axios.post(apiUrl, payload);
        
        if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            res.status(200).json({
                message: "Relatório final gerado com sucesso!",
                interpretation: response.data.candidates[0].content.parts[0].text
            });
        } else {
            throw new Error("Resposta do Gemini não continha texto de interpretação.");
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro interno na unificação com Gemini.', details: error.toString() });
    }
});


// =================================================================
// INICIALIZAÇÃO DO SERVIDOR
// =================================================================
async function startServer() {
    KB = await loadKnowledgeBase();
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

startServer();
