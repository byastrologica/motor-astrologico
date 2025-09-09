const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

function loadCsvToMap(filePath) {
    return new Promise((resolve, reject) => {
        const map = new Map();
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Lógica robusta para encontrar a chave e o valor
                const key = row.id_unico || row.id_regente || row.id_signo || row.id_grau || row.id_frase;
                const value = row.texto_interpretacao || row.texto_influencia || row.texto_motivacao_interna || row.texto_simbolo || row.texto_conectivo;

                if (key && value) {
                    map.set(String(key).trim(), String(value).trim());
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
            // Usa o nome do arquivo (sem .csv) como a chave no objeto KB
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
