import { supabase } from "@/integrations/supabase/client";

export const APP_ASSETS_BUCKET = "app-assets";
export const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";
export const VEHICLE_DOCS_BUCKET = "vehicle-documents";

const MAX_MB = 10;
const VEHICLE_MAX_SIDE = 1600;
const VEHICLE_QUALITY = 0.8;

function safeName(name: string, forcedExtension?: string) {
  const originalExtension = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const extension = forcedExtension ?? originalExtension;
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safari/formatos específicos podem precisar do fallback abaixo.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Reduz fotos de celular antes do upload. Isso evita enviar arquivos de vários MB
 * para listas/galerias e deixa estoque e catálogo muito mais rápidos.
 */
export async function optimizeVehiclePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  // Arquivos que já são pequenos não precisam passar pelo canvas.
  if (file.size <= 700 * 1024) return file;

  try {
    const source = await loadImage(file);
    const width = source.width;
    const height = source.height;
    const scale = Math.min(1, VEHICLE_MAX_SIDE / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;

    context.drawImage(source, 0, 0, targetWidth, targetHeight);
    if ("close" in source && typeof source.close === "function") source.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", VEHICLE_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
  } catch {
    // Se o navegador não conseguir decodificar o formato, mantém o arquivo original.
    return file;
  }
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
    .upload(path, file, { contentType: file.type || undefined, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Otimiza e envia uma foto de veículo para o bucket público. */
export async function uploadVehiclePhoto(file: File, vehicleId: string, index: number): Promise<string> {
  const optimized = await optimizeVehiclePhoto(file);
  if (optimized.size > MAX_MB * 1024 * 1024) {
    throw new Error(`A foto ${file.name} é muito grande. Limite de ${MAX_MB}MB.`);
  }

  const extension = optimized.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${vehicleId}/${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
  const { error } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(path, optimized, {
      contentType: optimized.type || undefined,
      upsert: false,
      cacheControl: "31536000",
    });
  if (error) throw new Error(`Erro ao enviar ${file.name}: ${error.message}`);

  return supabase.storage.from(VEHICLE_PHOTOS_BUCKET).getPublicUrl(path).data.publicUrl;
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
