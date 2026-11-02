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
  try {
    const profile = await getProfileBySlug(slug);
    if (!profile) return { title: brandConfig.name };

    return {
      title: `${profile.displayName} | ${brandConfig.name}`,
      description: profile.headline || `${profile.displayName}'s digital profile and verified executive card.`,
    };
  } catch {
    return { title: brandConfig.name };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;

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

  return <ProfileRenderer profile={renderData as Parameters<typeof ProfileRenderer>[0]['profile']} />;
}

