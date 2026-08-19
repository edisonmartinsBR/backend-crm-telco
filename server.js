const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Permite que qualquer site acesse a sua API
app.use(cors());
app.use(express.json());

// Conexão com o Supabase
const SUPABASE_URL = "https://gankqphikamtalbficgv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhbmtxcGhpa2FtdGFsYmZpY2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDkwMDgsImV4cCI6MjA5NDc4NTAwOH0.jc-hJIAsOrZpOizSRbrMSJs4LEVG07wnU1U9h7MtITc";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Rota de Teste (para verificar se está rodando)
app.get('/', (req, res) => {
  res.send('Servidor do CRM rodando com sucesso!');
});

// Rota de Prospecção que o seu HTML vai chamar
app.post('/api/prospeccao/coletar', async (req, res) => {
  const { consulta, cidade, segmento } = req.body;

  try {
    // Exemplo de prospects simulação/base inicial
    const empresasEncontradas = [
      { nome: `${segmento || 'Empresa'} Exemplo 1`, telefone: "5514999998888" },
      { nome: `${segmento || 'Empresa'} Exemplo 2`, telefone: "5514977776666" }
    ];

    // Salva automaticamente no Supabase para a Naomi atender
    for (const emp of empresasEncontradas) {
      await supabase.from('leads_tim').insert([{
        nome: emp.nome,
        empresa: emp.nome,
        telefone: emp.telefone,
        operadora: 'TIM',
        status: 'Novo',
        agente_atual: 'NAOMI',
        observacoes: `Capturado via prospecção em ${cidade}`
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

// Porta automática da nuvem ou porta 3000 local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});