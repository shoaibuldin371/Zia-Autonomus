const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

async function testGate() {
  console.log(`--- Running Automated Security Gate Audit against ${BASE_URL} ---`);
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Health Endpoint
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert(healthRes.status === 200, `/api/health responds with 200 OK (Status: ${healthRes.status})`);
  const healthJson = await healthRes.json();
  assert(healthJson.status === 'healthy', `Health status is healthy`);
  assert(!JSON.stringify(healthJson).includes('secret'), `Health payload contains no secret keys`);

  // 2. Login Page HTML Audit
  const loginRes = await fetch(`${BASE_URL}/login`);
  assert(loginRes.status === 200, `/login renders with 200 OK`);
  const loginHtml = await loginRes.text();
  assert(!loginHtml.includes('ziauldin371@gmail.com'), `/login HTML contains NO admin email address`);
  assert(!loginHtml.includes('Main Navigation'), `/login HTML contains NO dashboard sidebar`);
  assert(!loginHtml.includes('Loading portal session...'), `/login HTML contains no endless session loader`);
  assert(loginHtml.includes('Sign In to Console'), `/login HTML has direct sign-in form visible immediately`);

  // 3. API Private Access Without Cookie
  const apiNoCookieRes = await fetch(`${BASE_URL}/api/businesses`);
  assert(apiNoCookieRes.status === 401, `/api/businesses without cookie returns 401 Unauthorized (Status: ${apiNoCookieRes.status})`);

  // 4. API Private Access With Forged Cookie
  const apiForgedRes = await fetch(`${BASE_URL}/api/businesses`, {
    headers: { Cookie: 'growth_session=forged_jwt_token_attempt' },
  });
  assert(apiForgedRes.status === 401, `/api/businesses with forged cookie returns 401 Unauthorized (Status: ${apiForgedRes.status})`);

  // 5. Private Page Redirects Without Cookie
  const pageNoCookieRes = await fetch(`${BASE_URL}/`, { redirect: 'manual' });
  assert(pageNoCookieRes.status === 307, `Private dashboard page without cookie returns 307 Redirect (Status: ${pageNoCookieRes.status})`);
  const locationHeader = pageNoCookieRes.headers.get('location') || '';
  assert(locationHeader.includes('/login?next=%2F') || locationHeader.includes('/login?next=/'), `Redirect destination points to /login?next=/`);

  // 6. Private Page Redirects With Forged Cookie
  const pageForgedRes = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: 'growth_session=eyJhbGciOiJIUzI1NiJ9.forged' },
    redirect: 'manual',
  });
  assert(pageForgedRes.status === 307, `Private dashboard page with forged cookie returns 307 Redirect (Status: ${pageForgedRes.status})`);

  // 7. Cron Matrix: Missing Bearer Header
  const cronNoAuthRes = await fetch(`${BASE_URL}/api/cron/scheduled-run`);
  assert(cronNoAuthRes.status === 401, `Cron request without Bearer returns 401 Unauthorized (Status: ${cronNoAuthRes.status})`);

  // 8. Cron Matrix: Wrong Bearer Header
  const cronWrongAuthRes = await fetch(`${BASE_URL}/api/cron/scheduled-run`, {
    headers: { Authorization: 'Bearer wrong_token_attempt' },
  });
  assert(cronWrongAuthRes.status === 401, `Cron request with wrong Bearer returns 401 Unauthorized (Status: ${cronWrongAuthRes.status})`);

  // 9. Cron Matrix: Query String Secret Rejection
  const cronQueryRes = await fetch(`${BASE_URL}/api/cron/scheduled-run?secret=some_secret`);
  assert(cronQueryRes.status === 400, `Cron request with query parameter secret returns 400 Bad Request (Status: ${cronQueryRes.status})`);

  // 10. Compliance Unsubscribe: Missing parameters
  const unsubNoParamsRes = await fetch(`${BASE_URL}/api/compliance/unsubscribe`);
  assert(unsubNoParamsRes.status === 400, `Unsubscribe without parameters returns 400 Bad Request`);

  // 11. Compliance Unsubscribe: Tampered token
  const unsubTamperedRes = await fetch(`${BASE_URL}/api/compliance/unsubscribe?email=client@test.com&token=tampered_hex_token`);
  assert(unsubTamperedRes.status === 400, `Unsubscribe with tampered token returns 400 Bad Request`);

  console.log(`\nGate Audit Complete: ${passedCount} of ${totalCount} checks PASSED!`);
}

testGate().catch((err) => {
  console.error('Gate test error:', err);
  process.exit(1);
});
