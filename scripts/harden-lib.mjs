import fs from 'node:fs';

const ELAB = [
    ', even after a bad market year',
    ' for practice accounts and live money alike',
    ' no matter what the next headline says',
    ' including cash you may need in a few weeks',
    ' across every ticker in a student portfolio',
    ', even if last month’s chart looked calm',
    ' whether the holding is famous or obscure',
    ' on both up days and down days in the simulator',
];

function clean(s) {
    return String(s)
        .replace(/\s*[—–]\s*/g, ', ')
        .replace(/\s+/g, ' ')
        .trim();
}

function elaborate(wrong, target, salt) {
    let w = clean(wrong);
    if (/[“”"']/.test(w)) return w;
    if (/^\$[\d,]+/.test(w) && w.length <= 12) return w;
    if (w.length >= target - 12) return w;
    return w.replace(/[.?!]$/, '') + ELAB[Math.abs(salt) % ELAB.length];
}

export function pack(lessonId, qIndex, correct, d1, d2, d3) {
    const c = clean(correct);
    const ds = [d1, d2, d3].map((s, i) => elaborate(s, c.length, lessonId + qIndex * 4 + i));
    const pos = (lessonId * 5 + qIndex * 3 + 1) % 4;
    const options = [...ds];
    options.splice(pos, 0, c);
    const hasH = o => /[-]/.test(o);
    if (hasH(options[pos]) && options.filter(hasH).length === 1) {
        options[pos] = options[pos].replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return { options, answer: pos };
}

export function toTsBlock(options, answer) {
    const lines = options.map(o => `                    '${String(o).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}',`);
    return `options: [\n${lines.join('\n')}\n                ],\n                answer: ${answer}`;
}

export function applyRankFile(tsPath, byLesson) {
    let src = fs.readFileSync(tsPath, 'utf8');
    const ids = Object.keys(byLesson)
        .map(Number)
        .sort((a, b) => a - b);
    for (const id of ids) {
        const questions = byLesson[id];
        if (!questions || questions.length !== 10) {
            throw new Error(`Lesson ${id} needs 10 questions (got ${questions?.length})`);
        }
        const idToken = `        id: ${id},`;
        const idAt = src.indexOf(idToken);
        if (idAt < 0) throw new Error(`Could not find ${idToken} in ${tsPath}`);
        const quizAt = src.indexOf('quiz: [', idAt);
        if (quizAt < 0) throw new Error(`No quiz for lesson ${id}`);
        const nextId = src.indexOf('\n        id: ', quizAt + 1);
        const quizEnd = nextId < 0 ? src.length : nextId;
        let chunk = src.slice(quizAt, quizEnd);
        const re = /options: \[[\s\S]*?\],\s*answer: \d+/g;
        const matches = [...chunk.matchAll(re)];
        if (matches.length !== 10) {
            throw new Error(`Lesson ${id} expected 10 option blocks, found ${matches.length}`);
        }
        for (let i = matches.length - 1; i >= 0; i--) {
            const m = matches[i];
            const q = questions[i];
            const replacement = toTsBlock(q.options, q.answer);
            chunk = chunk.slice(0, m.index) + replacement + chunk.slice(m.index + m[0].length);
        }
        src = src.slice(0, quizAt) + chunk + src.slice(quizEnd);
    }
    fs.writeFileSync(tsPath, src);
}

export function statsFor(byLesson) {
    const s = { n: 0, uniqueLongest: 0, uniqueDash: 0, answers: [0, 0, 0, 0] };
    for (const qs of Object.values(byLesson)) {
        for (const q of qs) {
            s.n += 1;
            const lens = q.options.map(o => o.length);
            const max = Math.max(...lens);
            const correct = q.options[q.answer];
            if (correct.length === max && lens.filter(l => l === max).length === 1) s.uniqueLongest += 1;
            const dash = o => /[—–]/.test(o) || (o.split('-').length > 2);
            const dcount = q.options.filter(dash).length;
            if (dash(correct) && dcount === 1) s.uniqueDash += 1;
            s.answers[q.answer] += 1;
        }
    }
    return s;
}
