import fs from 'node:fs';

function extract(file) {
    const src = fs.readFileSync(file, 'utf8');
    const lessons = [];
    const idRe = /\n        id: (\d+),/g;
    let m;
    const ids = [];
    while ((m = idRe.exec(src))) ids.push({ id: Number(m[1]), index: m.index });
    for (let i = 0; i < ids.length; i++) {
        const start = ids[i].index;
        const end = i + 1 < ids.length ? ids[i + 1].index : src.length;
        const chunk = src.slice(start, end);
        const quizStart = chunk.indexOf('quiz: [');
        if (quizStart < 0) continue;
        const questions = [];
        const qRe =
            /prompt: '([^']*(?:\\'[^']*)*)',\s*options: \[([\s\S]*?)\],\s*answer: (\d+)/g;
        let q;
        while ((q = qRe.exec(chunk))) {
            const options = [...q[2].matchAll(/'((?:\\'|[^'])*)'/g)].map(x =>
                x[1].replace(/\\'/g, "'"),
            );
            questions.push({
                prompt: q[1].replace(/\\'/g, "'"),
                options,
                answer: Number(q[3]),
            });
        }
        lessons.push({ id: ids[i].id, questions });
    }
    return lessons;
}

const files = [
    'src/lib/academy/content/rank1.ts',
    'src/lib/academy/content/rank2.ts',
    'src/lib/academy/content/rank3.ts',
    'src/lib/academy/content/rank4.ts',
    'src/lib/academy/content/rank5.ts',
];

const all = files.flatMap(extract);
const stats = { n: 0, longest: 0, uniqueLongest: 0, dashCorrect: 0, uniqueDash: 0, answers: [0, 0, 0, 0] };
for (const les of all) {
    for (const q of les.questions) {
        stats.n += 1;
        const lens = q.options.map(o => o.length);
        const max = Math.max(...lens);
        const correct = q.options[q.answer] || '';
        const longestCount = lens.filter(l => l === max).length;
        if (correct.length === max) stats.longest += 1;
        if (correct.length === max && longestCount === 1) stats.uniqueLongest += 1;
        const hasDash = o => /[—–-]/.test(o);
        if (hasDash(correct)) stats.dashCorrect += 1;
        const dashCount = q.options.filter(hasDash).length;
        if (hasDash(correct) && dashCount === 1) stats.uniqueDash += 1;
        if (q.answer >= 0 && q.answer < 4) stats.answers[q.answer] += 1;
    }
}

console.log(JSON.stringify({ lessons: all.length, questions: stats.n, ...stats }, null, 2));
fs.writeFileSync('/tmp/academy-quizzes.json', JSON.stringify(all, null, 2));
console.log('wrote /tmp/academy-quizzes.json');
