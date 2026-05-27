/**
 * add-firebase-domain.mjs
 * Adds cctvquotation.com to Firebase Authentication Authorized Domains
 * Uses the correct v1 Identity Toolkit API endpoint for authorized domains
 */

const PROJECT_ID = 'team-cctv-live-8294';
const CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@team-cctv-live-8294.iam.gserviceaccount.com';
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCardrSA+9Knnpb
zDNx/TV1E3KGO8VTb1mxlRaAQs8R6BRoiCcoJhC0AacjEQVTJaz0k40xY+9lBTCw
7d6+ZpvEQg9nzR/gv3qmVs6QCkOj/p3Hd8RNJnjZir4I2hXVYqY6swlSJGLcuSQm
QwBkLOJ0V2PR03wSmZbjLs50dLIaKb9e8eon9be6PItSr8zuTSP7JFjAtYFjfdyZ
EUI+LvCN9JlM2gMXY534cB8SPO87SzhiHu9M7JrpLe2R8vx93sK0/2o+6JEJeuLL
luRd8kdHQXzA4D1ma4cU05aC3eY/Din+9x3ZZlJMyI4FucRK8ZATsjKtNDABC6oO
LFx2PHgDAgMBAAECggEAIbZ61wNciFr6OD/Nhq61lArlDzS/0WuXlQj1mob1MuXu
bMogHrQNN+6USyROkMzJYZU3VOh/KPl0n1t5DO64TJJJYUpoBEg3p0GMTACwtXGt
WehUtKwJ8wA2Yx+FWrjhmjGjem/LzGfd5Sj9UNgnk0voybbaeANZy7JL9T3qA6F3
Aae9KDEasMFpYj0efnrK+m0f5+3dmn0xfbEByg8drYSftspUTiAZPGbmKA0EGj/5
33yAOnjzvPDxP1kMOsjTqGNsKGCSWh6OUlLiRHEnQJi/Gn5Q1R5kdcCoTNeb00df
wpT5KuzLKBAmsfT5pAwPijzf0Re6neER5nFi4USBwQKBgQDIVdrxY+DXg+i3w1mp
rnIX9Y7huErYBB+gW2U6AQxZ9zzxiuw3m0hdrfd6jjaN5uY3cI2aaodEM5AZdejC
3IaV8k+PRd1zeBpjg/tXKzGS0/lXxrn/Jy7y2FBrvXtE4R0HD/OJ3GLK7xEK6ldc
I8zj3H0Li9V29zLevsP6f06d6wKBgQDFqGd/1BlpiMR7iFZ7pg9/NBufzgfGix6l
27Najdca18T3oQ8TF/NCpczUtZOanzxs/Oxz8aT1ZOIJcM5xw/N683OgjNosyhD8
k1xiIB/E+qFCPV4sHrQy88zTf8b7f91wdzWMrYwznlIYUyn+wJkaN2pPGOs82FDO
CweUUGhQSQKBgQCOXmU/0skAn5+MqGlZ6rzuRfYKdxvJM/T90rW3aPNMJCXNSfrg
8ZuV54HOOK6QXZ0RnQ0kxbvnPfWUAnUtteZ3PUJJAU+FNb8bJbpCklGilL3IIVQg
/cmhjxRn3Lpzkr88O5vJRzN2IDsuVKdMtaxv6kt7Hx7OcpJWNZ+0rzBBjQKBgG5V
Vgj19YWCkeM/NL9q8AWaqbznvlFnASGmZRSsTqGuRkXQguCuotzWPmOSRCWws4NH
IBqMjf9pY//PF35L2pMMaMP7PCJ6XUcQXyZrNjC3kuKt7O6F6SL0EqcREZr8Qjjw
YlT332ZE/yCS88M/8Xa/7jje+RkKyvhpEb8Jr2D5AoGAWKaGhbVg4LUaz4SvPo8y
8pJNXtplPkPoerUkFYfvAi9Qn4aIfVGiarv/aiT+yDjIeWRfPSlTGZXM57PaTHg5
1V3cjNtDTo598p3zN8hlPdBoDKmXir1k8voFgoc3EXtTIeuGNSFPeryxMfcQvcYQ
2Y85xmqXj50fbOaVwEHG9go=
-----END PRIVATE KEY-----`;

async function createJWT() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: CLIENT_EMAIL,
    sub: CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/cloud-platform'
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const headerStr = encode(header);
  const payloadStr = encode(payload);
  const sigInput = `${headerStr}.${payloadStr}`;

  const { createSign } = await import('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(sigInput);
  const signature = sign.sign(PRIVATE_KEY, 'base64url');
  return `${headerStr}.${payloadStr}.${signature}`;
}

async function getAccessToken() {
  const jwt = await createJWT();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token error: ${data.error_description}`);
  return data.access_token;
}

(async () => {
  try {
    console.log('🔐 Getting access token...');
    const token = await getAccessToken();
    console.log('✅ Token obtained\n');

    // First, GET the current project config using v2 admin endpoint
    console.log('📋 Getting current config...');
    const getRes = await fetch(
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const config = await getRes.json();
    if (!getRes.ok) {
      console.log('Response:', JSON.stringify(config, null, 2));
      throw new Error('Failed to get config');
    }
    console.log('Raw config:', JSON.stringify(config, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
