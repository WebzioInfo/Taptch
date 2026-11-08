'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardCustomizerPreview } from '@/campaigns/instagram-card/components/customization/CardCustomizerPreview';
import { INSTAGRAM_CAMPAIGN_CONFIG, campaignBrandConfig } from '@/campaigns/instagram-card/config';
import type { CardDesignState, PriceBreakdown, DesignOption } from '@/campaigns/instagram-card/types';
import {
  Instagram,
  Sparkles,
  Check,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Loader2,
  ChevronDown,
  MessageSquare,
  Smartphone,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export default function InstagramCardStorefrontPage() {
  // Catalog & Pricing states
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [designOption, setDesignOption] = useState<DesignOption>('DIY');
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  // Hero Card Showcase states
  const [heroSide, setHeroSide] = useState<'front' | 'back'>('front');
  const [simulatingTap, setSimulatingTap] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Customization studio states
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [designState, setDesignState] = useState<CardDesignState>({
    templateId: 'classic-dark',
    backgroundColor: '#0A0A0C',
    textColor: '#FFFFFF',
    fontFamily: 'Inter',
    accentColor: '#2563EB',
    instagramUsername: 'creator',
    headline: 'Founder & Visual Artist',
    tagline: 'Tap with any phone to connect',
  });

  // Customer checkout form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPostal, setShippingPostal] = useState('');
  const [designNotes, setDesignNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fetch initial campaign products
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/v1/campaigns/instagram-card/products');
        const json = await res.json();
        if (json.success && json.data.products.length > 0) {
          setProducts(json.data.products);
          setSelectedProductId(json.data.products[0].id);
        }
      } catch (err) {
        console.error('Failed to load campaign catalog', err);
      }
    }
    loadCatalog();
  }, []);

  // Fetch server-calculated pricing whenever configuration changes
  useEffect(() => {
    if (!selectedProductId) return;

    async function updatePricing() {
      setLoadingPricing(true);
      try {
        const res = await fetch('/api/v1/campaigns/instagram-card/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProductId,
            quantity,
            designOption,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setPricing(json.data);
        }
      } finally {
        setLoadingPricing(false);
      }
    }
    updatePricing();
  }, [selectedProductId, quantity, designOption]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Interactive Tap Simulator
  const handleSimulateTap = () => {
    if (simulatingTap) return;
    setSimulatingTap(true);
    setTimeout(() => {
      setShowNotification(true);
      setTimeout(() => {
        setSimulatingTap(false);
      }, 3500);
    }, 600);
  };

  const handleSelectProductAndScroll = (productId: string, templateId?: string) => {
    setSelectedProductId(productId);
    if (templateId) {
      const tpl = INSTAGRAM_CAMPAIGN_CONFIG.templates.find((t) => t.id === templateId);
      if (tpl) {
        setDesignState((prev) => ({
          ...prev,
          templateId: tpl.id,
          backgroundColor: tpl.previewBg.startsWith('linear') ? '#833AB4' : tpl.previewBg,
          textColor: tpl.previewText,
          accentColor: tpl.accentColor,
        }));
      }
    }
    const customizeElem = document.getElementById('customize');
    if (customizeElem) {
      customizeElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        productId: selectedProductId,
        quantity,
        designOption,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone,
        instagramUsername: designState.instagramUsername,
        instagramUrl: `https://instagram.com/${designState.instagramUsername}`,
        shippingAddress: {
          recipientName: customerName,
          street: shippingStreet,
          city: shippingCity,
          state: shippingState,
          postalCode: shippingPostal,
          country: 'India',
          phone: customerPhone,
        },
        designNotes: designNotes || undefined,
        designState,
      };

      const res = await fetch('/api/v1/campaigns/instagram-card/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to place order.');
      }

      setCreatedOrder(json.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unexpected order submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const faqItems = [
    {
      q: 'How does the Instagram NFC card work?',
      a: 'The card contains an embedded high-frequency NTAG216 contactless microchip. When tapped against any modern smartphone, the phone instantly recognizes the card and opens your Instagram profile in the Instagram app or browser.',
    },
    {
      q: 'Which smartphones are compatible?',
      a: 'Compatible with virtually all smartphones released since 2018. All iPhones from iPhone XS/XR to iPhone 16 Pro, and all NFC-enabled Android devices from Samsung, Google Pixel, OnePlus, Xiaomi, and Vivo.',
    },
    {
      q: 'Does the other person need an app installed?',
      a: 'No app, download, or subscription is ever required. Contactless NFC works natively at the operating system level on both iOS and Android.',
    },
    {
      q: 'Can I change my Instagram handle later?',
      a: 'Cards are pre-encoded directly with your verified handle URL. If you update your username in the future, simply reach out to our WhatsApp support to update your dynamic routing seamlessly.',
    },
    {
      q: 'How long does production and shipping take?',
      a: 'Your card is precision-printed and programmed within 24 to 48 hours. Express insured courier delivery delivers to your doorstep anywhere in India within 3 to 5 business days.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#111827] antialiased selection:bg-[#2563EB] selection:text-white font-sans">
      {/* ========================================================= */}
      {/* 1. MINIMAL APPLE-STYLE NAVIGATION */}
      {/* ========================================================= */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-5 sm:px-8">
          <Link href="/campaigns/instagram-card" className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#111827] flex items-center justify-center text-white shadow-xs">
              <Instagram className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#111827]">
              {campaignBrandConfig.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-7 text-xs font-medium text-[#64748B]">
            <a href="#hero" className="hover:text-[#111827] transition-colors">
              Overview
            </a>
            <a href="#collection" className="hover:text-[#111827] transition-colors">
              Collection
            </a>
            <a href="#how-it-works" className="hover:text-[#111827] transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-[#111827] transition-colors">
              FAQ
            </a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/campaigns/instagram-card/track"
              className="text-xs font-medium text-[#64748B] hover:text-[#111827] hidden sm:inline transition-colors"
            >
              Track Order
            </Link>
            <a href="#customize">
              <Button
                size="sm"
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs h-8 px-4 rounded-full transition-all shadow-xs"
              >
                Create Your Card
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ========================================================= */}
      {/* SECTION 1: HERO — LARGE PRODUCT HERO, MINIMAL TEXT */}
      {/* ========================================================= */}
      <section id="hero" className="relative pt-16 sm:pt-24 pb-16 overflow-hidden">
        {/* Soft Radial Ambient Lighting */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[450px] w-[650px] rounded-full bg-blue-50/60 blur-3xl opacity-70" />
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center relative z-10 space-y-6">
          {/* Eyebrow */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-medium text-[#64748B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] animate-pulse" />
            <span>Contactless Smart Identity</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#111827] leading-[1.08] max-w-3xl mx-auto">
            Your Instagram.
            <br />
            <span className="text-[#2563EB]">One Tap Away.</span>
          </h1>

          {/* Subhead */}
          <p className="text-base sm:text-xl text-[#64748B] max-w-xl mx-auto font-normal leading-relaxed">
            Your profile. Your card. One simple tap.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a href="#customize" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold h-11 px-7 rounded-full text-sm shadow-md transition-all">
                <span>Create Your Card</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </a>
            <a href="#collection" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#E5E7EB] text-[#111827] hover:bg-[#F8FAFC] font-semibold h-11 px-7 rounded-full text-sm transition-all"
              >
                Explore Collection
              </Button>
            </a>
          </div>

          {/* HERO PRODUCT VISUALIZATION WITH STUDIO LIGHTING */}
          <div className="pt-10 sm:pt-14 pb-4 flex flex-col items-center">
            {/* Simulated Phone Tap Notification Banner */}
            {showNotification && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm w-full mx-auto p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 flex items-center space-x-3 text-left">
                <div className="h-9 w-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Website NFC Tag
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    Open instagram.com/@{designState.instagramUsername}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">
                  Tapped
                </Badge>
              </div>
            )}

            {/* The Floating Card Hero */}
            <div className="relative group p-2">
              <CardCustomizerPreview
                design={designState}
                side={heroSide}
                material={selectedProduct?.material || 'PVC'}
                className="mx-auto"
                interactive={true}
                onFlip={() => setHeroSide(heroSide === 'front' ? 'back' : 'front')}
              />
            </div>

            {/* Interactive Hero Controls: Flip & Tap Simulator */}
            <div className="mt-6 flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHeroSide(heroSide === 'front' ? 'back' : 'front')}
                className="rounded-full text-xs h-8 px-4 border-[#E5E7EB] text-[#64748B] hover:text-[#111827] gap-1.5 transition-colors"
              >
                <RotateCw className="h-3 w-3" />
                <span>Flip to {heroSide === 'front' ? 'Back' : 'Front'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateTap}
                disabled={simulatingTap}
                className="rounded-full text-xs h-8 px-4 border-blue-200 bg-blue-50/50 text-[#2563EB] hover:bg-blue-100/60 gap-1.5 transition-colors font-medium"
              >
                <Smartphone className="h-3 w-3" />
                <span>{simulatingTap ? 'Phone Tapped...' : 'Simulate Phone Tap'}</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: EDITORIAL PRODUCT COLLECTION (ASYMMETRIC) */}
      {/* ========================================================= */}
      <section id="collection" className="py-20 bg-[#F8FAFC] border-y border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mx-auto text-center space-y-2 mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
              Crafted for Connection.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Engineered with precision materials and embedded with contactless NTAG216 silicon.
            </p>
          </div>

          {/* Asymmetric Product Showcase */}
          <div className="space-y-6">
            {/* Top Row: 1 Large Hero Card (Matte Obsidian) + 2 Stacked Supporting Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Feature 1: Matte Obsidian PVC (Large Hero Card, Span 7) */}
              <div className="lg:col-span-7 rounded-3xl bg-white border border-[#E5E7EB] p-8 sm:p-10 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-[#111827] text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Most Popular
                    </Badge>
                    <span className="text-lg font-bold text-[#111827]">₹499</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#111827] tracking-tight">
                    Matte Obsidian PVC
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-md leading-relaxed">
                    Velvet-soft matte texture with deep obsidian tone and scratch-resistant protective overlay. Waterproof, ultra-lightweight, and durable.
                  </p>
                </div>

                <div className="py-8 flex justify-center">
                  <CardCustomizerPreview
                    design={{
                      ...designState,
                      templateId: 'classic-dark',
                      backgroundColor: '#0A0A0C',
                      textColor: '#FFFFFF',
                      accentColor: '#2563EB',
                    }}
                    side="front"
                    material="PVC"
                    className="max-w-[310px] sm:max-w-[340px]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
                  <div className="text-xs text-[#64748B]">
                    <span>Waterproof • High Memory Chip</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSelectProductAndScroll('prod_ig_matte_pvc', 'classic-dark')}
                    className="bg-[#111827] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-full h-8 px-4 transition-colors"
                  >
                    Select Matte Obsidian
                  </Button>
                </div>
              </div>

              {/* Stacked Supporting Cards (Span 5) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* Supporting Card 1: Pure White Minimal */}
                <div className="flex-1 rounded-3xl bg-white border border-[#E5E7EB] p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                      Architectural Pure
                    </span>
                    <span className="text-sm font-bold text-[#111827]">₹499</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#111827] tracking-tight">
                    Pure White Minimal
                  </h4>
                  <p className="text-xs text-[#64748B] mb-4">
                    Ultra-clean ceramic white finish with high-contrast laser typography.
                  </p>

                  <div className="py-3 flex justify-center">
                    <CardCustomizerPreview
                      design={{
                        ...designState,
                        templateId: 'pure-minimalist',
                        backgroundColor: '#FFFFFF',
                        textColor: '#111827',
                        accentColor: '#2563EB',
                      }}
                      side="front"
                      material="PVC"
                      className="max-w-[240px]"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectProductAndScroll('prod_ig_matte_pvc', 'pure-minimalist')}
                    className="w-full mt-2 rounded-full border-[#E5E7EB] text-xs font-semibold hover:bg-slate-50"
                  >
                    Select Pure White
                  </Button>
                </div>

                {/* Supporting Card 2: Vibrant Sunset */}
                <div className="flex-1 rounded-3xl bg-white border border-[#E5E7EB] p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
                      Creator Edition
                    </span>
                    <span className="text-sm font-bold text-[#111827]">₹499</span>
                  </div>
                  <h4 className="text-lg font-bold text-[#111827] tracking-tight">
                    Vibrant Sunset
                  </h4>
                  <p className="text-xs text-[#64748B] mb-4">
                    Iconic Instagram purple-to-amber radial glow engineered for creators and influencers.
                  </p>

                  <div className="py-3 flex justify-center">
                    <CardCustomizerPreview
                      design={{
                        ...designState,
                        templateId: 'gradient-instagram',
                        backgroundColor: '#833AB4',
                        textColor: '#FFFFFF',
                        accentColor: '#E1306C',
                      }}
                      side="front"
                      material="PVC"
                      className="max-w-[240px]"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectProductAndScroll('prod_ig_matte_pvc', 'gradient-instagram')}
                    className="w-full mt-2 rounded-full border-[#E5E7EB] text-xs font-semibold hover:bg-slate-50"
                  >
                    Select Vibrant Sunset
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Panoramic Luxury Titanium Brushed Metal Card */}
            <div className="rounded-3xl bg-[#111827] text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-amber-300 border border-white/10">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Executive Flagship</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Titanium Brushed Steel
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                    Crafted with a 24g weighted stainless steel core, precision laser-etched Instagram insignia, and anti-metal ferrite shielding layer for instant contactless read speeds.
                  </p>
                  <div className="flex items-center space-x-6 pt-2">
                    <div>
                      <span className="text-xs text-slate-400 block">Weight</span>
                      <span className="text-sm font-bold text-white">24 Grams</span>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <span className="text-xs text-slate-400 block">Core</span>
                      <span className="text-sm font-bold text-white">316L Steel</span>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <span className="text-xs text-slate-400 block">Price</span>
                      <span className="text-base font-bold text-amber-300">₹1,499</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => handleSelectProductAndScroll('prod_ig_stainless_steel', 'executive-metal')}
                      className="bg-white hover:bg-slate-100 text-[#111827] font-semibold text-xs h-9 px-6 rounded-full transition-all shadow-md"
                    >
                      Select Titanium Edition
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-5 flex justify-center">
                  <CardCustomizerPreview
                    design={{
                      ...designState,
                      templateId: 'executive-metal',
                      backgroundColor: '#18181D',
                      textColor: '#F3E5AB',
                      accentColor: '#D4AF37',
                    }}
                    side="front"
                    material="METAL"
                    className="max-w-[310px] sm:max-w-[330px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 3: HOW IT WORKS — THREE SIMPLE STEPS */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="max-w-lg mx-auto text-center space-y-2 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Three steps from tap to follow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-left">
            {/* Step 01 */}
            <div className="space-y-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tighter block">
                01
              </span>
              <h3 className="text-lg font-bold text-[#111827]">
                Choose your design.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Select your material and customize your card with real-time interactive preview.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tighter block">
                02
              </span>
              <h3 className="text-lg font-bold text-[#111827]">
                We craft & program.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Pre-encoded with your verified Instagram URL and courier-shipped to your doorstep.
              </p>
            </div>

            {/* Step 03 */}
            <div className="space-y-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#2563EB] tracking-tighter block">
                03
              </span>
              <h3 className="text-lg font-bold text-[#111827]">
                Tap to connect.
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Tap against any smartphone to open your Instagram profile instantly. No app required.
              </p>
            </div>
          </div>

          {/* Compatibility Ribbon */}
          <div className="mt-16 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB] flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Native iOS & Android Compatibility</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Zero App Download Needed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Lifetime NFC Chip Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 4: CUSTOM DESIGN STUDIO & CHECKOUT */}
      {/* ========================================================= */}
      <section id="customize" className="py-20 bg-[#F8FAFC] border-t border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mx-auto text-center space-y-2 mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827]">
              Made to look like you.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Personalize every detail online, or collaborate directly with our design team.
            </p>
          </div>

          {createdOrder ? (
            /* Post-Purchase Order Confirmation */
            <div className="max-w-xl mx-auto rounded-3xl border border-[#E5E7EB] bg-white p-8 sm:p-10 shadow-sm text-center space-y-6">
              <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Check className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold text-[#111827]">Order Successfully Placed</h3>
                <div className="text-xs font-mono bg-[#F8FAFC] py-1.5 px-3 rounded-md border border-[#E5E7EB] inline-block font-semibold text-[#2563EB]">
                  Order #{createdOrder.orderNumber}
                </div>
                <p className="text-xs text-[#64748B] max-w-md mx-auto pt-1">
                  Thank you, {customerName}! Complete your payment via UPI to approve artwork and commence production.
                </p>
              </div>

              {/* Order Amount Details */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-xs space-y-2 text-left">
                <div className="flex justify-between font-medium text-[#111827]">
                  <span>Item</span>
                  <span>{selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Instagram Handle</span>
                  <span className="font-semibold text-[#111827]">@{designState.instagramUsername}</span>
                </div>
                <div className="flex justify-between text-[#64748B]">
                  <span>Total Due</span>
                  <span className="font-bold text-[#2563EB] text-sm">₹{createdOrder.totalAmount}</span>
                </div>
              </div>

              {/* Offline Settlement Instructions */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-left space-y-2">
                <span className="font-bold text-blue-950 block">UPI Settlement:</span>
                <p className="text-blue-900 font-mono text-sm font-semibold">
                  {campaignBrandConfig.payment.upiVpa}
                </p>
                <p className="text-[11px] text-blue-800">
                  Bank: {campaignBrandConfig.payment.bankName} • Account: {campaignBrandConfig.payment.accountNumber} • IFSC: {campaignBrandConfig.payment.ifscCode}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={`https://wa.me/${campaignBrandConfig.supportWhatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello ${campaignBrandConfig.name}, I have placed Instagram Card Order #${createdOrder.orderNumber} for ₹${createdOrder.totalAmount}. My Instagram is @${designState.instagramUsername}. Here is my payment confirmation.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-block"
                >
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-10 text-xs rounded-full shadow-xs">
                    <MessageSquare className="h-4 w-4" />
                    <span>Confirm Order on WhatsApp</span>
                  </Button>
                </a>

                <a
                  href={`/api/v1/campaigns/instagram-card/documents?orderId=${createdOrder.orderId}&type=invoice`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-block"
                >
                  <Button variant="outline" className="w-full text-xs h-9 border-[#E5E7EB] text-[#64748B] hover:text-[#111827] rounded-full">
                    Download Order Invoice PDF
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            /* Main Studio Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Live Sticky Card Visualizer */}
              <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                    Interactive Preview
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewSide(previewSide === 'front' ? 'back' : 'front')}
                    className="h-7 text-xs border-[#E5E7EB] text-[#64748B] hover:text-[#111827] rounded-full gap-1.5"
                  >
                    <RotateCw className="h-3 w-3" />
                    <span>Flip to {previewSide === 'front' ? 'Back' : 'Front'}</span>
                  </Button>
                </div>

                <div className="flex justify-center p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs">
                  <CardCustomizerPreview
                    design={designState}
                    side={previewSide}
                    material={selectedProduct?.material || 'PVC'}
                    interactive={true}
                    onFlip={() => setPreviewSide(previewSide === 'front' ? 'back' : 'front')}
                  />
                </div>

                <div className="text-center text-xs text-[#64748B] space-y-1">
                  <div className="font-semibold text-[#111827]">
                    Standard CR80 Size • 85.6mm × 53.98mm
                  </div>
                  <div>Embedded with contactless high-memory NTAG216 chip.</div>
                </div>
              </div>

              {/* Right Column: Customization & Checkout Controls */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E7EB] p-7 sm:p-9 shadow-xs space-y-7">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSubmitOrder} className="space-y-7">
                  {/* Step 1: Design Path Selector (Option A vs Option B) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                      1. Customization Mode
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setDesignOption('DIY')}
                        className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                          designOption === 'DIY'
                            ? 'border-[#2563EB] ring-1 ring-[#2563EB] bg-blue-50/30'
                            : 'border-[#E5E7EB] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#111827]">Design It Yourself</span>
                          <Badge variant="secondary" className="text-[10px]">Included</Badge>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          Instant real-time online customizer. Choose theme, handle, and preview immediately.
                        </p>
                      </div>

                      <div
                        onClick={() => setDesignOption('DESIGNER')}
                        className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                          designOption === 'DESIGNER'
                            ? 'border-[#2563EB] ring-1 ring-[#2563EB] bg-blue-50/30'
                            : 'border-[#E5E7EB] bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#111827]">Assign Our Designer</span>
                          <Badge className="bg-[#2563EB] text-white text-[10px]">+₹200</Badge>
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">
                          Personalized WhatsApp coordination with our design team for custom logo, fonts, and proofs.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Select Card Material */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                      2. Select Material & Finish
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {products.map((p) => {
                        const isSel = selectedProductId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProductId(p.id)}
                            className={`cursor-pointer rounded-2xl border p-3.5 text-left transition-all ${
                              isSel
                                ? 'border-[#2563EB] ring-1 ring-[#2563EB] bg-blue-50/30'
                                : 'border-[#E5E7EB] bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-[#111827]">{p.material}</span>
                              {isSel && <Check className="h-3.5 w-3.5 text-[#2563EB]" />}
                            </div>
                            <div className="text-sm font-bold text-[#111827]">₹{p.basePrice}</div>
                            <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1">
                              {p.name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Card Content */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                      3. Instagram Information
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">
                          Instagram Username *
                        </label>
                        <div className="flex rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 items-center text-xs">
                          <span className="text-[#64748B] font-bold select-none">@</span>
                          <input
                            type="text"
                            required
                            value={designState.instagramUsername}
                            onChange={(e) =>
                              setDesignState({
                                ...designState,
                                instagramUsername: e.target.value.replace(/^@/, '').trim(),
                              })
                            }
                            placeholder="yourusername"
                            className="flex-1 bg-transparent py-2.5 px-1 text-[#111827] focus:outline-none text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">
                          Professional Title / Bio Line
                        </label>
                        <Input
                          type="text"
                          value={designState.headline || ''}
                          onChange={(e) =>
                            setDesignState({ ...designState, headline: e.target.value })
                          }
                          placeholder="e.g. Founder & Creative Director"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Theme Palettes (DIY Mode Only) */}
                  {designOption === 'DIY' && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                        4. Visual Theme
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {INSTAGRAM_CAMPAIGN_CONFIG.templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() =>
                              setDesignState({
                                ...designState,
                                templateId: tpl.id,
                                backgroundColor: tpl.previewBg.startsWith('linear') ? '#833AB4' : tpl.previewBg,
                                textColor: tpl.previewText,
                                accentColor: tpl.accentColor,
                              })
                            }
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                              designState.templateId === tpl.id
                                ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] font-bold ring-1 ring-[#2563EB]'
                                : 'border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50'
                            }`}
                          >
                            <div className="text-[11px] truncate">{tpl.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Shipping & Delivery Info */}
                  <div className="space-y-4 pt-3 border-t border-[#E5E7EB]">
                    <label className="text-xs font-bold text-[#111827] uppercase tracking-wider block">
                      5. Shipping & Contact Details
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">
                          Recipient Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full name"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">
                          Phone Number * (for Courier & WhatsApp)
                        </label>
                        <Input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="text-xs font-medium text-[#111827] block mb-1">
                        Street Address *
                      </label>
                      <Input
                        type="text"
                        required
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        placeholder="Flat/House no., building, street"
                        className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-left">
                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">City *</label>
                        <Input
                          type="text"
                          required
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="City"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">State *</label>
                        <Input
                          type="text"
                          required
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          placeholder="State"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#111827] block mb-1">PIN Code *</label>
                        <Input
                          type="text"
                          required
                          value={shippingPostal}
                          onChange={(e) => setShippingPostal(e.target.value)}
                          placeholder="PIN"
                          className="h-10 text-xs rounded-xl border-[#E5E7EB]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary Breakdown */}
                  {pricing && (
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-xs space-y-2 text-left">
                      <div className="flex justify-between text-[#64748B]">
                        <span>Card Price ({pricing.quantity} item)</span>
                        <span className="font-medium text-[#111827]">₹{pricing.productSubtotal}</span>
                      </div>

                      {pricing.designerFee > 0 && (
                        <div className="flex justify-between text-[#64748B]">
                          <span>Designer Service</span>
                          <span className="font-medium text-[#111827]">₹{pricing.designerFee}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-[#64748B]">
                        <span>Courier Delivery (All-India)</span>
                        <span className="font-medium text-[#111827]">₹{pricing.shippingFee}</span>
                      </div>

                      <div className="flex justify-between text-[#64748B]">
                        <span>Tax (GST 18%)</span>
                        <span className="font-medium text-[#111827]">₹{pricing.taxAmount}</span>
                      </div>

                      <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-[#111827] text-sm">
                        <span>Total Payable</span>
                        <span className="text-[#2563EB]">₹{pricing.totalAmount}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || !customerName || !customerPhone || !designState.instagramUsername}
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold h-11 text-sm rounded-full shadow-md transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span>Place Order • ₹{pricing?.totalAmount || '...'}</span>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 5: FINAL CTA & COMPACT FAQ */}
      {/* ========================================================= */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          {/* Final Call to Action */}
          <div className="rounded-3xl bg-[#111827] text-white p-8 sm:p-12 text-center space-y-5 mb-20 shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to make an impression?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Join thousands of creators and professionals connecting effortlessly with a single contactless tap.
            </p>
            <div>
              <a href="#customize">
                <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold h-11 px-8 rounded-full text-sm shadow-md transition-all">
                  Order Your Card Now
                </Button>
              </a>
            </div>
          </div>

          {/* Compact 5-Question FAQ */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-[#64748B]">Everything you need to know about your NFC card.</p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#111827] hover:bg-slate-100/50 transition-colors"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-[#64748B] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-[#64748B] leading-relaxed border-t border-[#E5E7EB]/60 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MINIMAL APPLE-STYLE FOOTER */}
      {/* ========================================================= */}
      <footer className="w-full border-t border-[#E5E7EB] py-10 bg-white text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#111827]">{campaignBrandConfig.name}</span>
            <span>•</span>
            <span>Instagram Contactless NFC Smart Card</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={`https://wa.me/${campaignBrandConfig.supportWhatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#111827] transition-colors"
            >
              WhatsApp Support
            </a>
            <span>•</span>
            <span>All-India Delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
