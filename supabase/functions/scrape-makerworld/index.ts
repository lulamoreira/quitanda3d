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
    const { url } = await req.json();

    if (!url || !url.includes("makerworld.com")) {
      throw new Error("URL inválida. Use uma URL do MakerWorld como: makerworld.com/pt/models/XXXXXX");
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Não foi possível acessar a página. Status: ${response.status}`);
    }

    const html = await response.text();

    const titleMatch = html.match(/og:title[^>]*content="([^"]+)"/) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                       html.match(/<title>([^|<]+)/);
    const title = titleMatch ? titleMatch[1].trim() : "";

    const imageMatch = html.match(/og:image[^>]*content="([^"]+)"/) ||
                       html.match(/<img[^>]*src="(https[^"]+(?:jpg|png|webp))"/);
    const imageUrl = imageMatch ? imageMatch[1] : "";

    const descMatch = html.match(/og:description[^>]*content="([^"]+)"/) ||
                      html.match(/<p[^>]*>([^<]{80,500})<\/p>/);
    const description = descMatch ? descMatch[1].trim() : "";

    const makerMatch = html.match(/makerworld\.com\/[^/]+\/models\/(\d+)/);
    const modelId = makerMatch ? makerMatch[1] : "";

    return new Response(
      JSON.stringify({
        success: true,
        title,
        image_url: imageUrl,
        description,
        model_id: modelId,
        makerworld_url: url,
        source: "makerworld"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
