import { supabase } from "./supabase";

export type Cattle = { id: string; title: string; category: string; breed?: string | null; gender?: string | null; age_months?: number | null; milk_yield_liters?: number | null; price_pkr?: number | null; status: "available" | "reserved" | "sold"; description?: string | null; location?: string | null; cover_image_url?: string | null; };
export type MilkProduct = { id: string; name: string; milk_type: string; price_per_liter: number; unit: string; description?: string | null; image_url?: string | null; is_active: boolean; };
export type MarketplacePost = { id: string; title: string; category: string; description?: string | null; asking_price_pkr?: number | null; location?: string | null; contact_details?: string | null; cover_image_url?: string | null; seller_label?: string | null; is_farm_verified?: boolean; created_at?: string; status?: string; };
export type FarmSettings = { farm_name?: string | null; tagline?: string | null; phone?: string | null; whatsapp?: string | null; location?: string | null; about_text?: string | null; };
export type FarmSnapshot = { cattle: Cattle[]; cattleCount: number | null; products: MilkProduct[]; posts: MarketplacePost[]; settings: FarmSettings | null; milkLiters: number | null; milkPrice: number | null; configured: boolean; error: string | null; };
export type PrivateOrder = { id: string; status: string; delivery_date: string; time_slot: string; address: string; contact_number: string; total_pkr: number; created_at: string; };
export type Notification = { id: string; kind: string; title: string; body?: string | null; read_at?: string | null; created_at: string; };

const emptySnapshot = (error: string | null = null): FarmSnapshot => ({ cattle: [], cattleCount: null, products: [], posts: [], settings: null, milkLiters: null, milkPrice: null, configured: Boolean(supabase), error });

export async function fetchFarmSnapshot(): Promise<FarmSnapshot> {
  if (!supabase) return emptySnapshot("Connect Supabase to load live farm inventory, products, and marketplace posts.");
  const [cattle, cattleCount, products, posts, settings, inventory] = await Promise.all([
    supabase.from("cattle").select("*").eq("status", "available").eq("approved", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("cattle").select("id", { count: "exact", head: true }).eq("status", "available").eq("approved", true),
    supabase.from("milk_products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("marketplace_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(8),
    supabase.from("farm_settings").select("*").eq("id", "public").maybeSingle(),
    supabase.from("milk_inventory").select("available_liters").eq("inventory_date", new Date().toISOString().slice(0, 10)).limit(100),
  ]);
  const firstError = cattle.error ?? cattleCount.error ?? products.error ?? posts.error ?? settings.error ?? inventory.error;
  if (firstError) return { ...emptySnapshot(firstError.message), configured: true };
  const milkLiters = (inventory.data ?? []).reduce((sum, row) => sum + Number(row.available_liters ?? 0), 0);
  return { cattle: (cattle.data ?? []) as Cattle[], cattleCount: cattleCount.count ?? 0, products: (products.data ?? []) as MilkProduct[], posts: (posts.data ?? []) as MarketplacePost[], settings: (settings.data ?? null) as FarmSettings | null, milkLiters, milkPrice: products.data?.[0]?.price_per_liter ?? null, configured: true, error: null };
}

export async function createMarketplacePost(input: Record<string, unknown>, files: File[] = []) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Please sign in before creating a listing.");
  const { data, error } = await supabase.from("marketplace_posts").insert({ ...input, seller_id: userData.user.id, status: "pending", is_farm_verified: false }).select().single();
  if (error) throw error;
  let firstImageUrl: string | null = null;
  for (const file of files) {
    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) throw new Error("Only image or video files are allowed.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Each upload must be 10 MB or smaller.");
    const path = `${userData.user.id}/${data.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await supabase.storage.from("marketplace-media").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) throw upload.error;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    if (!firstImageUrl && mediaType === "image") {
      const signed = await supabase.storage.from("marketplace-media").createSignedUrl(path, 60 * 60 * 24 * 365);
      firstImageUrl = signed.data?.signedUrl ?? null;
    }
    const media = await supabase.from("marketplace_media").insert({ post_id: data.id, storage_path: path, media_type: mediaType });
    if (media.error) throw media.error;
  }
  if (firstImageUrl) { await supabase.from("marketplace_posts").update({ cover_image_url: firstImageUrl }).eq("id", data.id); }
  return data;
}

export async function placeMilkOrder(input: { productId: string; quantity: number; deliveryDate: string; timeSlot: string; address: string; contactNumber: string; recurring: boolean }) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Please sign in before placing an order.");
  const { data, error } = await supabase.rpc("place_milk_order", { p_user_id: userData.user.id, p_product_id: input.productId, p_quantity_liters: input.quantity, p_delivery_date: input.deliveryDate, p_time_slot: input.timeSlot, p_address: input.address, p_contact_number: input.contactNumber, p_recurring: input.recurring });
  if (error) throw error;
  return data;
}

export async function fetchMyOrders() { if (!supabase) return []; const { data, error } = await supabase.from("orders").select("id,status,delivery_date,time_slot,address,contact_number,total_pkr,created_at").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as PrivateOrder[]; }
export async function fetchMyPosts() { if (!supabase) return []; const { data, error } = await supabase.from("marketplace_posts").select("id,title,category,asking_price_pkr,location,status,created_at").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as MarketplacePost[]; }
export async function fetchNotifications() { if (!supabase) return []; const { data, error } = await supabase.from("notifications").select("id,kind,title,body,read_at,created_at").order("created_at", { ascending: false }); if (error) throw error; return (data ?? []) as Notification[]; }
export async function markNotificationRead(id: string) { if (!supabase) return; const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id); if (error) throw error; }
export async function reportMarketplacePost(postId: string, reason: string) { if (!supabase) throw new Error("Supabase is not configured yet."); const { data: userData } = await supabase.auth.getUser(); if (!userData.user) throw new Error("Please sign in before reporting a listing."); const { error } = await supabase.from("reports").insert({ reporter_id: userData.user.id, post_id: postId, reason }); if (error) throw error; }
