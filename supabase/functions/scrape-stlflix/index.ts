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

    if (!url || !url.includes("platform.stlflix.com/product/")) {
      throw new Error("URL inválida. Use uma URL de produto da STLFLIX como: platform.stlflix.com/product/nome-da-peca");
    }

    const slug = url.split("/product/")[1].split("?")[0].trim();

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    const html = await response.text();
    const requiresLogin = html.includes("login") && html.includes("password") && !html.includes("drop");

    if (!response.ok || requiresLogin) {
      return new Response(
        JSON.stringify({
          success: false,
          requires_login: true,
          slug,
          stlflix_url: url,
          message: "Página requer login. Preencha os dados manualmente."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ||
                       html.match(/og:title[^>]*content="([^"]+)"/) ||
                       html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" | STLFLIX", "").trim() : slug;

    const stlCodeMatch = html.match(/STL\s*#(\d+)/);
    const stlCode = stlCodeMatch ? `#${stlCodeMatch[1]}` : "";

    const imageMatch = html.match(/og:image[^>]*content="([^"]+)"/) ||
                       html.match(/<img[^>]*src="(https[^"]+(?:jpg|png|webp))"/);
    const imageUrl = imageMatch ? imageMatch[1] : "";

    const monoMatch = html.match(/Monocolor[^:]*:\s*([^\n<*]+)/i);
    const printTimeMono = monoMatch ? monoMatch[1].trim() : "";

    const multiMatch = html.match(/Multicolor[^:]*:\s*([^\n<*]+)/i);
    const printTimeMulti = multiMatch ? multiMatch[1].trim() : "";

    const heightMatch = html.match(/Altura[^:]*:\s*([\d,.]+\s*cm)/i);
    const height = heightMatch ? heightMatch[1].trim() : "";

    const descPatterns = [
      /class="[^"]*description[^"]*"[^>]*>([^<]{50,500})/i,
      /<p[^>]*>([A-ZÀ-ú][^<]{50,400})<\/p>/,
    ];
    let description = "";
    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match) { description = match[1].trim(); break; }
    }

    return new Response(
      JSON.stringify({
        success: true,
        slug,
        stl_code: stlCode,
        title,
        image_url: imageUrl,
        print_time_mono: printTimeMono,
        print_time_multi: printTimeMulti,
        height_cm: height,
        description,
        stlflix_url: url,
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
