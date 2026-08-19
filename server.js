const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');

const app = express();

app.use(cors());
app.use(express.json());

// Verifica se o token existe antes de iniciar
const token = process.env.APIFY_TOKEN;
if (!token) {
    console.warn("AVISO: APIFY_TOKEN não está configurado nas variáveis de ambiente!");
}

const client = new ApifyClient({ token: token || '' });

app.get('/api/prospects', async (req, res) => {
    const { cidade, segmento } = req.query;

    if (!cidade || !segmento) {
        return res.status(400).json({ error: 'Cidade e segmento são obrigatórios.' });
    }

    try {
        const input = {
            searchStringsArray: [`${segmento} em ${cidade}`],
            maxCrawledPlacesPerSearch: 10,
            language: 'pt-BR'
        };

        const run = await client.actor('compass/crawler-google-places').call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const prospects = items.map(item => ({
            nome: item.title || 'Não informado',
            telefone: item.phone || 'Não informado',
            endereco: item.address || 'Não informado',
            categoria: segmento,
            cidade: cidade
        }));

        res.json(prospects);
    } catch (error) {
        console.error('Erro no Apify:', error);
        res.status(500).json({ error: 'Erro ao processar a busca no Apify.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});