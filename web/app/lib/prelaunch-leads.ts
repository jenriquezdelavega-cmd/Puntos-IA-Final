import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type PrelaunchLead = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
};

function candidateFiles() {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'data', 'prelaunch-leads.json'),
    path.join(cwd, 'web', 'data', 'prelaunch-leads.json'),
    '/tmp/puntoia-prelaunch-leads.json',
  ];
}

async function readOne(file: string): Promise<PrelaunchLead[]> {
  try {
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as PrelaunchLead[];
  } catch {
    return [];
  }
}

export async function listPrelaunchLeads() {
  const all = await Promise.all(candidateFiles().map((f) => readOne(f)));
  const merged = all.flat();

  const seen = new Set<string>();
  const dedup: PrelaunchLead[] = [];
  for (const l of merged) {
    const key = `${l.createdAt}|${l.email}|${l.phone}|${l.businessName}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedup.push(l);
    }
  }

  dedup.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return dedup;
}

export async function addPrelaunchLead(lead: PrelaunchLead) {
  const existing = await listPrelaunchLeads();
  const next = [lead, ...existing];

  for (const file of candidateFiles()) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(next, null, 2), 'utf8');
      return { ok: true as const, file };
    } catch {
      // try next candidate
    }
  }

  return { ok: false as const, file: '' };
}
