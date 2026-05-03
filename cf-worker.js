// Cloudflare Worker — Firebase Firestore Proxy for OmniEnglish
// 部署到 Cloudflare Workers，国内可直连

const FIREBASE_API_KEY = 'AIzaSyB8vZ_cRgE3Eo2Nr3LzvJpkrJroY98JA1M';
const FIREBASE_PROJECT = 'omnienglish-aab81';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /auth — 匿名登录，返回 uid + idToken
    if (url.pathname === '/auth' && request.method === 'POST') {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
      );
      const data = await resp.json();
      return new Response(JSON.stringify({
        uid: data.localId,
        idToken: data.idToken
      }), { headers: corsHeaders });
    }

    // GET /doc?uid=xxx&token=xxx — 读取用户配置
    if (url.pathname === '/doc' && request.method === 'GET') {
      const uid = url.searchParams.get('uid');
      const token = url.searchParams.get('token');
      if (!uid || !token) {
        return new Response(JSON.stringify({ error: 'missing uid or token' }), { status: 400, headers: corsHeaders });
      }

      const fbUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}`;
      const resp = await fetch(fbUrl, {
        headers: { 'Authorization': `Firebase ${token}` }
      });

      if (resp.status === 404) {
        return new Response(JSON.stringify({ exists: false }), { headers: corsHeaders });
      }

      const doc = await resp.json();
      const result = { exists: true };
      for (const [key, val] of Object.entries(doc.fields || {})) {
        result[key] = parseValue(val);
      }
      return new Response(JSON.stringify(result), { headers: corsHeaders });
    }

    // POST /doc — 写入用户配置
    if (url.pathname === '/doc' && request.method === 'POST') {
      const body = await request.json();
      const { uid, token, key, data } = body;
      if (!uid || !token || !key) {
        return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: corsHeaders });
      }

      const fields = {};
      fields[key] = toValue(data);
      fields['updatedAt'] = { timestampValue: new Date().toISOString() };

      // 先尝试 PATCH (merge)，属性名含连字符需要反引号
      const safeKey = key.includes('-') ? '`' + key + '`' : key;
      const fbUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=${safeKey}&updateMask.fieldPaths=updatedAt`;
      let resp = await fetch(fbUrl, {
        method: 'PATCH',
        headers: { 'Authorization': `Firebase ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });

      if (!resp.ok) {
        const patchErr = await resp.text();
        // 文档不存在，用 POST 创建
        const createUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users?documentId=${uid}`;
        resp = await fetch(createUrl, {
          method: 'POST',
          headers: { 'Authorization': `Firebase ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { ...fields, uid: { stringValue: uid } } })
        });
        if (!resp.ok) {
          const postErr = await resp.text();
          return new Response(JSON.stringify({ ok: false, patchErr, postErr }), { headers: corsHeaders });
        }
        const postResult = await resp.json();
        return new Response(JSON.stringify({ ok: true, created: true }), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ ok: true, updated: true }), { headers: corsHeaders });
    }

    // GET /debug?uid=xxx&token=xxx — 原始 Firestore 响应
    if (url.pathname === '/debug' && request.method === 'GET') {
      const uid = url.searchParams.get('uid');
      const token = url.searchParams.get('token');
      const fbUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/users/${uid}`;
      const resp = await fetch(fbUrl, { headers: { 'Authorization': `Firebase ${token}` } });
      const raw = await resp.text();
      return new Response(raw, { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

// Firestore 值 → JS 值
function parseValue(val) {
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.arrayValue) return (val.arrayValue.values || []).map(parseValue);
  if (val.mapValue && val.mapValue.fields) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) obj[k] = parseValue(v);
    return obj;
  }
  if (val.nullValue !== undefined) return null;
  return null;
}

// JS 值 → Firestore 值
function toValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}
