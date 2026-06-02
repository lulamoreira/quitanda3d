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
      drop_name, 
      description, 
      drop_image_url, 
      drop_link, 
      source = "discord", 
      pieces = [] 
    } = body;

    // 1. Validação de obrigatoriedade
    if (!drop_name) {
      return new Response(
        JSON.stringify({ success: false, error: "drop_name é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Idempotência: verificar se discord_message_id já existe
    if (discord_message_id) {
      const { data: existingDrop, error: selectError } = await supabase
        .from("drops")
        .select("id")
        .eq("discord_message_id", discord_message_id)
        .maybeSingle();

      if (selectError) {
        throw new Error(`Erro ao verificar drop existente: ${selectError.message}`);
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
    }

    // 3. Inserir novo drop
    const { data: newDrop, error: insertDropError } = await supabase
      .from("drops")
      .insert({
        drop_name,
        description,
        drop_image_url,
        drop_link,
        source,
        discord_message_id
      })
      .select("id")
      .single();

    if (insertDropError) {
      throw new Error(`Erro ao criar drop: ${insertDropError.message}`);
    }

    const dropId = newDrop.id;
    let piecesCreated = 0;

    // 4. Inserir peças se houver
    if (pieces && Array.isArray(pieces) && pieces.length > 0) {
      const piecesToInsert = pieces
        .filter(p => p.name && p.name.trim() !== "")
        .map(p => {
          let stlflix_url = p.piece_url || null;
          if (!stlflix_url && p.stlflix_slug) {
            stlflix_url = `https://platform.stlflix.com/product/${p.stlflix_slug}`;
          }

          return {
            drop_id: dropId,
            name: p.name,
            piece_url: stlflix_url,
            image_url: p.image_url,
            stlflix_slug: p.stlflix_slug,
            source: source,
            status: "pendente",
            active: false,
            available_as: "ambos"
          };
        });

      if (piecesToInsert.length > 0) {
        const { error: insertPiecesError } = await supabase
          .from("pieces")
          .insert(piecesToInsert);

        if (insertPiecesError) {
          throw new Error(`Erro ao criar peças: ${insertPiecesError.message}`);
        }
        piecesCreated = piecesToInsert.length;
      }
    }

    // 5. Sucesso
    return new Response(
      JSON.stringify({ 
        success: true, 
        already_exists: false,
        drop_id: dropId, 
        pieces_created: piecesCreated 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});