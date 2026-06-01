import { createAPIFileRoute } from "@tanstack/react-start/api";

export const Route = createAPIFileRoute("/api/generate-copy")({
  POST: async ({ request }) => {
    try {
      const data = await request.json();
      
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

      const response = await fetch('https://api.lovable.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
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

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ error: `AI Gateway error: ${errorText}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const aiResult = await response.json();
      const content = aiResult.choices[0].message.content;
      
      return new Response(content, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
});
