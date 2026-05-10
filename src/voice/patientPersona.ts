import type { PatientCase } from '../game/types';

/** Stable speaker gender for the visible companion in the 3D scene. The
 *  simulator now speaks through the pet parent, never through the animal. */
export function parentGenderForId(caseId: string): 'M' | 'F' {
  let h = 0x811c9dc5;
  for (let i = 0; i < caseId.length; i++) {
    h ^= caseId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 2 === 0 ? 'F' : 'M';
}

const FEMALE_OWNER_NAMES = new Set([
  'ana',
  'clara',
  'claudia',
  'elena',
  'ines',
  'irene',
  'laura',
  'lucia',
  'marta',
  'maria',
  'noa',
  'sara',
  'sofia',
]);

const MALE_OWNER_NAMES = new Set([
  'alex',
  'bedirhan',
  'carlos',
  'david',
  'diego',
  'javier',
  'jorge',
  'luis',
  'miguel',
  'pablo',
  'sergio',
]);

function normalizeOwnerFirstName(ownerName?: string): string {
  return (ownerName ?? '')
    .trim()
    .split(/\s+/)[0]
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase() ?? '';
}

export function inferPetOwnerGender(ownerName?: string, caseId?: string): 'M' | 'F' {
  const firstName = normalizeOwnerFirstName(ownerName);
  if (FEMALE_OWNER_NAMES.has(firstName)) return 'F';
  if (MALE_OWNER_NAMES.has(firstName)) return 'M';
  if (firstName.endsWith('a') && firstName !== 'luca') return 'F';
  return caseId ? parentGenderForId(caseId) : 'F';
}

export function parentGenderFor(c: PatientCase): 'M' | 'F' {
  return inferPetOwnerGender(c.ownerName, c.id);
}

export function isPediatric(_c: PatientCase): boolean {
  return false;
}

export function buildInitialLine(c: PatientCase) {
  return { role: 'assistant' as const, content: c.chiefComplaint };
}

export function buildPersona(c: PatientCase, setting: 'er' | 'polyclinic' = 'er'): string {
  const animal = c.species === 'dog' ? 'dog' : 'cat';
  const pronoun = c.gender === 'F' ? 'she' : 'he';
  const possessive = c.gender === 'F' ? 'her' : 'his';
  const ownerRole = parentGenderFor(c) === 'F' ? 'pet mother' : 'pet father';
  const settingLine =
    setting === 'polyclinic'
      ? 'You are in a small-animal veterinary clinic. This is a consultation with a veterinarian.'
      : 'You are in a veterinary emergency service because the problem may be urgent.';

  const severityNote =
    c.severity === 'critical'
      ? `You are frightened. ${c.name} looks very unwell. Use short, worried sentences.`
      : c.severity === 'urgent'
        ? `You are anxious about ${c.name}. Keep answers brief and practical.`
        : `You are concerned but composed. You can answer steadily.`;

  const qa = c.anamnesis
    .map((q) => `- If the vet asks something like "${q.question}" -> answer about ${c.name}: "${q.answer}"`)
    .join('\n');

  return `You are ${c.ownerName}, the ${ownerRole} of ${c.name}, a ${c.age}-year-old ${animal}${c.breed ? ` (${c.breed})` : ''}. ${c.name} weighs ${c.weightKg} kg. You are speaking to the veterinarian on your pet's behalf. ${c.name} does not speak. You never answer as the animal.

SETTING: ${settingLine}

CRITICAL OUTPUT RULES:
- Output ONLY spoken dialogue. No stage directions. No actions. No asterisks. No markup.
- Speak as the owner, in first person about yourself, and in third person about ${c.name}.
- Use "${pronoun}" and "${possessive}" for ${c.name}; never say "I" as the animal.
- Keep replies short: 1-2 short sentences.
- Do not volunteer veterinary information unless the vet asks.
- Do not use clinical jargon unless the owner would naturally know it.
- If the vet asks something unclear, say "I don't understand" and stay in character.

WHAT BROUGHT YOU IN:
- What you said as the vet walked up: "${c.chiefComplaint}"
- How you both appear: ${c.arrivalBlurb}
- Severity context: ${severityNote}

ANSWERS YOU'D GIVE ABOUT ${c.name.toUpperCase()}:
${qa}

THINGS YOU DO NOT KNOW:
- Exact lab values, imaging findings, ECG details, or the final diagnosis
- Insurance policy details beyond normal owner-level awareness
- Anything not listed above unless it is harmless everyday context

HOW TO REACT:
- If a test result is mentioned, ask what it means in plain language.
- If the vet explains a plan, ask what you should watch for at home.
- If cost comes up, you can say you are worried about the bill and want to understand options.
- Stay as ${c.ownerName}, a worried pet parent, at all times.

FORBIDDEN:
- Speaking as ${c.name}: "My tummy hurts."
- Mentioning prompts, AI, simulation, or roleplay.
- Giving a diagnosis before the vet reaches one.

Remember: ONLY ${c.ownerName}'s spoken words.`;
}
