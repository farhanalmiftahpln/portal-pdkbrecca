import { createApp } from '../server/app';

const app = createApp();

export default function handler(req: any, res: any) {
  // Ensure pre-parsed bodies by Vercel Serverless runtime don't hang Express body-parser
  if (req.body !== undefined && typeof req.body === 'object') {
    req._body = true;
  }
  return app(req, res);
}
