import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthToken } from '../experience/src/network/token.ts';

test('API authentication retrieves the JWT endpoint with the session cookie', async () => {
  const token = await getAuthToken('https://auth.example.test/auth/', async (url, options) => {
    assert.equal(url, 'https://auth.example.test/auth/token');
    assert.equal(options.credentials, 'include');
    assert.equal(options.cache, 'no-store');
    return Response.json({ token: 'header.payload.signature' });
  });
  assert.equal(token, 'header.payload.signature');
});

test('a cached SDK session cannot be used as a JWT response', async () => {
  await assert.rejects(
    getAuthToken('https://auth.example.test/auth', async () => Response.json({
      session: { token: 'opaque-session' }, user: { id: 'test-user' },
    })),
    /did not provide an access token/,
  );
});

test('expired sessions are reported before making a backend request', async () => {
  await assert.rejects(
    getAuthToken('https://auth.example.test/auth', async () => new Response(null, { status: 401 })),
    /session could not be restored/,
  );
});
