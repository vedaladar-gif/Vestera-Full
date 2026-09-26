// Learning content data — ported from the Python app's routes.py
export interface LessonUnit {
    id: number;
    title: string;
    content: string;
    quiz: { question: string; options: string[]; answer: number }[];
    icon?: string; // emoji for the card illustration
    duration?: string; // estimated read time, e.g. "8 min"
    topics?: string[]; // topic tags
}

export interface Level {
    id: string;
    name: string;
    emoji: string;
    color: string;
    gradFrom?: string; // card illustration gradient start
    gradTo?: string; // card illustration gradient end
    units: LessonUnit[];
}

export const LEVELS: Level[] = [
    {
        id: 'beginner',
        name: 'Beginner',
        emoji: '',
        color: '#22c55e',
        gradFrom: 'rgba(34,197,94,0.18)',
        gradTo: 'rgba(34,197,94,0.04)',
        units: [
            {
                id: 1,
                icon: '',
                duration: '6 min',
                topics: ['Basics', 'Markets'],
                title: 'What is the Stock Market?',
                content: `The stock market is where buyers and sellers trade shares of publicly listed companies. When you buy a stock, you're purchasing a tiny piece of ownership in that company.\n\n**Key Concepts:**\n- **Stocks (Shares):** Units of ownership in a company\n- **Exchange:** A marketplace where stocks are traded (e.g., NYSE, NASDAQ)\n- **Ticker Symbol:** A short code identifying a stock (e.g., AAPL for Apple)\n- **Market Hours:** US markets typically open 9:30 AM – 4:00 PM ET\n\n**Why do companies go public?**\nCompanies sell shares to raise money for growth, research, and expansion. In return, investors get a chance to profit if the company does well.`,
                quiz: [
                    { question: 'What does buying a stock represent?', options: ['A loan to the company', 'Partial ownership', 'A guarantee of profit', 'A bond'], answer: 1 },
                    { question: 'What is a ticker symbol?', options: ['A company logo', 'A short code for a stock', 'A stock price', 'A trading fee'], answer: 1 },
                ],
            },
            {
                id: 2,
                icon: '',
                duration: '7 min',
                topics: ['Basics', 'Pricing'],
                title: 'Understanding Stock Prices',
                content: `Stock prices are determined by supply and demand. When more people want to buy a stock than sell it, the price goes up. When more people want to sell, the price goes down.\n\n**What affects stock prices?**\n- Company earnings and revenue\n- Industry trends and competition\n- Economic conditions (interest rates, inflation)\n- News and market sentiment\n- Government regulations\n\n**Important price terms:**\n- **Bid:** The highest price a buyer is willing to pay\n- **Ask:** The lowest price a seller is willing to accept\n- **Spread:** The difference between bid and ask`,
                quiz: [
                    { question: 'What determines a stock price?', options: ['Government only', 'Supply and demand', 'The company CEO', 'Random chance'], answer: 1 },
                    { question: 'What is the "spread"?', options: ['Total shares traded', 'Difference between bid and ask', 'A trading fee', 'Company profit'], answer: 1 },
                ],
            },
            {
                id: 3,
                icon: '',
                duration: '6 min',
                topics: ['Orders', 'Execution'],
                title: 'Types of Orders',
                content: `When trading stocks, you can place different types of orders:\n\n**Market Order:** Buy/sell immediately at the current price. Fast execution but price may vary.\n\n**Limit Order:** Buy/sell at a specific price or better. You control the price but it might not get filled.\n\n**Stop-Loss Order:** Automatically sells when the price drops to a certain level. Helps limit losses.\n\n**Stop-Limit Order:** Combines stop and limit orders. Triggers at a stop price, then becomes a limit order.`,
                quiz: [
                    { question: 'Which order type executes at the current market price?', options: ['Limit order', 'Stop-loss order', 'Market order', 'Stop-limit order'], answer: 2 },
                    { question: 'What does a stop-loss order do?', options: ['Buys more shares', 'Sells when price drops to a level', 'Guarantees profit', 'Cancels all orders'], answer: 1 },
                ],
            },
            {
                id: 4,
                icon: '',
                duration: '7 min',
                topics: ['Portfolio', 'Strategy'],
                title: 'What is a Portfolio?',
                content: `A portfolio is a collection of all your investments. Building a good portfolio is about balancing risk and reward.\n\n**Key portfolio concepts:**\n- **Diversification:** Don't put all your eggs in one basket\n- **Asset Allocation:** Mix of stocks, bonds, cash, etc.\n- **Rebalancing:** Periodically adjusting your portfolio\n- **Risk Tolerance:** How much loss you can handle\n\n**Common portfolio strategies:**\n- **Conservative:** More bonds, less stocks (lower risk)\n- **Moderate:** Balanced mix of stocks and bonds\n- **Aggressive:** More stocks, less bonds (higher risk, higher potential return)`,
                quiz: [
                    { question: 'What is diversification?', options: ['Buying one stock', 'Spreading investments across different assets', 'Only investing in bonds', 'Trading daily'], answer: 1 },
                    { question: 'An aggressive portfolio typically has:', options: ['More bonds', 'Only cash', 'More stocks', 'No investments'], answer: 2 },
                ],
            },
            {
                id: 5,
                icon: '',
                duration: '8 min',
                topics: ['Charts', 'Analysis'],
                title: 'Reading Stock Charts',
                content: `Stock charts display price movements over time. Learning to read them is essential for making informed decisions.\n\n**Types of charts:**\n- **Line Chart:** Simple line showing closing prices over time\n- **Bar Chart:** Shows open, high, low, and close (OHLC) for each period\n- **Candlestick Chart:** Similar to bar chart but more visual\n\n**Candlestick basics:**\n- **Green/White candle:** Price went UP (close > open)\n- **Red/Black candle:** Price went DOWN (close < open)\n- **Body:** The thick part showing open-to-close range\n- **Wicks/Shadows:** Thin lines showing high and low`,
                quiz: [
                    { question: 'What does a green candlestick mean?', options: ['Price went down', 'Price went up', 'Market is closed', 'Volume increased'], answer: 1 },
                    { question: 'What do the wicks on a candlestick show?', options: ['Trading volume', 'High and low prices', 'Number of trades', 'Market sentiment'], answer: 1 },
                ],
            },
            {
                id: 6,
                icon: '',
                duration: '5 min',
                topics: ['Markets', 'Sentiment'],
                title: 'Bulls vs Bears',
                content: `The terms "bull" and "bear" describe market sentiment:\n\n**Bull Market:** Prices are rising or expected to rise. Optimism prevails.\n**Bear Market:** Prices are falling or expected to fall. Pessimism prevails.\n\n**Key facts:**\n- A bear market is typically defined as a 20%+ decline from recent highs\n- Bull markets tend to last longer than bear markets\n- Both are normal parts of market cycles`,
                quiz: [
                    { question: 'What defines a bear market?', options: ['5% decline', '10% decline', '20%+ decline', '50% decline'], answer: 2 },
                    { question: 'A bull market means:', options: ['Prices are falling', 'Prices are rising', 'Market is closed', 'No trading'], answer: 1 },
                ],
            },
            {
                id: 7,
                icon: '',
                duration: '6 min',
                topics: ['Income', 'Dividends'],
                title: 'Dividends',
                content: `Dividends are payments made by companies to shareholders from their profits.\n\n**Key concepts:**\n- **Dividend Yield:** Annual dividend / stock price × 100\n- **Ex-Dividend Date:** Must own stock before this date to receive dividend\n- **DRIP:** Dividend Reinvestment Plan — automatically reinvest dividends\n\nNot all companies pay dividends. Growth companies often reinvest profits instead.`,
                quiz: [
                    { question: 'What is a dividend?', options: ['A stock split', 'Payment from company profits', 'A trading fee', 'A type of stock'], answer: 1 },
                    { question: 'What does DRIP stand for?', options: ['Daily Return Investment Plan', 'Dividend Reinvestment Plan', 'Direct Return Investment Program', 'Dividend Rate Index Plan'], answer: 1 },
                ],
            },
            {
                id: 8,
                title: 'Market Indices',
                content: `Market indices track the performance of a group of stocks:\n\n**Major US Indices:**\n- **S&P 500:** 500 largest US companies (broad market gauge)\n- **Dow Jones (DJIA):** 30 large "blue chip" companies\n- **NASDAQ Composite:** Tech-heavy index, ~3000 stocks\n- **Russell 2000:** 2000 small-cap companies\n\nIndices help investors understand overall market direction.`,
                quiz: [
                    { question: 'How many companies are in the S&P 500?', options: ['100', '250', '500', '1000'], answer: 2 },
                    { question: 'Which index is tech-heavy?', options: ['Dow Jones', 'S&P 500', 'NASDAQ', 'Russell 2000'], answer: 2 },
                ],
            },
            {
                id: 9,
                title: 'Risk Management Basics',
                content: `Managing risk is crucial for long-term investing success.\n\n**Key principles:**\n- Never invest more than you can afford to lose\n- Diversify across sectors and asset classes\n- Use stop-loss orders to limit downside\n- Don't invest based on emotions\n\n**The 1% Rule:** Never risk more than 1% of your portfolio on a single trade.\n\n**Position Sizing:** Determine how many shares to buy based on your risk tolerance and stop-loss level.`,
                quiz: [
                    { question: 'What is the 1% rule?', options: ['Invest 1% of income', 'Never risk more than 1% per trade', 'Only buy 1 stock', 'Trade once per day'], answer: 1 },
                    { question: 'What helps limit losses?', options: ['Buying more shares', 'Stop-loss orders', 'Ignoring the market', 'Only buying penny stocks'], answer: 1 },
                ],
            },
            {
                id: 10,
                title: 'Getting Started with Paper Trading',
                content: `Paper trading lets you practice trading without risking real money.\n\n**Benefits:**\n- Learn how markets work risk-free\n- Test trading strategies\n- Build confidence before investing real money\n- Understand order types and execution\n\n**Tips for paper trading:**\n1. Treat it like real money\n2. Keep a trading journal\n3. Set realistic goals\n4. Practice risk management\n5. Review your trades regularly`,
                quiz: [
                    { question: 'What is paper trading?', options: ['Trading paper products', 'Simulated trading without real money', 'Only trading penny stocks', 'Writing about stocks'], answer: 1 },
                    { question: 'Why is paper trading useful?', options: ['Guaranteed profits', 'Risk-free practice', 'It uses real money', 'It only works for bonds'], answer: 1 },
                ],
            },
        ],
    },
    {
        id: 'intermediate',
        name: 'Intermediate',
        emoji: '',
        color: '#5b84ff',
        gradFrom: 'rgba(91,132,255,0.18)',
        gradTo: 'rgba(91,132,255,0.04)',
        units: [
            { id: 1, icon: '', duration: '9 min', topics: ['Technical', 'Analysis'], title: 'Technical Analysis Fundamentals', content: 'Technical analysis studies price patterns and trends to predict future movements.\n\n**Key Concepts:**\n- **Support:** Price level where buying pressure prevents further decline\n- **Resistance:** Price level where selling pressure prevents further rise\n- **Trend Lines:** Lines connecting highs or lows to show direction\n- **Volume:** Number of shares traded — confirms price movements\n\n**The three assumptions:**\n1. Market action discounts everything\n2. Prices move in trends\n3. History tends to repeat itself', quiz: [{ question: 'What is a support level?', options: ['Where price stops rising', 'Where buying prevents decline', 'Company headquarters', 'A trading fee'], answer: 1 }, { question: 'What does volume confirm?', options: ['Company profits', 'Price movements', 'Dividend payments', 'Market hours'], answer: 1 }] },
            { id: 2, icon: '〰', duration: '8 min', topics: ['Indicators', 'Trends'], title: 'Moving Averages', content: 'Moving averages smooth out price data to identify trends.\n\n**Types:**\n- **SMA (Simple):** Average of closing prices over N periods\n- **EMA (Exponential):** Weights recent prices more heavily\n\n**Common periods:** 20-day, 50-day, 200-day\n\n**Golden Cross:** 50-day MA crosses above 200-day MA (bullish)\n**Death Cross:** 50-day MA crosses below 200-day MA (bearish)', quiz: [{ question: 'What is a Golden Cross?', options: ['50-day crosses above 200-day', '200-day crosses above 50-day', 'Price hits all-time high', 'Volume doubles'], answer: 0 }, { question: 'EMA gives more weight to:', options: ['Oldest prices', 'Recent prices', 'Volume', 'All prices equally'], answer: 1 }] },
            { id: 3, icon: '', duration: '10 min', topics: ['Fundamental', 'Valuation'], title: 'Fundamental Analysis', content: 'Fundamental analysis evaluates a company\'s financial health.\n\n**Key Metrics:**\n- **P/E Ratio:** Price / Earnings per share. Lower may indicate undervalued.\n- **Revenue:** Total sales\n- **EPS:** Earnings per share\n- **Debt-to-Equity:** Total debt / shareholders\' equity\n- **ROE:** Return on equity\n\n**Where to find data:** 10-K (annual report), 10-Q (quarterly), earnings calls', quiz: [{ question: 'A low P/E ratio may suggest:', options: ['Overvalued stock', 'Undervalued or slow growth', 'High debt', 'High dividends'], answer: 1 }, { question: 'What is EPS?', options: ['Earnings per stock', 'Earnings per share', 'Exchange price standard', 'Equity per shareholder'], answer: 1 }] },
            { id: 4, icon: '', duration: '9 min', topics: ['Patterns', 'Charts'], title: 'Candlestick Patterns', content: 'Common patterns that signal potential reversals or continuations:\n\n**Bullish Patterns:**\n- **Hammer:** Small body at top, long lower wick\n- **Engulfing:** Large green candle engulfs previous red candle\n- **Morning Star:** Three-candle reversal pattern\n\n**Bearish Patterns:**\n- **Shooting Star:** Small body at bottom, long upper wick\n- **Bearish Engulfing:** Large red candle engulfs previous green\n- **Evening Star:** Three-candle reversal pattern\n\nConfirm patterns with volume!', quiz: [{ question: 'A hammer candlestick is:', options: ['Bearish', 'Bullish', 'Neutral', 'Only for crypto'], answer: 1 }, { question: 'Patterns should be confirmed with:', options: ['News articles', 'Volume', 'Social media', 'Gut feeling'], answer: 1 }] },
            { id: 5, icon: '', duration: '7 min', topics: ['Sectors', 'Rotation'], title: 'Sector Analysis', content: 'The stock market is divided into 11 sectors:\n\n1. Technology\n2. Healthcare\n3. Financials\n4. Consumer Discretionary\n5. Communication Services\n6. Industrials\n7. Consumer Staples\n8. Energy\n9. Utilities\n10. Real Estate\n11. Materials\n\n**Sector Rotation:** Money flows between sectors based on economic cycles.', quiz: [{ question: 'How many market sectors are there?', options: ['5', '8', '11', '15'], answer: 2 }, { question: 'What is sector rotation?', options: ['Changing company names', 'Money flowing between sectors', 'Merging sectors', 'Creating new sectors'], answer: 1 }] },
            { id: 6, icon: '', duration: '11 min', topics: ['Options', 'Derivatives'], title: 'Options Basics', content: 'Stock options give you the right (not obligation) to buy or sell at a specific price.\n\n**Call Option:** Right to BUY at a set price (strike price)\n**Put Option:** Right to SELL at a set price\n\n**Key terms:**\n- **Strike Price:** The agreed-upon price\n- **Expiration Date:** When the option expires\n- **Premium:** The price you pay for the option\n- **In the Money (ITM):** Option has intrinsic value\n- **Out of the Money (OTM):** No intrinsic value yet', quiz: [{ question: 'A call option gives you the right to:', options: ['Sell', 'Buy', 'Hold', 'Short'], answer: 1 }, { question: 'What is the premium?', options: ['The strike price', 'The cost of the option', 'The expiration date', 'The stock price'], answer: 1 }] },
            { id: 7, icon: '', duration: '8 min', topics: ['ETFs', 'Funds'], title: 'ETFs and Mutual Funds', content: 'Pooled investment vehicles that hold multiple assets.\n\n**ETFs:**\n- Trade like stocks on exchanges\n- Lower expense ratios\n- Tax-efficient\n- Examples: SPY (S&P 500), QQQ (NASDAQ)\n\n**Mutual Funds:**\n- Priced once daily after market close\n- Actively or passively managed\n- May have minimum investments\n\n**Index Funds:** Track a specific index (cheapest option)', quiz: [{ question: 'ETFs trade:', options: ['Once daily', 'Like stocks throughout the day', 'Only on weekends', 'Only at market close'], answer: 1 }, { question: 'SPY tracks which index?', options: ['Dow Jones', 'NASDAQ', 'S&P 500', 'Russell 2000'], answer: 2 }] },
            { id: 8, icon: '', duration: '8 min', topics: ['Risk', 'Sizing'], title: 'Position Sizing', content: 'Determine how many shares to buy based on risk.\n\n**Formula:**\nPosition Size = (Account × Risk %) / (Entry - Stop Loss)\n\n**Example:**\n- Account: $10,000\n- Risk per trade: 1% = $100\n- Entry: $50, Stop Loss: $48\n- Risk per share: $2\n- Position Size: $100 / $2 = 50 shares\n\nNever risk more than 1-2% of your account per trade!', quiz: [{ question: 'With $10K account, 1% risk, and $2 risk per share, position size is:', options: ['25 shares', '50 shares', '100 shares', '200 shares'], answer: 1 }, { question: 'Max recommended risk per trade is:', options: ['5-10%', '3-5%', '1-2%', '10-20%'], answer: 2 }] },
            { id: 9, icon: '', duration: '9 min', topics: ['Psychology', 'Mindset'], title: 'Market Psychology', content: 'Emotions are the biggest enemy of successful trading.\n\n**Common psychological traps:**\n- **FOMO:** Fear of missing out — buying at tops\n- **Revenge Trading:** Trying to win back losses quickly\n- **Confirmation Bias:** Only seeing data that supports your view\n- **Anchoring:** Fixating on a specific price point\n\n**Solutions:**\n1. Have a written trading plan\n2. Use stop-losses religiously\n3. Take breaks after losses\n4. Journal every trade', quiz: [{ question: 'What is FOMO?', options: ['A chart pattern', 'Fear of missing out', 'A type of order', 'A market index'], answer: 1 }, { question: 'The best defense against emotional trading is:', options: ['More trades', 'Written trading plan', 'Following social media', 'Larger positions'], answer: 1 }] },
            { id: 10, icon: '', duration: '8 min', topics: ['Earnings', 'Catalysts'], title: 'Earnings Reports', content: 'Quarterly earnings reports are major catalysts for stock prices.\n\n**Key things to watch:**\n- **Revenue vs Expectations:** Did the company beat or miss?\n- **EPS vs Expectations:** Earnings per share compared to analyst estimates\n- **Guidance:** Company\'s outlook for next quarter/year\n- **Cash Flow:** How much cash the business generates\n\n**Earnings Season:** Reports cluster in Jan, Apr, Jul, Oct\n\n**Tip:** Price often moves BEFORE and AFTER the report. The reaction to the report matters more than the numbers themselves.', quiz: [{ question: 'Earnings season occurs how many times per year?', options: ['1', '2', '4', '12'], answer: 2 }, { question: 'What often matters more than the earnings numbers?', options: ['The CEO name', 'The market reaction', 'The company logo', 'The ticker symbol'], answer: 1 }] },
        ],
    },
    {
        id: 'advanced',
        name: 'Advanced',
        emoji: '',
        color: '#a855f7',
        gradFrom: 'rgba(168,85,247,0.18)',
        gradTo: 'rgba(168,85,247,0.04)',
        units: [
            { id: 1, icon: '', duration: '12 min', topics: ['Indicators', 'RSI', 'MACD'], title: 'Advanced Technical Indicators', content: 'Beyond basic indicators, advanced traders use:\n\n**RSI (Relative Strength Index):**\n- Measures momentum (0-100)\n- Above 70 = overbought, Below 30 = oversold\n\n**MACD:**\n- Shows trend direction and momentum\n- Signal line crossovers indicate buy/sell\n\n**Bollinger Bands:**\n- Price typically stays within 2 standard deviations of a moving average\n- Squeeze = low volatility, potential breakout\n\n**Fibonacci Retracements:**\n- Key levels: 23.6%, 38.2%, 50%, 61.8%\n- Used to identify support/resistance during pullbacks', quiz: [{ question: 'RSI above 70 suggests:', options: ['Oversold', 'Overbought', 'Neutral', 'Low volume'], answer: 1 }, { question: 'A Bollinger Band squeeze suggests:', options: ['High volatility', 'Low volatility, potential breakout', 'Market crash', 'Dividend payment'], answer: 1 }] },
            { id: 2, icon: '', duration: '14 min', topics: ['Options', 'Greeks'], title: 'Options Strategies', content: 'Advanced options strategies for different market conditions:\n\n**Covered Call:** Own stock + sell call. Income strategy.\n**Protective Put:** Own stock + buy put. Insurance strategy.\n**Iron Condor:** Sell OTM call spread + put spread. Profit from low volatility.\n**Straddle:** Buy call + put at same strike. Profit from big moves either way.\n**Vertical Spread:** Buy and sell options at different strikes, same expiration.\n\n**Greeks:**\n- Delta: Price sensitivity\n- Theta: Time decay\n- Vega: Volatility sensitivity\n- Gamma: Rate of delta change', quiz: [{ question: 'A covered call is:', options: ['Buying calls', 'Owning stock + selling call', 'Only puts', 'Shorting stock'], answer: 1 }, { question: 'Theta measures:', options: ['Price sensitivity', 'Time decay', 'Volatility', 'Volume'], answer: 1 }] },
            { id: 3, icon: '', duration: '10 min', topics: ['Short', 'Advanced'], title: 'Short Selling', content: 'Short selling lets you profit from declining prices.\n\n**How it works:**\n1. Borrow shares from your broker\n2. Sell the borrowed shares\n3. Buy them back later at a lower price\n4. Return the shares and keep the difference\n\n**Risks:**\n- Unlimited loss potential (price can rise infinitely)\n- Short squeeze: rapid price rise forces shorts to cover\n- Margin requirements and interest costs\n\n**Short Interest:** Percentage of shares sold short. High short interest = potential squeeze.', quiz: [{ question: 'Short selling profits when:', options: ['Price goes up', 'Price goes down', 'Price stays the same', 'Volume increases'], answer: 1 }, { question: 'The maximum loss on a short sale is:', options: ['100%', '50%', 'Theoretically unlimited', 'The stock price'], answer: 2 }] },
            { id: 4, icon: '', duration: '11 min', topics: ['Algo', 'Automation'], title: 'Algorithmic Trading', content: 'Using algorithms and code to automate trading decisions.\n\n**Common strategies:**\n- **Mean Reversion:** Price returns to average\n- **Momentum:** Follow the trend\n- **Arbitrage:** Exploit price differences\n- **Market Making:** Provide liquidity, profit from spread\n\n**Tools:** Python, R, APIs, backtesting frameworks\n\n**Key concerns:**\n- Overfitting: Strategy works on historical data but not live\n- Latency: Speed matters in execution\n- Risk management: Automated doesn\'t mean risk-free', quiz: [{ question: 'Mean reversion strategies assume price will:', options: ['Always go up', 'Return to its average', 'Go to zero', 'Stay the same'], answer: 1 }, { question: 'Overfitting means:', options: ['Too much data', 'Strategy works on past but not future data', 'Trading too fast', 'High fees'], answer: 1 }] },
            { id: 5, icon: '', duration: '10 min', topics: ['MPT', 'Sharpe'], title: 'Portfolio Theory', content: 'Modern Portfolio Theory (MPT) by Harry Markowitz:\n\n**Key concepts:**\n- **Efficient Frontier:** Optimal portfolios offering highest return for given risk\n- **Correlation:** How assets move relative to each other (-1 to +1)\n- **Sharpe Ratio:** (Return - Risk-free) / Std Dev. Higher = better risk-adjusted returns\n- **Beta:** Volatility relative to the market. Beta > 1 = more volatile\n- **Alpha:** Excess return above a benchmark\n\n**Diversification works because:** Uncorrelated assets reduce overall portfolio risk.', quiz: [{ question: 'The Sharpe Ratio measures:', options: ['Total return', 'Risk-adjusted return', 'Dividend yield', 'Market cap'], answer: 1 }, { question: 'Beta > 1 means:', options: ['Less volatile than market', 'More volatile than market', 'No correlation', 'Guaranteed profit'], answer: 1 }] },
            { id: 6, icon: '', duration: '11 min', topics: ['Macro', 'Fed'], title: 'Macroeconomics & Markets', content: 'Key economic indicators that move markets:\n\n**Federal Reserve:**\n- Sets interest rates (Federal Funds Rate)\n- Higher rates = stocks down, bonds up (generally)\n- Quantitative Easing (QE) = injecting money\n\n**Key Indicators:**\n- **GDP:** Economic growth\n- **CPI/PPI:** Inflation measures\n- **Unemployment Rate:** Labor market health\n- **PMI:** Manufacturing/services activity\n\n**Yield Curve:** Difference between long and short-term bond rates. Inverted curve = recession signal.', quiz: [{ question: 'Higher interest rates typically cause stocks to:', options: ['Rise', 'Fall', 'Stay the same', 'Trade at higher volume'], answer: 1 }, { question: 'An inverted yield curve signals:', options: ['Bull market', 'Potential recession', 'High inflation', 'Low unemployment'], answer: 1 }] },
            { id: 7, icon: '', duration: '9 min', topics: ['Global', 'ADRs'], title: 'International Markets', content: 'Trading beyond US borders.\n\n**Major Global Exchanges:**\n- **LSE:** London Stock Exchange\n- **TSE:** Tokyo Stock Exchange\n- **SSE:** Shanghai Stock Exchange\n- **HKEX:** Hong Kong\n- **Euronext:** Amsterdam, Paris, Lisbon\n\n**ADRs:** American Depositary Receipts let you buy foreign stocks on US exchanges.\n\n**Currency Risk:** Exchange rate fluctuations impact returns on international investments.\n\n**Emerging Markets:** Higher growth potential but more political and economic risk.', quiz: [{ question: 'ADRs allow you to:', options: ['Trade futures', 'Buy foreign stocks on US exchanges', 'Avoid taxes', 'Short sell only'], answer: 1 }, { question: 'Currency risk affects:', options: ['Only domestic stocks', 'Only bonds', 'International investments', 'Only ETFs'], answer: 2 }] },
            { id: 8, icon: '', duration: '12 min', topics: ['VaR', 'Drawdown'], title: 'Risk Metrics & Analysis', content: 'Advanced risk measurement tools:\n\n**Value at Risk (VaR):**\n- Maximum expected loss over a time period at a confidence level\n- Example: 95% VaR of $10K means 5% chance of losing more than $10K\n\n**Maximum Drawdown:**\n- Largest peak-to-trough decline in portfolio value\n- Important for assessing worst-case scenarios\n\n**Sortino Ratio:** Like Sharpe but only considers downside volatility.\n\n**Kelly Criterion:** Optimal position size based on win rate and payoff ratio.\nf* = (bp - q) / b where b=payoff, p=win prob, q=loss prob', quiz: [{ question: '95% VaR means:', options: ['95% chance of profit', '5% chance of exceeding the loss amount', '95% of capital is at risk', 'Only 5% is invested'], answer: 1 }, { question: 'Maximum drawdown measures:', options: ['Total profit', 'Largest peak-to-trough decline', 'Daily returns', 'Trading volume'], answer: 1 }] },
            { id: 9, icon: '', duration: '10 min', topics: ['Bias', 'Psychology'], title: 'Behavioral Finance', content: 'How cognitive biases affect financial decisions:\n\n**Key Biases:**\n- **Loss Aversion:** Losses feel 2x worse than equivalent gains feel good\n- **Herding:** Following the crowd instead of your analysis\n- **Overconfidence:** Overestimating your ability to predict markets\n- **Recency Bias:** Overweighting recent events\n- **Sunk Cost Fallacy:** Holding losers because you already invested\n\n**Prospect Theory (Kahneman & Tversky):**\nPeople evaluate gains and losses relative to a reference point, and are risk-averse for gains but risk-seeking for losses.', quiz: [{ question: 'Loss aversion means:', options: ['Avoiding all risk', 'Losses feel worse than equal gains feel good', 'Never selling stocks', 'Only buying bonds'], answer: 1 }, { question: 'The sunk cost fallacy leads to:', options: ['Taking profits quickly', 'Holding losers too long', 'Diversifying more', 'Buying index funds'], answer: 1 }] },
            { id: 10, icon: '', duration: '13 min', topics: ['System', 'Backtesting'], title: 'Building a Trading System', content: 'Creating a complete, systematic approach to trading:\n\n**Components:**\n1. **Market Selection:** Which markets/stocks to trade\n2. **Entry Rules:** Specific conditions to open a position\n3. **Exit Rules:** When to take profit and cut losses\n4. **Position Sizing:** How much to risk per trade\n5. **Risk Management:** Maximum drawdown, daily loss limits\n\n**Backtesting:** Test your system on historical data before risking real money.\n\n**Forward Testing:** Paper trade your system for 1-3 months.\n\n**Key Metrics:**\n- Win rate, average win/loss, profit factor, maximum drawdown\n\n**Remember:** The best system is one you can follow consistently.', quiz: [{ question: 'Backtesting involves:', options: ['Trading with real money first', 'Testing on historical data', 'Buying after hours', 'Asking for advice'], answer: 1 }, { question: 'A complete trading system includes:', options: ['Only entry rules', 'Only exit rules', 'Entry, exit, position sizing, and risk management', 'Just following the news'], answer: 2 }] },
        ],
    },
    {
        id: 'strategies',
        name: 'Strategies',
        emoji: '',
        color: '#f97316',
        gradFrom: 'rgba(249,115,22,0.18)',
        gradTo: 'rgba(249,115,22,0.04)',
        units: [
            {
                id: 1,
                icon: '',
                duration: '11 min',
                topics: ['Day Trading', 'Scalping'],
                title: 'Day Trading Strategies',
                content: `Day trading involves opening and closing positions within the same trading day — no overnight holds.\n\n**Core Day Trading Strategies:**\n\n**Momentum Trading:** Buy stocks showing strong upward movement with high volume. Ride the wave and exit before it fades.\n- Entry: Breakout above resistance with 2x average volume\n- Exit: First sign of momentum loss or predetermined target\n\n**Scalping:** Make dozens of small, quick trades for tiny gains.\n- Typical hold time: seconds to minutes\n- Requires ultra-fast execution and tight spreads\n- Very high win rate needed (65%+)\n\n**Opening Range Breakout (ORB):** Wait for the first 15-30 minutes to establish a range, then trade the breakout.\n- Mark high/low of the first candle(s)\n- Buy above high or sell below low with stop at opposite end\n\n**Gap and Go:** Stocks that gap up at open often continue moving.\n- Look for pre-market catalysts (earnings, news)\n- Volume must confirm the gap\n\n**Key Rules for Day Traders:**\n- Use a pattern day trader (PDT) compliant account (>$25K in US)\n- Never risk more than 0.5-1% per trade\n- Cut losses fast — day traders can't afford to hold losers\n- Trade the first and last 90 minutes (most volume)\n- Avoid trading midday (12-2 PM ET) — low volume, choppy`,
                quiz: [
                    { question: 'Opening Range Breakout uses the first:', options: ['30 seconds', '15-30 minutes', '2 hours', 'Full day'], answer: 1 },
                    { question: 'Pattern Day Traders in the US need at least:', options: ['$5,000', '$10,000', '$25,000', '$50,000'], answer: 2 },
                    { question: 'Scalping typically holds positions for:', options: ['Days', 'Hours', 'Seconds to minutes', 'Weeks'], answer: 2 },
                ],
            },
            {
                id: 2,
                icon: '',
                duration: '9 min',
                topics: ['Swing Trading', 'Trends'],
                title: 'Swing Trading Techniques',
                content: `Swing trading holds positions for days to weeks, capturing "swings" in price.\n\n**Why Swing Trade?**\n- Less screen time than day trading\n- Can hold overnight (more flexibility)\n- Focuses on larger, cleaner moves\n- More manageable for most people\n\n**Core Swing Trading Setups:**\n\n**Pullback to Moving Average:**\n- Stock is in an uptrend (above 50-day MA)\n- Price pulls back to the 20-day or 50-day MA\n- Buy when price bounces off the MA with a bullish candle\n- Stop loss just below the MA\n\n**Support/Resistance Bounce:**\n- Identify key support levels from previous highs/lows\n- Wait for price to touch support and show reversal signals\n- Enter on confirmation (bullish candle, increasing volume)\n\n**Flag Pattern:**\n- Strong momentum move (the "pole")\n- Tight consolidation (the "flag") for a few days\n- Buy the breakout from the flag with stop below the low\n\n**Timeframes:** Use weekly chart to identify trend, daily for entry signals, 4-hour for precise entry.\n\n**Typical Hold Time:** 3-10 trading days\n\n**Risk/Reward Target:** Aim for at least 2:1 (risk $100 to make $200)`,
                quiz: [
                    { question: 'Swing trading typically holds for:', options: ['Seconds', 'Minutes', 'Days to weeks', 'Years'], answer: 2 },
                    { question: 'A flag pattern consists of:', options: ['Random movement', 'A strong move followed by tight consolidation', 'Only bearish candles', 'A double top'], answer: 1 },
                    { question: 'Minimum risk/reward ratio to target:', options: ['0.5:1', '1:1', '2:1', '10:1'], answer: 2 },
                ],
            },
            {
                id: 3,
                icon: '',
                duration: '13 min',
                topics: ['Technical', 'Patterns', 'Indicators'],
                title: 'Technical Analysis Deep Dive',
                content: `Advanced technical analysis goes beyond basic indicators to identify high-probability setups.\n\n**Chart Patterns (Continuation):**\n- **Ascending Triangle:** Flat resistance + rising support. Bullish breakout expected.\n- **Descending Triangle:** Flat support + falling resistance. Bearish breakdown expected.\n- **Symmetrical Triangle:** Converging highs and lows. Breakout in either direction.\n- **Cup and Handle:** Rounded bottom (cup) + small pullback (handle). Bullish continuation.\n\n**Chart Patterns (Reversal):**\n- **Head and Shoulders:** Three peaks, middle highest. Target = head-to-neckline distance.\n- **Double Top/Bottom:** Two peaks/troughs at same level. Strong reversal signals.\n- **Rounding Bottom:** Slow, gradual reversal. Long formation time = strong signal.\n\n**Volume Analysis:**\n- Volume should confirm price moves\n- Rising price + rising volume = strong trend\n- Rising price + falling volume = weakening trend (potential reversal)\n- High volume reversals carry more weight\n\n**Divergence (Very Powerful):**\n- **Bullish Divergence:** Price makes lower low but RSI/MACD makes higher low\n- **Bearish Divergence:** Price makes higher high but indicator makes lower high\n- Divergence signals momentum loss before price turns\n\n**Multi-Timeframe Analysis:**\n- Always confirm direction on a higher timeframe\n- Trade in direction of the larger trend\n- Use smaller timeframe for entry precision`,
                quiz: [
                    { question: 'An ascending triangle is generally:', options: ['Bearish', 'Bullish', 'Neutral', 'Only for crypto'], answer: 1 },
                    { question: 'Bullish divergence occurs when:', options: ['Price and RSI both fall', 'Price falls but RSI rises', 'Price rises but RSI falls', 'Both rise together'], answer: 1 },
                    { question: 'Rising price with falling volume suggests:', options: ['Strong uptrend', 'Weakening trend', 'Breakout imminent', 'Strong volume'], answer: 1 },
                ],
            },
            {
                id: 4,
                icon: '',
                duration: '12 min',
                topics: ['Fundamental', 'Valuation', 'DCF'],
                title: 'Fundamental Analysis Deep Dive',
                content: `Deep fundamental analysis involves valuing a business from the ground up.\n\n**Valuation Methods:**\n\n**Price-to-Earnings (P/E):**\n- Compare to industry average and historical P/E\n- Forward P/E uses estimated future earnings\n- High P/E = growth expectations or overvaluation\n\n**Price-to-Sales (P/S):**\n- Useful for unprofitable companies\n- P/S under 2 often considered cheap; varies by sector\n\n**Discounted Cash Flow (DCF):**\n- Estimate future free cash flows and discount to present value\n- Most theoretically sound but assumption-sensitive\n- Formula: Value = Σ(FCF / (1+r)^t)\n\n**Enterprise Value/EBITDA:**\n- EV = Market Cap + Debt - Cash\n- Accounts for capital structure differences\n\n**Key Financial Ratios:**\n- **Current Ratio:** Current assets / current liabilities. >1 is good.\n- **Debt/Equity:** How leveraged is the company?\n- **Free Cash Flow Margin:** FCF / Revenue. Higher = better quality earnings.\n- **Return on Invested Capital (ROIC):** How efficiently does the company deploy capital?\n\n**Reading the 10-K:**\n1. Business Description (what they do)\n2. Risk Factors (what could go wrong)\n3. Financial Statements\n4. Management Discussion & Analysis (forward-looking)\n\n**Moat Analysis:** Does the company have a durable competitive advantage?\n- Network effects (social media, marketplaces)\n- Switching costs (enterprise software)\n- Cost advantages (scale, process)\n- Intangibles (brands, patents)`,
                quiz: [
                    { question: 'DCF stands for:', options: ['Direct Cash Flow', 'Discounted Cash Flow', 'Dividend Cash Formula', 'Dynamic Capital Factor'], answer: 1 },
                    { question: 'ROIC measures:', options: ['Dividend yield', 'Capital efficiency', 'Revenue growth', 'Debt levels'], answer: 1 },
                    { question: 'A company "moat" refers to:', options: ['Its office location', 'Cash reserves', 'Durable competitive advantage', 'Market cap'], answer: 2 },
                ],
            },
            {
                id: 5,
                icon: '',
                duration: '10 min',
                topics: ['Risk', 'Management', 'Position Sizing'],
                title: 'Advanced Risk Management',
                content: `Professional risk management is what separates consistent traders from those who blow up.\n\n**The Three Pillars of Risk Management:**\n\n**1. Position Sizing:**\n- Risk a fixed percentage (1-2%) of your account per trade\n- Calculate: Position Size = (Account × Risk%) / (Entry - Stop)\n- Kelly Criterion (aggressive): f* = (bp - q) / b\n\n**2. Portfolio-Level Risk:**\n- **Correlation risk:** Multiple positions in correlated sectors amplify losses\n- **Max portfolio heat:** Total risk across all open trades (never exceed 5-6%)\n- **Sector limits:** Max 20-25% in any single sector\n\n**3. Drawdown Management:**\n- **Daily loss limit:** Stop trading for the day at -2% of account\n- **Weekly loss limit:** Cut position sizes in half after -5% week\n- **Maximum drawdown rule:** Never let account fall more than 20% from peak\n\n**Stop Loss Strategies:**\n- **Fixed %:** Always stop 2% below entry\n- **ATR-based:** Stop = Entry - 2×ATR (adapts to volatility)\n- **Structure-based:** Below the last swing low (most logical)\n- **Time-based:** Exit if trade doesn't work within X days\n\n**Asymmetric Risk/Reward:**\n- Only take trades with R:R of 2:1 or better\n- Even with 40% win rate, a 2:1 R:R is profitable\n- Math: 0.4 × 2 - 0.6 × 1 = +0.2R per trade\n\n**Common Risk Mistakes:**\n- Averaging down on losing positions\n- Moving stop losses to avoid being stopped out\n- Over-trading after a big win ("house money" fallacy)\n- Under-trading after a big loss (missing good setups)`,
                quiz: [
                    { question: 'Maximum portfolio heat (total risk across all trades) should not exceed:', options: ['1-2%', '5-6%', '15-20%', '30%+'], answer: 1 },
                    { question: 'ATR-based stops adapt to:', options: ['Market hours', 'Volatility', 'Volume', 'Earnings'], answer: 1 },
                    { question: 'With 40% win rate, you need an R:R of at least:', options: ['0.5:1', '1:1', '2:1+', '5:1+'], answer: 2 },
                ],
            },
            {
                id: 6,
                icon: '',
                duration: '14 min',
                topics: ['Options', 'Calls', 'Puts', 'Strategies'],
                title: 'Options Trading Strategies',
                content: `Options give you leverage and defined risk with multiple strategic applications.\n\n**Building Blocks:**\n- **Long Call:** Bullish. Pay premium, profit if stock rises above strike + premium.\n- **Long Put:** Bearish. Pay premium, profit if stock falls below strike - premium.\n- **Short Call:** Sell premium, collect income, cap profit if stock stays below strike.\n- **Short Put:** Sell premium, collect income, obligated to buy if stock falls below strike.\n\n**Income Strategies:**\n\n**Covered Call:**\n- Own 100 shares + sell 1 call option\n- Collect premium (income) while capping upside\n- Best for: Flat to slightly bullish stocks you own\n- Risk: Stock drops; reward: Premium + stock appreciation up to strike\n\n**Cash-Secured Put:**\n- Sell a put option backed by cash to buy shares if assigned\n- Collect premium while waiting to buy stock at a discount\n- Equivalent to covered call in risk profile\n\n**Spread Strategies:**\n\n**Bull Call Spread:** Buy call + sell higher-strike call. Reduce cost, cap gain.\n**Bear Put Spread:** Buy put + sell lower-strike put. Reduce cost, cap gain.\n**Iron Condor:** Sell OTM call spread + sell OTM put spread. Profit when stock stays in range.\n\n**Volatility Plays:**\n- **Long Straddle:** Buy ATM call + put. Profit from big moves either direction.\n- **Long Strangle:** Buy OTM call + put (cheaper than straddle). Needs bigger move.\n\n**The Greeks in Practice:**\n- **Delta (0 to 1):** How much option moves per $1 stock move. 0.5 = $0.50/move.\n- **Theta (negative):** Time decay — options lose value daily. Hurts buyers, helps sellers.\n- **Vega:** Sensitivity to implied volatility (IV). Buy options before IV expansion.\n- **Gamma:** Rate of delta change. High gamma near expiration.`,
                quiz: [
                    { question: 'A covered call involves:', options: ['Only buying calls', 'Owning shares + selling a call', 'Buying puts', 'Short selling'], answer: 1 },
                    { question: 'Theta represents:', options: ['Price sensitivity', 'Time decay', 'Volatility', 'Volume'], answer: 1 },
                    { question: 'An iron condor profits when:', options: ['Stock moves a lot', 'Stock stays in a range', 'Stock crashes', 'Volatility spikes'], answer: 1 },
                ],
            },
            {
                id: 7,
                icon: '',
                duration: '11 min',
                topics: ['MPT', 'Diversification', 'Factor Investing'],
                title: 'Portfolio Theory & Construction',
                content: `Building an optimal portfolio is a science as much as an art.\n\n**Modern Portfolio Theory (MPT):**\n- Harry Markowitz (1952) proved diversification mathematically\n- Efficient Frontier: curve of portfolios maximizing return for given risk\n- **Key Insight:** Combining assets with low correlation reduces total risk\n\n**Correlation Basics:**\n- Range: -1 (perfect inverse) to +1 (perfect together)\n- Stocks + Bonds: typically low/negative correlation\n- Tech stocks: highly correlated with each other\n- Add gold, real estate, international to lower correlation\n\n**The Capital Asset Pricing Model (CAPM):**\n- Expected Return = Risk-Free Rate + Beta × (Market Return - Risk-Free Rate)\n- Beta > 1: More volatile than market (tech, growth)\n- Beta < 1: Less volatile (utilities, staples)\n\n**Factor Investing (Smart Beta):**\n- **Value Factor:** Low P/E, P/B stocks historically outperform\n- **Momentum Factor:** Recent winners continue to outperform\n- **Size Factor:** Small caps outperform long-term\n- **Quality Factor:** High ROIC, low debt companies\n- **Low Volatility Factor:** Lower volatility stocks often outperform risk-adjusted\n\n**Practical Portfolio Construction:**\n1. Define your investment goal and time horizon\n2. Choose asset allocation (stocks/bonds/cash split)\n3. Select sectors and geographies for diversification\n4. Pick individual securities or use ETFs\n5. Set rebalancing schedule (quarterly, annually, or band-based)\n\n**Rebalancing:** Restores target allocation when markets drift.\n- Band-based: Rebalance when allocation drifts >5% from target\n- Calendar: Rebalance quarterly or annually`,
                quiz: [
                    { question: 'The Efficient Frontier represents:', options: ['Only bonds', 'Portfolios with highest return for given risk', 'Only tech stocks', 'Cash savings'], answer: 1 },
                    { question: 'A correlation of -1 means:', options: ['Assets move together', 'Assets move opposite', 'No relationship', 'Same volatility'], answer: 1 },
                    { question: 'The value factor focuses on:', options: ['High P/E stocks', 'Low P/E stocks', 'Only growth stocks', 'Dividend stocks'], answer: 1 },
                ],
            },
        ],
    },
    {
        id: 'personal-finance',
        name: 'Personal Finance',
        emoji: '',
        color: '#06b6d4',
        gradFrom: 'rgba(6,182,212,0.18)',
        gradTo: 'rgba(6,182,212,0.04)',
        units: [
            {
                id: 1,
                icon: '',
                duration: '8 min',
                topics: ['IRAs', 'Retirement', 'Tax-Free'],
                title: 'Understanding IRAs',
                content: `An IRA (Individual Retirement Account) is a tax-advantaged savings account built specifically for retirement. Understanding how IRAs work — and opening one early — is one of the most impactful financial moves anyone can make.

**Why Retirement Accounts Matter:**
Most people rely on Social Security — but the average monthly benefit is only around $1,900. An IRA lets your money grow in a tax-sheltered environment for decades, turning small monthly contributions into hundreds of thousands of dollars by the time you retire.

**Key Concepts:**
- **Traditional IRA:** Contribute pre-tax dollars. Get a tax deduction today. Pay taxes only when you withdraw in retirement.
- **Roth IRA:** Contribute after-tax dollars. No deduction now — but all growth and qualified withdrawals are 100% tax-free.
- **Contribution Limit:** $7,000/year in 2024 ($8,000 if you are age 50 or older)
- **Early Withdrawal Penalty:** 10% penalty plus taxes if you withdraw before age 59½

**Traditional vs Roth:**
- **Traditional IRA:** Tax break now · Pre-tax contributions · Taxed at withdrawal · Required distributions at age 73
- **Roth IRA:** Tax break later · After-tax contributions · Tax-free growth forever · No required distributions

**Example:**
$200/month at 7% annual return — both retire at age 65:
- Start investing at age 18 → ~$525,000 by retirement
- Start investing at age 30 → ~$222,000 by retirement
Starting just 12 years earlier more than doubles the final balance.

**Why It Matters:**
Opening a Roth IRA at 18 with just $100/month can grow into over $400,000 by retirement — completely tax-free. Every year you delay is compound growth you can never recover. Money saved through budgeting and invested here starts compounding immediately toward your future.

**Key Takeaways:**
- **Choose Roth if young:** Low tax bracket now plus decades of tax-free growth equals a massive long-term advantage
- **Start small:** $50/month invested consistently beats waiting to invest larger amounts later
- **Max it out:** Aim for the full $7,000/year limit before investing in taxable brokerage accounts
- **Time is irreplaceable:** Starting at 18 vs 30 can mean $300,000+ more at retirement`,
                quiz: [
                    { question: 'Which IRA provides 100% tax-free qualified withdrawals in retirement?', options: ['Traditional IRA', 'Roth IRA', 'SEP IRA', 'Both are equally tax-free'], answer: 1 },
                    { question: 'What is the penalty for withdrawing IRA funds before age 59½?', options: ['5% penalty', '10% penalty plus taxes', '20% flat fee', 'No penalty, just taxes'], answer: 1 },
                    { question: 'Which IRA gives you a tax deduction in the year you contribute?', options: ['Roth IRA', 'Traditional IRA', 'Neither type', 'Both types'], answer: 1 },
                    { question: 'When is the best time to open a Roth IRA?', options: ['After you turn 40', 'Once you have a large amount saved', 'As early as possible', 'Only when fully employed'], answer: 2 },
                ],
            },
            {
                id: 2,
                icon: '',
                duration: '9 min',
                topics: ['Compound Interest', 'Growth', 'Time'],
                title: 'The Power of Compound Interest',
                content: `Compound interest is earning returns on your returns — not just on the original amount. It is the most powerful wealth-building force in personal finance, and why time in the market matters far more than timing or the amount you start with.

**Key Concepts:**
- **Principal:** The original amount you invest or deposit
- **Interest:** The return earned each period on your current total balance
- **Compound Growth:** Returns are calculated on your ever-growing balance, not just the original deposit
- **Compounding Frequency:** How often returns are added — daily, monthly, or annually. More frequent means faster growth.

**Formula:**
A = P × (1 + r/n)^(nt)
- A = Final amount
- P = Principal (your starting amount)
- r = Annual interest rate as a decimal
- n = Compounding periods per year
- t = Time in years

**Example:**
$100/month at 7% annual return (compounded monthly):
- After 10 years → ~$17,400 (you contributed just $12,000)
- After 20 years → ~$52,400 (you contributed just $24,000)
- After 30 years → ~$121,900 (you contributed just $36,000)

**Early vs Late Starter ($100/month at 7%, retire at 65):**
- Start at age 18 → ~$350,000 at retirement
- Start at age 28 → ~$168,000 at retirement
- 10 extra years of compounding creates over $180,000 more — without a single extra dollar invested

**Why It Matters:**
Compound interest also works against you on debt. A credit card at 24% APR compounds monthly just as aggressively — wiping out investment gains just as fast. Eliminating high-interest debt is equivalent to earning a guaranteed 24% return. Both investing early and clearing debt leverage the same compounding force in opposite directions. This is why long-term investing, started as early as possible, is the core of wealth-building.

**Key Takeaways:**
- **Time beats amount:** Starting 10 years earlier often doubles outcomes without higher contributions
- **Reinvest everything:** All dividends and returns must stay invested to get the full compounding benefit
- **Debt cuts both ways:** High-interest debt compounds against you — clear it before investing aggressively
- **Stay the course:** Withdrawing early resets compounding and permanently reduces your final outcome`,
                quiz: [
                    { question: 'What makes compound interest more powerful than simple interest?', options: ['Higher interest rates', 'Government backing', 'You earn returns on your returns', 'It only applies to index funds'], answer: 2 },
                    { question: 'In A = P(1 + r/n)^nt, what does "t" represent?', options: ['Tax rate', 'Type of account', 'Time in years', 'Transaction fee'], answer: 2 },
                    { question: 'Why does starting at 18 vs 28 create such a large wealth difference?', options: ['Better stocks available when young', '10 more years of compounding on a growing total', 'Lower taxes when young', 'Higher IRA contribution limits'], answer: 1 },
                    { question: 'Person A invests $100/month starting at 20. Person B invests $200/month starting at 35. Both retire at 65 at 7% return. Who has more?', options: ['Person B — more per month wins', 'Person A — time beats amount', 'They end up equal', 'It depends on stock selection'], answer: 1 },
                ],
            },
            {
                id: 3,
                icon: '',
                duration: '6 min',
                topics: ['Simple Interest', 'Loans', 'Formula'],
                title: 'Simple Interest Basics',
                content: `Simple interest calculates returns on the original principal only — it never earns on itself. It grows in a straight line. Understanding it helps you evaluate loans, savings accounts, and the real cost difference between simple and compound borrowing.

**Key Concepts:**
- **Linear Growth:** Simple interest adds the same dollar amount each period — no acceleration or snowball effect
- **Common Uses:** Some auto loans, personal loans, short-term notes, and government savings bonds use simple interest
- **Predictable:** You can calculate exactly how much you will owe or earn at any point in time
- **No Snowball:** Unlike compound interest, previously earned interest never earns interest of its own

**Formula:**
Interest = Principal × Rate × Time
- Interest = Total interest earned or owed
- Principal = Starting amount in dollars
- Rate = Annual interest rate as a decimal
- Time = Number of years

**Example:**
$1,000 at 5% simple interest for 3 years:
- Interest = $1,000 × 0.05 × 3 = $150
- Total amount = $1,000 + $150 = $1,150

**Simple vs Compound Interest:**
- **Simple Interest:** Flat growth · Same dollar amount added each year · $1,000 at 10% for 20 years = $3,000
- **Compound Interest:** Exponential growth · Returns on returns · $1,000 at 10% for 20 years = $6,727

**Why It Matters:**
When borrowing, knowing whether interest is simple or compound can save you thousands. Simple interest loans are almost always cheaper at the same stated rate. For saving and investing, compound interest is dramatically more powerful — which is why you want compound growth on investments and simple (or no) interest on your debt.

**Key Takeaways:**
- **Memorize the formula:** I = P × R × T — quick mental math for any loan estimate
- **Simple is predictable:** Great for understanding the actual cost of short-term borrowing
- **Compound wins for investing:** For growing wealth over time, compound interest is far superior
- **Always ask:** Before taking a loan, confirm whether interest is simple or compound`,
                quiz: [
                    { question: 'Using I = P × R × T, what is the interest on $2,000 at 4% for 5 years?', options: ['$80', '$400', '$800', '$2,000'], answer: 1 },
                    { question: 'How does simple interest grow over time?', options: ['Exponentially', 'In a straight line (linearly)', 'It decreases over time', 'It varies randomly'], answer: 1 },
                    { question: 'At the same interest rate, which is generally cheaper for a borrower?', options: ['Compound interest', 'Simple interest', 'They are always identical', 'It depends on the lender'], answer: 1 },
                    { question: 'What is the total amount owed on $500 at 6% simple interest for 2 years?', options: ['$530', '$560', '$600', '$660'], answer: 1 },
                ],
            },
            {
                id: 4,
                icon: '',
                duration: '8 min',
                topics: ['Budgeting', '50/30/20', 'Money Management'],
                title: 'Budgeting & Controlling Your Money',
                content: `A budget is a plan for your money. Without one, spending naturally expands to fill whatever you earn — and nothing is ever left to invest. Budgeting is the foundation of financial control and the first step toward building real wealth.

**Key Concepts:**
- **Income:** All money coming in — salary, side income, freelance, benefits
- **Fixed Expenses:** Same amount every month — rent, car payment, loan minimums, subscriptions
- **Variable Expenses:** Change each month — food, clothing, entertainment, gas
- **Net Worth:** Total assets minus total liabilities — the number that truly measures financial health

**The 50/30/20 Rule:**
1. 50% — Needs: rent, utilities, groceries, transportation, minimum debt payments
2. 30% — Wants: dining out, entertainment, shopping, subscriptions, travel, hobbies
3. 20% — Savings and debt payoff: emergency fund, retirement accounts, extra loan payments

**Example:**
Monthly take-home income of $3,000:
- $1,500 to Needs (rent, utilities, groceries, transport)
- $900 to Wants (dining, streaming, hobbies, clothing)
- $600 to Savings and investments (IRA, emergency fund, extra debt payments)

**Avoiding Lifestyle Inflation:**
As income grows, spending tends to grow with it — this is lifestyle inflation. The key habit is keeping fixed expenses stable while routing raises and bonuses directly into savings and investments instead of upgrading your lifestyle.

**Why It Matters:**
A person earning $40,000 who saves 20% builds more long-term wealth than someone earning $80,000 who saves nothing. Every dollar saved through budgeting becomes a dollar that can be invested — compounding in an IRA, ETF, or savings account. The budget is what creates the money to invest.

**Key Takeaways:**
- **Pay yourself first:** Automatically transfer savings before touching any spending money
- **Track every dollar:** An app or spreadsheet — awareness alone reduces spending significantly
- **Cut wants first:** Review subscriptions and discretionary spending monthly before cutting necessities
- **Invest the surplus:** Saved money should go to work in the market — not sit idle in a checking account`,
                quiz: [
                    { question: 'In the 50/30/20 rule, what percentage goes to savings and debt payoff?', options: ['10%', '20%', '30%', '50%'], answer: 1 },
                    { question: 'What is "lifestyle inflation"?', options: ['Rising food and energy prices', 'Spending more as your income increases', 'Inflation affecting savings rates', 'Rising cost of housing over time'], answer: 1 },
                    { question: 'Which of the following is a "fixed expense"?', options: ['Restaurant meals', 'Monthly rent or mortgage payment', 'Clothing purchases', 'Weekend entertainment'], answer: 1 },
                    { question: 'Using 50/30/20 on a $4,000 monthly take-home, how much goes to "Wants"?', options: ['$400', '$800', '$1,200', '$2,000'], answer: 2 },
                ],
            },
        ],
    },
];
