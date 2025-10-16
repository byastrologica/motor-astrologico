// interpretationEngine.js

const axios = require('axios');

async function callGeminiAPI(prompt, apiKey) {
    if (!apiKey) { throw new Error("Chave de API do Gemini não configurada."); }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt.trim() }] }] };
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

module.exports = { generateFinalInterpretation };




const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Função para remover o BOM e outros caracteres não visíveis
function cleanKey(key) {
    if (!key) return '';
    // O caractere '\uFEFF' é o Byte Order Mark (BOM).
    return key.replace(/\uFEFF/g, '').trim();
}

function loadCsvToMap(filePath) {
    return new Promise((resolve, reject) => {
        const map = new Map();
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const keyColumn = row.id_unico || row.id_regente || row.id_signo || row.id_grau || row.id_frase;
                const valueColumn = row.texto_interpretacao || row.texto_influencia || row.texto_motivacao_interna || row.texto_simbolo || row.texto_conectivo || row.texto;

                if (keyColumn && valueColumn) {
                    const cleanKeyStr = cleanKey(String(keyColumn));
                    map.set(cleanKeyStr, String(valueColumn).trim());
                }
            })
            .on('end', () => {
                console.log(`Arquivo CSV carregado: ${path.basename(filePath)}`);
                resolve(map);
            })
            .on('error', (error) => {
                reject(`Erro ao ler o arquivo ${filePath}: ${error.message}`);
            });
    });
}

async function loadKnowledgeBase() {
    const kbPath = path.join(__dirname, 'knowledge_base');
    const knowledgeBase = {};
    try {
        const files = fs.readdirSync(kbPath).filter(file => file.endsWith('.csv'));
        for (const file of files) {
            const filePath = path.join(kbPath, file);
            const mapName = path.basename(file, '.csv');
            knowledgeBase[mapName] = await loadCsvToMap(filePath);
        }
        console.log("Base de Conhecimento carregada com sucesso.");
        return knowledgeBase;
    } catch (error) {
        console.warn(`AVISO: A pasta 'knowledge_base' não foi encontrada ou está vazia.`);
        return {};
    }
}

module.exports = { loadKnowledgeBase };

