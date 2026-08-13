import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type Financials = Database["public"]["Views"]["vehicle_financials"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Expense = Database["public"]["Tables"]["vehicle_expenses"]["Row"];
export type Entry = Database["public"]["Tables"]["vehicle_entries"]["Row"];
export type Sale = Database["public"]["Tables"]["vehicle_sales"]["Row"];
export type Checklist = Database["public"]["Tables"]["vehicle_checklist"]["Row"];
export type Photo = Database["public"]["Tables"]["vehicle_photos"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["vehicle_documents"]["Row"];
export type HistoryRow = Database["public"]["Tables"]["vehicle_history"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type GarageExpense = Database["public"]["Tables"]["garage_expenses"]["Row"];
export type Settings = Database["public"]["Tables"]["garage_settings"]["Row"];

export type VehicleWithFinancials = Vehicle & { fin: Financials | null };

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data;
}

export const vehiclesQuery = queryOptions({
  queryKey: ["vehicles"],
  queryFn: async (): Promise<VehicleWithFinancials[]> => {
    const vehicles = unwrap(
      await supabase
        .from("vehicles")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    );
    const fins = unwrap(await supabase.from("vehicle_financials").select("*"));
    const map = new Map((fins ?? []).map((f) => [f.vehicle_id, f]));
    return (vehicles ?? []).map((v) => ({ ...v, fin: map.get(v.id) ?? null }));
  },
});

export const vehicleQuery = (id: string) =>
  queryOptions({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const vehicle = unwrap(await supabase.from("vehicles").select("*").eq("id", id).single());
      const [fin, photos, docs, expenses, entry, sale, checklist, history] = await Promise.all([
        supabase.from("vehicle_financials").select("*").eq("vehicle_id", id).maybeSingle(),
        supabase.from("vehicle_photos").select("*").eq("vehicle_id", id).order("position"),
        supabase.from("vehicle_documents").select("*").eq("vehicle_id", id).order("created_at"),
        supabase
          .from("vehicle_expenses")
          .select("*")
          .eq("vehicle_id", id)
          .order("expense_date", { ascending: false }),
        supabase.from("vehicle_entries").select("*").eq("vehicle_id", id).maybeSingle(),
        supabase.from("vehicle_sales").select("*").eq("vehicle_id", id).maybeSingle(),
        supabase.from("vehicle_checklist").select("*").eq("vehicle_id", id).order("position"),
        supabase
          .from("vehicle_history")
          .select("*")
          .eq("vehicle_id", id)
          .order("created_at", { ascending: false }),
      ]);
      return {
        vehicle,
        fin: fin.data ?? null,
        photos: photos.data ?? [],
        docs: docs.data ?? [],
        expenses: expenses.data ?? [],
        entry: entry.data ?? null,
        sale: sale.data ?? null,
        checklist: checklist.data ?? [],
        history: history.data ?? [],
      };
    },
  });

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async () => unwrap(await supabase.from("customers").select("*").order("name")) ?? [],
});

export const suppliersQuery = queryOptions({
  queryKey: ["suppliers"],
  queryFn: async () => unwrap(await supabase.from("suppliers").select("*").order("name")) ?? [],
});

export const leadsQuery = queryOptions({
  queryKey: ["leads"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("leads")
        .select("*, vehicles(brand, model, version)")
        .order("created_at", { ascending: false }),
    ) ?? [],
});

export const garageExpensesQuery = queryOptions({
  queryKey: ["garage_expenses"],
  queryFn: async () =>
    unwrap(
      await supabase.from("garage_expenses").select("*").order("expense_date", { ascending: false }),
    ) ?? [],
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () =>
    unwrap(await supabase.from("garage_settings").select("*").eq("id", true).maybeSingle()),
});

export const salesQuery = queryOptions({
  queryKey: ["sales"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("vehicle_sales")
        .select("*, vehicles(brand, model, version, manufacture_year, model_year)")
        .order("sale_date", { ascending: false }),
    ) ?? [],
});
