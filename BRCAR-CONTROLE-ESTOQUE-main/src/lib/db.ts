import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cliente sem tipagem gerada.
 * Usado apenas nas colunas novas criadas pela migração 20260818031000_pro_upgrade.sql,
 * enquanto o arquivo src/integrations/supabase/types.ts não é regerado.
 */
export const db = supabase as unknown as SupabaseClient;
