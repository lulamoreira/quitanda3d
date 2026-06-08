import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      discord_message_id, 
      content,
      image_url
    } = body;

    // 1. VALIDAÇÃO
    if (!discord_message_id || discord_message_id.trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "discord_message_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!content || content.trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "content é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. IDEMPOTÊNCIA
    const { data: existingDrop, error: selectError } = await supabase
      .from("drops")
      .select("id")
      .eq("discord_message_id", discord_message_id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Erro ao verificar idempotência: ${selectError.message}`);
    }

    if (existingDrop) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          already_exists: true, 
          drop_id: existingDrop.id, 
          pieces_created: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. LOG CONTENT FOR DEBUGGING
    console.log("Receiving Discord content:", content);

    // 4. PARSE DO DROP_NAME
    // Padrões comuns: "Drop #123 - Nome", "Drop: Nome", ou apenas o Nome na primeira linha
    const nameRegex = /(?:Drop\s*#?\s*\d*\s*[-–]\s*|Drop:\s*)([^!@\n]+?)(?:\s*!|\s*@|\s*\n|$)/i;
    const nameMatch = content.match(nameRegex);
    let dropName = "";
    
    if (nameMatch && nameMatch[1]) {
      dropName = nameMatch[1].trim();
    } else {
      // Se não achar o padrão "Drop", pega a primeira linha que não seja vazia e não seja um link
      const lines = content.split('\n').map(l => l.trim()).filter(l => l !== "");
      for (const line of lines) {
        if (!line.includes("http") && line.length > 3) {
          dropName = line.substring(0, 100);
          break;
        }
      }
    }
    
    if (!dropName) {
      dropName = "Drop Discord " + new Date().toLocaleDateString();
    }

    // 5. PARSE DAS PIECES
    const pieces = [];
    
    // Pattern 1: Markdown [Name](URL)
    const mdRegex = /\[([^\]]+)\]\((https:\/\/platform\.stlflix\.com\/product\/([a-z0-9\-]+))\)/g;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
      pieces.push({
        name: match[1].trim(),
        piece_url: match[2],
        stlflix_url: match[2],
        stlflix_slug: match[3]
      });
    }

    // Pattern 2: Name followed by URL (if not already captured by MD)
    // Captura "Nome da Peça" seguido de newline ou ":" e o link
    if (pieces.length === 0) {
      const textUrlRegex = /(?:^|\n)(?:[•\-\*]\s*)?([^\n\r:]{2,80})\s*[\n\r:]\s*(https:\/\/platform\.stlflix\.com\/product\/([a-z0-9\-]+))/g;
      while ((match = textUrlRegex.exec(content)) !== null) {
        // Verificar se esse slug já foi capturado (evitar duplicatas se o regex falhar e capturar de novo)
        if (!pieces.find(p => p.stlflix_slug === match[3])) {
          pieces.push({
            name: match[1].trim(),
            piece_url: match[2],
            stlflix_url: match[2],
            stlflix_slug: match[3]
          });
        }
      }
    }

    // 6. PARSE DA DESCRIPTION
    let description = null;
    // Tenta pegar o bloco de texto antes do primeiro link de produto
    const firstProductUrlIndex = content.indexOf("https://platform.stlflix.com/product/");
    if (firstProductUrlIndex !== -1) {
      const textBefore = content.substring(0, firstProductUrlIndex).trim();
      const lines = textBefore.split('\n');
      // Remove a primeira linha se for o título
      if (lines.length > 1 && (lines[0].includes(dropName) || lines[0].toLowerCase().includes("drop"))) {
        lines.shift();
      }
      description = lines.join('\n').trim();
    }

    // 7. INSERT DROP
    const { data: newDrop, error: insertDropError } = await supabase

      .from("drops")
      .insert({
        drop_name: dropName,
        description: description,
        drop_image_url: image_url || null,
        drop_link: "https://platform.stlflix.com",
        source: "discord",
        discord_message_id: discord_message_id
      })
      .select("id")
      .single();

    if (insertDropError) {
      throw new Error(`Erro ao criar drop: ${insertDropError.message}`);
    }

    const dropId = newDrop.id;
    let piecesCreated = 0;

    // 8. INSERT PIECES
    if (pieces.length > 0) {
      const piecesToInsert = pieces.map(p => ({
        drop_id: dropId,
        name: p.name,
        piece_url: p.piece_url,
        stlflix_url: p.stlflix_url,
        stlflix_slug: p.stlflix_slug,
        source: "discord",
        status: "pendente",
        active: false,
        available_as: "ambos"
      }));

      const { data: insertedPieces, error: insertPiecesError } = await supabase
        .from("pieces")
        .insert(piecesToInsert)
        .select('id');

      if (insertPiecesError) {
        throw new Error(`Erro ao criar peças: ${insertPiecesError.message}`);
      }
      piecesCreated = insertedPieces?.length || 0;
    }

    // 8. RESPONSE
    return new Response(
      JSON.stringify({ 
        success: true, 
        already_exists: false,
        drop_name: dropName,
        drop_id: dropId, 
        pieces_created: piecesCreated 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
