import { applyRankFile, statsFor } from './harden-lib.mjs';
import { byLesson } from './harden-r1.mjs';

const s = statsFor(byLesson);
console.log('rank1 generated', s);
if (Object.keys(byLesson).length !== 20) throw new Error('need 20 lessons');
applyRankFile('src/lib/academy/content/rank1.ts', byLesson);
console.log('patched rank1.ts');
