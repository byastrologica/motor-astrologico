const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Servidor de teste "Olá, Mundo" funcionando!');
});

app.listen(PORT, () => {
    console.log(`Servidor de teste rodando na porta ${PORT}`);
});
