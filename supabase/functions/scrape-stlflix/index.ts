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
      throw new Error("URL inválida. Use uma URL como: platform.stlflix.com/product/nome-da-peca");
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

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/s);
    if (!nextDataMatch) {
      throw new Error("Não foi possível ler os dados da página. Verifique se você está logado na STLFLIX.");
    }

    const nextData = JSON.parse(nextDataMatch[1]);
    const product = nextData?.props?.pageProps?.product || nextData?.props?.pageProps;

    if (!product || !product.name) {
      throw new Error("Dados do produto não encontrados. A página pode exigir login.");
    }

    const title = product.name || "";
    const stlCode = product.id ? `#${product.id}` : "";
    const description = product.description
      ? product.description.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
      : "";

    const thumbnail = product.thumbnail?.data?.attributes?.url || "";
    const galleryImages = product.gallery?.data?.map((img: any) => img?.attributes?.url).filter(Boolean) || [];
    const imageUrl = thumbnail || galleryImages[0] || "";

    const monoMatch = description.match(/Monocolor[^:]*:\s*([^\n<*]+)/i);
    const printTimeMono = monoMatch ? monoMatch[1].trim() : "";

    const multiMatch = description.match(/Multicolor[^:]*:\s*([^\n<*]+)/i);
    const printTimeMulti = multiMatch ? multiMatch[1].trim() : "";

    const heightMatch = description.match(/Altura[^:]*:\s*([\d,.]+\s*cm)/i);
    const height = heightMatch ? heightMatch[1].trim() : "";

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
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
