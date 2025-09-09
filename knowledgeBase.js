const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function loadCsvToMap(filePath) {
    return new Promise((resolve, reject) => {
        const map = new Map();
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.id_unico && row.texto) {
                    map.set(row.id_unico.trim(), row.texto.trim());
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
