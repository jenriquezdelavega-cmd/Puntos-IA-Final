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

const leadsFile = path.join(process.cwd(), 'data', 'prelaunch-leads.json');

async function readLeads(): Promise<PrelaunchLead[]> {
  try {
    const raw = await readFile(leadsFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as PrelaunchLead[];
  } catch {
    return [];
  }
}

export async function addPrelaunchLead(lead: PrelaunchLead) {
  const current = await readLeads();
  const next = [lead, ...current];
  await mkdir(path.dirname(leadsFile), { recursive: true });
  await writeFile(leadsFile, JSON.stringify(next, null, 2), 'utf8');
}

export async function listPrelaunchLeads() {
  return readLeads();
}
