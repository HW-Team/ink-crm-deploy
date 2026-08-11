import { NextRequest, NextResponse } from 'next/server';

// Agent API auth — dedicated key from env, checked on every agent route
export function checkAgentKey(req: NextRequest): boolean {
  const key = process.env.INK_AGENT_KEY;
  if (!key) return false;
  const provided = req.headers.get('x-ink-agent-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return provided === key;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
