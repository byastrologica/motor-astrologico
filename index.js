// =================================================================
// DEPENDÊNCIAS E CONFIGURAÇÃO INICIAL
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const {
    SE_SUN, SE_MOON, SE_MERCURY, SE_VENUS, SE_MARS, SE_JUPITER, SE_SATURN,
    SE_URANUS, SE_NEPTUNE, SE_PLUTO, SE_TRUE_NODE, SEFLG_SPEED
} = require('./constants');

const sweph = require('sweph'); 

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const ephePath = path.join(__dirname, 'sweph_bin', 'ephe');
sweph.set_ephe_path(ephePath);

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

function calculateHousesWithSwetest(jd_ut, lat, lon) {
    return new Promise((resolve, reject) => {
        const swetestPath = path.join(__dirname, 'sweph_bin', 'swetest');
        
        // ======================================================
        // CORREÇÃO FINAL NO COMANDO
        // ======================================================
        // O argumento -edir precisa de um espaço antes do caminho
        const command = `${swetestPath} -edir ${ephePath} -p -h1 -ut${jd_ut} -geopos${lon},${lat},0 -eswe`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Erro ao executar swetest: ${stderr || error.message}`);
            }
            
            try {
                const lines = stdout.split('\n');
                let ascendant = null;
                let mc = null;
                
                const cusps = [];
                for (const line of lines) {
                    if (line.trim().match(/^house\s+\d+/)) {
                        cusps.push(parseFloat(line.split(/\s+/)[2]));
                    }
                }

                const ascLine = lines.find(line => line.trim().startsWith('Ascendant'));
                const mcLine = lines.find(line => line.trim().startsWith('MC'));

                if (ascLine) {
                    ascendant = parseFloat(ascLine.split(/\s+/)[1]);
                }
                if (mcLine) {
                    mc = parseFloat(mcLine.split(/\s+/)[1]);
                }

                if (ascendant !== null && mc !== null) {
                    resolve({ ascendant, mc, cusps });
                } else {
                    reject("Não foi possível extrair Ascendente/MC da saída do swetest. Saída recebida: " + stdout);
                }
            } catch (parseError) {
                reject(`Erro ao processar saída do swetest: ${parseError}`);
            }
        });
    });
}

async function buscarCidade(textoDigitado) {
    const CHAVE_API = process.env.GEOAPIFY_API_KEY; 
    if (!CHAVE_API) { throw new Error("Configuração do servidor incompleta."); }
    const url =
