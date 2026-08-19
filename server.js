const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

// Conexão com o Supabase
const SUPABASE_URL = "https://gankqphikamtalbficgv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbmtxcGhpa2FtdGFsYmZpY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDkwMDgsImV4cCI6MjA5NDc4NTAwOH0.jc-hJIAsOrZpOizSRbrMSJs4LEVG07wnU1U9h7MtITc";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Rota de Teste
app.get('/', (req, res) => {
  res.send('Servidor do CRM rodando com sucesso!');
});

// Rota de Prospecção REAL via Google Places
app.post('/api/prospeccao/coletar', async (req, res) => {
  const { cidade, segmento } = req.body;
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY; // Chave que vai ficar no Render

  try {
    let empresasEncontradas = [];

    // Se tiver chave do Google configurada, busca no Google Maps
    if (GOOGLE_KEY) {
      const query = encodeURIComponent(`${segmento} em ${cidade}`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Pega as empresas reais retornadas pelo Google
        for (const place of data.results.slice(0, 10)) { // Limita às 10 primeiras
          
          // Busca os detalhes (telefone) de cada local
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number&key=${GOOGLE_KEY}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();
          
          const telefoneRaw = detailData.result?.formatted_phone_number || '';
          // Limpa o telefone deixando só os números com DDD
          const telefoneLimpo = '55' + telefoneRaw.replace(/\D/g, '');

          empresasEncontradas.push({
            nome: place.name,
            telefone: telefoneLimpo.length > 2 ? telefoneLimpo : 'Sem Telefone'
          });
        }
      }
    } else {
      console.log("ATENÇÃO: Chave GOOGLE_PLACES_KEY não encontrada nas variáveis de ambiente!");
    }

    // Salva no Supabase para a Naomi
    for (const emp of empresasEncontradas) {
      await supabase.from('leads_tim').insert([{
        nome: emp.nome,
        empresa: emp.nome,
        telefone: emp.telefone,
        operadora: 'TIM',
        status: 'Novo',
        agente_atual: 'NAOMI',
        observacoes: `Capturado via prospecção real em ${cidade}`
      }]);
    }

    return res.json({
      sucesso: true,
      total: empresasEncontradas.length,
      empresas: empresasEncontradas
    });

  } catch (error) {
    console.error("Erro na prospecção:", error);
    return res.status(500).json({ error: 'Erro interno ao processar prospecção' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});