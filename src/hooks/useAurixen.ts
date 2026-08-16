import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

function useCollection<T>(key: unknown[], loader: () => Promise<T[]>) {
  return useQuery({ queryKey: key, queryFn: loader });
}

/* ------------------------------- notes ---------------------------------- */

export type Note = {
  id: string;
  project_slug: string;
  category: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export function useNotes(projectSlug: string) {
  return useCollection<Note>(["notes", projectSlug], async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("project_slug", projectSlug)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Note[];
  });
}

export function useSaveNote(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: Partial<Note> & { id?: string }) => {
      if (note.id) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: note.title ?? "",
            content: note.content ?? "",
            category: note.category ?? "idee",
            pinned: note.pinned ?? false,
          })
          .eq("id", note.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase.from("notes").insert({
        user_id,
        project_slug: projectSlug,
        title: note.title ?? "",
        content: note.content ?? "",
        category: note.category ?? "idee",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", projectSlug] });
      toast.success("Note enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNote(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", projectSlug] });
      toast.success("Note supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ------------------------------ events ---------------------------------- */

export type CalendarEvent = {
  id: string;
  project_slug: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  kind: string;
  restaurant_id: string | null;
};

export function useEvents(projectSlug?: string) {
  return useCollection<CalendarEvent>(["events", projectSlug ?? "all"], async () => {
    let q = supabase.from("events").select("*").order("event_date", { ascending: true });
    if (projectSlug) q = q.eq("project_slug", projectSlug);
    const { data, error } = await q;
    if (error) throw error;
    return data as CalendarEvent[];
  });
}

export function useSaveEvent(projectSlug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ev: Partial<CalendarEvent> & { id?: string }) => {
      const payload = {
        title: ev.title ?? "Sans titre",
        description: ev.description ?? null,
        event_date: ev.event_date!,
        event_time: ev.event_time || null,
        project_slug: ev.project_slug ?? projectSlug ?? "aurixen",
        kind: ev.kind ?? "general",
        restaurant_id: ev.restaurant_id ?? null,
      };
      if (ev.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", ev.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase.from("events").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement enregistré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Événement supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* -------------------------------- pins ---------------------------------- */

export type Pin = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  status: string;
  published_at: string | null;
  product: string | null;
  board: string | null;
  impressions: number;
  saves: number;
  clicks: number;
  outbound_clicks: number;
  manual_score: number | null;
  notes: string | null;
  created_at: string;
};

export function usePins() {
  return useCollection<Pin>(["pins"], async () => {
    const { data, error } = await supabase
      .from("pins")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Pin[];
  });
}

export function useSavePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pin: Partial<Pin> & { id?: string }) => {
      const payload = {
        title: pin.title ?? "Sans titre",
        description: pin.description ?? null,
        image_url: pin.image_url ?? null,
        status: pin.status ?? "cree",
        published_at: pin.published_at || null,
        product: pin.product ?? null,
        board: pin.board ?? null,
        impressions: Number(pin.impressions ?? 0),
        saves: Number(pin.saves ?? 0),
        clicks: Number(pin.clicks ?? 0),
        outbound_clicks: Number(pin.outbound_clicks ?? 0),
        manual_score: pin.manual_score === null ? null : (pin.manual_score ?? null),
        notes: pin.notes ?? null,
      };
      if (pin.id) {
        const { error } = await supabase.from("pins").update(payload).eq("id", pin.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase.from("pins").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pins"] });
      toast.success("Pin enregistré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pins"] });
      toast.success("Pin supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* -------------------------------- sales --------------------------------- */

export type Sale = {
  id: string;
  product: string;
  amount: number;
  currency: string;
  quantity: number;
  source: string;
  sold_at: string;
};

export function useSales() {
  return useCollection<Sale>(["sales"], async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });
    if (error) throw error;
    return data as Sale[];
  });
}

export function useSaveSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sale: Partial<Sale>) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("sales").insert({
        user_id,
        product: sale.product ?? "Produit A",
        amount: Number(sale.amount ?? 0),
        quantity: Number(sale.quantity ?? 1),
        source: sale.source ?? "manuel",
        sold_at: sale.sold_at ?? new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Vente enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ----------------------------- restaurants ------------------------------ */

export type CustomField = { label: string; value: string };

export type Restaurant = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  cuisine: string | null;
  parking: string | null;
  size: string | null;
  interest: string;
  notes: string | null;
  custom_fields: CustomField[];
  created_at: string;
};

export function useRestaurants() {
  return useCollection<Restaurant>(["restaurants"], async () => {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      ...r,
      custom_fields: (r.custom_fields ?? []) as CustomField[],
    })) as Restaurant[];
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).single();
      if (error) throw error;
      return { ...data, custom_fields: (data.custom_fields ?? []) as CustomField[] } as Restaurant;
    },
  });
}

export function useSaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<Restaurant> & { id?: string }) => {
      const payload = {
        name: r.name ?? "Nouveau restaurant",
        location: r.location ?? null,
        address: r.address ?? null,
        phone: r.phone ?? null,
        email: r.email ?? null,
        website: r.website ?? null,
        cuisine: r.cuisine ?? null,
        parking: r.parking ?? null,
        size: r.size ?? null,
        interest: r.interest ?? "inconnu",
        notes: r.notes ?? null,
        custom_fields: r.custom_fields ?? [],
      };
      if (r.id) {
        const { error } = await supabase.from("restaurants").update(payload).eq("id", r.id);
        if (error) throw error;
        return r.id;
      }
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("restaurants")
        .insert({ ...payload, user_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      if (id) qc.invalidateQueries({ queryKey: ["restaurant", id] });
      toast.success("Restaurant enregistré");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      toast.success("Restaurant supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------------------- availabilities ---------------------------- */

export type Availability = {
  id: string;
  restaurant_id: string;
  slot_date: string;
  slot_time: string | null;
  status: string;
  notes: string | null;
};

export function useAvailabilities(restaurantId?: string) {
  return useCollection<Availability>(["availabilities", restaurantId ?? "all"], async () => {
    let q = supabase.from("availabilities").select("*").order("slot_date", { ascending: true });
    if (restaurantId) q = q.eq("restaurant_id", restaurantId);
    const { data, error } = await q;
    if (error) throw error;
    return data as Availability[];
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Partial<Availability> & { id?: string }) => {
      const payload = {
        restaurant_id: a.restaurant_id!,
        slot_date: a.slot_date!,
        slot_time: a.slot_time || null,
        status: a.status ?? "disponible",
        notes: a.notes ?? null,
      };
      if (a.id) {
        const { error } = await supabase.from("availabilities").update(payload).eq("id", a.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase.from("availabilities").insert({ ...payload, user_id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availabilities"] });
      toast.success("Disponibilité enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availabilities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availabilities"] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------------------- folders & files --------------------------- */

export type Folder = { id: string; name: string; project_slug: string; parent_id: string | null };
export type StoredFile = {
  id: string;
  name: string;
  folder_id: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export function useFolders(projectSlug: string) {
  return useCollection<Folder>(["folders", projectSlug], async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("project_slug", projectSlug)
      .order("name");
    if (error) throw error;
    return data as Folder[];
  });
}

export function useFiles(projectSlug: string) {
  return useCollection<StoredFile>(["files", projectSlug], async () => {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("project_slug", projectSlug)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as StoredFile[];
  });
}

export function useCreateFolder(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("folders")
        .insert({ user_id, project_slug: projectSlug, name });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", projectSlug] });
      toast.success("Dossier créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFolder(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["folders", projectSlug] });
      qc.invalidateQueries({ queryKey: ["files", projectSlug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadFile(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folderId }: { file: File; folderId: string | null }) => {
      const user_id = await currentUserId();
      const path = `${user_id}/${projectSlug}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("aurixen-files").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase.from("files").insert({
        user_id,
        project_slug: projectSlug,
        folder_id: folderId,
        name: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files", projectSlug] });
      toast.success("Fichier ajouté");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMoveFile(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string | null }) => {
      const { error } = await supabase.from("files").update({ folder_id: folderId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", projectSlug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteFile(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: StoredFile) => {
      await supabase.storage.from("aurixen-files").remove([file.storage_path]);
      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files", projectSlug] });
      toast.success("Fichier supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function openStoredFile(path: string) {
  const { data, error } = await supabase.storage
    .from("aurixen-files")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) {
    toast.error("Impossible d'ouvrir le fichier");
    return;
  }
  window.open(data.signedUrl, "_blank");
}
