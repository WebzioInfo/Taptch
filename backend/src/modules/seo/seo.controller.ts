import { Controller, Get, Param, Res, Req, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SeoService } from './seo.service';
import { Request, Response } from 'express';

@ApiTags('SEO & Metadata')
@Controller()
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Dynamic XML sitemap listing published profiles' })
  async getSitemap() {
    return this.seoService.generateSitemapXml();
  }

  @Public()
  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Standard robots.txt directives' })
  getRobots() {
    return this.seoService.generateRobotsTxt();
  }

  @Public()
  @Get('api/v1/seo/preview/:slug')
  @ApiOperation({ summary: 'Get generated SEO and social card metadata for preview' })
  async getSeoPreview(@Param('slug') slug: string) {
    return this.seoService.getProfileSeo(slug);
  }

  @Public()
  @Get('p/:slug')
  @ApiOperation({ summary: 'Crawler-compatible server-side rendered HTML metadata for public profiles' })
  async renderPublicProfileMeta(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /bot|crawler|spider|crawling|whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|applebot/i.test(
      userAgent,
    );

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

    try {
      const seo = await this.seoService.getProfileSeo(slug);

      // If requested by a crawler/social bot or directly via browser, return rich metadata HTML
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}">
  <link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}">
  <meta name="robots" content="${escapeHtml(seo.robots)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(seo.openGraph.title)}">
  <meta property="og:description" content="${escapeHtml(seo.openGraph.description)}">
  <meta property="og:image" content="${escapeHtml(seo.openGraph.image)}">
  <meta property="og:url" content="${escapeHtml(seo.openGraph.url)}">
  <meta property="og:type" content="${escapeHtml(seo.openGraph.type)}">
  <meta property="og:site_name" content="${escapeHtml(seo.openGraph.siteName)}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${escapeHtml(seo.twitterCard.card)}">
  <meta name="twitter:title" content="${escapeHtml(seo.twitterCard.title)}">
  <meta name="twitter:description" content="${escapeHtml(seo.twitterCard.description)}">
  <meta name="twitter:image" content="${escapeHtml(seo.twitterCard.image)}">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(seo.jsonLd, null, 2)}
  </script>

  ${
    !isBot
      ? `
  <script>
    // Redirect human visitor to full interactive React application
    window.location.replace("${frontendUrl}/p/${encodeURIComponent(slug)}");
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${frontendUrl}/p/${encodeURIComponent(slug)}">
  </noscript>
  `
      : ''
  }
  <style>
    body { background: #0A0A0C; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #121216; border: 1px solid #27272A; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
    .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; border: 2px solid #D4AF37; }
    .title { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #F4F4F5; }
    .bio { font-size: 14px; color: #A1A1AA; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: inline-block; background: #D4AF37; color: #000; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 12px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    ${seo.openGraph.image ? `<img src="${escapeHtml(seo.openGraph.image)}" alt="${escapeHtml(seo.title)}" class="avatar">` : ''}
    <h1 class="title">${escapeHtml(seo.title)}</h1>
    <p class="bio">${escapeHtml(seo.description)}</p>
    <a href="${frontendUrl}/p/${encodeURIComponent(slug)}" class="btn">View Interactive Digital Profile</a>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch {
      return res.redirect(`${frontendUrl}/`);
    }
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
