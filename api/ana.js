// Arquivo: api/ana.js
export default async function handler(req, res) {
  const { cod } = req.query;

  if (!cod) {
    return res.status(400).json({ error: 'Código da estação não fornecido' });
  }

  try {
    // O seu servidor na Vercel vai bater na porta da ANA disfarçado
    const url = `http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosTempoReal?codEstacao=${cod}`;
    
    const resposta = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/xml'
      }
    });

    if (!resposta.ok) {
      throw new Error(`Erro no servidor da ANA: ${resposta.status}`);
    }

    const xml = await resposta.text();

    // Devolve o XML limpo para o seu painel React
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(xml);

  } catch (error) {
    console.error('Falha no Backend:', error);
    res.status(500).json({ error: 'Falha ao contatar a ANA' });
  }
}
