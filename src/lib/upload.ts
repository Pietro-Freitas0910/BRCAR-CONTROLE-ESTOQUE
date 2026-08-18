import { supabase } from "@/integrations/supabase/client";

export const APP_ASSETS_BUCKET = "app-assets";
export const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";
export const VEHICLE_DOCS_BUCKET = "vehicle-documents";

const MAX_MB = 10;

function safeName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Envia um arquivo para um bucket público e devolve a URL pronta para uso. */
export async function uploadPublicFile(
  file: File,
  folder: string,
  bucket: string = APP_ASSETS_BUCKET,
): Promise<string> {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Limite de ${MAX_MB}MB.`);
  }
  const path = `${folder}/${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Envia um arquivo para o bucket privado de documentos. Devolve o caminho interno. */
export async function uploadPrivateFile(file: File, folder: string): Promise<string> {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Arquivo muito grande. Limite de ${MAX_MB}MB.`);
  }
  const path = `${folder}/${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(VEHICLE_DOCS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

/** Gera um link temporário (1 hora) para abrir um documento privado. */
export async function signedDocUrl(path: string): Promise<string> {
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage
    .from(VEHICLE_DOCS_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) throw new Error(error?.message ?? "Não foi possível abrir o arquivo.");
  return data.signedUrl;
}

export async function removePublicFile(url: string, bucket: string = APP_ASSETS_BUCKET) {
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  await supabase.storage.from(bucket).remove([path]);
}
