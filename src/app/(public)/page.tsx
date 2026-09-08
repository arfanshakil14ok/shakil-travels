import React from 'react';
import { HeroSection } from '@/components/public/hero-section';
import { ServicesSection } from '@/components/public/services-section';
import { CountriesSection } from '@/components/public/countries-section';
import { JobsPreviewSection } from '@/components/public/jobs-preview-section';
import { HowItWorksSection } from '@/components/public/how-it-works-section';
import { MigrantInfoSection } from '@/components/public/migrant-info-section';
import { TrustSection } from '@/components/public/trust-section';
import { ContactCtaSection } from '@/components/public/contact-cta-section';

export default function PublicHomePage() {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <CountriesSection />
      <JobsPreviewSection />
      <HowItWorksSection />
      <MigrantInfoSection />
      <TrustSection />
      <ContactCtaSection />
    </div>
  );
}
