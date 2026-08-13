import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/format";
import type { VehicleInsert } from "@/lib/api";
import type { Database } from "@/integrations/supabase/types";

export interface VehicleFormValues {
  brand: string;
  model: string;
  version: string;
  manufacture_year: string;
  model_year: string;
  plate: string;
  color: string;
  mileage: string;
  fuel: string;
  transmission: string;
  doors: string;
  engine: string;
  category: string;
  status: string;
  listed_price: string;
  minimum_price: string;
  target_price: string;
  optionals: string;
  notes: string;
  chassi: string;
  renavam: string;
}

export const EMPTY_VEHICLE: VehicleFormValues = {
  brand: "",
  model: "",
  version: "",
  manufacture_year: "",
  model_year: "",
  plate: "",
  color: "",
  mileage: "",
  fuel: "Flex",
  transmission: "Automático",
  doors: "4",
  engine: "",
  category: "",
  status: "em_preparacao",
  listed_price: "",
  minimum_price: "",
  target_price: "",
  optionals: "",
  notes: "",
  chassi: "",
  renavam: "",
};

export function toVehiclePayload(values: VehicleFormValues): VehicleInsert {
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\./g, "").replace(",", ".")));
  return {
    brand: values.brand.trim(),
    model: values.model.trim(),
    version: values.version.trim() || null,
    manufacture_year: num(values.manufacture_year),
    model_year: num(values.model_year),
    plate: values.plate.trim().toUpperCase() || null,
    color: values.color.trim() || null,
    mileage: num(values.mileage),
    fuel: values.fuel || null,
    transmission: values.transmission || null,
    doors: num(values.doors),
    engine: values.engine.trim() || null,
    category: values.category.trim() || null,
    status: values.status as Database["public"]["Enums"]["vehicle_status"],
    listed_price: num(values.listed_price),
    minimum_price: num(values.minimum_price),
    target_price: num(values.target_price),
    optionals: values.optionals
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    notes: values.notes.trim() || null,
    chassi: values.chassi.trim() || null,
    renavam: values.renavam.trim() || null,
  };
}

const FUELS = ["Flex", "Gasolina", "Diesel", "Etanol", "Híbrido", "Elétrico", "GNV"];
const TRANSMISSIONS = ["Automático", "Manual", "CVT", "Automatizado"];

export function VehicleForm({
  initial,
  onSubmit,
  submitting,
  submitLabel = "Salvar veículo",
}: {
  initial?: VehicleFormValues;
  onSubmit: (values: VehicleFormValues) => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<VehicleFormValues>(initial ?? EMPTY_VEHICLE);
  const set = (key: keyof VehicleFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const field = (
    key: keyof VehicleFormValues,
    label: string,
    props: { type?: string; placeholder?: string; required?: boolean } = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? ""}
        required={props.required ?? false}
        value={values[key]}
        onChange={(e) => set(key)(e.target.value)}
      />
    </div>
  );

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <section className="card-elevated p-6">
        <h2 className="font-display text-lg font-bold">Identificação</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field("brand", "Marca", { required: true, placeholder: "Toyota" })}
          {field("model", "Modelo", { required: true, placeholder: "Corolla" })}
          {field("version", "Versão", { placeholder: "XEi 2.0" })}
          {field("manufacture_year", "Ano fabricação", { type: "number" })}
          {field("model_year", "Ano modelo", { type: "number" })}
          {field("plate", "Placa", { placeholder: "ABC1D23" })}
          {field("color", "Cor")}
          {field("mileage", "Quilometragem", { type: "number" })}
          {field("category", "Categoria", { placeholder: "Sedã, SUV, Picape..." })}
        </div>
      </section>

      <section className="card-elevated p-6">
        <h2 className="font-display text-lg font-bold">Mecânica e situação</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Combustível</Label>
            <Select value={values.fuel} onValueChange={set("fuel")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUELS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Câmbio</Label>
            <Select value={values.transmission} onValueChange={set("transmission")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSMISSIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Situação</Label>
            <Select value={values.status} onValueChange={set("status")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field("engine", "Motor", { placeholder: "2.0 16V" })}
          {field("doors", "Portas", { type: "number" })}
          {field("chassi", "Chassi")}
          {field("renavam", "Renavam")}
        </div>
      </section>

      <section className="card-elevated p-6">
        <h2 className="font-display text-lg font-bold">Precificação</h2>
        <p className="text-sm text-muted-foreground">
          O preço mínimo é usado para alertar quando uma negociação fica abaixo da margem.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {field("listed_price", "Preço anunciado (R$)", { type: "number" })}
          {field("target_price", "Preço alvo (R$)", { type: "number" })}
          {field("minimum_price", "Preço mínimo (R$)", { type: "number" })}
        </div>
      </section>

      <section className="card-elevated p-6">
        <h2 className="font-display text-lg font-bold">Anúncio</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="optionals">Opcionais (separados por vírgula)</Label>
            <Textarea
              id="optionals"
              rows={2}
              value={values.optionals}
              onChange={(e) => set("optionals")(e.target.value)}
              placeholder="Ar-condicionado, Multimídia, Câmera de ré"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={values.notes}
              onChange={(e) => set("notes")(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
