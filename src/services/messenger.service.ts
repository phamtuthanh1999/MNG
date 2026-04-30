import https from 'https';
import { IncomingMessage } from 'http';
import { URL } from 'url';

/**
 * Messenger service - gửi tin nhắn qua Facebook Graph API
 * - Uses `FB_PAGE_ACCESS_TOKEN` from environment by default.
 * - Example: await sendTextMessage('RECIPIENT_ID', 'Hello')
 */

export const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v25.0';
export const FB_PAGE_ID = process.env.FB_PAGE_ID || '963756143497416';

export async function sendTextMessage(recipientId: string, text: string, accessToken?: string, pageId?: string): Promise<any> {
  const token = accessToken || process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FB_PAGE_ACCESS_TOKEN is not set. Set it in the environment or pass as parameter.');
  }
  const pid = pageId || FB_PAGE_ID;

  const postData = JSON.stringify({
    recipient: { id: recipientId },
    messaging_type: 'RESPONSE',
    message: { text }
  });

  const url = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pid}/messages?access_token=${encodeURIComponent(token)}`);

  const options: https.RequestOptions = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err: any = new Error(`Facebook API error: ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.response = parsed;
            reject(err);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

export async function sendMessagePayload(payload: any, accessToken?: string, pageId?: string): Promise<any> {
  const token = accessToken || process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('FB_PAGE_ACCESS_TOKEN is not set.');
  const pid = pageId || FB_PAGE_ID;

  const postData = JSON.stringify(payload);
  const url = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pid}/messages?access_token=${encodeURIComponent(token)}`);

  const options: https.RequestOptions = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname + url.search,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err: any = new Error(`Facebook API error: ${res.statusCode}`);
            err.statusCode = res.statusCode;
            err.response = parsed;
            reject(err);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}
