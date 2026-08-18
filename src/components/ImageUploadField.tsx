import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { APP_ASSETS_BUCKET, removePublicFile, uploadPublicFile } from "@/lib/upload";

type Props = {
  label: string;
  hint?: string;
  value: string | null | undefined;
  folder: string;
  bucket?: string;
  rounded?: boolean;
  className?: string;
  onChange: (url: string | null) => void | Promise<void>;
};

/** Campo reutilizável de foto: pré-visualização, envio e remoção. */
export function ImageUploadField({
  label,
  hint,
  value,
  folder,
  bucket = APP_ASSETS_BUCKET,
  rounded = false,
  className,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadPublicFile(file, folder, bucket);
      await onChange(url);
      toast.success("Imagem enviada.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted",
            rounded ? "rounded-full" : "rounded-lg",
          )}
        >
          {value ? (
            <img src={value} alt={label} className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {value ? "Trocar imagem" : "Enviar imagem"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await removePublicFile(value, bucket);
                  await onChange(null);
                } catch (error) {
                  toast.error((error as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Trash2 className="size-4" /> Remover
            </Button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
