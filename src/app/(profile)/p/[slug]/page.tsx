import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfileBySlug } from '@/modules/profiles';
import { ProfileRenderer } from '@/components/templates/ProfileRenderer';
import { brandConfig } from '@/config/brand';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

  try {
    const profile = await getProfileBySlug(slug);
    const isPublicStatus =
      profile &&
      (profile.status === 'PUBLISHED' ||
        profile.status === 'published' ||
        profile.status === 'APPROVED');

    if (!profile || !isPublicStatus) {
      return {
        title: brandConfig.name,
        robots: { index: false, follow: false },
      };
    }

    // Check if the user explicitly opted out of search engine discovery
    const isSeoOptedOut =
      profile.customFields &&
      typeof profile.customFields === 'object' &&
      (profile.customFields as Record<string, unknown>).seoIndexing === false;

    const profileUrl = `${baseUrl}/p/${slug}`;
    const title = `${profile.displayName} | ${brandConfig.name}`;
    const description =
      profile.headline ||
      profile.bio?.slice(0, 160) ||
      `${profile.displayName}'s verified executive digital identity and contactless card.`;

    const ogImages = profile.avatarUrl
      ? [{ url: profile.avatarUrl, width: 400, height: 400, alt: profile.displayName }]
      : [{ url: `${baseUrl}${brandConfig.assets.logoStackedUrl}`, width: 1200, height: 630, alt: brandConfig.name }];

    return {
      title,
      description,
      alternates: {
        canonical: profileUrl,
      },
      openGraph: {
        type: 'profile',
        title,
        description,
        url: profileUrl,
        siteName: brandConfig.name,
        images: ogImages,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: profile.avatarUrl ? [profile.avatarUrl] : [`${baseUrl}${brandConfig.assets.logoStackedUrl}`],
      },
      robots: isSeoOptedOut
        ? { index: false, follow: false }
        : {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              'max-video-preview': -1,
              'max-image-preview': 'large',
              'max-snippet': -1,
            },
          },
    };
  } catch {
    return {
      title: brandConfig.name,
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taptch.com';

  let profile;
  try {
    profile = await getProfileBySlug(slug);
  } catch {
    notFound();
  }

  // Profile must be strictly PUBLISHED or APPROVED to be visible to public visitors
  const isPublicStatus =
    profile &&
    (profile.status === 'PUBLISHED' ||
      profile.status === 'published' ||
      profile.status === 'APPROVED');

  if (!profile || !isPublicStatus) {
    notFound();
  }

  // Use the pre-compiled, plan-filtered JSON snapshot if present
  const publishedSnapshot =
    profile.publishedJson &&
    typeof profile.publishedJson === 'object' &&
    'displayName' in profile.publishedJson
      ? (profile.publishedJson as Record<string, unknown>)
      : null;

  const renderData = publishedSnapshot ? { ...profile, ...publishedSnapshot } : profile;

  // Build Person Structured Data (Schema.org)
  const socialUrls = Array.isArray(renderData.socialLinks)
    ? renderData.socialLinks.map((s: { url: string }) => s.url).filter(Boolean)
    : [];

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: renderData.displayName,
    jobTitle: renderData.headline || undefined,
    description: renderData.bio || undefined,
    image: renderData.avatarUrl || undefined,
    url: `${baseUrl}/p/${slug}`,
    email: renderData.email || undefined,
    telephone: renderData.phone || undefined,
    sameAs: socialUrls.length > 0 ? socialUrls : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <ProfileRenderer profile={renderData as Parameters<typeof ProfileRenderer>[0]['profile']} />
    </>
  );
}
