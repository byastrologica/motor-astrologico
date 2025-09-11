// reportBuilder.js (Versão Final para o Plano Gratuito)

const { ZODIAC_SIGNS } = require('./constants');

// Função auxiliar para formatar o objeto de dignidades numa string legível.
function formatDignities(dignities) {
    if (!dignities || Object.keys(dignities).length === 0) {
        return "Condição: Peregrino (age de forma independente, sem apoio ou hostilidade do signo).";
    }
    const parts = [];
    if (dignities.domicile) parts.push("Domicílio (em casa, muito forte)");
    if (dignities.exaltation) parts.push("Exaltação (honrado, muito forte)");
    if (dignities.detriment) parts.push("Exílio (desafiado, enfraquecido)");
    if (dignities.fall) parts.push("Queda (muito desafiado, enfraquecido)");
    if (dignities.triplicity) parts.push("Triplicidade (apoiado pelo elemento)");
    if (dignities.term) parts.push(`Termo de ${dignities.term}`);
    if (dignities.face) parts.push(`Face (${dignities.decan}º Decanato) de ${dignities.face}`);
    
    return `Condição: ${parts.join(', ')}.`;
}

// Função auxiliar para formatar os dados de um planeta.
function formatPlanetData(planetName, planetObject) {
    const degree = Math.floor(planetObject.longitude % 30);
    const sabianDegree = degree + 1; // Símbolos Sabianos são de 1 a 30
    
    let report = `**Análise do ${planetName.charAt(0).toUpperCase() + planetName.slice(1)}:**\n`;
    report += `- Posição: ${planetObject.sign}, Grau ${degree}.\n`;
    report += `- Tipo de Grau: ${planetObject.degree_type}.\n`;
    report += `- Símbolo Sabiano: Grau ${sabianDegree} de ${planetObject.sign}.\n`;
    
    const isRetrograde = planetObject.speed < 0;
    report += `- Movimento: ${isRetrograde ? 'Retrógrado' : 'Direto'}.\n`;
    
    if(planetObject.dignities) {
        report += `- ${formatDignities(planetObject.dignities)}\n`;
    }
    
    report += `- Dwadasamsa (motivação subconsciente): ${planetObject.dwadasamsaSign}.\n\n`;
    return report;
}

/**
 * Monta o prompt completo para o relatório do Plano Gratuito.
 * @param {object} data - O objeto de resposta completo da API de cálculo.
 * @returns {string} O prompt finalizado para ser enviado à API do Gemini.
 */
function generateFreeReportPrompt(data) {
    const { planets, moon_phase } = data;
    
    // 1. Extrai e formata os dados necessários
    const sunData = formatPlanetData('sun', planets.sun);
    const moonData = formatPlanetData('moon', planets.moon);
    
    // Normaliza os nomes dos signos para evitar problemas de acentuação
    const normalize = (signName) => signName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedZodiac = ZODIAC_SIGNS.map(normalize);
    const northNodeIndex = normalizedZodiac.indexOf(normalize(planets.north_node.sign));
    const southNodeSign = ZODIAC_SIGNS[(northNodeIndex + 6) % 12];
    
    const nodesData = `**Análise Cármica dos Nodos Lunares:**\n- A jornada evolutiva vai do Nodo Sul em ${southNodeSign} para o Nodo Norte em ${planets.north_node.sign}.\n\n`;

    const moonPhaseData = `**Dinâmica Sol-Lua:**\n- Fase Lunar de Nascimento: ${moon_phase}.\n\n`;

    // 2. Monta a secção de dados técnicos
    const rawTexts = sunData + moonData + moonPhaseData + nodesData;

    // 3. Insere os dados no template principal do prompt
    const prompt = `
Atue como uma astróloga especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser fluida, empoderadora, focada na jornada interior e não ser fatalista.

A seguir estão os dados técnicos de um mapa astral para o relatório gratuito "A Essência da Sua Alma". A sua tarefa é usar estes dados para escrever uma interpretação coesa e inspiradora, seguindo a estrutura de 3 camadas:
1.  **Pilares da Identidade:** Use os dados do Sol e da Lua para uma análise profunda. Sintetize todas as informações (signo, dignidades, grau, tipo de grau, Símbolo Sabiano, movimento, dwadasamsa) para descrever o "Herói da Jornada" (Sol) e a "Criança Interior" (Lua).
2.  **A Dinâmica Central:** Use a Fase Lunar para explicar como a identidade e as emoções dançam juntas.
3.  **A Bússola Cármica:** Use os dados dos Nodos Lunares para dar uma introdução poderosa sobre o caminho de vida da pessoa, explicando o ponto de partida (Nodo Sul) e a direção do crescimento (Nodo Norte).

Conclua com uma breve reflexão e adicione as "Perguntas para reflexão" apropriadas para cada secção, como nos seus guiões.

**DADOS TÉCNICOS PARA A ANÁLISE:**
${rawTexts}
    `;

    return prompt.trim();
}

module.exports = { generateFreeReportPrompt };
