// knowledge_base/knowledgeBase.js

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