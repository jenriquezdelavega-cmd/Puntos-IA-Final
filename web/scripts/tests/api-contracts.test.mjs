import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

test('api routes avoid direct request.json parsing', () => {
  const apiDir = join(process.cwd(), 'app', 'api');
  const files = walk(apiDir);
  const offenders = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (/await\s+(?:req|request)\.json\s*\(/.test(content)) {
      offenders.push(file.replace(process.cwd() + '/', ''));
    }
  }

  assert.deepEqual(offenders, [], `Found direct json parsing in: ${offenders.join(', ')}`);
});

test('middleware exists to propagate request-id on /api', () => {
  const middlewarePath = join(process.cwd(), 'middleware.ts');
  assert.equal(existsSync(middlewarePath), true, 'middleware.ts must exist');

  const content = readFileSync(middlewarePath, 'utf8');
  assert.match(content, /matcher:\s*\[\s*['"]\/api\/:path\*['"]\s*\]/);
  assert.match(content, /x-request-id/);
  assert.match(content, /master-api/, 'middleware should include master API rate limiting');
  assert.match(content, /x-dns-prefetch-control/, 'middleware should set x-dns-prefetch-control');
  assert.match(content, /x-permitted-cross-domain-policies/, 'middleware should set x-permitted-cross-domain-policies');
});


test('critical auth routes parse request bodies with schema validators', () => {
  const files = [
    'app/api/tenant/login/route.ts',
    'app/api/user/login/route.ts',
    'app/api/user/register/route.ts',
    'app/api/user/update/route.ts',
    'app/api/master/create-tenant/route.ts',
    'app/api/master/list-tenants/route.ts',
    'app/api/master/reports/route.ts',
    'app/api/master/create-user/route.ts',
    'app/api/master/manage-tenant/route.ts',
    'app/api/master/manage-user/route.ts',
    'app/api/master/migrate-prefixes/route.ts',
    'app/api/admin/stats/route.ts',
    'app/api/admin/reports/route.ts',
    'app/api/admin/generate/route.ts',
    'app/api/admin/push/route.ts',
    'app/api/admin/seed/route.ts',
    'app/api/redeem/request/route.ts',
    'app/api/redeem/validate/route.ts',
    'app/api/check-in/scan/route.ts',
  ];

  for (const file of files) {
    const content = readFileSync(join(process.cwd(), file), 'utf8');
    assert.match(content, /parseWithSchema\s*\(/, `${file} must use parseWithSchema()`);
  }
});

test('map tenants endpoint supports conditional requests with ETag', () => {
  const file = 'app/api/map/tenants/route.ts';
  const content = readFileSync(join(process.cwd(), file), 'utf8');

  assert.match(content, /if-none-match/i, 'map tenants route should read If-None-Match header');
  assert.match(content, /status:\s*304/, 'map tenants route should return 304 on ETag match');
  assert.match(content, /etag/i, 'map tenants route should include ETag response header');
});

test('tenant session token verification guards malformed payloads', () => {
  const file = 'app/lib/tenant-session-token.ts';
  const content = readFileSync(join(process.cwd(), file), 'utf8');

  assert.match(content, /try\s*{[\s\S]*JSON\.parse[\s\S]*}\s*catch/, 'verifyTenantSessionToken should handle JSON parse errors');
  assert.match(content, /Number\.isFinite\s*\(\s*parsed\.exp\s*\)/, 'verifyTenantSessionToken should validate exp is finite');
});

test('tenant login includes brute-force rate limiting', () => {
  const file = 'app/api/tenant/login/route.ts';
  const content = readFileSync(join(process.cwd(), file), 'utf8');

  assert.match(content, /checkRateLimit\s*\(/, 'tenant login should enforce rate limiting');
  assert.match(content, /buildRateLimitKey\s*\(\s*['"]tenant-login['"]/, 'tenant login should use tenant-login limiter scope');
});

test('user register includes anti-abuse rate limiting', () => {
  const file = 'app/api/user/register/route.ts';
  const content = readFileSync(join(process.cwd(), file), 'utf8');

  assert.match(content, /checkRateLimit\s*\(/, 'user register should enforce rate limiting');
  assert.match(content, /buildRateLimitKey\s*\(\s*['"]user-register['"]/, 'user register should use user-register limiter scope');
});
