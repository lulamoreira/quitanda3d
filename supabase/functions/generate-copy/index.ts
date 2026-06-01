import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { piece_name, drop_description, price_figura, price_chaveiro, available_as } = await req.json();

    const prompt = `Gere copy de vendas em português brasileiro para esta peça de impressão 3D:
Peça: ${piece_name}
Contexto: ${drop_description}
Preço figura: R$${price_figura || 'N/A'}
Preço chaveiro: R$${price_chaveiro || 'N/A'}
Disponível como: ${available_as}

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

    const response = await fetch('https://api.lovable.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // Using a powerful model via Lovable Gateway
        messages: [
          {
            role: 'system',
            content: 'Você é o copywriter da Quitanda 3D, loja paulistana de impressão 3D premium com BambuLab X1C Carbon. Responda APENAS com JSON válido. Sem markdown, sem texto antes ou depois do JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
