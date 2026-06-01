import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data } = await req.json()
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }

    const prompt = `Gere copy de vendas em português brasileiro para esta peça de impressão 3D:
Peça: ${data.piece_name}
Contexto: ${data.drop_description}
Preço figura: R$${data.price_figura || 'N/A'}
Preço chaveiro: R$${data.price_chaveiro || 'N/A'}
Disponível como: ${data.available_as}

Retorne exatamente este JSON:
{
  "titulo_ml": "máximo 60 caracteres com palavras-chave de busca",
  "descricao_ml": "descrição completa vendedora mencionando PLA premium, BambuLab X1C Carbon, prazo 5 a 7 dias úteis",
  "titulo_shopee": "máximo 60 caracteres diferente do título ML",
  "descricao_shopee": "descrição casual com emojis voltada para público jovem",
  "caption_instagram": "gancho forte na primeira linha, storytelling curto, CTA levando para link na bio",
  "caption_tiktok": "máximo 150 caracteres impactantes",
  "hashtags": "15 hashtags em português e inglês separadas por espaço"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620", // Actual current model identifier for Claude 3.5 Sonnet
        max_tokens: 1500,
        system: "Você é o copywriter da Quitanda 3D, loja paulistana de impressão 3D premium com BambuLab X1C Carbon. Responda APENAS com JSON válido. Sem markdown, sem texto antes ou depois do JSON.",
        messages: [{ role: "user", content: prompt }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${errorText}`);
    }

    const aiResult = await response.json();
    const content = aiResult.content[0].text;
    
    return new Response(content, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})