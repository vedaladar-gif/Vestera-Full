import fs from 'node:fs';
import { pack, applyRankFile, statsFor } from './harden-lib.mjs';

const all = JSON.parse(fs.readFileSync('scripts/academy-quizzes.json', 'utf8'));
const byFile = {
    'src/lib/academy/content/rank3.ts': all.filter(l => l.id >= 41 && l.id <= 60),
    'src/lib/academy/content/rank4.ts': all.filter(l => l.id >= 61 && l.id <= 80),
    'src/lib/academy/content/rank5.ts': all.filter(l => l.id >= 81 && l.id <= 100),
};

for (const [file, lessons] of Object.entries(byFile)) {
    const byLesson = {};
    for (const les of lessons) {
        byLesson[les.id] = les.questions.map((q, i) => {
            const correct = q.options[q.answer];
            const wrongs = q.options.filter((_, idx) => idx !== q.answer);
            if (wrongs.length !== 3) throw new Error(`L${les.id} q${i + 1}`);
            return pack(les.id, i, correct, wrongs[0], wrongs[1], wrongs[2]);
        });
    }
    console.log(file, statsFor(byLesson));
    applyRankFile(file, byLesson);
}
