const axios = require('axios');

function getText(kbMap, id) {
    // Adiciona uma verificação para garantir que o mapa existe
    return kbMap && kbMap.has(id) ? kbMap.get(id) : '';
}

async function generateFinalReport(mappedData, KB) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    let rawTexts = "";
    mappedData.forEach(planetData => {
        rawTexts += `**Para o planeta ${planetData.planetName}:**\n`;
        // CORREÇÃO: Usa os nomes de arquivo corretos (ex: KB.PlanetasEmSigno)
        rawTexts += `- **No signo:** ${getText(KB.PlanetasEmSigno, planetData.planetSignId)}\n`;
        planetData.aspectIds.forEach(aspectId => {
            rawTexts += `- **Em aspecto:** ${getText(KB.Aspectos, aspectId)}\n`;
        });
        rawTexts += `- **Símbolo Sabiano:** ${getText(KB.SimbolosSabianos, planetData.sabianSymbolId)}\n\n`;
    });

    const prompt = `
    Atue como um astrólogo especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser focada em autoconhecimento, não ser fatalista e ter um tom empoderador.
    
    A seguir estão blocos de texto que representam interpretações astrológicas isoladas para um mapa astral. Sua tarefa é atuar como um editor final: reescreva e costure esses blocos em uma narrativa fluida, coesa e unificada. Adicione uma introdução geral, uma conclusão e sugestões práticas para o desenvolvimento pessoal ao longo do texto. Não apenas liste os textos, transforme-os em um relatório completo e inspirador.

    **TEXTOS BASE PARA A ANÁLISE:**
    ${rawTexts}
    `;

    const payload = { contents: [{ "parts": [{ "text": prompt.trim() }] }] };

    try {
        const response = await axios.post(apiUrl, payload);
        if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return "A interpretação final não pôde ser gerada.";
    } catch (error) {
        console.error("Erro na chamada final ao Gemini:", error.response ? error.response.data : error.message);
        throw new Error("Falha na comunicação com o serviço de interpretação final.");
    }
}

module.exports = { generateFinalReport };
