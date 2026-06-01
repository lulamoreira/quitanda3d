import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { piece_name, drop_description, price_figura, price_chaveiro, available_as } = await req.json();

    const prompt = `Gere copy de vendas em português brasileiro para esta peça de impressão 3D:
Peça: ${piece_name}
Contexto: ${drop_description || "Colecionável de impressão 3D"}
Preço figura: ${price_figura ? "R$" + price_figura : "não disponível"}
Preço chaveiro: ${price_chaveiro ? "R$" + price_chaveiro : "não disponível"}
Disponível como: ${available_as}

Retorne SOMENTE este JSON, sem markdown, sem texto adicional:
{"titulo_ml":"máximo 60 caracteres com palavras-chave de busca","descricao_ml":"descrição completa vendedora mencionando PLA premium, BambuLab X1C Carbon, prazo 5 a 7 dias úteis","titulo_shopee":"máximo 60 caracteres diferente do título ML","descricao_shopee":"descrição casual com emojis voltada para público jovem","caption_instagram":"gancho forte na primeira linha, storytelling curto, CTA levando para link na bio","caption_tiktok":"máximo 150 caracteres impactantes","hashtags":"15 hashtags em português e inglês separadas por espaço"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: "Você é copywriter da Quitanda 3D. Responda SOMENTE com JSON válido. Nunca use markdown, nunca use blocos de código, nunca coloque texto antes ou depois do JSON.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await response.json();
    let raw = data.content[0].text.trim();

    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      raw = raw.substring(firstBrace, lastBrace + 1);
    }

    const result = JSON.parse(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});