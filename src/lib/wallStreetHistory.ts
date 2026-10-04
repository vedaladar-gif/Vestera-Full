export const FIRST_YEAR = 1960;
export const LAST_YEAR = 2012;

// S&P 500 total return (dividends reinvested), one value per calendar year from 1960 to 2012.
export const INDEX_RETURNS = [
    0.0034, 0.2664, -0.0881, 0.2261, 0.1642, 0.1240, -0.0997, 0.2380, 0.1081, -0.0824,
    0.0356, 0.1422, 0.1876, -0.1431, -0.2590, 0.3700, 0.2383, -0.0698, 0.0651, 0.1852,
    0.3174, -0.0470, 0.2042, 0.2234, 0.0615, 0.3124, 0.1849, 0.0581, 0.1654, 0.3148,
    -0.0306, 0.3023, 0.0749, 0.0997, 0.0133, 0.3720, 0.2268, 0.3310, 0.2834, 0.2089,
    -0.0903, -0.1185, -0.2197, 0.2836, 0.1074, 0.0483, 0.1561, 0.0548, -0.3655, 0.2594,
    0.1482, 0.0207, 0.1589,
];

// First-half return for years where the market moved very differently in each half.
export const INDEX_FIRST_HALF: Record<number, number> = {
    1962: -0.21, 1966: -0.06, 1970: -0.18, 1973: -0.08, 1974: -0.13, 1982: -0.08,
    1987: 0.26, 1990: 0.02, 2001: -0.065, 2002: -0.13, 2008: -0.12, 2009: 0.03, 2011: 0.06,
};

export type YearNews = { title: string; headline: string; meaning: string };

// What was happening each year, written without names or dates so the era stays hidden.
export const YEAR_NEWS: YearNews[] = [
    { title: 'Economic Slowdown', headline: 'The economy is slipping into a mild recession.', meaning: 'Businesses are selling less, and investors are waiting to see how long the slowdown lasts.' },
    { title: 'Recovery', headline: 'The recession is over and the economy is growing again.', meaning: 'When people expect better times, they are willing to pay more for company shares.' },
    { title: 'Sudden Sell-Off', headline: 'Stocks fell sharply in a sudden spring sell-off, and a tense standoff between superpowers has the world on edge.', meaning: 'Fear can push prices down quickly, even when companies are still earning money.' },
    { title: 'Steady Gains', headline: 'Company profits are rising and the economy is on solid ground.', meaning: 'Rising profits usually support rising stock prices over time.' },
    { title: 'Tax Cut', headline: 'A large tax cut leaves families and businesses with more money to spend.', meaning: 'More spending can mean more sales and profits for companies.' },
    { title: 'Booming Economy', headline: 'Unemployment is low and factories are running at full speed.', meaning: 'Strong economies are good for profits, but they can also push prices and interest rates up.' },
    { title: 'Credit Crunch', headline: 'Interest rates jumped and loans suddenly became hard to get.', meaning: 'When borrowing gets expensive, companies and shoppers spend less, and stocks often fall.' },
    { title: 'Growth Stocks Craze', headline: 'Investors are excited about fast-growing companies and new technology.', meaning: 'Excitement can lift prices quickly. It can also push them higher than profits justify.' },
    { title: 'Rising Prices', headline: 'Inflation is picking up during a turbulent, divided year.', meaning: 'When prices rise, each dollar buys less, and investors look for things that keep up.' },
    { title: 'Tight Money', headline: 'The central bank is raising interest rates to fight inflation.', meaning: 'Higher rates make bonds and savings more attractive, which can pull money away from stocks.' },
    { title: 'Recession', headline: 'The economy is shrinking, and a giant railroad company just went bankrupt.', meaning: 'Even famous companies can fail. Spreading your money out protects you from any single collapse.' },
    { title: 'Price Controls', headline: 'The government froze wages and prices and cut the link between the dollar and gold.', meaning: 'Big policy changes can shake up which investments do well.' },
    { title: 'Favorite Stocks', headline: 'Investors are piling into a small group of famous companies that seem like they can never lose.', meaning: 'When everyone owns the same stocks, prices can get very expensive.' },
    { title: 'Oil Shock', headline: 'An oil embargo sent fuel prices soaring while inflation climbs.', meaning: 'Energy companies can gain, while car makers and many other businesses get hurt.' },
    { title: 'Deep Bear Market', headline: 'Stocks have been falling for months, prices keep rising, and the president resigned.', meaning: 'A bear market is a drop of 20% or more. It is painful, and it has always ended eventually.' },
    { title: 'Bounce Back', headline: 'The recession is ending and stocks are climbing from their lows.', meaning: 'Recoveries often start while the news still feels bad.' },
    { title: 'Growth Returns', headline: 'Profits are recovering and businesses are hiring again.', meaning: 'A growing economy usually helps most companies.' },
    { title: 'Sluggish Market', headline: 'Inflation is high and the dollar is losing value.', meaning: 'High inflation eats into profits and makes investors cautious.' },
    { title: 'Stagflation', headline: 'Prices keep rising quickly while the economy grows slowly.', meaning: 'Stagflation is hard on both stocks and bonds.' },
    { title: 'Second Oil Shock', headline: 'A revolution in a major oil-producing country sent fuel prices up again.', meaning: 'Oil producers can do well, while companies that use a lot of fuel struggle.' },
    { title: 'Record Interest Rates', headline: 'The central bank pushed interest rates to record highs to break inflation.', meaning: 'Savings accounts pay a lot right now, but very high rates can also cause a recession.' },
    { title: 'Double-Dip Recession', headline: 'Very high interest rates are dragging the economy into another recession.', meaning: 'Many stocks are cheap compared with their profits. Some investors see that as a chance.' },
    { title: 'Rates Start Falling', headline: 'Inflation is finally coming down, and interest rates are starting to drop.', meaning: 'Falling rates often mark the start of a long rise in stock prices.' },
    { title: 'Strong Recovery', headline: 'The economy is growing fast and new technology is spreading into offices and homes.', meaning: 'Strong growth lifts profits across many industries.' },
    { title: 'Strong Dollar', headline: 'The dollar is very strong, making imports cheap and exports hard to sell.', meaning: 'Companies that sell abroad can see profits shrink when the dollar is strong.' },
    { title: 'Falling Rates', headline: 'Interest rates are dropping and governments agreed to weaken the dollar.', meaning: 'Lower rates make stocks more attractive compared with bonds and savings.' },
    { title: 'Oil Price Collapse', headline: 'Oil prices crashed, cutting fuel costs for drivers and businesses.', meaning: 'Cheap oil helps most companies but hurts oil producers.' },
    { title: 'Soaring Stocks', headline: 'Stocks have soared this year, and some investors worry prices are getting ahead of profits.', meaning: 'Fast rises can reverse suddenly. Nobody knows exactly when.' },
    { title: 'After the Crash', headline: 'Stocks are slowly recovering from a record one-day crash.', meaning: 'Investors who held on through the crash have been getting their losses back.' },
    { title: 'Takeover Boom', headline: 'Companies are being bought with borrowed money, and many savings banks are failing.', meaning: 'Borrowed money can boost prices, but it adds risk when things go wrong.' },
    { title: 'War and Oil', headline: 'An invasion in the Middle East sent oil prices higher and the economy into recession.', meaning: 'Banks and companies with a lot of debt get hit hardest in a recession.' },
    { title: 'Recovery', headline: 'The war ended quickly and interest rates are falling.', meaning: 'Lower rates and returning confidence are good for stocks.' },
    { title: 'Slow Growth', headline: 'The economy is growing slowly and some famous companies are cutting thousands of jobs.', meaning: 'Big, well-known companies can still stumble when their industry changes.' },
    { title: 'Steady Expansion', headline: 'Interest rates are low and businesses are investing in new equipment.', meaning: 'Low rates help companies borrow and grow.' },
    { title: 'Surprise Rate Hikes', headline: 'The central bank raised interest rates again and again, and bond prices fell.', meaning: 'When rates rise, existing bonds lose value.' },
    { title: 'Bull Market', headline: 'Inflation is low, profits are strong, and a new thing called the internet is getting attention.', meaning: 'Low inflation and rising profits are a strong mix for stocks.' },
    { title: 'Rising Optimism', headline: 'Stocks keep climbing, and officials warn that prices may be too high.', meaning: 'Warnings do not always mean an immediate drop, but they are worth noticing.' },
    { title: 'Asian Crisis', headline: 'Currencies in several Asian countries collapsed, shaking markets around the world.', meaning: 'Trouble in one region can spread to markets everywhere.' },
    { title: 'Global Jitters', headline: 'A big government defaulted on its debt and a famous investment fund nearly collapsed.', meaning: 'Sudden scares can cause sharp drops, even in a strong market.' },
    { title: 'Tech Mania', headline: 'Internet companies are soaring, even ones that have never made a profit.', meaning: 'When prices race far ahead of profits, the fall can be steep.' },
    { title: 'Bubble Pops', headline: 'Technology stocks have started falling fast from record highs.', meaning: 'A bubble is when prices rise far beyond what the companies are worth. Bubbles eventually burst.' },
    { title: 'Recession and Shock', headline: 'The economy is in recession and the country suffered a terrible attack.', meaning: 'Shocks can close markets and drop prices, but the economy keeps going.' },
    { title: 'Accounting Scandals', headline: 'Several big companies were caught faking their profits.', meaning: 'If you cannot trust a company\'s numbers, its stock can go to zero. Diversifying protects you.' },
    { title: 'Recovery', headline: 'Interest rates are very low and stocks are recovering.', meaning: 'Recoveries reward investors who stayed in the market.' },
    { title: 'Steady Growth', headline: 'The economy is growing steadily and interest rates are rising slowly.', meaning: 'Slow, steady rate increases are usually easier for markets to handle.' },
    { title: 'Housing Boom', headline: 'Home prices are climbing fast and oil keeps getting more expensive.', meaning: 'Booms can feel permanent while they are happening.' },
    { title: 'Housing Cools', headline: 'Home prices have stopped rising after a long boom.', meaning: 'When one big part of the economy slows, the effects can spread.' },
    { title: 'Mortgage Trouble', headline: 'Many risky home loans are going bad.', meaning: 'Banks that made those loans could face big losses.' },
    { title: 'Financial Crisis', headline: 'Major banks are failing and lending is freezing up.', meaning: 'In a panic, almost everything falls together. Cash and government bonds hold up best.' },
    { title: 'Bottoming Out', headline: 'The government is spending heavily to rescue the economy after a severe crisis.', meaning: 'Some of the best gains come right after the worst drops.' },
    { title: 'Slow Recovery', headline: 'The recovery is slow, and debt problems in Europe worry investors.', meaning: 'Worries can cause sharp dips even while the market is rising overall.' },
    { title: 'Debt Worries', headline: 'The government lost its top credit rating and Europe\'s debt crisis deepened.', meaning: 'Scary headlines often cause short, sharp drops.' },
    { title: 'Recovery Continues', headline: 'Interest rates are near zero and stocks have been climbing.', meaning: 'Very low rates push investors toward stocks in search of better returns.' },
];
