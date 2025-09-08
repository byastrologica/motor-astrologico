const axios = require('axios');
const { getSabianSymbol } = require('./sabianSymbols');

async function generateInterpretation(planetAnalysis) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) { throw new Error("Chave de API do Gemini não configurada."); }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    const sabianSymbolText = getSabianSymbol(planetAnalysis.sign, planetAnalysis.sabianDegree);

    const prompt = `
    Atue como um astrólogo especialista em psicologia profunda, com um estilo de escrita inspirado em Liz Greene. Sua análise deve ser focada em autoconhecimento, não ser fatalista e ter um tom empoderador.
    Gere uma interpretação psicológica detalhada para o seguinte posicionamento planetário, tecendo todas as informações fornecidas em uma narrativa coesa:

    Planeta: ${planetAnalysis.name}
    Signo: ${planetAnalysis.sign}
    Posicionamento Detalhado: Localizado no ${planetAnalysis.decanate.number}º decanato, sub-regido por ${planetAnalysis.decanate.ruler}, e com a dwadasamsa em ${planetAnalysis.dwad}.
    
    Dinâmicas Internas (Aspectos):
    ${planetAnalysis.aspects.join('\n')}
    
    Imagem Arquetípica: O grau corresponde ao Símbolo Sabiano: "${sabianSymbolText}".
    
    ${planetAnalysis.degreeNote ? `Nota Adicional: ${planetAnalysis.degreeNote}` : ''}

    Por favor, sintetize todas essas camadas em um texto fluido, explicando como as dinâmicas e nuances se combinam para formar uma faceta complexa da personalidade do indivíduo.
    `;

    const payload = { contents: [{ "parts": [{ "text": prompt.trim() }] }] };

    try {
        const response = await axios.post(apiUrl, payload);
        if (response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        }
        return "A interpretação não pôde ser gerada.";
    } catch (error) {
        // LOG DE DIAGNÓSTICO DETALHADO
        console.error("================ ERRO DETALHADO DO GEMINI ================");
        if (error.response) {
            // A requisição foi feita e o servidor respondeu com um status de erro
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // A requisição foi feita mas nenhuma resposta foi recebida
            console.error("Request:", error.request);
        } else {
            // Algo aconteceu ao configurar a requisição
            console.error("Error Message:", error.message);
        }
        console.error("==========================================================");
        throw new Error("Falha na comunicação com o serviço de interpretação.");
    }
}

module.exports = { generateInterpretation };
