// technicalReportGenerator.js (Versão com Balanço de Elementos/Modos)

// ... (suas funções auxiliares: decimalToDMS, capitalize, etc.) ...

function generateTechnicalReport(data) {
    const { moon_phase, planets, aspects, aspect_patterns, balances } = data;

    let report = "Resumo Astrológico do Mapa\n\n";
    report += `Fase Lunar de Nascimento: ${moon_phase}\n\n`;

    // --- NOVA SECÇÃO: BALANÇO DE ELEMENTOS E MODOS ---
    if (balances) {
        report += "--- Balanço de Elementos e Modos ---\n\n";
        report += "Elementos (Temperamento):\n";
        report += `   - Fogo: ${balances.elements.Fogo}\n`;
        report += `   - Terra: ${balances.elements.Terra}\n`;
        report += `   - Ar: ${balances.elements.Ar}\n`;
        report += `   - Água: ${balances.elements.Água}\n\n`;
        report += "Modos (Modo de Operar):\n";
        report += `   - Cardinal: ${balances.modes.Cardinal}\n`;
        report += `   - Fixo: ${balances.modes.Fixo}\n`;
        report += `   - Mutável: ${balances.modes.Mutável}\n\n`;
    }
    
    report += "--- Posição e Condições Planetárias ---\n\n";
    // ... (resto da lógica de formatação do relatório, sem alterações) ...

    return report.trim();
}

module.exports = { generateTechnicalReport };
