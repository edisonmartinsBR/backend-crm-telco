const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializa o cliente do Apify buscando o token das variáveis de ambiente
const client = new ApifyClient({
    token: apify_api_GuETQXWgWeqdDe3bOBg5jJFpYzfdLb0dCynP,
});

// Rota de busca de prospects
app.get('/api/prospects', async (req, res) => {
    const { cidade, segmento } = req.query;

    if (!cidade || !segmento) {
        return res.status(400).json({ error: 'Cidade e segmento são obrigatórios.' });
    }

    try {
        // Parâmetros de entrada para o scraper do Google Maps
        const input = {
            searchStringsArray: [`${segmento} em ${cidade}`],
            maxCrawledPlacesPerSearch: 10,
            language: 'pt-BR'
        };

        // Executa a busca no Apify
        const run = await client.actor('compass/crawler-google-places').call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // Formata os resultados retornados
        const prospects = items.map(item => ({
            nome: item.title || 'Não informado',
            telefone: item.phone || 'Não informado',
            endereco: item.address || 'Não informado',
            categoria: segmento,
            cidade: cidade
        }));

        res.json(prospects);
    } catch (error) {
        console.error('Erro na busca via Apify:', error);
        res.status(500).json({ error: 'Erro interno ao buscar dados no Apify.' });
    }
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});