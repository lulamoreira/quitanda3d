import { supabase } from "@/integrations/supabase/client";

export const generateCopyFn = async (data: {
  piece_name: string;
  drop_description: string;
  price_figura: number | null;
  price_chaveiro: number | null;
  available_as: string;
}) => {
  const { data: response, error } = await supabase.functions.invoke('generate-copy', {
    body: { data }
  });

  if (error) throw error;
  return response;
};
