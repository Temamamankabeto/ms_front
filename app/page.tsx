"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Facebook,
  FileBadge,
  FileText,
  Globe2,
  Home,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Newspaper,
  Phone,
  Search,
  Send,
  UserPlus,
  Users,
  Youtube,
} from "lucide-react";

import { useSendContact, useTrackApplication } from "@/hooks/home/use-home";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import mesob from "@/app/mesob.jpg";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import i18n from "@/lib/i18n";

const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    children: [
      { label: "About us", href: "/about", icon: Users },
      { label: "Contact", href: "/#contact", icon: Mail },
    ],
  },
  {
    label: "Service",
    href: "/services",
    icon: BriefcaseBusiness,
    children: [
      { label: "City", href: "/services?level=city", icon: Building2 },
      { label: "Sub city", href: "/services?level=subcity", icon: Building2 },
      { label: "Woreda", href: "/services?level=woreda", icon: Building2 },
    ],
  },
  {
    label: "Resource",
    href: "/resources/reports",
    icon: FileText,
    children: [
      { label: "Report", href: "/resources/reports", icon: FileText },
      { label: "Guideline", href: "/resources/guidelines", icon: ClipboardList },
    ],
  },
  { label: "News", href: "/news", icon: Newspaper },
];

const categories = [
  { title: "Employment Services", icon: BriefcaseBusiness },
  { title: "Personal Documents", icon: Users },
  { title: "Certificates", icon: FileBadge },
  { title: "Business Services", icon: Building2 },
  { title: "Payments & Fines", icon: CreditCard },
];
const services = [
  {
    title: "city_services",
    text: "city_services_desc",
    icon: Building2,
  },
  {
    title: "sub_city_services",
    text: "sub_city_services_desc",
    icon: Users,
  },
  {
    title: "woreda_services",
    text: "woreda_services_desc",
    icon: FileText,
  },

  {
    title: "all_services",
    text: "all_services_desc",
    icon: FileText,
  },
];

export default function HomePage() {
  const [applicationNumber, setApplicationNumber] = useState("");
  const { t, changeLanguage } = useLanguage();

  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const trackMutation = useTrackApplication();
  const contactMutation = useSendContact();

  async function handleTrack() {
    if (!applicationNumber.trim()) return;
    try {
      const res = await trackMutation.mutateAsync({ application_number: applicationNumber });
      alert(`Status: ${res.data.status}`);
    } catch {
      alert("Application not found");
    }
  }

  async function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await contactMutation.mutateAsync(contactForm);
      setContactForm({ name: "", email: "", message: "" });
      alert("Your message has been sent successfully.");
    } catch {
      alert("Unable to send your message right now.");
    }
  }

  return (
      <main className="min-h-screen bg-white text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <Image src={mesob} alt="Adama MESOB" width={70} height={70} className="h-10 w-10 rounded-full object-cover" />
              <div className="leading-tight">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Adama<span className="text-sky-500">.</span></h1>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">MESOB eService</p>
              </div>
            </Link>

            <div className="hidden items-center gap-5 lg:flex">
              <div className="group relative">
                <Button variant="outline" className="h-9 min-w-28 justify-between border-0 bg-white px-3 text-xs font-bold shadow-none hover:bg-slate-50">
                  <span className="flex items-center gap-2"><Globe2 className="h-4 w-4" />EN</span>
                  <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" />
                </Button>
                <div className="invisible absolute right-0 top-full z-50 w-48 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border bg-white p-2 shadow-xl">
                    {["Afaan Oromoo", "English", "አማርኛ"].map((item) => {
                      const code =
                          item === "English"
                              ? "en"
                              : item === "Afaan Oromoo"
                                  ? "om"
                                  : "am";
                      return (
                          <Button
                              key={item}
                              type="button"
                              variant="ghost"
                              onClick={() => changeLanguage(code)}
                              className="h-auto w-full justify-start rounded-lg px-3 py-3 text-left text-sm font-semibold"
                          >
                            {item}
                            {i18n.language === code && (
                                <Check className="ml-auto h-4 w-4" />
                            )}
                          </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="group relative">
                <Button className="h-10 rounded-full bg-sky-500 px-7 text-xs font-black uppercase tracking-wide shadow-lg shadow-sky-100 hover:bg-sky-600">
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="invisible absolute right-0 top-full z-50 w-52 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border bg-white p-3 text-[#08214a] shadow-xl">
                    <Button asChild variant="ghost" className="h-auto w-full justify-start rounded-lg px-3 py-3 text-sm font-semibold">
                      <Link href="/login"><LockKeyhole className="h-4 w-4" />Sign In</Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-auto w-full justify-start rounded-lg px-3 py-3 text-sm font-semibold">
                      <Link href="/register"><UserPlus className="h-4 w-4" />Create Account</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden"><Menu /></Button>
          </div>

          <nav className="mx-auto hidden min-h-14 max-w-7xl items-center justify-center bg-white px-4 md:px-6 lg:flex">
            {navigationItems.map((item) => {
              const ItemIcon = item.icon;

              if (!item.children) {
                return (
                    <Button
                        key={item.label}
                        asChild
                        variant="ghost"
                        className="h-14 rounded-none border-b-2 border-transparent px-5 text-sm font-semibold text-slate-700 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600"
                    >
                      <Link href={item.href}>
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                );
              }

              return (
                  <div key={item.label} className="group relative">
                    <Button
                        asChild
                        variant="ghost"
                        className="h-14 rounded-none border-b-2 border-transparent px-5 text-sm font-semibold text-slate-700 hover:border-sky-500 hover:bg-sky-50 hover:text-sky-600"
                    >
                      <Link href={item.href}>
                        <ItemIcon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                      </Link>
                    </Button>

                    <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;

                          return (
                              <Button
                                  key={child.label}
                                  asChild
                                  variant="ghost"
                                  className="h-auto w-full justify-start rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                              >
                                <Link href={child.href}>
                                  <ChildIcon className="h-4 w-4" />
                                  {child.label}
                                </Link>
                              </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
              );
            })}
          </nav>
        </header>

        <section className="px-4 pb-8 pt-6 md:px-6">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-50 px-5 py-20 text-center md:px-10 md:py-32">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(250,204,21,0.18),transparent_18%),radial-gradient(circle_at_40%_62%,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_62%_48%,rgba(56,189,248,0.16),transparent_26%)]" />
            <div className="relative mx-auto max-w-5xl">
              <h2 className="mx-auto max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
                {t("hero_title")}

              </h2>

              <div className="mx-auto mt-14 max-w-5xl">
                <div className="relative rounded-full border border-slate-200 bg-white shadow-sm">
                  <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                      value={applicationNumber}
                      onChange={(e) => setApplicationNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTrack();
                      }}
                      placeholder="Search"
                      className="h-14 rounded-full border-0 bg-transparent pl-12 pr-28 text-sm shadow-none focus-visible:ring-0"
                  />
                  <Button
                      onClick={handleTrack}
                      disabled={trackMutation.isPending}
                      className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-sky-500 px-6 text-sm font-bold hover:bg-sky-600"
                  >
                    Search
                  </Button>
                </div>
                {/*
              <div className="mt-5 flex flex-wrap items-center gap-3 text-left">
                <span className="text-sm font-bold text-slate-400">#Top searches:</span>
                {categories.map((category) => (
                  <Link
                    key={category.title}
                    href="/services"
                    className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600"
                  >
                    {category.title}
                  </Link>
                ))}
              </div> */}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto grid scroll-mt-32 max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_440px] md:px-8">
          <div className="rounded-2xl bg-white p-7 shadow-lg">
            <div className="mb-6 flex items-center justify-between"><h3 className="text-3xl font-black">Our Services</h3>
              <Link href="/services" className="flex items-center gap-2 font-bold text-[#063d91]">View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service, index) =>
                  <Link href="/services" key={service.title} className="rounded-xl border bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${index % 3 === 0 ? "bg-emerald-100 text-emerald-700" : index % 3 === 1 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      <service.icon className="h-8 w-8" />
                    </div>
                    <h4 className="font-black">{t(service.title)}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {t(service.text)}
                    </p>
                  </Link>)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-lg">
            <h3 className="mb-6 text-3xl font-black">Contact Us</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="relative"><Users className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} className="h-14 rounded-xl pl-12" placeholder="Name" required /></div>
              <div className="relative"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><Input type="email" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} className="h-14 rounded-xl pl-12" placeholder="Email" required /></div>
              <div className="relative"><MessageSquare className="absolute left-4 top-5 h-5 w-5 text-slate-400" /><Textarea value={contactForm.message} onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))} className="min-h-40 rounded-xl pl-12 pt-4" placeholder="Message" required /></div>
              <Button disabled={contactMutation.isPending} className="h-14 w-full rounded-xl bg-sky-500 text-base font-bold hover:bg-sky-600"><Send className="mr-2 h-5 w-5" />{contactMutation.isPending ? "Sending..." : "Send Message"}</Button>
            </form>
          </div>
        </section>

        <footer className="bg-gradient-to-r from-[#06295a] to-[#04507f] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-5 md:px-8">
            <div><div className="flex items-center gap-3"><Image src={mesob} alt="Adama MESOB" width={58} height={58} className="rounded-full" /><div className="text-xl font-black">Adama MESOB<br /><span className="text-emerald-400">eService</span></div></div><p className="mt-5 text-sm leading-7 text-white/85">Tajaajila elektiroonikaalaa bulchiinsa gaarii mirkaneessuuf hojjanna.</p></div>
            <FooterLinks
                title="About Us"
                items={[
                  { label: "About Us", href: "/about" },
                  { label: "Service Provider", href: "/service-providers" },
                  { label: "Vision & Mission", href: "/about" },
                  { label: "Our Team", href: "/about" },
                ]}
            />
            <FooterLinks
                title={t("services")}
                items={[
                  { label:  t("city_services"), href: "/services?level=city" },
                  { label: t("sub_city_services"), href: "/services?level=subcity" },
                  { label: t("woreda_services"), href: "/services?level=woreda" },
                  { label: t("all_services"), href: "/services" },
                ]}
            />
            <div><h4 className="mb-4 font-black">Contact</h4><p className="flex gap-3 text-sm"><MapPin className="h-5 w-5" />Adama, Oromia, Ethiopia</p><p className="mt-4 flex gap-3 text-sm"><Phone className="h-5 w-5" />+251 9141</p></div>
          </div>
          <div className="border-t border-white/20"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm md:flex-row md:px-8"><p>© 2026 Adama MESOB eService. All Rights Reserved.</p><div className="flex items-center gap-4"><span>Follow Us</span><Facebook /><Send /><Youtube /><Linkedin /></div></div></div>
        </footer>
        <ChatbotWidget source="public-home" />
      </main>
  );
}

type FooterLinkItem = { label: string; href: string };

function FooterLinks({ title, items }: { title: string; items: FooterLinkItem[] }) {
  return (
      <div>
        <h4 className="mb-4 font-black">{title}</h4>
        <ul className="space-y-3 text-sm text-white/85">
          {items.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
          ))}
        </ul>
      </div>
  );
}
