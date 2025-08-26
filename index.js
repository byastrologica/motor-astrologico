const express = require('express');
const cors = require('cors');
// Importando a biblioteca da maneira correta
const Horoscope = require('astrology-js');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// A rota principal da nossa API
app.post('/calculate', (req, res) => {
    try {
        console.log("Recebi uma requisição:", req.body);
        const { year, month, day, hour, lat, lon } = req.body;

        if (year == null || month == null || day == null || hour == null || lat == null || lon == null) {
            return res.status(400).json({ error: 'Dados de entrada incompletos.' });
        }

        // --- 1. CONVERTER HORA DECIMAL PARA HORA E MINUTO ---
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);

        // --- 2. CRIAR O HORÓSCOPO COM A NOVA BIBLIOTECA ---
        const horoscope = new Horoscope({
            date: new Date(year, month - 1, day, h, m),
            latitude: lat,
            longitude: lon,
            houseSystem: 'placidus'
        });

        // --- 3. EXTRAIR PLANETAS ---
        const calculatedPlanets = {};
        const planetNames = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'true_north_node'];
        
        for (const name of planetNames) {
            const planet = horoscope.planets[name];
            if (planet) {
                 calculatedPlanets[name.replace('true_', '')] = { // Renomeia 'true_north_node' para 'north_node'
                    longitude: planet.longitude,
                    latitude: planet.latitude,
                    speed: planet.speed.longitude
                };
            }
        }

        // --- 4. EXTRAIR CASAS ---
        const calculatedHouses = {
            ascendant: horoscope.ascendant.longitude,
            mc: horoscope.mc.longitude,
            cusps: horoscope.houses.map(cusp => cusp.longitude)
        };

        // --- 5. MONTAR A RESPOSTA FINAL ---
        const responseData = {
            message: "Cálculo completo realizado com sucesso!",
            planets: calculatedPlanets,
            houses: calculatedHouses
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error("Erro no cálculo:", error);
        res.status(500).json({ error: 'Erro interno ao realizar o cálculo.', details: error.toString() });
    }
});

// Rota de teste para a página inicial
app.get('/', (req, res) => {
    res.send('Servidor astrológico no ar. Use o endpoint POST /calculate para fazer os cálculos.');
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
