import type { AcademyRankId, LessonCatalogItem } from './types';
import { lessonDifficulty, lessonMinutes, lessonXp, rankForLesson } from './ranks';

type Spec = {
    id: number;
    title: string;
    topics: string[];
    extraSearch?: string[];
    practice?: { label: string; href: string };
};

const TITLES: Spec[] = [
    { id: 1, title: 'What Is Money?', topics: ['money', 'basics'], extraSearch: ['currency', 'cash'] },
    { id: 2, title: 'Saving vs Investing', topics: ['saving', 'investing'], extraSearch: ['emergency fund'] },
    { id: 3, title: 'What Is Investing?', topics: ['investing'], extraSearch: ['ownership', 'return'] },
    { id: 4, title: 'What Is the Stock Market?', topics: ['stock market', 'markets'], extraSearch: ['exchange'] },
    { id: 5, title: 'What Is a Stock?', topics: ['stocks'], extraSearch: ['share', 'ownership'], practice: { label: 'Explore a Stock', href: '/trade?ticker=AAPL' } },
    { id: 6, title: 'Why Do Stock Prices Move?', topics: ['prices', 'supply and demand'], extraSearch: ['news'] },
    { id: 7, title: 'What Does It Mean to Own a Company?', topics: ['ownership', 'stocks'], extraSearch: ['shareholder'] },
    { id: 8, title: 'What Is a Share?', topics: ['shares', 'stocks'], extraSearch: ['equity'] },
    { id: 9, title: 'What Is a Stock Exchange?', topics: ['exchanges', 'markets'], extraSearch: ['NYSE', 'NASDAQ'] },
    { id: 10, title: 'Bulls and Bears', topics: ['market mood', 'sentiment'], extraSearch: ['bull market', 'bear market'] },
    { id: 11, title: 'What Is a Portfolio?', topics: ['portfolio'], extraSearch: ['holdings'], practice: { label: 'Build a Practice Portfolio', href: '/portfolio' } },
    { id: 12, title: 'What Is Risk?', topics: ['risk'], extraSearch: ['loss', 'volatility'] },
    { id: 13, title: 'What Is Return?', topics: ['return'], extraSearch: ['profit', 'gain'] },
    { id: 14, title: 'Why Investing Takes Time', topics: ['time', 'patience'], extraSearch: ['long-term'] },
    { id: 15, title: 'Compound Growth', topics: ['compound growth'], extraSearch: ['compound interest', 'exponential'] },
    { id: 16, title: 'What Is a Dividend?', topics: ['dividends'], extraSearch: ['payout', 'income'] },
    { id: 17, title: 'What Is an Index?', topics: ['indexes'], extraSearch: ['benchmark', 'S&P'] },
    { id: 18, title: 'What Is the S&P 500?', topics: ['S&P 500', 'indexes'], extraSearch: ['large companies'] },
    { id: 19, title: 'Why People Diversify', topics: ['diversification'], extraSearch: ['eggs in one basket'], practice: { label: 'Build a Practice Portfolio', href: '/portfolio' } },
    { id: 20, title: 'Your First Practice Portfolio', topics: ['portfolio', 'practice'], extraSearch: ['simulator'], practice: { label: 'Open the Simulator', href: '/trade' } },

    { id: 21, title: 'Stocks vs Bonds', topics: ['stocks', 'bonds'], extraSearch: ['loan', 'ownership'] },
    { id: 22, title: 'What Are ETFs?', topics: ['ETFs'], extraSearch: ['exchange traded fund', 'basket'] },
    { id: 23, title: 'What Are Mutual Funds?', topics: ['mutual funds'], extraSearch: ['fund manager'] },
    { id: 24, title: 'Index Funds', topics: ['index funds'], extraSearch: ['passive', 'fees'] },
    { id: 25, title: 'Large, Mid, and Small Companies', topics: ['company size'], extraSearch: ['large-cap', 'small-cap'] },
    { id: 26, title: 'Growth vs Value', topics: ['growth', 'value'], extraSearch: ['cheap', 'expensive'] },
    { id: 27, title: 'Market Capitalization', topics: ['market cap'], extraSearch: ['company size', 'valuation'] },
    { id: 28, title: 'Revenue', topics: ['revenue'], extraSearch: ['sales', 'top line'] },
    { id: 29, title: 'Profit', topics: ['profit'], extraSearch: ['earnings', 'net income'] },
    { id: 30, title: 'Earnings Per Share', topics: ['EPS'], extraSearch: ['earnings per share'] },
    { id: 31, title: 'P/E Ratio', topics: ['P/E', 'valuation'], extraSearch: ['price to earnings'] },
    { id: 32, title: 'Understanding Company Financials', topics: ['financials'], extraSearch: ['income statement', 'balance sheet'] },
    { id: 33, title: 'Reading a Simple Stock Chart', topics: ['charts'], extraSearch: ['price chart'], practice: { label: 'Read a Stock Chart', href: '/trade?ticker=AAPL' } },
    { id: 34, title: 'Market Orders', topics: ['orders'], extraSearch: ['buy', 'sell'], practice: { label: 'Place a Practice Order', href: '/trade' } },
    { id: 35, title: 'Limit Orders', topics: ['limit orders'], extraSearch: ['price target'], practice: { label: 'Place a Practice Order', href: '/trade' } },
    { id: 36, title: 'Bid and Ask', topics: ['bid', 'ask'], extraSearch: ['spread'] },
    { id: 37, title: 'Fees', topics: ['fees'], extraSearch: ['expense ratio', 'commission'] },
    { id: 38, title: 'Inflation', topics: ['inflation'], extraSearch: ['purchasing power'] },
    { id: 39, title: 'Time Value of Money', topics: ['time value of money'], extraSearch: ['present value'] },
    { id: 40, title: 'Building a Diversified Portfolio', topics: ['diversification', 'portfolio'], extraSearch: ['asset mix'], practice: { label: 'Build a Practice Portfolio', href: '/portfolio' } },

    { id: 41, title: 'Asset Allocation', topics: ['asset allocation'], extraSearch: ['mix', 'stocks and bonds'] },
    { id: 42, title: 'Risk Tolerance', topics: ['risk tolerance'], extraSearch: ['comfort with loss'] },
    { id: 43, title: 'Investment Time Horizons', topics: ['time horizon'], extraSearch: ['years', 'goals'] },
    { id: 44, title: 'Dollar-Cost Averaging', topics: ['dollar-cost averaging'], extraSearch: ['DCA', 'regular investing'] },
    { id: 45, title: 'Rebalancing', topics: ['rebalancing'], extraSearch: ['portfolio weights'] },
    { id: 46, title: 'Portfolio Weighting', topics: ['weights'], extraSearch: ['percent of portfolio'] },
    { id: 47, title: 'Sector Diversification', topics: ['sectors'], extraSearch: ['technology', 'health care'] },
    { id: 48, title: 'Geographic Diversification', topics: ['geography'], extraSearch: ['international', 'US'] },
    { id: 49, title: 'Understanding Volatility', topics: ['volatility'], extraSearch: ['ups and downs'] },
    { id: 50, title: 'Market Cycles', topics: ['cycles'], extraSearch: ['expansion', 'recession'] },
    { id: 51, title: 'Bull Markets', topics: ['bull markets'], extraSearch: ['rising prices'] },
    { id: 52, title: 'Bear Markets', topics: ['bear markets'], extraSearch: ['falling prices'] },
    { id: 53, title: 'Market Corrections', topics: ['corrections'], extraSearch: ['pullback'] },
    { id: 54, title: 'Economic Basics', topics: ['economy'], extraSearch: ['GDP', 'jobs'] },
    { id: 55, title: 'Interest Rates and Stocks', topics: ['interest rates'], extraSearch: ['Fed', 'borrowing'] },
    { id: 56, title: 'Inflation and Investments', topics: ['inflation', 'investing'], extraSearch: ['real return'] },
    { id: 57, title: 'Earnings Reports', topics: ['earnings reports'], extraSearch: ['quarterly results'] },
    { id: 58, title: 'Revenue Growth', topics: ['revenue growth'], extraSearch: ['growing sales'] },
    { id: 59, title: 'Cash Flow', topics: ['cash flow'], extraSearch: ['cash in', 'cash out'] },
    { id: 60, title: 'Comparing Two Companies', topics: ['comparison'], extraSearch: ['side by side'], practice: { label: 'Analyze a Company', href: '/trade?ticker=MSFT' } },

    { id: 61, title: 'Fundamental Analysis', topics: ['fundamental analysis'], extraSearch: ['company value'] },
    { id: 62, title: 'Technical Analysis', topics: ['technical analysis'], extraSearch: ['charts', 'patterns'], practice: { label: 'Read a Stock Chart', href: '/trade?ticker=AAPL' } },
    { id: 63, title: 'Support and Resistance', topics: ['support', 'resistance'], extraSearch: ['price levels'] },
    { id: 64, title: 'Trend Lines', topics: ['trend lines'], extraSearch: ['uptrend', 'downtrend'] },
    { id: 65, title: 'Moving Averages', topics: ['moving averages'], extraSearch: ['SMA', 'average price'] },
    { id: 66, title: 'Volume', topics: ['volume'], extraSearch: ['shares traded'] },
    { id: 67, title: 'Candlestick Basics', topics: ['candlesticks'], extraSearch: ['open', 'close'] },
    { id: 68, title: 'Valuation', topics: ['valuation'], extraSearch: ['what a company is worth'] },
    { id: 69, title: 'P/E Compared With Growth', topics: ['PEG', 'P/E'], extraSearch: ['growth rate'] },
    { id: 70, title: 'Price-to-Sales', topics: ['price-to-sales'], extraSearch: ['P/S'] },
    { id: 71, title: 'Debt and Leverage', topics: ['debt', 'leverage'], extraSearch: ['borrow'] },
    { id: 72, title: 'Free Cash Flow', topics: ['free cash flow'], extraSearch: ['FCF'] },
    { id: 73, title: 'Competitive Advantage', topics: ['competitive advantage'], extraSearch: ['edge'] },
    { id: 74, title: 'Management and Leadership', topics: ['management'], extraSearch: ['CEO', 'leaders'] },
    { id: 75, title: 'Economic Moats', topics: ['moats'], extraSearch: ['brand', 'switching costs'] },
    { id: 76, title: 'News and Stock Prices', topics: ['news'], extraSearch: ['headlines'] },
    { id: 77, title: 'How Earnings Surprises Affect Stocks', topics: ['earnings surprises'], extraSearch: ['beat', 'miss'] },
    { id: 78, title: 'Behavioral Finance', topics: ['behavior'], extraSearch: ['emotions', 'psychology'] },
    { id: 79, title: 'Common Investor Biases', topics: ['biases'], extraSearch: ['FOMO', 'confirmation'] },
    { id: 80, title: 'Building an Investment Thesis', topics: ['thesis'], extraSearch: ['why I own this'] },

    { id: 81, title: 'Advanced Portfolio Construction', topics: ['portfolio construction'], extraSearch: ['mix', 'risk'] },
    { id: 82, title: 'Correlation', topics: ['correlation'], extraSearch: ['move together'] },
    { id: 83, title: 'Concentration Risk', topics: ['concentration'], extraSearch: ['too much in one stock'] },
    { id: 84, title: 'Scenario Analysis', topics: ['scenarios'], extraSearch: ['what if'] },
    { id: 85, title: 'Risk-Adjusted Returns', topics: ['risk-adjusted'], extraSearch: ['Sharpe', 'return per risk'] },
    { id: 86, title: 'Understanding Drawdowns', topics: ['drawdowns'], extraSearch: ['peak to trough'] },
    { id: 87, title: 'Portfolio Stress Testing', topics: ['stress testing'], extraSearch: ['worst case'] },
    { id: 88, title: 'Comparing Investment Strategies', topics: ['strategies'], extraSearch: ['active', 'passive'] },
    { id: 89, title: 'Long-Term vs Short-Term Strategies', topics: ['timeframe'], extraSearch: ['trading vs investing'] },
    { id: 90, title: 'Fundamental vs Technical Decisions', topics: ['analysis styles'], extraSearch: ['when to use each'] },
    { id: 91, title: 'Evaluating an Investment Thesis', topics: ['thesis'], extraSearch: ['prove', 'disprove'] },
    { id: 92, title: 'Reading an Earnings Call', topics: ['earnings calls'], extraSearch: ['transcript', 'Q&A'] },
    { id: 93, title: 'Understanding Guidance', topics: ['guidance'], extraSearch: ['forecast', 'outlook'] },
    { id: 94, title: 'Competitive Positioning', topics: ['positioning'], extraSearch: ['market share'] },
    { id: 95, title: 'Behavioral Traps', topics: ['behavior', 'traps'], extraSearch: ['FOMO', 'panic'] },
    { id: 96, title: 'Avoiding Investment Scams', topics: ['scams', 'fraud'], extraSearch: ['guaranteed returns', 'pressure'] },
    { id: 97, title: 'How Taxes Can Affect Investments', topics: ['taxes'], extraSearch: ['capital gains'] },
    { id: 98, title: 'Building a Long-Term Investment Plan', topics: ['plan'], extraSearch: ['goals', 'savings'] },
    { id: 99, title: 'Complete Company Analysis', topics: ['company analysis'], extraSearch: ['research'], practice: { label: 'Analyze a Company', href: '/ai-forecast' } },
    { id: 100, title: 'Build and Defend Your Investment Strategy', topics: ['capstone', 'strategy'], extraSearch: ['final', 'plan'], practice: { label: 'Practice in Vestera', href: '/trade' } },
];

export const LESSON_CATALOG: LessonCatalogItem[] = TITLES.map(spec => {
    const rank = rankForLesson(spec.id);
    return {
        id: spec.id,
        rankId: rank.id,
        title: spec.title,
        difficulty: lessonDifficulty(spec.id),
        minutes: lessonMinutes(spec.id),
        xp: lessonXp(spec.id),
        topics: spec.topics,
        searchTerms: [spec.title, ...spec.topics, ...(spec.extraSearch || [])],
        practice: spec.practice,
    };
});

export function getCatalogItem(id: number): LessonCatalogItem | undefined {
    return LESSON_CATALOG[id - 1];
}

export function searchCatalog(query: string): LessonCatalogItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return LESSON_CATALOG.filter(item =>
        item.searchTerms.some(t => t.toLowerCase().includes(q)) ||
        item.title.toLowerCase().includes(q),
    ).slice(0, 12);
}

export function lessonsForRank(rankId: AcademyRankId): LessonCatalogItem[] {
    return LESSON_CATALOG.filter(l => l.rankId === rankId);
}

export function topicToLessonId(topic: string): number | null {
    const t = topic.toLowerCase();
    const hit = LESSON_CATALOG.find(l =>
        l.topics.some(x => x.toLowerCase() === t) ||
        l.searchTerms.some(x => x.toLowerCase() === t),
    );
    return hit?.id ?? null;
}
