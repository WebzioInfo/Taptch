import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Palette,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Download,
  Share2,
} from 'lucide-react';

export default function HomePage() {
  const templates = [
    {
      id: 'obsidian-luxury',
      name: 'Obsidian Luxury',
      category: 'Executive',
      plan: 'Nano',
      accent: 'border-amber-500/40 bg-gradient-to-br from-[#121216] to-[#0A0A0C]',
      textAccent: 'text-[#D4AF37]',
      desc: 'Signature executive dark aesthetic with brushed gold accents, micro-borders, and high-contrast typography.',
    },
    {
      id: 'ivory-minimal',
      name: 'Ivory Minimalist',
      category: 'Editorial',
      plan: 'Nano',
      accent: 'border-[#E2DDD3]/50 bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE9] text-[#1E1E24]',
      textAccent: 'text-[#8C6D3B]',
      desc: 'Warm alabaster editorial design with timeless serif headings, subtle dividers, and high legibility.',
    },
    {
      id: 'aurora-creator',
      name: 'Aurora Creator',
      category: 'Creative',
      plan: 'Micro',
      accent: 'border-purple-500/30 bg-gradient-to-br from-[#151833] to-[#0B0D1B]',
      textAccent: 'text-purple-400',
      desc: 'Vibrant neon glassmorphism designed for creators, designers, agency founders, and media directors.',
    },
    {
      id: 'zenith-corporate',
      name: 'Zenith Corporate',
      category: 'Enterprise',
      plan: 'Mini',
      accent: 'border-blue-500/30 bg-gradient-to-br from-[#0F172A] to-[#080D1A]',
      textAccent: 'text-blue-400',
      desc: 'Structured enterprise navy and titanium aesthetic for B2B executives, consultants, and legal partners.',
    },
    {
      id: 'catalyst-business',
      name: 'Catalyst Business',
      category: 'Commercial',
      plan: 'Mini',
      accent: 'border-emerald-500/30 bg-gradient-to-br from-[#064E3B]/60 to-[#022C22]',
      textAccent: 'text-emerald-400',
      desc: 'Commercial showcase design featuring dedicated product showcase shelves, service cards, and quick enquiries.',
    },
    {
      id: 'apex-capital',
      name: 'Apex Capital',
      category: 'Prestige',
      plan: 'Max',
      accent: 'border-emerald-600/40 bg-gradient-to-br from-[#052E25] to-[#011410]',
      textAccent: 'text-emerald-300',
      desc: 'Prestige emerald and dark graphite tailored for luxury real estate developers, venture capital, and private wealth.',
    },
  ];

  const plans = [
    {
      id: 'nano',
      name: 'Nano',
      badge: 'Free Forever',
      price: '₹0',
      period: 'forever',
      desc: 'Ideal for individuals and students starting with digital networking.',
      features: [
        '1 Digital Profile',
        'Standard Obsidian & Ivory Templates',
        'Instant vCard Download',
        'Direct Profile QR Code',
        'Unlimited Profile Views',
      ],
      highlighted: false,
    },
    {
      id: 'micro',
      name: 'Micro',
      badge: 'Solo Professional',
      price: '₹499',
      period: '/year',
      desc: 'For freelancers, independent consultants, and solo practitioners.',
      features: [
        '2 Digital Profiles',
        '1 Linked Business Entity',
        'Company Overview & Bio',
        'Reciprocal Contact Exchange Form',
        'Photo Gallery (up to 5 images)',
        'Google Maps Integration',
      ],
      highlighted: false,
    },
    {
      id: 'mini',
      name: 'Mini',
      badge: 'Growth Business',
      price: '₹1,499',
      period: '/year',
      desc: 'Designed for small business owners, agencies, and retail brands.',
      features: [
        '5 Digital Profiles',
        'Up to 3 Linked Business Entities',
        'Product & Service Showcase (10 items)',
        'Photo Gallery (up to 15 images)',
        'Aurora & Zenith Premium Templates',
        'Priority Lead Capture & CSV Export',
      ],
      highlighted: true,
    },
    {
      id: 'max',
      name: 'Max',
      badge: 'Enterprise Multi-Brand',
      price: '₹3,999',
      period: '/year',
      desc: 'For serial entrepreneurs, enterprise partners, and multi-brand founders.',
      features: [
        '20 Digital Profiles',
        'Up to 10 Distinct Businesses',
        '50 Products & 50 Services Showcase',
        'Brochure & PDF Catalog Downloads',
        'YouTube Video Integrations',
        'Custom Domain Mapping',
        'All Luxury Templates Unlocked',
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-primary/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary group-hover:border-primary/40 transition-colors">
              {brandConfig.name.charAt(0)}
            </div>
            <span className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
              {brandConfig.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#hardware" className="hover:text-foreground transition-colors">NFC Cards</Link>
            <Link href="/dev/gallery" className="hover:text-foreground transition-colors">Studio</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="gold" size="sm" className="text-xs font-medium gap-1.5 shadow-sm">
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 z-10 flex flex-col items-center text-center">

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.1]">
          Craft Your Executive <br className="hidden sm:inline" />
          <span className="text-primary italic">Digital Identity</span> in Minutes
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mt-6 leading-relaxed">
          The self-service digital profile and smart NFC platform for professionals, entrepreneurs, and high-growth businesses. Select luxury templates, attach multiple businesses, and share with a single tap.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
          <Link href="/register">
            <Button variant="gold" size="lg" className="gap-2 px-8 font-semibold shadow-xl">
              <span>Create Free Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="outline" size="lg" className="gap-2 px-8 font-semibold">
              <Palette className="h-4 w-4 text-primary" />
              <span>Explore Templates</span>
            </Button>
          </Link>
        </div>

        {/* Realistic Interactive Mockup Frame */}
        <div className="mt-16 w-full max-w-4xl relative">
          <div className="p-3 sm:p-6 rounded-3xl border border-primary/20 bg-gradient-to-b from-card/80 via-card/40 to-background backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Phone Digital Profile Frame */}
              <div className="md:col-span-7 flex justify-center">
                <div className="w-full max-w-xs sm:max-w-sm rounded-[2.5rem] border-4 border-neutral-800 bg-[#0A0A0C] p-4 shadow-2xl relative overflow-hidden text-left">
                  {/* Phone Speaker Notch */}
                  <div className="mx-auto w-24 h-4 bg-neutral-900 rounded-full mb-3" />

                  {/* Profile Mock Content */}
                  <div className="rounded-2xl bg-[#121216] border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xl text-[#D4AF37]">
                        A
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-base text-foreground">
                          Aditya Singhania
                          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
                        </div>
                        <p className="text-xs text-muted-foreground">Managing Partner, Singhania Capital</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1">
                        <Download className="h-3 w-3" /> Save Contact
                      </button>
                      <button className="flex-1 py-1.5 rounded-lg border border-white/15 text-xs font-semibold flex items-center justify-center gap-1">
                        <Share2 className="h-3 w-3" /> Exchange
                      </button>
                    </div>

                    {/* Multi-business switcher teaser */}
                    <div className="p-3 rounded-xl bg-background/60 border border-white/5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[10px] text-primary uppercase font-bold tracking-wider">
                        <span>Active Venture</span>
                        <Badge variant="outline" className="text-[9px] py-0">Business 1 of 2</Badge>
                      </div>
                      <div className="font-semibold text-foreground">Apex Capital India</div>
                      <p className="text-[11px] text-muted-foreground">Private Equity & High-Growth Venture Advisory</p>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground border-t border-white/5">
                      <span className="font-mono">tapzio.com/p/aditya</span>
                      <span className="text-[#D4AF37] font-semibold">NFC Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical NFC Card Showcase */}
              <div className="md:col-span-5 text-left space-y-4 p-4">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Paired with Smart NFC Cards
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every digital profile pairs instantly with our laser-engraved Matte Black PVC or stainless steel cards. Tap any modern smartphone to open your card in under 50 milliseconds.
                </p>

                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Sub-50ms Edge Redirects</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    No clunky native app required. Works natively on all modern iOS and Android devices.
                  </p>
                </div>

                <div className="pt-2">
                  <Link href="#hardware">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <span>View Card Materials</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="features" className="container mx-auto max-w-7xl px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <Badge variant="gold" className="text-xs uppercase tracking-wider">
            Self-Service Architecture
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            How It Works in 4 Simple Steps
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            From sign-up to your first tap in less than two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary">
                01
              </div>
              <CardTitle className="text-lg">Choose Profile Mode</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Select between a Personal executive card or a Business card with multi-company branding.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary">
                02
              </div>
              <CardTitle className="text-lg">Select Luxury Template</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Browse Obsidian Luxury, Ivory Minimal, Aurora Creator, Zenith, and Catalyst templates.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary">
                03
              </div>
              <CardTitle className="text-lg">Customize & Publish</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Upload photos, add multiple business entities, showcase product catalogues, and publish live.
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-3 space-y-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-mono font-bold text-primary">
                04
              </div>
              <CardTitle className="text-lg">Tap & Share</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              Share via unguessable NFC token redirect, QR code, or reciprocal contact exchange form.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Luxury Template Gallery Teaser */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Badge variant="gold" className="text-xs uppercase tracking-wider mb-2">
              Aesthetic Direction
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Curated Luxury Templates
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Engineered with Obsidian Luxury principles, WCAG 2.2 contrast ratios, and responsive layouts.
            </p>
          </div>
          <Link href="/templates">
            <Button variant="gold" size="sm" className="gap-2 text-xs">
              <span>View All Templates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <Card key={tpl.id} className={`border ${tpl.accent} shadow-xl hover:scale-[1.01] transition-transform`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="gold" className="text-[10px] uppercase">
                    Plan: {tpl.plan}
                  </Badge>
                  <span className="text-xs font-mono opacity-60 uppercase">{tpl.category}</span>
                </div>
                <CardTitle className={`text-xl font-bold pt-2 ${tpl.textAccent}`}>
                  {tpl.name}
                </CardTitle>
                <CardDescription className="text-xs opacity-80 leading-relaxed pt-1">
                  {tpl.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link href={`/templates`}>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                    <span>Preview Template</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Multi-Business Architecture Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="p-8 sm:p-12 rounded-3xl border border-primary/20 bg-gradient-to-r from-card/80 via-card/50 to-primary/10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="gold" className="text-xs uppercase tracking-wider">
                Multi-Business Capability
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                One Person. Multiple Businesses. <br />
                <span className="text-primary italic">One Single Smart Card.</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You run a venture capital firm, an architecture studio, and an advisory practice. With {brandConfig.name}, you never need to carry three different cards. Attach multiple businesses to your digital profile and allow clients to browse distinct company overviews, download brochures, and view catalogs.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>Distinct company logos, roles, and industry descriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>Dedicated product & service showcase shelves with inquiry triggers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span>Individual brochure download links for corporate decks</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Card className="border-border/80 bg-background/80 p-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Apex Capital India</div>
                  <Badge variant="gold" className="text-[10px]">Private Equity</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Managing Partner • Fund II ($50M AUM) • Bangalore
                </div>
              </Card>

              <Card className="border-border/80 bg-background/80 p-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Studio D Urban Architecture</div>
                  <Badge variant="outline" className="text-[10px]">Architecture</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Co-Founder & Strategic Director • Sustainable Masterplanning
                </div>
              </Card>

              <Card className="border-border/80 bg-background/80 p-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Pulse AI Hardware</div>
                  <Badge variant="outline" className="text-[10px]">Technology</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Angel Investor & Board Advisor • Edge Robotics
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="pricing" className="container mx-auto max-w-7xl px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <Badge variant="gold" className="text-xs uppercase tracking-wider">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Plans for Every Stage of Growth
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Start for free forever, or upgrade as your business portfolio expands. No credit card required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`border relative flex flex-col justify-between ${p.highlighted
                ? 'border-primary bg-primary/5 shadow-2xl ring-1 ring-primary'
                : 'border-border/80 bg-card/60'
                }`}
            >
              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={p.highlighted ? 'gold' : 'outline'} className="text-[10px]">
                      {p.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold pt-2">{p.name}</CardTitle>
                  <CardDescription className="text-xs min-h-[32px] pt-1">{p.desc}</CardDescription>
                  <div className="pt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground font-mono">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 pb-6 space-y-2.5 text-xs text-muted-foreground border-t border-border/40">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <div className="p-6 pt-0">
                <Link href="/register">
                  <Button
                    variant={p.highlighted ? 'gold' : 'outline'}
                    size="sm"
                    className="w-full text-xs font-semibold"
                  >
                    Select {p.name}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hardware Materials Section */}
      <section id="hardware" className="container mx-auto max-w-7xl px-4 sm:px-6 py-20 border-t border-border/60">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <Badge variant="gold" className="text-xs uppercase tracking-wider">
            Physical Hardware
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Precision Crafted NFC Hardware
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Every card features high-speed NTAG chips, anti-metal ferrite protection, and durable coatings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/80 bg-card/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="text-[10px] w-fit mb-2">PVC Edition</Badge>
              <CardTitle className="text-lg">Matte Black PVC</CardTitle>
              <CardDescription className="text-xs">
                Ultra-durable, waterproof, and scratch-resistant matte PVC with spot gloss detailing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="font-mono text-lg font-bold text-primary">₹999</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• NXP NTAG216 Chip (888 bytes)</li>
                <li>• Waterproof & bend-resistant</li>
                <li>• Instant pairing & re-linkable</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-card/60 relative overflow-hidden ring-1 ring-primary/30">
            <CardHeader className="pb-3">
              <Badge variant="gold" className="text-[10px] w-fit mb-2">Executive Edition</Badge>
              <CardTitle className="text-lg">Brushed Stainless Metal</CardTitle>
              <CardDescription className="text-xs">
                Substantial laser-engraved stainless steel card with internal anti-metal ferrite barrier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="font-mono text-lg font-bold text-primary">₹2,499</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Heavyweight 24g steel core</li>
                <li>• Precision laser etched name & logo</li>
                <li>• Ferrite shielding for smartphone tap</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60">
            <CardHeader className="pb-3">
              <Badge variant="outline" className="text-[10px] w-fit mb-2">Artisanal Edition</Badge>
              <CardTitle className="text-lg">Sustainable Wood / Bamboo</CardTitle>
              <CardDescription className="text-xs">
                Responsibly harvested natural walnut and bamboo with embedded RFID antenna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="font-mono text-lg font-bold text-primary">₹1,499</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Natural organic wood grain</li>
                <li>• Eco-friendly biodegradable core</li>
                <li>• Custom laser engraved monogram</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-5xl px-4 sm:px-6 py-20">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-card/90 to-primary/10 p-8 sm:p-14 text-center space-y-6 shadow-2xl">
          <Badge variant="gold" className="text-xs uppercase tracking-wider">
            Ready to Upgrade Your Network?
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Get Your Digital Identity Today
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Join executives, partners, and high-growth founders using {brandConfig.name} to exchange contacts with zero friction.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link href="/register">
              <Button variant="gold" size="lg" className="gap-2 px-8 font-semibold shadow-xl">
                <span>Start Free Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-12 bg-background/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {brandConfig.name.charAt(0)}
            </div>
            <span className="font-semibold text-sm text-foreground">{brandConfig.name}</span>
            <span>•</span>
            <span>{brandConfig.tagline}</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="/dev/gallery" className="hover:text-foreground transition-colors">UI Studio</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} {brandConfig.legalName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
