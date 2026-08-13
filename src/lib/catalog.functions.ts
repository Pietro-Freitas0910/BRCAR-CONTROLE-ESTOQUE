import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"]!;
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const CATALOG_COLUMNS =
  "id, brand, model, version, manufacture_year, model_year, mileage, color, fuel, transmission, doors, engine, category, optionals, notes, listed_price, status, cover_photo_url";

export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("vehicles")
    .select(CATALOG_COLUMNS)
    .in("status", ["disponivel", "reservado"])
    .is("deleted_at", null)
    .order("listed_price", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCatalogVehicle = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data: input }) => {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(CATALOG_COLUMNS)
      .eq("id", input.id)
      .in("status", ["disponivel", "reservado"])
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const { data: photos } = await supabase
      .from("vehicle_photos")
      .select("id, url, is_cover, position")
      .eq("vehicle_id", input.id)
      .order("position", { ascending: true });
    return { ...data, photos: photos ?? [] };
  });

export const createLead = createServerFn({ method: "POST" })
  .inputValidator((input: { vehicleId: string | null; name: string; phone: string; message?: string }) => {
    const name = input.name.trim().slice(0, 120);
    const phone = input.phone.trim().slice(0, 40);
    if (name.length < 2) throw new Error("Informe seu nome.");
    if (phone.replace(/\D/g, "").length < 10) throw new Error("Informe um telefone válido com DDD.");
    return {
      vehicleId: input.vehicleId,
      name,
      phone,
      message: (input.message ?? "").trim().slice(0, 500),
    };
  })
  .handler(async ({ data: input }) => {
    const { error } = await publicClient()
      .from("leads")
      .insert({
        vehicle_id: input.vehicleId,
        name: input.name,
        phone: input.phone,
        message: input.message || null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("garage_settings")
    .select("name, whatsapp, address, city, instagram, catalog_headline")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});
