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
                console.log(`[DIAGNÓSTICO] Sucesso ao carregar: ${path.basename(filePath)}`);
                resolve(map);
            })
            .on('error', (error) => {
                console.error(`[DIAGNÓSTICO] Erro ao ler o arquivo CSV ${filePath}:`, error);
                reject(error);
            });
    });
}

async function loadKnowledgeBase() {
    const kbPath = path.join(__dirname, 'knowledge_base');
    console.log(`[DIAGNÓSTICO] Procurando pela pasta da Base de Conhecimento em: ${kbPath}`);
    
    const knowledgeBase = {};
    try {
        if (!fs.existsSync(kbPath)) {
            console.error(`[DIAGNÓSTICO] ERRO CRÍTICO: A pasta ${kbPath} não existe!`);
            return {};
        }

        const files = fs.readdirSync(kbPath);
        console.log(`[DIAGNÓSTICO] Arquivos encontrados na pasta: [${files.join(', ')}]`);

        const csvFiles = files.filter(file => file.endsWith('.csv'));
        if (csvFiles.length === 0) {
             console.warn(`[DIAGNÓSTICO] AVISO: Nenhum arquivo .csv foi encontrado na pasta.`);
             return {};
        }

        for (const file of csvFiles) {
            const filePath = path.join(kbPath, file);
            const mapName = path.basename(file, '.csv');
            knowledgeBase[mapName] = await loadCsvToMap(filePath);
        }
        console.log("[DIAGNÓSTICO] Base de Conhecimento carregada com sucesso.");
        return knowledgeBase;
    } catch (error) {
        console.error(`[DIAGNÓSTICO] ERRO GERAL ao carregar a Base de Conhecimento:`, error);
        return {};
    }
}

module.exports = { loadKnowledgeBase };
