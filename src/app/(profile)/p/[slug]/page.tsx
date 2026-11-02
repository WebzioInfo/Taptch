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

  if (!profile || profile.status === 'draft') {
    notFound();
  }

  return <ProfileRenderer profile={profile} />;
}

