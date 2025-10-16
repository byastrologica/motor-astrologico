// interpretationEngine.js

const axios = require('axios');

async function callGeminiAPI(prompt, apiKey) {
    if (!apiKey) {
        throw new Error("Chave de API do Gemini não configurada.");
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [{
                text: prompt.trim()
            }]
        }]
    };

    try {
        const response = await axios.post(apiUrl, payload);
        if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return `(A interpretação para esta secção não pôde ser gerada.)`;
    } catch (error) {
        console.error("Erro na chamada ao Gemini:", error.response ? error.response.data : error.message);
        return `(Ocorreu um erro ao gerar a interpretação: ${error.message})`;
    }
}

async function generateFinalInterpretation(technicalReport) {
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `
Atue como uma astróloga especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser fluida, empoderadora, focada na jornada interior e não ser fatalista.

Com base no resumo técnico astrológico completo abaixo, escreva uma interpretação integrada e coesa. Não apenas repita os dados, mas teça-os numa narrativa psicológica profunda sobre as forças, potenciais, desafios e a história da alma da pessoa.

**RESUMO TÉCNICO COMPLETO DO MAPA:**
${technicalReport}
`;
    return await callGeminiAPI(prompt, apiKey);
}

// Unificamos as exportações em um único objeto
module.exports = {
    generateFinalInterpretation
};