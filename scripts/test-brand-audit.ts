async function auditBrand() {
  console.log('========================================');
  console.log('AUDITING SHAKIL GLOBAL MANPOWER BRANDING');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, desc: string) {
    if (cond) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Audit Home Page HTML
  const homeRes = await fetch('http://localhost:3000/');
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes('SHAKIL GLOBAL MANPOWER'), 'Home page contains SHAKIL GLOBAL MANPOWER');
  assert(homeHtml.includes('01913681771'), 'Home page contains official phone 01913681771');
  assert(homeHtml.includes('tel:01913681771'), 'Home page contains clickable tel:01913681771 link');
  assert(homeHtml.includes('RL-1892'), 'Home page contains RL-1892 license number');
  assert(!homeHtml.includes('SHAKIL GLOBAL RECRUITMENT'), 'Home page has no visible SHAKIL GLOBAL RECRUITMENT');

  // 2. Audit Contact Page
  const contactRes = await fetch('http://localhost:3000/contact');
  const contactHtml = await contactRes.text();
  assert(contactHtml.includes('01913681771'), 'Contact page contains official phone');
  assert(contactHtml.includes('নেত্রকোনা'), 'Contact page contains Netrokona address in Bengali');
  assert(contactHtml.includes('ইসলামপুর মোড়'), 'Contact page contains Islampur Mor address');

  // 3. Audit Health Check Route
  const healthRes = await fetch('http://localhost:3000/api/health');
  const healthJson = await healthRes.json();
  assert(healthJson.service === 'SHAKIL GLOBAL MANPOWER ERP', 'Health endpoint reports SHAKIL GLOBAL MANPOWER ERP');

  // 4. Audit Icon / Favicon Assets
  const iconRes = await fetch('http://localhost:3000/brand/favicon.svg');
  assert(iconRes.status === 200, 'Brand favicon.svg exists and is served with HTTP 200');

  const logoRes = await fetch('http://localhost:3000/brand/logo.svg');
  assert(logoRes.status === 200, 'Brand logo.svg exists and is served with HTTP 200');

  const logoLightRes = await fetch('http://localhost:3000/brand/logo-light.svg');
  assert(logoLightRes.status === 200, 'Brand logo-light.svg exists and is served with HTTP 200');

  const logoMarkRes = await fetch('http://localhost:3000/brand/logo-mark.svg');
  assert(logoMarkRes.status === 200, 'Brand logo-mark.svg exists and is served with HTTP 200');

  console.log(`\nAUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed > 0) process.exit(1);
}

auditBrand().catch((err) => {
  console.error(err);
  process.exit(1);
});
