// index.js

require('dotenv').config();
const express = require('express');
// ... (outros requires)
const { generateTechnicalReport } = require('./technicalReportGenerator');
const { generateFinalInterpretation } = require('./interpretationEngine'); // Atualizado

const app = express();
// ... (configuração do app)

// ... (funções geocodeLocation e buscarCidade)

app.post('/calculate', async (req, res) => {
    try {
        // ... (toda a sua lógica de cálculo e enriquecimento de dados)
        const enrichedData = { /* ... */ };
        
        // 1. Gera o Relatório Técnico
        const technicalReport = generateTechnicalReport(enrichedData);

        // 2. Gera a Interpretação Final a partir do Relatório Técnico
        const finalInterpretation = await generateFinalInterpretation(technicalReport);
        
        // 3. Retorna ambos na resposta
        res.status(200).json({
            message: "Análise astrológica gerada com sucesso!",
            interpretation: finalInterpretation,
            technical_report: technicalReport
        });

    } catch (error) {
        console.error("Erro no processo:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro interno.', details: error.toString() });
    }
});

// ... (Resto do seu código do servidor)
