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

    // 3. PARSE DO DROP_NAME
    const nameRegex = /Drop\s*#?\s*\d*\s*[-–]\s*([^!@\n]+?)(?:\s*!|\s*@|\s*\n|$)/i;
    const nameMatch = content.match(nameRegex);
    let dropName = "";
    
    if (nameMatch && nameMatch[1]) {
      dropName = nameMatch[1].trim();
    } else {
      const lines = content.split('\n');
      dropName = lines[0].trim().substring(0, 100);
    }
    
    if (!dropName) {
      dropName = "Drop sem nome";
    }

    // 4. PARSE DA DESCRIPTION
    let description = null;
    const firstUrlIndex = content.indexOf("https://platform.stlflix.com");
    if (firstUrlIndex !== -1) {
      const textBeforeUrl = content.substring(0, firstUrlIndex);
      const descriptionLines = textBeforeUrl.split('\n');
      // Descartar a primeira linha (título)
      descriptionLines.shift();
      const cleanLines = descriptionLines
        .map(line => line.trim())
        .filter(line => line !== "");
      
      if (cleanLines.length > 0) {
        description = cleanLines.join(' ').trim();
      }
    }

    // 5. PARSE DAS PIECES
    const piecesRegex = /^[\s]*([A-Za-z0-9][A-Za-z0-9\s\-'_]{1,80})\s*\n\s*(https:\/\/platform\.stlflix\.com\/product\/([a-z0-9\-]+))/gm;
    const pieces = [];
    let match;
    while ((match = piecesRegex.exec(content)) !== null) {
      pieces.push({
        name: match[1].trim(),
        piece_url: match[2],
        stlflix_url: match[2],
        stlflix_slug: match[3]
      });
    }

    // 6. INSERT DROP
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

    // 7. INSERT PIECES
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
