'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { ComingSoonModule } from '@/components/admin/coming-soon-module';

export default function MigrantInfoAdminPage() {
  return (
    <ComingSoonModule
      title="Migrant Worker Guidance & Knowledgebase"
      description="Manage safe migration guides, anti-fraud warnings, emergency hotlines, and destination rules."
      plannedPhase="Phase 6 Content & Welfare Engine"
      icon={<Info className="w-8 h-8" />}
      features={[
        'Categorized guides: Pre-departure, Overseas Safety, Embassy Helplines, Remittance',
        'Direct synchronization with public website guidance section',
        'Bengali migrant workers rights and BMET compliance checklists',
      ]}
    />
  );
}
