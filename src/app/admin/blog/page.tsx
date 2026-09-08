'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ComingSoonModule } from '@/components/admin/coming-soon-module';

export default function BlogAdminPage() {
  return (
    <ComingSoonModule
      title="Articles & Overseas News"
      description="Publish recruitment announcements, legal updates, policy briefings, and migrant success stories."
      plannedPhase="Phase 6 Content & Portal Management"
      icon={<MessageCircle className="w-8 h-8" />}
      features={[
        'Rich text editor for Bengali and English articles',
        'SEO metadata, social cards, and publication scheduling',
        'Featured news carousel on the public portal',
      ]}
    />
  );
}
