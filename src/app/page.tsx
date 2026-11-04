import Link from 'next/link';
import { brandConfig } from '@/config/brand';
import { BrandLogo } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
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
      desc: 'Signature executive aesthetic with brushed gold accents.',
    },
    {
      id: 'ivory-minimal',
      name: 'Ivory Minimalist',
      category: 'Editorial',
      plan: 'Nano',
      accent: 'border-[#E2DDD3]/50 bg-gradient-to-br from-[#FAF8F5] to-[#F2EFE9] text-[#1E1E24]',
      textAccent: 'text-[#8C6D3B]',
      desc: 'Warm editorial design with serif typography.',
    },
    {
      id: 'aurora-creator',
      name: 'Aurora Creator',
      category: 'Creative',
      plan: 'Micro',
      accent: 'border-purple-500/30 bg-gradient-to-br from-[#151833] to-[#0B0D1B]',
      textAccent: 'text-purple-400',
      desc: 'Vibrant glassmorphism for creative agencies.',
    },
    {
      id: 'zenith-corporate',
      name: 'Zenith Corporate',
      category: 'Enterprise',
      plan: 'Mini',
      accent: 'border-blue-500/30 bg-gradient-to-br from-[#0F172A] to-[#080D1A]',
      textAccent: 'text-blue-400',
      desc: 'Structured navy and titanium aesthetic for B2B.',
    },
    {
      id: 'catalyst-business',
      name: 'Catalyst Business',
      category: 'Commercial',
      plan: 'Mini',
      accent: 'border-emerald-500/30 bg-gradient-to-br from-[#064E3B]/60 to-[#022C22]',
      textAccent: 'text-emerald-400',
      desc: 'Commercial showcase with catalogue shelves.',
    },
    {
      id: 'apex-capital',
      name: 'Apex Capital',
      category: 'Prestige',
      plan: 'Max',
      accent: 'border-emerald-600/40 bg-gradient-to-br from-[#052E25] to-[#011410]',
      textAccent: 'text-emerald-300',
      desc: 'Prestige emerald for wealth and real estate.',
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
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo variant="horizontal" size="md" asLink href="/" />

          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/templates" className="hover:text-foreground transition-colors">Templates</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#hardware" className="hover:text-foreground transition-colors">Cards</Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs h-8">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="gold" size="sm" className="text-xs font-medium gap-1.5 shadow-sm h-8">
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-16 z-10 flex flex-col items-center text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
          Digital identity <br className="hidden sm:inline" />
          <span className="text-primary italic">for modern leaders</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mt-4 leading-relaxed">
          Share profiles, multiple businesses, and digital portfolios with a single tap.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-6">
          <Link href="/register">
            <Button variant="gold" size="default" className="gap-2 px-6 font-semibold shadow-lg text-xs h-9">
              <span>Get Started</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="outline" size="default" className="gap-2 px-6 font-semibold text-xs h-9">
              <Palette className="h-3.5 w-3.5 text-primary" />
              <span>Templates</span>
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
                      <span className="font-mono">tappzio.com/p/aditya</span>
                      <span className="text-[#D4AF37] font-semibold">NFC Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical NFC Card Showcase */}
              <div className="md:col-span-5 text-left space-y-3 p-4">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Smart NFC
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pair your digital profile with a laser-engraved NFC card. Tap any smartphone to share instantly.
                </p>

                <div className="pt-2">
                  <Link href="#hardware">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                      <span>Card Materials</span>
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
      <section id="features" className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/80 bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary mb-2">
              01
            </div>
            <h3 className="text-sm font-semibold mb-1">Mode</h3>
            <p className="text-xs text-muted-foreground">Personal or business card structure.</p>
          </Card>

          <Card className="border-border/80 bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary mb-2">
              02
            </div>
            <h3 className="text-sm font-semibold mb-1">Template</h3>
            <p className="text-xs text-muted-foreground">Select from curated executive layouts.</p>
          </Card>

          <Card className="border-border/80 bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary mb-2">
              03
            </div>
            <h3 className="text-sm font-semibold mb-1">Customise</h3>
            <p className="text-xs text-muted-foreground">Add links, ventures, and catalogues.</p>
          </Card>

          <Card className="border-border/80 bg-card p-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs font-bold text-primary mb-2">
              04
            </div>
            <h3 className="text-sm font-semibold mb-1">Share</h3>
            <p className="text-xs text-muted-foreground">Share via NFC tap, QR, or link.</p>
          </Card>
        </div>
      </section>

      {/* Luxury Template Gallery Teaser */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border/60">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Templates
          </h2>
          <Link href="/templates">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <span>All Templates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((tpl) => (
            <Card key={tpl.id} className={`border ${tpl.accent} shadow-md`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="gold" className="text-[10px] uppercase">
                    {tpl.plan}
                  </Badge>
                  <span className="text-xs font-mono opacity-60 uppercase">{tpl.category}</span>
                </div>
                <CardTitle className={`text-base font-bold pt-2 ${tpl.textAccent}`}>
                  {tpl.name}
                </CardTitle>
                <CardDescription className="text-xs opacity-80 leading-relaxed pt-1">
                  {tpl.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link href="/templates">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                    <span>Preview</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Multi-Business Architecture Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border/60">
        <div className="p-6 sm:p-10 rounded-2xl border border-primary/20 bg-card shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                One Profile. Multiple Businesses.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Attach multiple business entities to your digital card with distinct logos, catalogues, and enquiry links.
              </p>
            </div>

            <div className="space-y-2.5">
              <Card className="border-border/80 bg-background/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Apex Capital India</div>
                  <Badge variant="gold" className="text-[10px]">Private Equity</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Managing Partner • Bengaluru
                </div>
              </Card>

              <Card className="border-border/80 bg-background/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Studio D Architecture</div>
                  <Badge variant="outline" className="text-[10px]">Architecture</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Co-Founder & Strategic Director
                </div>
              </Card>

              <Card className="border-border/80 bg-background/80 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-foreground">Pulse AI Hardware</div>
                  <Badge variant="outline" className="text-[10px]">Technology</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Advisor & Investor
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="pricing" className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`border relative flex flex-col justify-between ${p.highlighted
                ? 'border-primary bg-primary/5 shadow-xl ring-1 ring-primary'
                : 'border-border/80 bg-card'
                }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={p.highlighted ? 'gold' : 'outline'} className="text-[10px]">
                      {p.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold pt-2">{p.name}</CardTitle>
                  <div className="pt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground font-mono">{p.price}</span>
                    <span className="text-xs text-muted-foreground">{p.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 pb-5 space-y-2 text-xs text-muted-foreground border-t border-border/40">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <div className="p-5 pt-0">
                <Link href="/register">
                  <Button
                    variant={p.highlighted ? 'gold' : 'outline'}
                    size="sm"
                    className="w-full text-xs font-semibold h-8"
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
      <section id="hardware" className="container mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            NFC Cards
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="text-[10px] w-fit mb-1">PVC</Badge>
              <CardTitle className="text-base">Matte Black PVC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="font-mono text-base font-bold text-primary">₹999</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• NXP NTAG216 Chip</li>
                <li>• Waterproof & bend-resistant</li>
                <li>• Instant tap redirect</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-card relative overflow-hidden ring-1 ring-primary/30">
            <CardHeader className="pb-2">
              <Badge variant="gold" className="text-[10px] w-fit mb-1">Metal</Badge>
              <CardTitle className="text-base">Stainless Steel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="font-mono text-base font-bold text-primary">₹2,499</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 24g steel core</li>
                <li>• Laser etched logo</li>
                <li>• Anti-metal ferrite layer</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <Badge variant="outline" className="text-[10px] w-fit mb-1">Wood</Badge>
              <CardTitle className="text-base">Natural Bamboo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="font-mono text-base font-bold text-primary">₹1,499</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Natural organic grain</li>
                <li>• Eco-friendly core</li>
                <li>• Custom laser engraving</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-primary/30 bg-card p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Get started
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Create your digital identity in minutes.
          </p>
          <div className="pt-2 flex justify-center">
            <Link href="/register">
              <Button variant="gold" size="default" className="gap-2 px-6 font-semibold shadow-lg text-xs h-9">
                <span>Create Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-12 bg-background/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <BrandLogo variant="symbol" size="sm" />
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
