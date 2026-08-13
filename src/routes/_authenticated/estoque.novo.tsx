import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VehicleForm, toVehiclePayload, type VehicleFormValues } from "@/components/app/VehicleForm";

export const Route = createFileRoute("/_authenticated/estoque/novo")({
  head: () => ({
    meta: [
      { title: "Novo veículo — BR Car Seminovos" },
      { name: "description", content: "Cadastrar um novo veículo no estoque." },
      { property: "og:title", content: "Novo veículo — BR Car Seminovos" },
      { property: "og:description", content: "Cadastro de veículo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NovoVeiculo,
});

function NovoVeiculo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<File[]>([]);

  const uploadPhotos = async (vehicleId: string) => {
    if (photos.length === 0) return;

    const rows: { vehicle_id: string; url: string; position: number; is_cover: boolean }[] = [];
    for (let index = 0; index < photos.length; index += 1) {
      const file = photos[index];
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${vehicleId}/${Date.now()}-${index}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (uploadError) throw new Error(`Erro ao enviar ${file.name}: ${uploadError.message}`);

      const { data: publicData } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
      rows.push({
        vehicle_id: vehicleId,
        url: publicData.publicUrl,
        position: index,
        is_cover: index === 0,
      });
    }

    const { error: photosError } = await supabase.from("vehicle_photos").insert(rows);
    if (photosError) throw new Error(photosError.message);

    const { error: coverError } = await supabase
      .from("vehicles")
      .update({ cover_photo_url: rows[0].url })
      .eq("id", vehicleId);
    if (coverError) throw new Error(coverError.message);
  };

  const create = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = { ...toVehiclePayload(values), created_by: userData.user?.id ?? null };
      const { data, error } = await supabase.from("vehicles").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      await uploadPhotos(data.id);
      return data;
    },
    onSuccess: async (data) => {
      toast.success("Veículo cadastrado!");
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      void navigate({ to: "/estoque/$id", params: { id: data.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Novo veículo"
        description="Cadastre os dados principais e selecione as fotos direto da galeria."
      />
      <div className="mb-6 card-elevated p-6">
        <Label htmlFor="vehicle-photos" className="text-base font-semibold">Fotos do veículo</Label>
        <p className="mt-1 text-sm text-muted-foreground">Selecione as fotos direto da galeria. Você pode escolher várias de uma vez; a primeira será a capa.</p>
        <Input
          id="vehicle-photos"
          type="file"
          accept="image/*"
          multiple
          className="mt-4"
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
        />
        {photos.length > 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{photos.length} foto{photos.length > 1 ? "s" : ""} selecionada{photos.length > 1 ? "s" : ""}.</p>
        ) : null}
      </div>
      <VehicleForm onSubmit={(v) => create.mutate(v)} submitting={create.isPending} />
    </>
  );
}
