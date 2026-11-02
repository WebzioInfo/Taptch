/**
 * CENTRALIZED DEMO BUSINESS MOCK DATA SYSTEM
 * 
 * Provides realistic demo profiles across 8 industry verticals
 * for interactive template previews, layout demonstrations, and marketing.
 * 
 * Important Rules:
 * 1. Mock data is strictly used for template demonstrations.
 * 2. Never insert mock data into actual customer records or overwrite customer information.
 * 3. Clearly identifiable demo markers are attached to every profile.
 * 4. Never present fictional reviews, certifications, or business claims as verified facts.
 */

import type { ProfileRenderData } from '@/components/templates/ProfileRenderer';

export interface DemoBusinessProfile extends ProfileRenderData {
  category: string;
  categoryLabel: string;
  industry: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  location: string;
  workingHours: string;
  highlights: string[];
  socialLinks: { platform: string; url: string }[];
  gallery: { url: string; caption?: string }[];
  brochures: { title: string; fileUrl: string; fileSize?: string }[];
  isDemo: true;
}

export const DEMO_BUSINESSES: DemoBusinessProfile[] = [
  // 1. Industrial & Manufacturing
  {
    id: 'demo-apex-industrial',
    slug: 'apex-industrial-solutions',
    displayName: 'Apex Industrial Solutions',
    category: 'industrial-manufacturing',
    categoryLabel: 'Industrial & Manufacturing',
    industry: 'Heavy Machinery & Automation',
    headline: 'High-Precision CNC Machining, Industrial Hydraulics & Plant Automation',
    bio: 'Apex Industrial Solutions is an engineering and machinery manufacturing enterprise based in the Kochi Industrial Corridor. We design, manufacture, and commission high-capacity hydraulic power packs, 5-axis CNC machining stations, and automated conveyor systems for manufacturing plants across South India.\n\n[DEMO PROFILE] All equipment specifications and contact channels shown are for template demonstration purposes.',
    avatarUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'industrial-manufacturing',
    phone: '+91 484 290 8800',
    whatsapp: '+91 98460 12345',
    email: 'info@apexindustrial-demo.com',
    website: 'https://apexindustrial.demo.tappzio.com',
    address: 'Plot 42, Industrial Development Area, Kalamassery',
    location: 'Kochi, Kerala 683109',
    workingHours: 'Mon – Sat: 08:30 – 18:00 IST',
    highlights: [
      'Heavy-duty 5-axis CNC machining infrastructure',
      'Custom hydraulic systems up to 700 bar working pressure',
      'Onsite commissioning & 24/7 emergency breakdown support',
      'Zero-tolerance dimensional inspection testing',
    ],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/company/apex-industrial-demo' },
      { platform: 'youtube', url: 'https://youtube.com/@apexindustrial-demo' },
      { platform: 'website', url: 'https://apexindustrial.demo.tappzio.com' },
    ],
    businesses: [
      {
        id: 'biz-apex-main',
        companyName: 'Apex Industrial Solutions Pvt Ltd',
        tagline: 'Precision Engineering Since 2012',
        roleTitle: 'Manufacturing Headquarters',
        industry: 'Industrial Engineering',
        description: 'Primary fabrication and CNC machining facility covering 45,000 sq ft.',
        websiteUrl: 'https://apexindustrial.demo.tappzio.com',
        brochureUrl: '/docs/apex-machinery-specifications-demo.pdf',
        address: 'Kalamassery Industrial Estate, Kochi, Kerala',
      },
      {
        id: 'biz-apex-hydraulics',
        companyName: 'Apex Fluid Power Systems',
        tagline: 'Hydraulic & Pneumatic Solutions',
        roleTitle: 'Hydraulics Division',
        industry: 'Fluid Power',
        description: 'Specialized unit producing custom hydraulic cylinders, valves, and power units.',
        websiteUrl: 'https://apexindustrial.demo.tappzio.com/hydraulics',
        brochureUrl: '/docs/apex-hydraulics-catalogue-demo.pdf',
        address: 'Phase II, Edayar Industrial Area, Kochi, Kerala',
      },
    ],
    catalogue: [
      {
        id: 'cat-apex-1',
        title: 'CNC 5-Axis Vertical Milling Center (VMC-850)',
        itemType: 'product',
        description: 'High-rigidity casting with 12,000 RPM direct-drive spindle and 24-tool automatic tool changer for aerospace & automotive machining.',
        price: '48,50,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://apexindustrial.demo.tappzio.com/products/vmc-850',
      },
      {
        id: 'cat-apex-2',
        title: 'Industrial Hydraulic Power Unit (HPU-300)',
        itemType: 'product',
        description: 'Compact 40 HP continuous-duty power pack equipped with variable displacement piston pump and integrated oil cooling unit.',
        price: '4,20,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://apexindustrial.demo.tappzio.com/products/hpu-300',
      },
      {
        id: 'cat-apex-3',
        title: 'Preventive Machinery Maintenance Contract',
        itemType: 'service',
        description: 'Comprehensive annual maintenance covering scheduled laser alignment, vibration analysis, and hydraulic fluid testing.',
        price: '1,50,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://apexindustrial.demo.tappzio.com/services/maintenance',
      },
      {
        id: 'cat-apex-4',
        title: 'Industrial PLC & SCADA Automation',
        itemType: 'service',
        description: 'Custom programmable logic controller software design and electrical control panel assembly for assembly line automation.',
        price: '2,80,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://apexindustrial.demo.tappzio.com/services/automation',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', caption: 'Precision CNC Machining Floor' },
      { url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80', caption: 'Heavy Structural Fabrication Plant' },
      { url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80', caption: 'Hydraulic Test Bench & Pressure Calibration' },
      { url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=80', caption: 'Laser Alignment & Quality Verification' },
    ],
    brochures: [
      { title: 'Apex Engineering Solutions — Full Machinery Catalogue 2026', fileUrl: '/docs/apex-machinery-specifications-demo.pdf', fileSize: '4.8 MB' },
      { title: 'Technical Specification Sheet — VMC-850 Machining Center', fileUrl: '/docs/vmc850-specsheet-demo.pdf', fileSize: '1.2 MB' },
    ],
    isDemo: true,
  },

  // 2. Corporate Business
  {
    id: 'demo-singhania-corporate',
    slug: 'singhania-corporate-advisory',
    displayName: 'Singhania Corporate Advisory',
    category: 'corporate-business',
    categoryLabel: 'Corporate & Consulting',
    industry: 'Strategic Advisory & M&A',
    headline: 'Cross-Border M&A, Corporate Governance & Institutional Restructuring',
    bio: 'Singhania Corporate Advisory counsels promoter groups, private equity funds, and multinational corporations navigating high-stakes transactions, board governance, and capital restructuring across India and the GCC.\n\n[DEMO PROFILE] Sample corporate presentation created to demonstrate the Corporate Business layout.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'corporate-business',
    phone: '+91 22 6190 4000',
    whatsapp: '+91 98200 44000',
    email: 'contact@singhoniacorp-demo.com',
    website: 'https://singhoniacorp.demo.tappzio.com',
    address: '14th Floor, Maker Maxity, Bandra Kurla Complex',
    location: 'Mumbai, Maharashtra 400051',
    workingHours: 'Mon – Fri: 09:00 – 19:30 IST',
    highlights: [
      'Over ₹12,000 Cr in closed transactions advised across South Asia',
      'Dedicated practice groups for Cross-Border M&A and Dispute Resolution',
      'Confidential board advisory for listed holding corporations',
      'Dual-office footprint across Mumbai BKC and New Delhi',
    ],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/company/singhoniacorp-demo' },
      { platform: 'twitter', url: 'https://x.com/singhoniacorp_demo' },
      { platform: 'website', url: 'https://singhoniacorp.demo.tappzio.com' },
    ],
    businesses: [
      {
        id: 'biz-singhania-ma',
        companyName: 'Singhania M&A Partners LLP',
        tagline: 'Institutional Transaction Advisors',
        roleTitle: 'Corporate Headquarters',
        industry: 'Investment Banking & M&A',
        description: 'Lead transaction structuring and regulatory filings.',
        websiteUrl: 'https://singhoniacorp.demo.tappzio.com',
        address: 'Bandra Kurla Complex, Mumbai',
      },
    ],
    catalogue: [
      {
        id: 'cat-singhania-1',
        title: 'Cross-Border M&A Transaction Advisory',
        itemType: 'service',
        description: 'End-to-end deal origination, target valuation, cross-border regulatory approvals, and post-merger integration framework.',
        price: 'Custom Retainer',
        currency: '',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://singhoniacorp.demo.tappzio.com/practice/mergers',
      },
      {
        id: 'cat-singhania-2',
        title: 'Corporate Governance & Board Audit',
        itemType: 'service',
        description: 'Independent evaluation of board charter efficacy, ESG reporting alignment, and statutory compliance framework.',
        price: 'Annual Retainer',
        currency: '',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://singhoniacorp.demo.tappzio.com/practice/governance',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', caption: 'Mumbai BKC Corporate Headquarters' },
      { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80', caption: 'Executive Boardroom' },
    ],
    brochures: [
      { title: 'Singhania Advisory — Corporate Capability Statement 2026', fileUrl: '/docs/singhania-corporate-deck-demo.pdf', fileSize: '3.4 MB' },
    ],
    isDemo: true,
  },

  // 3. Creative & Agency
  {
    id: 'demo-horizon-creative',
    slug: 'horizon-creative-agency',
    displayName: 'Horizon Creative Studio',
    category: 'creative-agency',
    categoryLabel: 'Creative & Agency',
    industry: 'Design, Branding & Digital Media',
    headline: 'Immersive Brand Identity, High-Conversion Web Experiences & 3D Media',
    bio: 'Horizon is an independent design studio shaping brand aesthetics for ambitious startups, luxury labels, and digital-first products. We synthesize typography, motion, and interaction design into memorable digital experiences.\n\n[DEMO PROFILE] Creative agency demonstration profile with interactive media and showcase.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'creative-agency',
    phone: '+91 80 4112 9090',
    whatsapp: '+91 99000 88221',
    email: 'hello@horizonstudio-demo.com',
    website: 'https://horizonstudio.demo.tappzio.com',
    address: '100 Feet Road, 2nd Stage, Indiranagar',
    location: 'Bengaluru, Karnataka 560038',
    workingHours: 'Mon – Fri: 10:00 – 19:30 IST',
    highlights: [
      'Over 60+ global brand identity systems designed',
      'Awwwards & FWA featured digital interactions',
      'Rapid 4-week design sprint to deployment pipeline',
      'Full-stack design systems engineered in React & Tailwind',
    ],
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/horizonstudio_demo' },
      { platform: 'dribbble', url: 'https://dribbble.com/horizonstudio-demo' },
      { platform: 'behance', url: 'https://behance.net/horizonstudio-demo' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/horizonstudio-demo' },
    ],
    businesses: [
      {
        id: 'biz-horizon-main',
        companyName: 'Horizon Studio Lab',
        tagline: 'Art, Code & Interaction',
        roleTitle: 'Design Flagship',
        industry: 'Digital Design',
        description: 'Main creative floor specializing in brand direction and UI/UX engineering.',
        websiteUrl: 'https://horizonstudio.demo.tappzio.com',
        address: 'Indiranagar, Bengaluru',
      },
    ],
    catalogue: [
      {
        id: 'cat-horizon-1',
        title: 'Comprehensive Brand Identity System',
        itemType: 'service',
        description: 'Complete visual identity architecture: logo mark, typography hierarchy, luxury color system, stationary, and 80-page brand guidelines book.',
        price: '2,20,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://horizonstudio.demo.tappzio.com/services/brand',
      },
      {
        id: 'cat-horizon-2',
        title: 'SaaS Product UI/UX Architecture',
        itemType: 'service',
        description: 'Research-backed interactive UX wireframes, Obsidian Luxury theme UI design tokens, component library, and Figma design tokens.',
        price: '3,80,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://horizonstudio.demo.tappzio.com/services/uiux',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80', caption: 'Creative Lab Workspace' },
      { url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800&auto=format&fit=crop&q=80', caption: 'Brand Typography & Print Artifacts' },
      { url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80', caption: 'Interactive Prototype Showcase' },
    ],
    brochures: [
      { title: 'Horizon Studio — Portfolio & Case Studies 2026', fileUrl: '/docs/horizon-portfolio-demo.pdf', fileSize: '5.2 MB' },
    ],
    isDemo: true,
  },

  // 4. Professional Services
  {
    id: 'demo-veritas-legal',
    slug: 'veritas-legal-partners',
    displayName: 'Veritas Legal & Advisory',
    category: 'professional-services',
    categoryLabel: 'Professional Services',
    industry: 'Legal, Tax & Corporate Governance',
    headline: 'Commercial Litigation, Arbitration & Direct Taxation Counsel',
    bio: 'Veritas Legal provides trusted counsel in commercial dispute resolution, intellectual property, corporate tax, and infrastructure contracts. Serving high-net-worth families, conglomerates, and financial institutions.\n\n[DEMO PROFILE] Editorial serif presentation designed for legal partners, accountants, and consultants.',
    avatarUrl: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'professional-services',
    phone: '+91 11 2341 5500',
    whatsapp: '+91 98110 55000',
    email: 'chambers@veritaslegal-demo.com',
    website: 'https://veritaslegal.demo.tappzio.com',
    address: 'Gopaldas Bhawan, 28 Barakhamba Road',
    location: 'Connaught Place, New Delhi 110001',
    workingHours: 'Mon – Sat: 09:30 – 18:30 IST',
    highlights: [
      'Representation before Supreme Court of India, High Courts & NCLT',
      'Senior Advocate consultation for complex commercial disputes',
      'Dedicated Chambers with full legal research repository',
      'Confidential mediation & international dispute arbitration',
    ],
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/company/veritas-legal-demo' },
      { platform: 'website', url: 'https://veritaslegal.demo.tappzio.com' },
    ],
    businesses: [
      {
        id: 'biz-veritas-main',
        companyName: 'Veritas Law Chambers',
        tagline: 'Advocates & Solicitors',
        roleTitle: 'New Delhi Chambers',
        industry: 'Legal Practice',
        description: 'Principal litigation and arbitration practice chambers.',
        websiteUrl: 'https://veritaslegal.demo.tappzio.com',
        address: 'Barakhamba Road, New Delhi',
      },
    ],
    catalogue: [
      {
        id: 'cat-veritas-1',
        title: 'Commercial Dispute Arbitration',
        itemType: 'service',
        description: 'Representation in domestic and international institutional arbitrations under LCIA, SIAC, and Indian Arbitration Act.',
        price: 'Professional Fee',
        currency: '',
        imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://veritaslegal.demo.tappzio.com/arbitration',
      },
      {
        id: 'cat-veritas-2',
        title: 'Corporate Tax Litigation & Advisory',
        itemType: 'service',
        description: 'Comprehensive advice on transfer pricing, GST audits, direct tax assessments, and representation before ITAT.',
        price: 'Advisory Retainer',
        currency: '',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://veritaslegal.demo.tappzio.com/tax',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80', caption: 'Chambers Research Library' },
      { url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80', caption: 'Consultation Conference Suite' },
    ],
    brochures: [
      { title: 'Veritas Legal — Practice Areas & Institutional Overview', fileUrl: '/docs/veritas-overview-demo.pdf', fileSize: '2.1 MB' },
    ],
    isDemo: true,
  },

  // 5. Retail & Shopping
  {
    id: 'demo-malabar-silk',
    slug: 'malabar-silk-handlooms',
    displayName: 'Malabar Silk & Crafts Flagship',
    category: 'retail-shopping',
    categoryLabel: 'Retail & Shopping',
    industry: 'Handwoven Silks & Luxury Handlooms',
    headline: 'Authentic Pure Kanchipuram, Kerala Kasavu & Handcrafted Heritage Silks',
    bio: 'Malabar Silk & Crafts has preserved traditional Indian weaving since 1978. Every piece in our flagship collection is hand-loomed with certified Silk Mark pure mulberry threads and tested zari, direct from artisan clusters.\n\n[DEMO PROFILE] Retail storefront layout with instant WhatsApp order inquiry and product catalogue.',
    avatarUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'retail-shopping',
    phone: '+91 495 272 1100',
    whatsapp: '+91 94470 11223',
    email: 'orders@malabarsilk-demo.com',
    website: 'https://malabarsilk.demo.tappzio.com',
    address: 'Sweet Meat Street (SM Street) Heritage Arcade',
    location: 'Kozhikode, Kerala 673001',
    workingHours: 'Mon – Sun: 10:00 – 21:00 IST',
    highlights: [
      '100% Silk Mark certified genuine handwoven silk',
      'Worldwide insured express courier delivery',
      'Video call personal shopping & bridal trunk shows',
      'Custom color dyeing & bespoke blouse embroidery',
    ],
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/malabarsilk_demo' },
      { platform: 'facebook', url: 'https://facebook.com/malabarsilk.demo' },
      { platform: 'youtube', url: 'https://youtube.com/@malabarsilk-demo' },
    ],
    businesses: [
      {
        id: 'biz-malabar-flagship',
        companyName: 'Malabar Silk Heritage Emporium',
        tagline: 'Weaving Traditions Since 1978',
        roleTitle: 'Kozhikode Flagship Store',
        industry: 'Luxury Textiles',
        description: 'Multi-storey showroom featuring bridal silks, kasavu dhotis, and ethnic menswear.',
        websiteUrl: 'https://malabarsilk.demo.tappzio.com',
        address: 'SM Street, Kozhikode',
      },
    ],
    catalogue: [
      {
        id: 'cat-silk-1',
        title: 'Heritage Bridal Kanchipuram Silk Saree (Crimson Gold)',
        itemType: 'product',
        description: 'Pure zari woven body with intricate temple borders and rich peacock pallu. Accompanied by certified Silk Mark label.',
        price: '28,500',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://malabarsilk.demo.tappzio.com/sarees/kanchipuram-crimson',
      },
      {
        id: 'cat-silk-2',
        title: 'Authentic Kerala Kasavu Bridal Tissue Saree',
        itemType: 'product',
        description: 'Traditional fine cotton-silk blend with 4-inch pure gold kasavu border and hand-embroidered floral motifs.',
        price: '14,800',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://malabarsilk.demo.tappzio.com/sarees/kerala-kasavu',
      },
      {
        id: 'cat-silk-3',
        title: 'Raw Silk Festive Kurta & Veshti Ensemble (Groom Collection)',
        itemType: 'product',
        description: 'Handspun raw tussar silk kurta in natural cream with matching gold-bordered matching silk dhoti.',
        price: '9,200',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://malabarsilk.demo.tappzio.com/mens/groom-ensemble',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80', caption: 'Kanchipuram Silk Loom Details' },
      { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80', caption: 'Kerala Kasavu Handloom Artistry' },
      { url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80', caption: 'Flagship Showroom Interior' },
    ],
    brochures: [
      { title: 'Malabar Silk — Bridal Lookbook & Weaving Catalogue 2026', fileUrl: '/docs/malabar-silk-lookbook-demo.pdf', fileSize: '6.1 MB' },
    ],
    isDemo: true,
  },

  // 6. Food & Restaurant
  {
    id: 'demo-saffron-spice',
    slug: 'saffron-spice-bistro',
    displayName: 'Saffron & Spice Bistro & Lounge',
    category: 'food-restaurant',
    categoryLabel: 'Food & Restaurant',
    industry: 'Fine Dining & Royal Awadhi Cuisine',
    headline: 'Progressive Royal Awadhi Flavors, Clay Oven Delicacies & Handcrafted Mocktails',
    bio: 'Saffron & Spice blends centuries-old Nizami culinary traditions with contemporary gastronomy. Savor slow-cooked dum biryanis, melt-in-mouth kebabs, and handcrafted royal desserts in an opulent, ambient setting.\n\n[DEMO PROFILE] Restaurant menu demonstration featuring live reservations and direct WhatsApp ordering.',
    avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'food-restaurant',
    phone: '+91 40 6820 7700',
    whatsapp: '+91 99880 77000',
    email: 'reservations@saffronspice-demo.com',
    website: 'https://saffronspice.demo.tappzio.com',
    address: 'Road No. 36, Near Peddamma Temple, Jubilee Hills',
    location: 'Hyderabad, Telangana 500033',
    workingHours: 'Lunch: 12:00 – 15:30 | Dinner: 19:00 – 23:30 IST',
    highlights: [
      'Slow-cooked traditional copper handi dum pukht preparation',
      'Private dining suites available for family gatherings & corporate dinners',
      'Farm-to-table organic spices sourced directly from Kerala & Kashmir',
      'Valet parking available for all guests',
    ],
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/saffronspice_demo' },
      { platform: 'facebook', url: 'https://facebook.com/saffronspice.demo' },
      { platform: 'website', url: 'https://saffronspice.demo.tappzio.com' },
    ],
    businesses: [
      {
        id: 'biz-saffron-jubilee',
        companyName: 'Saffron & Spice Flagship',
        tagline: 'Royal Indian Dining',
        roleTitle: 'Jubilee Hills Flagship',
        industry: 'Hospitality & Dining',
        description: '140-cover dining hall with private mezzanine lounge and open tandoor kitchen.',
        websiteUrl: 'https://saffronspice.demo.tappzio.com',
        address: 'Road No. 36, Jubilee Hills, Hyderabad',
      },
    ],
    catalogue: [
      {
        id: 'cat-food-1',
        title: 'Nizami Dum Gosht Biryani (Chef Signature)',
        itemType: 'product',
        description: 'Tender baby mutton marinated for 12 hours in royal spices, layered with aged basmati rice and saffron milk, sealed with dough in a clay handi.',
        price: '745',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://saffronspice.demo.tappzio.com/menu/dum-biryani',
      },
      {
        id: 'cat-food-2',
        title: 'Galouti Kebab with Ulte Tawe Ka Paratha',
        itemType: 'product',
        description: 'Silken, melt-in-mouth spiced kebabs infused with smoked cloves and cardamom, served on warm saffron-infused flaky bread.',
        price: '595',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://saffronspice.demo.tappzio.com/menu/galouti-kebab',
      },
      {
        id: 'cat-food-3',
        title: 'Private Banquet & Executive Dinner Catering',
        itemType: 'service',
        description: 'Turnkey live gourmet catering with on-site tandoor chefs, copper table service, and curated bespoke menus for 25 to 200 guests.',
        price: 'From 1,800/plate',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://saffronspice.demo.tappzio.com/catering',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80', caption: 'Opulent Ambient Dining Room' },
      { url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80', caption: 'Dum Pukht Clay Handi Presentation' },
      { url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', caption: 'Chef Handcrafting Clay Oven Tandoori' },
    ],
    brochures: [
      { title: 'Saffron & Spice — Complete Dining & Beverage Menu 2026', fileUrl: '/docs/saffron-spice-menu-demo.pdf', fileSize: '3.8 MB' },
    ],
    isDemo: true,
  },

  // 7. Modern Business & Technology
  {
    id: 'demo-nexacore-systems',
    slug: 'nexacore-cloud-systems',
    displayName: 'NexaCore Cloud & AI Systems',
    category: 'modern-business',
    categoryLabel: 'Modern Business & Tech',
    industry: 'Cloud Infrastructure & Applied AI',
    headline: 'Autonomous AI Workflows, Distributed Cloud Infrastructure & DevOps Reliability',
    bio: 'NexaCore engineers scalable microservices, vector search pipelines, and enterprise LLM integrations. We help scaling technology organizations build resilient, low-latency platforms across AWS, GCP, and self-hosted Kubernetes.\n\n[DEMO PROFILE] Modern emerald tech layout with interactive showcase and technical capabilities.',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'modern-business',
    phone: '+91 20 6790 3300',
    whatsapp: '+91 97660 33000',
    email: 'architecture@nexacore-demo.com',
    website: 'https://nexacore.demo.tappzio.com',
    address: 'World Trade Center, Tower 2, Kharadi',
    location: 'Pune, Maharashtra 411014',
    workingHours: 'Mon – Fri: 09:00 – 18:30 IST (24/7 SRE Response)',
    highlights: [
      'Sub-50ms vector query retrieval architectures',
      'SOC2 Type II & ISO 27001 data isolation compliance',
      'Automated zero-downtime CI/CD deployment pipelines',
      'Specialized engineering pods for FinTech & HealthTech systems',
    ],
    socialLinks: [
      { platform: 'github', url: 'https://github.com/nexacore-demo' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/nexacore-demo' },
      { platform: 'twitter', url: 'https://x.com/nexacore_demo' },
    ],
    businesses: [
      {
        id: 'biz-nexacore-hq',
        companyName: 'NexaCore Cloud Technologies Inc',
        tagline: 'High-Throughput Distributed Cloud',
        roleTitle: 'Engineering Headquarters',
        industry: 'Cloud Computing',
        description: 'Core platform development and 24/7 site reliability operations center.',
        websiteUrl: 'https://nexacore.demo.tappzio.com',
        address: 'WTC, Kharadi, Pune',
      },
    ],
    catalogue: [
      {
        id: 'cat-nexa-1',
        title: 'Kubernetes Cluster Architecture & Migration',
        itemType: 'service',
        description: 'Full architecture migration to bare-metal or managed Kubernetes (EKS/GKE) with GitOps automation and Terraform IaC.',
        price: '3,50,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://nexacore.demo.tappzio.com/solutions/k8s',
      },
      {
        id: 'cat-nexa-2',
        title: 'Enterprise AI Agent & RAG Pipeline Setup',
        itemType: 'service',
        description: 'End-to-end integration of open-weight LLMs, vector database embeddings, and structured schema validations.',
        price: '4,80,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://nexacore.demo.tappzio.com/solutions/ai-rag',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80', caption: 'High-Performance Cloud Infrastructure' },
      { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', caption: 'Autonomous Neural Model Pipelines' },
    ],
    brochures: [
      { title: 'NexaCore — Cloud Infrastructure & AI Architecture Brief', fileUrl: '/docs/nexacore-capability-demo.pdf', fileSize: '2.8 MB' },
    ],
    isDemo: true,
  },

  // 8. Premium Brand & Luxury
  {
    id: 'demo-meridian-luxury',
    slug: 'meridian-high-end-living',
    displayName: 'Meridian Private Estates',
    category: 'premium-brand',
    categoryLabel: 'Premium Brand & Luxury',
    industry: 'Trophy Real Estate & Private Assets',
    headline: 'Bespoke Waterfront Estates, Luxury Villas & Confidential Wealth Portfolios',
    bio: 'Meridian represents the pinnacle of discreet luxury asset acquisition. We curate off-market seaside penthouses, heritage heritage bungalows, and private oceanfront acreage for family offices and discerning collectors.\n\n[DEMO PROFILE] Signature Obsidian Luxury aesthetic with brushed metallic gold and VIP contact features.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    coverUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    profileType: 'business',
    templateId: 'premium-brand',
    phone: '+91 22 2288 9000',
    whatsapp: '+91 98210 90000',
    email: 'private@meridianestates-demo.com',
    website: 'https://meridianestates.demo.tappzio.com',
    address: 'Chander Mukhi, Nariman Point',
    location: 'Mumbai, Maharashtra 400021',
    workingHours: 'Strictly by Prior Private Appointment',
    highlights: [
      'Exclusive mandate on 18 off-market beachfront trophy estates',
      'Confidential escrow & legal due-diligence facilitation',
      'Helicopter and private yacht site inspections arranged',
      'VIP concierge services for international non-resident clients',
    ],
    socialLinks: [
      { platform: 'instagram', url: 'https://instagram.com/meridianestates_demo' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/meridianestates-demo' },
      { platform: 'website', url: 'https://meridianestates.demo.tappzio.com' },
    ],
    businesses: [
      {
        id: 'biz-meridian-prime',
        companyName: 'Meridian Prime Real Estate LLP',
        tagline: 'Ultra-Luxury Realty Advisors',
        roleTitle: 'Nariman Point Advisory',
        industry: 'Luxury Real Estate',
        description: 'Trophy asset procurement and off-market residential acquisitions.',
        websiteUrl: 'https://meridianestates.demo.tappzio.com',
        address: 'Nariman Point, Mumbai',
      },
    ],
    catalogue: [
      {
        id: 'cat-meridian-1',
        title: 'The Bay Penthouse at Marine Drive',
        itemType: 'product',
        description: '11,000 sq ft triplex residence with 360-degree Arabian Sea panorama, private infinity cantilevered pool, and private high-speed elevator.',
        price: '48,00,00,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://meridianestates.demo.tappzio.com/estates/bay-penthouse',
      },
      {
        id: 'cat-meridian-2',
        title: 'Heritage Portuguese Coastal Villa (North Goa)',
        itemType: 'product',
        description: 'Restored 19th-century estate on 2.4 private oceanfront acres with direct beach access, private chapel, and lush orchard gardens.',
        price: '22,50,00,000',
        currency: '₹',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
        actionUrl: 'https://meridianestates.demo.tappzio.com/estates/goa-coastal-villa',
      },
    ],
    gallery: [
      { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80', caption: 'Penthouse Oceanfront Living Salon' },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80', caption: 'Coastal Villa Grounds & Sunset Vista' },
    ],
    brochures: [
      { title: 'Meridian Private Estates — The Trophy Collection 2026', fileUrl: '/docs/meridian-trophy-collection-demo.pdf', fileSize: '8.4 MB' },
    ],
    isDemo: true,
  },
];

/**
 * Helper to get a demo business by template ID or category
 */
export function getDemoBusinessByTemplate(templateId: string): DemoBusinessProfile {
  // Direct match
  const direct = DEMO_BUSINESSES.find(
    (b) => b.templateId === templateId || b.category === templateId
  );
  if (direct) return direct;

  // Normalized matching for legacy slugs
  if (templateId === 'zenith-corporate') return DEMO_BUSINESSES[1]; // Singhania Corporate
  if (templateId === 'aurora-creator') return DEMO_BUSINESSES[2]; // Horizon Creative
  if (templateId === 'ivory-minimal') return DEMO_BUSINESSES[3]; // Veritas Legal
  if (templateId === 'catalyst-business') return DEMO_BUSINESSES[6]; // NexaCore Modern
  if (templateId === 'obsidian-luxury' || templateId === 'apex-capital') return DEMO_BUSINESSES[7]; // Meridian

  // Default fallback to first demo business
  return DEMO_BUSINESSES[0];
}

