import type { AssetRecord, AssetSearchHit } from '@/lib/assetCatalog/types';

function symbolFromQuery(raw: string): string {
    return raw.toUpperCase().replace(/[^A-Z0-9.-]/g, '');
}

function normalizeText(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Rank catalog matches for Trade search. Higher score = better match.
 */
export function searchAssetCatalog(assets: readonly AssetRecord[], rawQuery: string, limit = 25): AssetSearchHit[] {
    const trimmed = rawQuery.trim();
    if (!trimmed) return [];

    const qLower = normalizeText(trimmed);
    const qSym = symbolFromQuery(trimmed);
    const hits: AssetSearchHit[] = [];

    for (const a of assets) {
        const sym = a.symbol.toUpperCase();
        const nameNorm = normalizeText(a.name);
        let score = 0;

        if (qSym.length > 0) {
            if (sym === qSym) score = Math.max(score, 10_000);
            else if (sym.startsWith(qSym)) score = Math.max(score, 8000 - (sym.length - qSym.length) * 8);
            else if (sym.includes(qSym)) score = Math.max(score, 4500);
        }

        if (qLower.length > 0) {
            if (nameNorm === qLower) score = Math.max(score, 9000);
            else if (nameNorm.startsWith(qLower)) score = Math.max(score, 6500);
            else if (nameNorm.includes(qLower)) score = Math.max(score, 3500);

            const words = nameNorm.split(/\s+/).filter(Boolean);
            for (const w of words) {
                if (w.startsWith(qLower) && qLower.length >= 2) {
                    score = Math.max(score, 5000);
                    break;
                }
            }
        }

        const terms = a.searchableTerms ?? [];
        for (const t of terms) {
            const tn = normalizeText(t);
            if (!tn) continue;
            if (tn === qLower) score = Math.max(score, 9200);
            else if (tn.startsWith(qLower)) score = Math.max(score, 7000);
            else if (tn.includes(qLower)) score = Math.max(score, 4800);
        }

        if (score > 0) {
            hits.push({ ...a, score });
        }
    }

    hits.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.symbol.localeCompare(b.symbol);
    });

    return hits.slice(0, limit);
}
