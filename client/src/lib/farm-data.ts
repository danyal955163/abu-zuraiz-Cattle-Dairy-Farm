import { normalizeWhatsApp, supabase } from "./supabase";

export type Cattle = { id: string; title: string; category: string; breed?: string | null; gender?: string | null; age_months?: number | null; milk_yield_liters?: number | null; price_pkr?: number | null; status: "available" | "reserved" | "sold"; description?: string | null; location?: string | null; cover_image_url?: string | null; };
export type MilkProduct = { id: string; name: string; milk_type: string; price_per_liter: number; unit: string; description?: string | null; image_url?: string | null; is_active: boolean; };
export type MarketplacePost = { seller_id?: string | null; id: string; title: string; category: string; animal_type?: string | null; description?: string | null; asking_price_pkr?: number | null; price_type?: "fixed" | "negotiable" | null; breed?: string | null; breed_caste?: string | null; age_months?: number | null; gender?: string | null; color?: string | null; health_vaccination?: string | null; delivery_details?: string | null; location?: string | null; contact_details?: string | null; whatsapp_number?: string | null; phone_number?: string | null; cover_image_url?: string | null; seller_label?: string | null; is_farm_verified?: boolean; created_at?: string; status?: string; rejection_reason?: string | null; origin?: "user" | "admin" | null; };
export type FarmSettings = { farm_name?: string | null; tagline?: string | null; phone?: string | null; whatsapp?: string | null; location?: string | null; about_text?: string | null; };
export type FarmSnapshot = { cattle: Cattle[]; cattleCount: number | null; products: MilkProduct[]; posts: MarketplacePost[]; settings: FarmSettings | null; milkLiters: number | null; milkPrice: number | null; configured: boolean; error: string | null; };
export type PrivateOrder = { id: string; status: string; delivery_date: string; time_slot: string; address: string; contact_number: string; total_pkr: number; created_at: string; };
export type Notification = { id: string; kind: string; title: string; body?: string | null; read_at?: string | null; created_at: string; };

const emptySnapshot = (error: string | null = null): FarmSnapshot => ({ cattle: [], cattleCount: null, products: [], posts: [], settings: null, milkLiters: null, milkPrice: null, configured: Boolean(supabase), error });

export async function fetchFarmSnapshot(): Promise<FarmSnapshot> {
  if (!supabase) return emptySnapshot("سپابیس کنیکٹ کریں تاکہ حقیقی مویشی، دودھ اور آفرز دکھائی جا سکیں۔");
  const shared = await supabase.from("listings").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(24);
  const [products, settings, inventory] = await Promise.all([
    supabase.from("milk_products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("farm_settings").select("*").eq("id", "public").maybeSingle(),
    supabase.from("milk_inventory").select("available_liters").eq("inventory_date", new Date().toISOString().slice(0, 10)).limit(100),
  ]);
  const legacy = await Promise.all([
    supabase.from("cattle").select("*").eq("status", "available").eq("approved", true).order("created_at", { ascending: false }).limit(8),
    supabase.from("marketplace_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(8),
  ]);
  const sharedRows = (shared.error ? [] : (shared.data ?? [])).map((row: any) => ({ ...row, id: row.id, title: row.title ?? row.name ?? "مویشی کی پیشکش", category: row.category ?? row.animal_type ?? "دیگر", asking_price_pkr: row.asking_price_pkr ?? row.price_pkr ?? row.price, price_pkr: row.price_pkr ?? row.asking_price_pkr ?? row.price, cover_image_url: row.cover_image_url ?? row.image_url, origin: row.source ?? row.origin, status: row.status }));
  const legacyCattle = (legacy[0].data ?? []) as Cattle[];
  const legacyPosts = (legacy[1].data ?? []) as MarketplacePost[];
  const cattle = sharedRows.filter((row: any) => row.source === "admin" || row.origin === "admin").slice(0, 8) as Cattle[];
  const posts = [...sharedRows.filter((row: any) => row.source === "user" || row.origin === "user"), ...legacyPosts].slice(0, 12) as MarketplacePost[];
  const finalCattle = cattle.length ? cattle : legacyCattle;
  const firstError = products.error ?? settings.error ?? inventory.error;
  if (firstError) return { ...emptySnapshot(firstError.message), configured: true };
  return { cattle: finalCattle, cattleCount: finalCattle.length, products: (products.data ?? []) as MilkProduct[], posts, settings: (settings.data ?? null) as FarmSettings | null, milkLiters: (inventory.data ?? []).reduce((sum, row) => sum + Number(row.available_liters ?? 0), 0), milkPrice: products.data?.[0]?.price_per_liter ?? null, configured: true, error: null };
}

export async function submitAdminContactRequest(input: Record<string, unknown>, files: File[] = []) {
  if (!supabase) throw new Error("سپابیس ابھی کنفیگر نہیں ہے۔");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("درخواست بھیجنے کے لیے پہلے لاگ اِن کریں۔");
  const whatsapp = input.whatsapp ? normalizeWhatsApp(String(input.whatsapp)) : null;
  if (input.whatsapp && !whatsapp) throw new Error("درست پاکستانی WhatsApp نمبر درج کریں۔");
  const { data, error } = await supabase.from("admin_contact_requests").insert({ ...input, user_id: auth.user.id, whatsapp_number: whatsapp, status: "pending" }).select().single();
  if (error) throw error;
  for (const file of files.slice(0, 8)) {
    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) throw new Error("صرف تصویر یا ویڈیو فائل قابلِ قبول ہے۔");
    if (file.size > 10 * 1024 * 1024) throw new Error("ہر فائل 10 MB سے کم ہونی چاہیے۔");
    const path = `${auth.user.id}/admin-requests/${data.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await supabase.storage.from("marketplace-media").upload(path, file, { contentType: file.type });
    if (upload.error) throw upload.error;
    const media = await supabase.from("admin_request_media").insert({ request_id: data.id, storage_path: path, media_type: file.type.startsWith("video/") ? "video" : "image" });
    if (media.error) throw media.error;
  }
  return data;
}

export async function createMarketplacePost(input: Record<string, unknown>, files: File[] = []) {
  if (!supabase) throw new Error("Supabase is not configured yet.");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Please sign in before creating a listing.");
  const normalizedWhatsApp = input.whatsapp_number ? normalizeWhatsApp(String(input.whatsapp_number)) : null;
  if (input.whatsapp_number && !normalizedWhatsApp) throw new Error("Enter a valid Pakistani WhatsApp number such as 03XXXXXXXXX or +92XXXXXXXXXX.");
  const { data, error } = await supabase.from("marketplace_posts").insert({ ...input, whatsapp_number: normalizedWhatsApp, seller_id: userData.user.id, status: "pending", is_farm_verified: false }).select().single();
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

export async function fetchFavoriteIds(userId: string) { if (!supabase) return []; const { data, error } = await supabase.from("favorites").select("post_id").eq("user_id", userId); if (error) throw error; return (data ?? []).map(row => row.post_id as string); }
export async function toggleFavorite(userId: string, postId: string, active: boolean) { if (!supabase) throw new Error("Supabase is not configured yet."); const result = active ? await supabase.from("favorites").delete().eq("user_id", userId).eq("post_id", postId) : await supabase.from("favorites").insert({ user_id: userId, post_id: postId }); if (result.error) throw result.error; }
export async function startConversation(userId: string, sellerId: string, listingId: string) { if (!supabase) throw new Error("Supabase is not configured yet."); const conversation = await supabase.from("conversations").insert({ listing_id: listingId }).select().single(); if (conversation.error) throw conversation.error; const owner = await supabase.from("conversation_participants").insert({ conversation_id: conversation.data.id, user_id: userId }); if (owner.error) throw owner.error; const seller = await supabase.from("conversation_participants").insert({ conversation_id: conversation.data.id, user_id: sellerId }); if (seller.error) throw seller.error; return conversation.data.id as string; }
export async function fetchConversations() { if (!supabase) return []; const { data, error } = await supabase.from("conversations").select("id,listing_id,created_at,updated_at").order("updated_at", { ascending: false }); if (error) throw error; return data ?? []; }
export async function fetchMessages(conversationId: string) { if (!supabase) return []; const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,body,voice_path,created_at,read_at").eq("conversation_id", conversationId).order("created_at"); if (error) throw error; return await Promise.all((data ?? []).map(async message => { if (!message.voice_path) return message; const signed = await supabase!.storage.from("voice-messages").createSignedUrl(message.voice_path, 60 * 60); return { ...message, voice_url: signed.data?.signedUrl ?? null }; })); }
export async function sendTextMessage(conversationId: string, senderId: string, body: string) { if (!supabase) throw new Error("Supabase is not configured yet."); const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() }); if (error) throw error; }
export async function uploadVoiceMessage(conversationId: string, senderId: string, blob: Blob) { if (!supabase) throw new Error("Supabase is not configured yet."); const path = `${senderId}/${conversationId}/${crypto.randomUUID()}.webm`; const uploaded = await supabase.storage.from("voice-messages").upload(path, blob, { contentType: blob.type || "audio/webm" }); if (uploaded.error) throw uploaded.error; const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: senderId, voice_path: path }); if (error) throw error; }
