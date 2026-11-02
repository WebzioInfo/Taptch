'use client';

import * as React from 'react';
import { brandConfig } from '@/config/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Smartphone, Laptop, MoreVertical, CreditCard } from 'lucide-react';

export default function DesignSystemGalleryPage() {
  const [theme, setTheme] = React.useState<'obsidian' | 'ivory' | 'aurora'>('obsidian');
  const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-8">
      {/* Top Bar Controls */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{brandConfig.name} Design System Studio</h1>
          <p className="text-xs text-neutral-400">Interactive Component Gallery & WCAG 2.2 Contrast Verification</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setTheme('obsidian')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                theme === 'obsidian' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Obsidian (Flagship)
            </button>
            <button
              onClick={() => setTheme('ivory')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                theme === 'ivory' ? 'bg-amber-100 text-neutral-900 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Ivory
            </button>
            <button
              onClick={() => setTheme('aurora')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                theme === 'aurora' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Aurora
            </button>
          </div>

          {/* Viewport Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>1280px</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>390px</span>
            </button>
          </div>
        </div>
      </div>

      {/* Frame Container */}
      <div className="max-w-7xl mx-auto py-8 flex justify-center">
        <div
          data-theme={theme}
          className={`transition-all duration-300 rounded-2xl border border-border bg-background text-foreground shadow-2xl p-6 sm:p-10 ${
            viewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-5xl'
          }`}
        >
          {/* Header Info Banner */}
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg capitalize">{theme} Direction</span>
                <Badge variant="gold">
                  {theme === 'obsidian' ? '19.78:1 AAA' : theme === 'ivory' ? '19.21:1 AAA' : '16.44:1 AAA'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {theme === 'obsidian' && 'Dark luxury, metallic gold accents, high-contrast borders.'}
                {theme === 'ivory' && 'Editorial warmth, tactile paper feel, warm terracotta accents.'}
                {theme === 'aurora' && 'Deep indigo space, electric sky accents, digital-forward.'}
              </p>
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src="/assets/demo/avatar-sample.jpg" />
              <AvatarFallback>AV</AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-8 mt-6">
            {/* Section 1: Buttons */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                1. Button Primitives
              </h2>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="default">Primary Button</Button>
                <Button variant="gold">Gold Luxury</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large CTA</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            {/* Section 2: Badges */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                2. Badges & Tags
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="default">Verified Member</Badge>
                <Badge variant="gold">Obsidian Elite</Badge>
                <Badge variant="secondary">In Production</Badge>
                <Badge variant="outline">NTAG424 DNA</Badge>
                <Badge variant="destructive">Revoked</Badge>
              </div>
            </div>

            {/* Section 3: Inputs */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                3. Input Fields
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Direct Email</label>
                  <Input placeholder="aditya@apexcapital.in" defaultValue="aditya@apexcapital.in" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Activation Secret Key</label>
                  <Input placeholder="••••••" type="password" />
                </div>
              </div>
            </div>

            {/* Section 4: Cards */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                4. Cards & Profiles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Aditya Vikram</CardTitle>
                      <Badge variant="gold">Managing Partner</Badge>
                    </div>
                    <CardDescription>Apex Capital Partners &bull; Mumbai</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Cross-border M&A advisory, sovereign wealth allocation, and private equity investments.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">View Public Card</Button>
                    <Button variant="gold" size="sm">Exchange Contact</Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Executive Metal Card</CardTitle>
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <CardDescription>Chip: NTAG424 DNA Sun Cryptographic</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-emerald-400">Active &bull; Linked</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Security Mode</span>
                      <span className="font-semibold">Dynamic AES-128 SUN</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" size="sm" className="w-full">Manage Security</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Section 5: Tabs & Interactive Modals */}
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                5. Interactive Dialogs & Tabs
              </h2>
              <div className="space-y-4">
                <Tabs defaultValue="identity">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="identity">Digital Profile</TabsTrigger>
                    <TabsTrigger value="cards">NFC Cards</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                  <TabsContent value="identity" className="p-4 rounded-lg border border-border mt-2 text-sm text-muted-foreground">
                    Obsidian Luxury digital business card with zero-DB cached public profile and instant vCard 3.0 export.
                  </TabsContent>
                  <TabsContent value="cards" className="p-4 rounded-lg border border-border mt-2 text-sm text-muted-foreground">
                    Hardware NTAG424 DNA cards with CMAC dynamic tamper detection and manufacturer pre-encoding pipeline.
                  </TabsContent>
                  <TabsContent value="security" className="p-4 rounded-lg border border-border mt-2 text-sm text-muted-foreground">
                    Multi-tenant PostgreSQL Row-Level Security, Better Auth 2FA, and transaction-isolated session variables.
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open Test Modal Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Hardware Activation Key</DialogTitle>
                        <DialogDescription>
                          Enter the 6-character activation secret found under the protective seal.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-3">
                        <Input placeholder="e.g. 7X9K2P" className="text-center font-mono text-lg tracking-widest uppercase" />
                      </div>
                      <DialogFooter>
                        <Button variant="gold" className="w-full">Verify & Bind Card</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Copy Public Link</DropdownMenuItem>
                      <DropdownMenuItem>Download vCard (.vcf)</DropdownMenuItem>
                      <DropdownMenuItem>Download QR Code</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Deactivate Card</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
