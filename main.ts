// Neon Coast Cover Studio — the hand-in program (Node 22, standard library only).
//
// The studio itself is the static web app in app/: plain files a desktop browser runs offline, with no
// build step and no network request. This program's whole job is to hand that app in the way the bounty
// asks: copy app/ and screenshots/ from beside this file into the output directory, then write the
// dossier the judge reads with buildDossier from the vendored make.fun library (vendor/makefun-app.ts,
// the kit's copy, untouched — the scorer rebuilds the dossier with its own copy and compares bytes).
//
// In the grader the output directory is /output; anywhere else, MAKEFUN_OUTPUT_DIR names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts` and open the address it prints.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (the kit's reference gate values): the dossier text is capped at
// 160 KiB, screenshots at 4 files of 256 KiB each, and the app tree at 993 entries, 48 MiB in all, with
// no path over 1,000 bytes. buildDossier refuses anything past them, so an entry that writes here is one
// the scorer's file checks can pass.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
