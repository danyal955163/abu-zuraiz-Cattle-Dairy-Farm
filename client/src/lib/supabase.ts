import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(supabaseUrl!, publishableKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export async function signInWithGoogle() { if (!supabase) return { error: new Error("Supabase is not configured yet.") }; return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }); }
export async function signInWithPassword(email: string, password: string) { if (!supabase) return { error: new Error("Supabase is not configured yet.") }; return supabase.auth.signInWithPassword({ email: email.trim(), password }); }
export async function signUpWithPassword(email: string, password: string, fullName: string, phone?: string, whatsapp?: string) { if (!supabase) return { error: new Error("Supabase is not configured yet.") }; return supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim(), phone: phone?.trim() || null, whatsapp: whatsapp?.trim() || null }, emailRedirectTo: window.location.origin } }); }
export async function requestPasswordReset(email: string) { if (!supabase) return { error: new Error("Supabase is not configured yet.") }; return supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account` }); }
export async function requestOtp(email: string) { if (!supabase) return { error: new Error("Supabase is not configured yet.") }; return supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } }); }
export async function signOut() { if (supabase) return supabase.auth.signOut(); return { error: null }; }
export async function getCurrentUser() { if (!supabase) return null; const { data } = await supabase.auth.getUser(); return data.user ?? null; }
export async function getProfile(userId: string) { if (!supabase) return null; const { data, error } = await supabase.from("profiles").select("id,username,full_name,display_name,avatar_url,phone").eq("id", userId).maybeSingle(); if (error) throw error; return data; }
export async function updateProfile(userId: string, input: { display_name?: string; phone?: string; avatar_url?: string }) { if (!supabase) throw new Error("Supabase is not configured yet."); const { data, error } = await supabase.from("profiles").update(input).eq("id", userId).select().single(); if (error) throw error; return data; }
export function subscribeToAuth(onChange: (user: unknown) => void) { if (!supabase) return () => undefined; const { data } = supabase.auth.onAuthStateChange((_event, session) => onChange(session?.user ?? null)); return () => data.subscription.unsubscribe(); }
export function normalizeWhatsApp(value: string) { const digits = value.replace(/\D/g, ""); if (!digits) return null; if (digits.startsWith("03") && digits.length === 11) return `92${digits.slice(1)}`; if (digits.startsWith("3") && digits.length === 10) return `92${digits}`; if (digits.startsWith("92") && digits.length >= 12) return digits; return null; }
