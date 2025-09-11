// interpretationEngine.js

const axios = require('axios');
const { ZODIAC_SIGNS } = require('./constants');

// --- FUNÇÕES AUXILIARES ---

/**
 * Formata um objeto de dignidades numa string de dados legível para a IA.
 */
function formatDignitiesForPrompt(dignities) {
    if (!dignities || Object.keys(dignities).length === 0) return "Condição: Peregrino";
    const parts = [];
    if (dignities.domicile) parts.push("Domicílio (muito forte)");
    if (dignities.exaltation) parts.push("Exaltação (muito forte)");
    if (dignities.detriment) parts.push("Exílio (desafiado)");
    if (dignities.fall) parts.push("Queda (muito desafiado)");
    if (dignities.triplicity) parts.push("Triplicidade (apoiado)");
    return `Condição: ${parts.join(', ')}`;
}

/**
 * Formata os aspetos de um planeta numa string de dados.
 */
function formatAspectsForPrompt(planetName, aspects) {
    const planetAspects = aspects.filter(asp => asp.point1 === planetName || asp.point2 === planetName);
    if (planetAspects.length === 0) return "Nenhum aspeto maior.";

    const parts = planetAspects.map(asp => {
        const otherPlanet = asp.point1 === planetName ? asp.point2 : asp.point1;
        return `${asp.aspect_type} com ${otherPlanet}`;
    });
    return `Aspetos principais: ${parts.join(', ')}.`;
}

/**
 * Função central para fazer a chamada à API do Gemini.
 */
async function callGeminiAPI(prompt) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt.trim() }] }] };

    try {
        const response = await axios.post(apiUrl, payload);
        if (response.data.candidates && response.data.candidates[0].content.parts[0].text) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return `(A interpretação para esta secção não pôde ser gerada.)`;
    } catch (error) {
        console.error("Erro na chamada ao Gemini:", error.response ? error.response.data : error.message);
        return `(Ocorreu um erro ao gerar a interpretação para esta secção: ${error.message})`;
    }
}


// --- LÓGICA DE GERAÇÃO DE PROMPTS (PLANO GRATUITO) ---

function createSunPrompt(sun, aspects) {
    const sunData = `
    - Planeta: Sol
    - Posição: ${Math.floor(sun.longitude % 30)}° de ${sun.sign}
    - Movimento: ${sun.speed < 0 ? 'Retrógrado' : 'Direto'}
    - ${formatDignities(sun.dignities)}
    - Decanato/Face: ${sun.dignities.decan}º (${sun.dignities.face})
    - Termo: ${sun.dignities.term}
    - Dwadasamsa (motivação oculta): ${sun.dwadasamsaSign}
    - ${formatAspectsForPrompt('sun', aspects)}
    `;
    return `
Atue como uma astróloga especialista em psicologia profunda (estilo Liz Greene).
Com base nos dados técnicos abaixo, escreva uma análise sintetizada e fluida sobre o Sol num mapa astral, o "Herói da Jornada".
**Não liste os dados**, teça-os numa narrativa coesa. Explique como a condição do Sol (suas dignidades/debilidades) e seus aspetos principais moldam a expressão da identidade e do propósito da pessoa. Termine com uma pergunta para reflexão.

**Dados Técnicos do Sol:**
${sunData}`;
}

function createMoonPrompt(moon, aspects) {
    const moonData = `
    - Planeta: Lua
    - Posição: ${Math.floor(moon.longitude % 30)}° de ${moon.sign}
    - Grau: ${moon.degree_type}
    - Movimento: ${moon.speed < 0 ? 'Retrógrado' : 'Direto'}
    - ${formatDignities(moon.dignities)}
    - Decanato/Face: ${moon.dignities.decan}º (${moon.dignities.face})
    - Termo: ${moon.dignities.term}
    - Dwadasamsa (motivação oculta): ${moon.dwadasamsaSign}
    - ${formatAspectsForPrompt('moon', aspects)}
    `;
    return `
Atue como uma astróloga especialista em psicologia profunda (estilo Liz Greene).
Com base nos dados técnicos abaixo, escreva uma análise sintetizada e empoderadora sobre a Lua num mapa astral, a "Criança Interior".
**Não liste os dados**, integre-os numa narrativa sobre as necessidades emocionais, segurança e padrões instintivos da pessoa. Dê especial atenção a como a condição da Lua (suas dignidades/debilidades) e seus aspetos influenciam o seu mundo interior. Termine com uma pergunta para reflexão.

**Dados Técnicos da Lua:**
${moonData}`;
}

function createNodesAndPhasePrompt(moon_phase, north_node) {
    const southNodeSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(north_node.sign) + 6) % 12];
    const nodesData = `
    - Fase Lunar de Nascimento: ${moon_phase}
    - Posição do Nodo Norte: ${north_node.sign}
    - Posição do Nodo Sul: ${southNodeSign}
    `;
    return `
Atue como uma astróloga especialista em psicologia profunda (estilo Liz Greene).
Com base nos dados abaixo, escreva uma análise unificada sobre a "Dinâmica Central" e a "Bússola Cármica".
Primeiro, explique o significado da Fase Lunar de nascimento como a dança entre o Sol e a Lua.
Depois, descreva a jornada evolutiva do Nodo Sul para o Nodo Norte como a missão principal da alma nesta vida. Mantenha um tom introdutório e instigante. Termine com uma pergunta para reflexão sobre os Nodos.

**Dados Técnicos:**
${nodesData}`;
}


// --- FUNÇÃO PRINCIPAL EXPORTADA ---

/**
 * Gera a interpretação completa para o Plano Gratuito.
 * @param {object} data - O objeto de dados completo e enriquecido.
 * @returns {string} O relatório de interpretação final.
 */
async function generateFreeReport(data) {
    const { planets, aspects, moon_phase } = data;

    // Gera cada parte da interpretação em paralelo para mais eficiência
    const sunPrompt = createSunPrompt(planets.sun, aspects);
    const moonPrompt = createMoonPrompt(planets.moon, aspects);
    const nodesAndPhasePrompt = createNodesAndPhasePrompt(moon_phase, planets.north_node);

    const [sunInterpretation, moonInterpretation, nodesAndPhaseInterpretation] = await Promise.all([
        callGeminiAPI(sunPrompt),
        callGeminiAPI(moonPrompt),
        callGeminiAPI(nodesAndPhasePrompt)
    ]);

    // Monta o relatório final a partir das partes
    const finalReport = `
# A Essência da Sua Alma

**O Herói da Sua Jornada: O Sol**
${sunInterpretation}

**A Criança Interior: A Lua**
${moonInterpretation}

**A Dinâmica Central e a Bússola Cármica**
${nodesAndPhaseInterpretation}

---
*Esta é uma análise gratuita e introdutória. A análise completa, incluindo todos os planetas, aspetos e os grandes temas da sua vida, está disponível na versão completa.*
    `;

    return finalReport.trim();
}

module.exports = { generateFreeReport };
