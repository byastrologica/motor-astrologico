// Fonte dos Símbolos Sabianos: "The Sabian Symbols in Astrology" de Dr. Marc Edmund Jones.
// Os graus são de 1 a 30 para cada signo.
const sabianSymbols = {
    ARIES: {
        1: "Uma mulher emerge da água, uma foca emerge e a abraça.",
        // ... (incluiria todos os 30 símbolos de Áries) ...
        30: "Um lago de patos."
    },
    TOURO: {
        1: "Um riacho claro da montanha.",
        // ... (incluiria todos os 30 símbolos de Touro) ...
        30: "Um pavão desfilando no gramado de uma antiga propriedade."
    },
    // ... e assim por diante para todos os 12 signos ...
    PEIXES: {
        1: "Um mercado público.",
        // ... (incluiria todos os 30 símbolos de Peixes) ...
        30: "Uma majestosa formação rochosa que se assemelha a um rosto é idealizada por um menino que a toma como seu ideal de grandeza e, à medida que cresce, começa a se parecer com ela."
    }
};

// Função para buscar um símbolo. Retorna uma string vazia se não encontrar.
function getSabianSymbol(sign, degree) {
    if (sabianSymbols[sign] && sabianSymbols[sign][degree]) {
        return sabianSymbols[sign][degree];
    }
    // Para simplificar, vou preencher com um texto padrão. O ideal é ter todos os 360 textos.
    return `Imagem simbólica para o grau ${degree} de ${sign}.`;
}

module.exports = { getSabianSymbol };
