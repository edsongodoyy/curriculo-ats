// api/optimize.js
// Verifica pagamento no MP e chama a API do Claude

const SYSTEM_PROMPT = `Você é um especialista em recrutamento e otimização de currículos para sistemas ATS (Applicant Tracking Systems). Analise e otimize o currículo fornecido para maximizar a compatibilidade com ATS e as chances de entrevista.

Responda APENAS com JSON válido. Sem markdown, sem blocos de código, sem texto adicional. Estrutura exata:

{
  "scoreBefore": <número 0-100 representando score ATS atual>,
  "scoreAfter": <número 0-100 representando score ATS após otimização>,
  "keywordsFound": ["palavra-chave presente no currículo"],
  "keywordsMissing": ["palavra-chave importante ausente"],
  "optimizedResume": "currículo completo reescrito com \\n para quebras de linha",
  "professionalSummary": "resumo profissional de 3-4 linhas otimizado para a vaga",
  "improvements": "lista numerada com o que foi melhorado, separada por \\n",
  "linkedinHeadline": "headline profissional para LinkedIn (máx 220 caracteres)",
  "linkedinAbout": "seção Sobre do LinkedIn em primeira pessoa (200-300 palavras)",
  "linkedinSkills": ["habilidade 1", "habilidade 2"]
}`;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const MP_TOKEN       = process.env.MP_ACCESS_TOKEN;
  const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;

  if (!MP_TOKEN)      return res.status(500).json({ error: 'MP_ACCESS_TOKEN não configurado' });
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurado' });

  const { paymentId, pdfText, jobText } = req.body || {};

  if (!paymentId) return res.status(400).json({ error: 'paymentId é obrigatório' });
  if (!pdfText)   return res.status(400).json({ error: 'pdfText é obrigatório' });
  if (!jobText)   return res.status(400).json({ error: 'jobText é obrigatório' });

  try {
    // ── 1. Verificar pagamento no Mercado Pago ──────────────────────────────
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': 'Bearer ' + MP_TOKEN }
    });
    const payment = await mpRes.json();

    if (payment.status !== 'approved') {
      console.warn('Pagamento não aprovado:', payment.status, paymentId);
      return res.status(402).json({
        error: 'Pagamento não confirmado',
        status: payment.status
      });
    }

    // ── 2. Chamar Claude API ────────────────────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: 'CURRÍCULO (extraído do PDF):\n' + pdfText + '\n\n---\n\nDESCRIÇÃO DA VAGA:\n' + jobText
          }
        ]
      })
    });

    const claudeData = await claudeRes.json();

    if (!claudeData.content || !claudeData.content[0]) {
      console.error('Resposta inesperada do Claude:', claudeData);
      return res.status(500).json({ error: 'Erro na IA', detail: claudeData });
    }

    const raw    = claudeData.content[0].text;
    const clean  = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);

  } catch (err) {
    console.error('Erro optimize:', err);
    return res.status(500).json({ error: 'Erro interno', detail: err.message });
  }
};
