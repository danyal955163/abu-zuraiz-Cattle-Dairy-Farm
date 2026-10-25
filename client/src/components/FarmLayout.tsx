import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Leaf, ArrowUpRight, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, requestOtp, subscribeToAuth } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const navItems = [
  ["Our Farm", "/farm"], ["Cattle Zone", "/cattle"], ["Fresh Milk", "/milk"],
  ["Dairy", "/dairy"], ["Marketplace", "/marketplace"],
] as const;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className="brand-mark" aria-label="Abuzuriaz Cattle Farm home"><span className="brand-seal"><Leaf size={compact ? 15 : 17} strokeWidth={2.4} /></span><span><strong>Abuzuriaz</strong>{!compact && <small>Cattle Farm</small>}</span></Link>;
}

export function AuthDialog({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email address.");
    const { error } = await requestOtp(email);
    if (error) return toast.error(error.message);
    setSent(true); toast.success("Check your inbox for the secure sign-in link.");
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="eyebrow"><ShieldCheck size={15} /> Secure access</div><h2 id="auth-title">Keep your farm activity in one place.</h2><p className="muted">Sign in with a one-time link to publish listings, place milk orders, and view private activity.</p>{!isSupabaseConfigured ? <div className="notice notice-warm">Add the Supabase public URL and anon key to enable sign in.</div> : sent ? <div className="notice notice-green">A secure link was sent to <strong>{email}</strong>.</div> : <form onSubmit={submit} className="stack-form"><label>Email address<input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" required /></label><Button type="submit" className="btn-primary">Send secure link <ArrowUpRight size={16} /></Button></form>}</div></div>;
}

export function FarmLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false); const [authOpen, setAuthOpen] = useState(false); const [user, setUser] = useState<unknown>(null); const [location] = useLocation();
  useEffect(() => subscribeToAuth(setUser), []);
  return <div className="site-shell"><header className="site-header"><div className="site-header-inner"><BrandMark /><nav className={open ? "desktop-nav nav-open" : "desktop-nav"} aria-label="Primary navigation">{navItems.map(([label, href]) => <Link key={href} href={href} className={location === href ? "active" : ""} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/about" onClick={() => setOpen(false)}>About</Link></nav><div className="header-actions"><Link className="icon-link" href={user ? "/account" : "#"} onClick={e => { if (!user) { e.preventDefault(); setAuthOpen(true); } }} aria-label="Account"><span className="account-dot" />{user ? "Account" : "Sign in"}</Link><Link href="/order" className="header-cta">Order milk <ArrowUpRight size={15} /></Link><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></div></div></header>{children}<footer className="site-footer"><div className="footer-grid"><div><BrandMark /><p className="footer-copy">Fresh milk, healthy animals, and a trusted marketplace built around real farm provenance.</p></div><div><p className="footer-label">Explore</p><Link href="/cattle">Cattle Zone</Link><Link href="/milk">Fresh Milk</Link><Link href="/marketplace">Marketplace</Link></div><div><p className="footer-label">Information</p><Link href="/delivery">Delivery information</Link><Link href="/about">About the farm</Link><Link href="/contact">Contact us</Link></div><div><p className="footer-label">Stay connected</p><p className="footer-contact"><Phone size={14} /> Configured by farm admin</p><p className="footer-contact"><Mail size={14} /> Contact details coming soon</p><p className="footer-contact"><MapPin size={14} /> Location coming soon</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Abuzuriaz Cattle Farm</span><span>Privacy · Terms</span></div></footer>{authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}</div>;
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) { return <section className="page-intro"><div className="container"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="intro-copy">{children}</p>}</div></section>; }

export function SetupNotice({ message }: { message?: string | null }) { return message ? <div className="container"><div className="setup-notice"><div><p className="eyebrow">Live data connection</p><p>{message}</p></div><Link href="/contact" className="text-link">See setup notes <ArrowUpRight size={15} /></Link></div></div> : null; }
