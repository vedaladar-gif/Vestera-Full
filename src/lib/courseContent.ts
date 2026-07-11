// Vestera Academy — structured course catalog
// Generated content for the 6-course Academy system

export const QUIZ_PASS_PCT = 80;

export type QuestionType = 'multiple_choice' | 'true_false' | 'scenario';

export interface FinalQuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface CourseLesson {
  id: number;
  title: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topics: string[];
  content: string;
}

export interface Course {
  id: string;
  title: string;
  emoji: string;
  icon: string;
  color: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  badgeName: string;
  badgeEmoji: string;
  description: string;
  prerequisite: string | null;
  lessons: CourseLesson[];
  finalQuiz: FinalQuizQuestion[];
}

export const COURSE_CATALOG: Course[] = [
  {
    id: "course-1",
    title: "Introduction to Investing",
    emoji: "🌱",
    icon: "seedling",
    color: "#22c55e",
    difficulty: "Beginner",
    estimatedMinutes: 65,
    xpReward: 250,
    coinReward: 120,
    badgeName: "First Steps Investor",
    badgeEmoji: "🎓",
    description: "Learn what investing is, how markets work, and how to build a solid foundation for long-term wealth.",
    prerequisite: null,
    lessons: [
      {
        id: 1,
        title: "What is Investing?",
        duration: "12 min",
        difficulty: "Beginner",
        topics: ["Basics","Wealth Building"],
        content: `Investing means putting your money to work so it can grow over time. Instead of letting cash sit in a checking account earning almost nothing, you buy assets — like stocks, bonds, or funds — that have the potential to increase in value or pay you income along the way.

Think of investing like planting a tree. You give up spending that money today, but if you choose wisely and give it time, the tree grows bigger every year. The earlier you start, the more time compounding has to work its magic.

**Key Concepts:**
- **Investing:** Using money to buy assets expected to grow or generate income over time
- **Saving:** Setting money aside in safe, low-return accounts for short-term goals
- **Return:** The profit (or loss) you earn on an investment, usually expressed as a percentage
- **Compound Growth:** Earning returns on your returns — the snowball effect that builds wealth
- **Inflation:** The gradual rise in prices; if your money doesn't grow faster than inflation, you lose purchasing power

**Investing vs Saving:**
Saving is for money you need soon — an emergency fund, a phone, next semester's expenses. It belongs in safe places like a high-yield savings account. Investing is for money you won't need for several years — retirement, a house down payment in 10 years, long-term wealth. Because markets go up and down, investing carries more risk, but historically it has delivered much higher returns than saving alone.

**Why Start Young?**
A teenager who invests \$50/month from age 16 to 26 and then stops completely can end up with more money at retirement than someone who starts at 30 and invests \$200/month for 35 years. Time is your biggest advantage — use it.

**Example:**
If you invest \$1,000 at an average 8% annual return:
- After 10 years → about \$2,159
- After 30 years → about \$10,063
That's without adding another dollar. Add regular contributions and the numbers get much bigger.

**Common Mistakes:**
- Waiting until you feel "rich enough" to start — even \$25/month matters
- Confusing investing with gambling — good investing is planned, diversified, and long-term
- Checking your portfolio every hour and panic-selling on bad days
- Investing money you might need within the next 1–2 years

**Key Takeaways:**
- **Investing grows wealth:** It beats inflation and builds long-term financial freedom
- **Time beats timing:** Starting early matters more than picking perfect stocks
- **Know your goal:** Match your strategy to how long until you need the money
- **Stay patient:** Short-term drops are normal; long-term trends have historically been upward

**Summary:**
Investing is how you turn today's dollars into tomorrow's financial freedom. You don't need to be wealthy to begin — you need a goal, a plan, and the discipline to stay in the game. Vestera's paper trading lets you practice all of this with zero real-money risk while you learn.`,
      },
      {
        id: 2,
        title: "Stocks vs ETFs vs Mutual Funds",
        duration: "14 min",
        difficulty: "Beginner",
        topics: ["Stocks","ETFs","Funds"],
        content: `When you start investing, you'll quickly encounter three main ways to put money in the market: individual stocks, ETFs, and mutual funds. Each has a different balance of control, cost, and diversification. Understanding the differences helps you choose the right tool for your goals.

**Key Concepts:**
- **Stock:** A share of ownership in one specific company (e.g., one share of Apple)
- **ETF (Exchange-Traded Fund):** A basket of many investments that trades like a single stock on an exchange
- **Mutual Fund:** A pooled investment managed by a company; you buy shares of the fund itself
- **Diversification:** Spreading money across many investments to reduce risk
- **Expense Ratio:** The annual fee charged by a fund, expressed as a percentage of your investment

**Individual Stocks:**
Buying a stock means you own a tiny piece of one company. If the company thrives, your share can rise in value and may pay dividends. The upside can be huge — but if that one company struggles, your entire bet is on the line. Stock picking requires research and carries concentration risk.

**ETFs:**
ETFs hold dozens or hundreds of stocks (or bonds) in one package. You buy and sell them throughout the day at market prices, just like a stock. Popular examples include SPY (tracks the S&P 500) and QQQ (tracks the NASDAQ-100). ETFs typically have low fees, are tax-efficient, and give instant diversification. They're a favorite starting point for beginners.

**Mutual Funds:**
Mutual funds also pool money from many investors into a diversified portfolio. Unlike ETFs, they're priced once per day after the market closes. They can be actively managed (a fund manager picks stocks) or passively managed (tracking an index). Active funds often charge higher fees. Some require minimum investments of \$1,000 or more.

**Comparison at a Glance:**
- **Stocks:** High control · Single-company risk · Best for research-driven investors
- **ETFs:** Instant diversification · Low fees · Trades all day · Great for beginners
- **Mutual Funds:** Diversified · Some high fees · Priced once daily · Good for automatic investing

**Example:**
Imagine you have \$500 to invest. Buying one stock puts 100% of that money on one company. Buying an S&P 500 ETF spreads it across 500 of America's largest companies — if one company drops 50%, your overall portfolio barely feels it.

**Common Mistakes:**
- Putting all your money in one "hot" stock you saw on social media
- Ignoring expense ratios — a 1% fee vs 0.03% adds up to thousands over decades
- Buying an ETF without checking what it actually holds
- Assuming mutual funds are always "safer" — they can hold the same risky stocks as ETFs

**Key Takeaways:**
- **Match the tool to your experience:** Beginners often start with broad ETFs
- **Fees matter:** Lower costs mean more of the return stays in your pocket
- **Diversification is free with funds:** One ETF can hold hundreds of companies
- **You can combine approaches:** Core ETF portfolio + a few individual stocks you research

**Summary:**
Stocks give you ownership in one company. ETFs and mutual funds give you a basket. For most beginners, a low-cost index ETF is the smartest first step — you get market exposure, instant diversification, and more time to learn before picking individual names.`,
      },
      {
        id: 3,
        title: "Risk vs Reward",
        duration: "13 min",
        difficulty: "Beginner",
        topics: ["Risk","Returns","Psychology"],
        content: `Every investment sits somewhere on the risk-reward spectrum. Higher potential returns almost always come with higher potential losses. Understanding this tradeoff — and knowing your personal risk tolerance — is one of the most important skills in investing.

**Key Concepts:**
- **Risk:** The chance that an investment loses value or fails to meet expectations
- **Reward (Return):** The gain you earn when an investment increases in value or pays income
- **Risk Tolerance:** How much loss you can handle emotionally and financially without panicking
- **Risk Capacity:** How much loss you can afford based on your timeline and finances
- **Volatility:** How much an investment's price swings up and down

**The Risk-Reward Tradeoff:**
Cash in a savings account is very low risk but earns minimal return — often less than inflation. Government bonds are relatively safe but typically return 3–5%. Stocks are riskier (they can drop 20–50% in bad years) but have historically returned around 7–10% annually over long periods. Cryptocurrency and single small-cap stocks can soar or crash — maximum risk, maximum uncertainty.

**Risk Tolerance vs Risk Capacity:**
Your risk tolerance is emotional — can you sleep at night if your portfolio drops 30%? Your risk capacity is mathematical — if you need the money for college in two years, you can't afford a big stock market drop even if you're emotionally fine with it. Always invest based on the lower of the two.

**Measuring Risk:**
- **Standard Deviation:** How wildly returns swing around the average
- **Maximum Drawdown:** The biggest peak-to-trough drop — your "worst case" scenario
- **Beta:** How much a stock moves relative to the overall market (Beta > 1 = more volatile)

**Example:**
Two portfolios, both starting at \$10,000:
- **Conservative (60% bonds, 40% stocks):** Might grow to \$18,000 in 10 years with a worst-year drop of -8%
- **Aggressive (90% stocks, 10% bonds):** Might grow to \$24,000 in 10 years with a worst-year drop of -35%
Same starting point, very different ride. Neither is "wrong" — it depends on your timeline and temperament.

**Common Mistakes:**
- Chasing the highest returns without understanding the downside
- Selling everything during a market crash because fear overrides logic
- Taking too much risk with money needed within 2–3 years
- Confusing a recent winning streak with skill ("I'm a genius!" before a crash)

**Key Takeaways:**
- **Higher reward requires higher risk:** There's no free lunch in investing
- **Know yourself:** Honest risk tolerance prevents panic-selling
- **Match risk to timeline:** Longer horizons can handle more stock exposure
- **Diversification reduces risk:** Without necessarily killing returns

**Summary:**
Risk and reward are partners — you can't have one without considering the other. The best investors aren't the ones who take the most risk; they're the ones who take the right amount of risk for their goals and stick to the plan when markets get scary.`,
      },
      {
        id: 4,
        title: "Diversification",
        duration: "12 min",
        difficulty: "Beginner",
        topics: ["Portfolio","Risk Management"],
        content: `Diversification is the investing equivalent of "don't put all your eggs in one basket." By spreading your money across different investments, you reduce the chance that one bad pick destroys your entire portfolio. It's one of the few free lunches in finance.

**Key Concepts:**
- **Diversification:** Spreading investments across assets, sectors, and geographies
- **Correlation:** How similarly two investments move — low correlation improves diversification
- **Asset Classes:** Major categories like stocks, bonds, cash, real estate, and commodities
- **Sector:** A group of companies in the same industry (tech, healthcare, energy)
- **Concentration Risk:** Danger from having too much money in one investment

**Why Diversification Works:**
If you own only one tech stock and that company misses earnings, you could lose 30% overnight. If you own an ETF with 500 companies across every industry, one company's bad day barely moves the needle. Different assets also respond differently to economic events — when stocks fall, bonds often rise, smoothing your overall returns.

**Levels of Diversification:**
1. **Within an asset class:** Own many stocks, not just one (use ETFs for easy diversification)
2. **Across asset classes:** Mix stocks, bonds, and cash based on your timeline
3. **Across geographies:** Include international stocks, not just US companies
4. **Across sectors:** Don't put 80% of your money in tech because it's been hot lately

**Example:**
During the 2000 dot-com crash, investors concentrated in tech lost 70–90%. Investors in a diversified S&P 500 index fund lost about 45% — still painful, but recoverable. During 2008, real estate and financial stocks crashed while consumer staples and utilities held up better. Diversification doesn't prevent losses, but it limits how bad they get.

**Common Mistakes:**
- Owning 10 tech stocks and calling it "diversified" — they're all in the same sector
- Over-diversifying into 50 individual stocks you can't track or understand
- Chasing last year's best-performing sector and abandoning everything else
- Ignoring international exposure — the US is only about 60% of the global stock market

**Key Takeaways:**
- **Spread the risk:** No single investment should make or break you
- **Use ETFs for easy diversification:** One fund can hold hundreds of companies
- **Low correlation is the goal:** Mix assets that don't all move the same direction
- **Rebalance periodically:** Markets shift your allocation — adjust back to your targets

**Summary:**
Diversification is your safety net. It won't eliminate losses, but it prevents one bad decision from wiping you out. Combined with a long time horizon, it's the closest thing to a guaranteed improvement in your risk-adjusted returns.`,
      },
      {
        id: 5,
        title: "Building Your First Portfolio",
        duration: "15 min",
        difficulty: "Beginner",
        topics: ["Portfolio","Strategy","Getting Started"],
        content: `Your first portfolio doesn't need to be complicated. In fact, the best beginner portfolios are simple, low-cost, and diversified. This lesson walks you through the practical steps to go from zero to a real investment plan — even if you're starting with just \$50.

**Key Concepts:**
- **Portfolio:** Your complete collection of investments
- **Asset Allocation:** The percentage split between stocks, bonds, and other assets
- **Rebalancing:** Adjusting your portfolio back to target percentages over time
- **Dollar-Cost Averaging:** Investing a fixed amount on a regular schedule regardless of price
- **Paper Trading:** Practicing with simulated money before risking real dollars

**Step-by-Step: Building Your First Portfolio:**
1. Define your goal (retirement in 40 years? Laptop in 2 years?)
2. Choose your asset allocation based on timeline and risk tolerance
3. Pick 1–3 low-cost ETFs as your core holdings
4. Set up automatic monthly contributions
5. Review quarterly — don't obsess daily

**Sample Beginner Allocations:**
- **Age 16–25, long timeline:** 90% stock ETF (like VTI or SPY) + 10% bond ETF
- **Medium timeline (5–7 years):** 60% stocks + 40% bonds
- **Short timeline (<3 years):** Keep money in savings, not stocks

**Example:**
Alex, age 17, has \$100/month to invest for retirement:
- Opens a Roth IRA (tax-free growth forever)
- Buys a total US stock market ETF (70%) and a total bond market ETF (30%)
- Sets up automatic \$100 monthly purchase
- Uses Vestera paper trading to practice reading charts while the real account grows
After 10 years at 7% average return, that \$12,000 contributed becomes roughly \$17,400 — and Alex is still decades from retirement.

**Common Mistakes:**
- Waiting for the "perfect" time to start — timing the market is nearly impossible
- Building a portfolio of 20 random stocks from TikTok recommendations
- Forgetting about fees — choose ETFs with expense ratios under 0.20%
- Checking your balance daily and making emotional changes

**Key Takeaways:**
- **Start simple:** One or two broad ETFs beat a messy collection of random picks
- **Automate contributions:** Consistency beats trying to time the market
- **Practice first:** Use paper trading to build confidence before real money
- **Review, don't react:** Check quarterly, rebalance annually, ignore daily noise

**Summary:**
Your first portfolio should be boring — and that's a compliment. Broad index ETFs, automatic contributions, and a long-term mindset will outperform most fancy strategies. Start now, keep costs low, stay diversified, and let time do the heavy lifting.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "What does buying a stock represent?",
        options: ["A loan to the company","Partial ownership in the company","A guarantee of profit","A government bond"],
        answer: 1,
        explanation: "A stock is a share of ownership — you literally own a tiny piece of that business.",
      },
      {
        id: 2,
        type: "true_false",
        question: "Investing and saving are the same thing.",
        options: ["True","False"],
        answer: 1,
        explanation: "Saving is for short-term, low-risk goals. Investing is for long-term growth and carries market risk.",
      },
      {
        id: 3,
        type: "multiple_choice",
        question: "Which investment vehicle typically offers instant diversification with low fees?",
        options: ["Single stock","ETF","Savings account","Certificate of deposit"],
        answer: 1,
        explanation: "ETFs hold many assets in one package and usually charge very low expense ratios.",
      },
      {
        id: 4,
        type: "scenario",
        question: "Jordan has $500 and wants broad market exposure with minimal research. What is the best first step?",
        options: ["Buy one trending meme stock","Put it all in a single company they like","Buy a low-cost S&P 500 ETF","Keep it in cash forever"],
        answer: 2,
        explanation: "A broad index ETF spreads risk across hundreds of companies — ideal for beginners.",
      },
      {
        id: 5,
        type: "multiple_choice",
        question: "What is diversification?",
        options: ["Buying only tech stocks","Spreading investments across different assets","Trading every day","Investing only in bonds"],
        answer: 1,
        explanation: "Diversification reduces the impact of any single investment failing.",
      },
      {
        id: 6,
        type: "true_false",
        question: "Higher potential returns always come with higher potential risk.",
        options: ["True","False"],
        answer: 0,
        explanation: "The risk-reward tradeoff is fundamental — there are no high-return, zero-risk investments.",
      },
      {
        id: 7,
        type: "multiple_choice",
        question: "What is dollar-cost averaging?",
        options: ["Investing a fixed amount on a regular schedule","Trying to buy at the lowest price each day","Selling when the market drops","Only investing lump sums once a year"],
        answer: 0,
        explanation: "Regular fixed investments reduce the pressure of timing the market perfectly.",
      },
      {
        id: 8,
        type: "scenario",
        question: "Morgan needs money for college tuition in 18 months. Where should that money primarily be?",
        options: ["100% in aggressive growth stocks","High-yield savings or short-term safe accounts","Single cryptocurrency","Options trading account"],
        answer: 1,
        explanation: "Short timelines cannot recover from big market drops — safety comes first.",
      },
      {
        id: 9,
        type: "multiple_choice",
        question: "What does an expense ratio measure?",
        options: ["Stock price volatility","The annual fee charged by a fund","Dividend yield","Market cap"],
        answer: 1,
        explanation: "Expense ratios directly reduce your returns — lower is better.",
      },
      {
        id: 10,
        type: "true_false",
        question: "Paper trading lets you practice investing without risking real money.",
        options: ["True","False"],
        answer: 0,
        explanation: "Paper trading is a risk-free way to learn mechanics and test strategies before going live.",
      },
    ],
  },
  {
    id: "course-2",
    title: "Understanding Stocks",
    emoji: "📊",
    icon: "chart-bar",
    color: "#5b84ff",
    difficulty: "Beginner",
    estimatedMinutes: 70,
    xpReward: 300,
    coinReward: 150,
    badgeName: "Stock Scholar",
    badgeEmoji: "📈",
    description: "Dive into how stocks work — from exchanges and market cap to IPOs and dividends.",
    prerequisite: "course-1",
    lessons: [
      {
        id: 1,
        title: "Stock Exchanges",
        duration: "13 min",
        difficulty: "Beginner",
        topics: ["Markets","Trading"],
        content: `Stock exchanges are the marketplaces where buyers and sellers come together to trade shares. When you buy a stock on your phone, your order is routed to one of these exchanges, matched with a seller, and executed in milliseconds. Understanding how exchanges work helps demystify the entire investing process.

**Key Concepts:**
- **Stock Exchange:** A regulated marketplace where securities are bought and sold
- **NYSE:** New York Stock Exchange — the world's largest by market cap, uses an auction system
- **NASDAQ:** Electronic exchange known for tech companies; no physical trading floor
- **Ticker Symbol:** A unique 1–5 letter code identifying a stock (AAPL = Apple, TSLA = Tesla)
- **Market Hours:** US markets typically open 9:30 AM – 4:00 PM Eastern Time on weekdays

**Major US Exchanges:**
The NYSE lists giants like Coca-Cola, Walmart, and Berkshire Hathaway. NASDAQ hosts Apple, Microsoft, and Amazon. There's also the NYSE American (smaller companies) and OTC markets (penny stocks and foreign companies — higher risk). Most investors interact with NYSE and NASDAQ daily without realizing it.

**How Trading Works:**
When you place a buy order, the exchange matches you with the lowest-priced seller. Market makers — special firms — provide liquidity by always being ready to buy or sell, keeping markets smooth. The price you see is the last trade price, constantly updating as new orders fill.

**Global Exchanges:**
Beyond the US, major exchanges include the London Stock Exchange (LSE), Tokyo Stock Exchange (TSE), Shanghai Stock Exchange (SSE), and Euronext (Europe). You can access many international stocks through ADRs (American Depositary Receipts) on US exchanges.

**Example:**
When you buy 1 share of AAPL at \$175, your broker sends the order to NASDAQ. A market maker or another investor sells you that share. Apple doesn't receive your money directly — you're buying from another investor. Apple only gets money when it first sells shares (during an IPO) or issues new stock.

**Common Mistakes:**
- Thinking the company gets your money when you buy stock on the open market
- Trading penny stocks on OTC markets without understanding the extra risk
- Assuming pre-market and after-hours prices reflect normal trading conditions
- Ignoring that exchanges are closed on US holidays

**Key Takeaways:**
- **Exchanges are matchmakers:** They connect buyers and sellers efficiently
- **Know your ticker:** Every stock has a unique symbol for identification
- **Markets have hours:** Plan trades during regular sessions for best liquidity
- **Global access exists:** ADRs let you invest in foreign companies from US accounts

**Summary:**
Stock exchanges are the engine rooms of capitalism. They provide the infrastructure, rules, and liquidity that make investing accessible to everyone — from Wall Street firms to a teenager buying their first share on a phone app.`,
      },
      {
        id: 2,
        title: "Market Capitalization",
        duration: "12 min",
        difficulty: "Beginner",
        topics: ["Valuation","Company Size"],
        content: `Market capitalization (market cap) tells you how big a company is in the eyes of the market. It's calculated by multiplying the current stock price by the total number of shares outstanding. Market cap helps you categorize companies and understand the risk-return profile of different investments.

**Key Concepts:**
- **Market Cap:** Stock price × shares outstanding = total market value of a company
- **Large Cap:** Companies valued over \$10 billion (Apple, Microsoft, JPMorgan)
- **Mid Cap:** \$2–10 billion (growing companies with established business models)
- **Small Cap:** \$300 million – \$2 billion (younger, faster-growing, more volatile)
- **Mega Cap:** Over \$200 billion (the absolute giants of the market)

**Why Market Cap Matters:**
Large-cap companies tend to be more stable — they've survived competition and economic cycles. Small-cap companies can grow faster but are riskier and more volatile. Mid-caps offer a balance. Index funds like the S&P 500 are large-cap focused, while the Russell 2000 tracks small caps.

**Market Cap Categories:**
- **Mega/Large Cap:** Lower volatility, established dividends, slower growth
- **Mid Cap:** Moderate risk, potential for steady growth
- **Small Cap:** Higher volatility, higher growth potential, less analyst coverage
- **Micro Cap:** Under \$300 million — very risky, often illiquid

**Example:**
Company A: stock price \$50 × 1 billion shares = \$50 billion market cap (large cap)
Company B: stock price \$200 × 50 million shares = \$10 billion market cap (large cap)
Company C: stock price \$15 × 100 million shares = \$1.5 billion market cap (small cap)
Notice Company B has a higher stock price but the same market cap as Company A — price alone doesn't tell you company size.

**Common Mistakes:**
- Thinking a \$500 stock is "bigger" than a \$20 stock (market cap, not price, measures size)
- Putting all money in small caps hoping for lottery-like returns
- Ignoring that market cap changes daily as the stock price moves
- Confusing market cap with revenue or profit

**Key Takeaways:**
- **Market cap = price × shares:** The true measure of company size
- **Size affects risk:** Larger companies tend to be more stable
- **Diversify across caps:** Mix large, mid, and small for balanced exposure
- **Price is misleading:** Always look at market cap, not just share price

**Summary:**
Market cap is one of the first numbers savvy investors check. It tells you whether you're dealing with an established giant or a fast-moving upstart — and helps you build a portfolio with the right mix of stability and growth potential.`,
      },
      {
        id: 3,
        title: "Shares Outstanding",
        duration: "11 min",
        difficulty: "Beginner",
        topics: ["Shares","Structure"],
        content: `Shares outstanding represent the total number of shares a company has issued and that investors currently hold. This number is crucial for calculating market cap, earnings per share (EPS), and understanding how corporate actions like stock splits and buybacks affect your ownership.

**Key Concepts:**
- **Shares Outstanding:** Total shares currently held by all shareholders
- **Float:** Shares available for public trading (excludes insider/locked shares)
- **Authorized Shares:** Maximum shares a company is allowed to issue (set in corporate charter)
- **Dilution:** When new shares are issued, reducing each existing share's ownership percentage
- **Stock Split:** Increasing share count while proportionally lowering price (2-for-1 split doubles shares, halves price)

**How Shares Outstanding Change:**
Companies can increase shares through secondary offerings (selling new stock to raise money) or stock splits. They decrease shares through buybacks (repurchasing their own stock). Each change affects EPS and your ownership stake.

**Why It Matters for Investors:**
If a company earns \$1 billion and has 500 million shares outstanding, EPS = \$2.00. If they issue 100 million new shares without growing earnings, EPS drops to \$1.67 — your slice of the profit shrinks. This is dilution, and it's why investors watch share count carefully.

**Stock Splits vs Share Count:**
A 4-for-1 split turns 1 share at \$400 into 4 shares at \$100. You own the same percentage of the company — nothing fundamentally changed. But splits can make stocks feel more affordable and sometimes attract more retail investors.

**Example:**
You own 10 shares of a company with 1 million shares outstanding. You own 0.001% of the company. The company issues 500,000 new shares. Now there are 1.5 million shares, and your 10 shares represent only 0.00067% — your ownership was diluted by 33% unless you bought more.

**Common Mistakes:**
- Celebrating a stock split as "free money" — your ownership percentage stays the same
- Ignoring dilution from companies constantly issuing new shares
- Confusing shares outstanding with daily trading volume
- Not reading about share buybacks — they can boost EPS and signal management confidence

**Key Takeaways:**
- **Shares outstanding drives key metrics:** Market cap, EPS, and ownership percentage
- **Watch for dilution:** New share issuance can hurt existing shareholders
- **Splits don't change value:** They just adjust price and share count proportionally
- **Buybacks reduce share count:** Can be bullish if done at reasonable prices

**Summary:**
Shares outstanding are the denominator behind many of the most important stock metrics. Understanding how this number changes — through splits, offerings, and buybacks — gives you an edge in evaluating whether a company is rewarding or diluting its shareholders.`,
      },
      {
        id: 4,
        title: "IPOs",
        duration: "14 min",
        difficulty: "Beginner",
        topics: ["IPOs","Public Markets"],
        content: `An IPO (Initial Public Offering) is when a private company first sells its shares to the public on a stock exchange. It's one of the most exciting events in the market — but also one of the most misunderstood. IPOs can create huge gains or painful losses, and the hype often exceeds the reality.

**Key Concepts:**
- **IPO:** Initial Public Offering — a company's debut on the public stock market
- **Private Company:** Owned by founders, employees, and private investors — shares not publicly traded
- **Public Company:** Anyone can buy shares on an exchange after the IPO
- **Underwriter:** Investment banks (Goldman Sachs, Morgan Stanley) that help price and sell the IPO
- **Lock-Up Period:** Time after IPO when insiders cannot sell their shares (typically 90–180 days)

**Why Companies Go Public:**
Companies IPO primarily to raise money for growth, pay off debt, or give early investors and employees a way to cash out. Going public also increases visibility, credibility, and the ability to use stock for acquisitions. But it comes with costs — regulatory reporting, scrutiny, and pressure for quarterly results.

**The IPO Process:**
1. Company hires underwriters and files an S-1 registration with the SEC
2. Roadshow: management pitches to institutional investors
3. Price is set based on demand (often the night before trading begins)
4. First day of trading: shares become available to the public
5. Lock-up expires: insiders can finally sell

**Example:**
When a popular tech company IPOs at \$25/share and opens at \$40 on day one, headlines scream about a "60% pop." But most retail investors couldn't buy at \$25 — that price went to institutional investors. If you bought at \$40 and the stock falls to \$22 over the next year, the IPO "pop" didn't help you at all.

**Common Mistakes:**
- Buying IPO stocks on hype without reading the S-1 filing
- Assuming IPO = guaranteed gains (many IPOs trade below their opening price within a year)
- Ignoring lock-up expiration dates — massive insider selling can pressure the stock
- Confusing a high opening price with a healthy company

**Key Takeaways:**
- **IPOs are fundraising events:** The company is selling shares to raise capital
- **First-day pops aren't free money:** Retail investors often pay more than the IPO price
- **Read the S-1:** It reveals risks, financials, and how the company actually makes money
- **Wait and watch:** Many successful investors avoid IPOs and buy after the hype settles

**Summary:**
IPOs are the market's grand openings — exciting, heavily marketed, and often overpriced. Understanding the process helps you decide whether to participate or patiently wait for a better entry point after the initial frenzy fades.`,
      },
      {
        id: 5,
        title: "Dividends",
        duration: "13 min",
        difficulty: "Beginner",
        topics: ["Income","Dividends"],
        content: `Dividends are cash payments that companies distribute to shareholders from their profits. They're a way to earn income from your investments without selling any shares. Not every company pays dividends, but for many investors — especially those seeking steady income — they're a cornerstone of strategy.

**Key Concepts:**
- **Dividend:** A payment from company profits to shareholders, usually quarterly
- **Dividend Yield:** Annual dividend per share ÷ stock price × 100 (e.g., \$2 dividend on a \$50 stock = 4% yield)
- **Ex-Dividend Date:** You must own the stock before this date to receive the upcoming dividend
- **Payout Ratio:** Percentage of earnings paid as dividends — above 80% may be unsustainable
- **DRIP:** Dividend Reinvestment Plan — automatically uses dividends to buy more shares

**Who Pays Dividends?**
Mature, profitable companies with steady cash flows — think Coca-Cola, Johnson & Johnson, and Procter & Gamble. Growth companies like Tesla and Amazon typically reinvest all profits back into the business instead of paying dividends. Neither approach is inherently better — it depends on the company's stage and your goals.

**Dividend Dates Explained:**
1. **Declaration Date:** Company announces the dividend amount
2. **Ex-Dividend Date:** Cutoff — buy before this to qualify
3. **Record Date:** Company checks who owns shares
4. **Payment Date:** Cash hits your account

**Example:**
You own 100 shares of a company paying a \$0.50 quarterly dividend (\$2/year):
- Annual income: 100 × \$2 = \$200
- If the stock is \$40, your yield is 5%
- With DRIP enabled, each quarter's \$50 automatically buys more shares, which earn their own dividends — compounding in action

**Common Mistakes:**
- Chasing the highest yield without checking if it's sustainable (a 15% yield often signals trouble)
- Buying a stock right before the ex-dividend date thinking it's free money (the stock price drops by the dividend amount)
- Ignoring that dividends are taxed (qualified dividends get lower rates; non-qualified are taxed as income)
- Avoiding growth stocks just because they don't pay dividends

**Key Takeaways:**
- **Dividends = income:** Get paid just for holding shares
- **Yield isn't everything:** A moderate, growing dividend beats an unsustainable high yield
- **Reinvest for compounding:** DRIP turns income into more shares and more future dividends
- **Know the dates:** Ex-dividend date determines eligibility

**Summary:**
Dividends reward patient shareholders with regular cash payments. Whether you spend them for income or reinvest them for growth, understanding how dividends work adds a powerful tool to your investing toolkit.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "What is a ticker symbol?",
        options: ["A company logo","A short code identifying a stock","The stock price","A trading fee"],
        answer: 1,
        explanation: "Ticker symbols like AAPL or MSFT uniquely identify stocks on exchanges.",
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "Market cap is calculated by:",
        options: ["Revenue × profit margin","Stock price × shares outstanding","Daily volume × price","Earnings × P/E ratio"],
        answer: 1,
        explanation: "Market cap = current share price multiplied by total shares outstanding.",
      },
      {
        id: 3,
        type: "true_false",
        question: "A $500 stock is always a larger company than a $20 stock.",
        options: ["True","False"],
        answer: 1,
        explanation: "Share price alone is misleading — market cap (price × shares) measures true company size.",
      },
      {
        id: 4,
        type: "multiple_choice",
        question: "What happens to your ownership percentage when a company issues new shares?",
        options: ["It increases automatically","It decreases (dilution)","It stays exactly the same","It doubles"],
        answer: 1,
        explanation: "New share issuance dilutes existing shareholders unless they buy proportionally more.",
      },
      {
        id: 5,
        type: "scenario",
        question: "A company announces a 2-for-1 stock split. You own 10 shares at $200 each. After the split you have:",
        options: ["5 shares at $400","20 shares at $100","10 shares at $100","20 shares at $200"],
        answer: 1,
        explanation: "A 2-for-1 split doubles your shares and halves the price — total value unchanged.",
      },
      {
        id: 6,
        type: "multiple_choice",
        question: "What is an IPO?",
        options: ["When a company buys back its stock","When a private company first sells shares to the public","When a stock gets delisted","When dividends are paid"],
        answer: 1,
        explanation: "IPO stands for Initial Public Offering — the company's stock market debut.",
      },
      {
        id: 7,
        type: "true_false",
        question: "Most retail investors can buy IPO shares at the official IPO price before the first trading day.",
        options: ["True","False"],
        answer: 1,
        explanation: "IPO shares typically go to institutional investors first; retail often buys at the higher opening market price.",
      },
      {
        id: 8,
        type: "multiple_choice",
        question: "What is dividend yield?",
        options: ["Total dividends paid last year","Annual dividend per share ÷ stock price","Stock price ÷ earnings","Shares outstanding × price"],
        answer: 1,
        explanation: "Yield = annual dividend divided by current stock price, expressed as a percentage.",
      },
      {
        id: 9,
        type: "scenario",
        question: "You want steady income from mature companies. Which is most relevant?",
        options: ["IPO lock-up periods","Dividend yield and payout ratio","Short selling rules","After-hours trading volume"],
        answer: 1,
        explanation: "Dividend yield and payout ratio help evaluate income-generating stocks.",
      },
      {
        id: 10,
        type: "true_false",
        question: "Growth companies like early-stage tech firms often reinvest profits instead of paying dividends.",
        options: ["True","False"],
        answer: 0,
        explanation: "Growth companies typically reinvest earnings to fuel expansion rather than distribute cash to shareholders.",
      },
    ],
  },
  {
    id: "course-3",
    title: "Reading the Market",
    emoji: "📈",
    icon: "chart-line",
    color: "#f97316",
    difficulty: "Intermediate",
    estimatedMinutes: 75,
    xpReward: 350,
    coinReward: 175,
    badgeName: "Chart Reader",
    badgeEmoji: "🕯️",
    description: "Master candlesticks, support and resistance, trends, volume, and technical indicators.",
    prerequisite: "course-2",
    lessons: [
      {
        id: 1,
        title: "Candlesticks",
        duration: "15 min",
        difficulty: "Intermediate",
        topics: ["Charts","Technical"],
        content: `Candlestick charts are the most popular way traders visualize price action. Each "candle" shows four key prices for a time period — open, high, low, and close — giving you a compact story of who won the battle between buyers and sellers.

**Key Concepts:**
- **Open:** The price at the start of the period
- **Close:** The price at the end of the period
- **High:** The highest price reached during the period
- **Low:** The lowest price reached during the period
- **Body:** The thick rectangle between open and close
- **Wick (Shadow):** Thin lines extending above and below the body showing the high and low

**Reading the Colors:**
- **Green (Bullish):** Close > Open — buyers pushed price up during the period
- **Red (Bearish):** Close < Open — sellers pushed price down during the period
Long bodies show strong conviction; short bodies show indecision. Long upper wicks suggest sellers rejected higher prices; long lower wicks suggest buyers stepped in at lower levels.

**Common Candlestick Patterns:**
- **Doji:** Open and close nearly equal — market indecision, possible reversal
- **Hammer:** Small body at top, long lower wick — bullish reversal signal at support
- **Shooting Star:** Small body at bottom, long upper wick — bearish reversal at resistance
- **Engulfing:** One candle completely swallows the previous — strong reversal signal

**Example:**
A stock drops to \$45 with a hammer candle (long lower wick, small green body) at a known support level on high volume. This suggests sellers pushed price down, but buyers aggressively stepped in — a potential bounce. Traders might enter at \$46 with a stop at \$44.

**Common Mistakes:**
- Trading every candlestick pattern without confirming context (trend, volume, support)
- Ignoring the timeframe — a hammer on a 1-minute chart means less than on a daily chart
- Forgetting that patterns are probabilities, not guarantees
- Using candlesticks alone without considering the bigger picture

**Key Takeaways:**
- **OHLC tells the story:** Every candle captures a complete price battle
- **Color shows direction:** Green = up, Red = down for that period
- **Wicks reveal rejection:** Long wicks show where price was rejected
- **Confirm with volume:** Strong patterns need volume backing

**Vestera Practice Tip:**
Apply what you learned in this lesson using Vestera's paper trading tools. Pick one stock, walk through the concepts step by step, and write down your observations. Building the habit of structured analysis — not just watching prices — is what separates informed investors from gamblers.



**Summary:**
Candlesticks transform raw price data into visual stories. Learn the basics, practice on Vestera charts, and always confirm patterns with trend, support/resistance, and volume before making decisions.`,
      },
      {
        id: 2,
        title: "Support & Resistance",
        duration: "14 min",
        difficulty: "Intermediate",
        topics: ["Technical","Levels"],
        content: `Support and resistance are the foundation of technical analysis. Support is a price level where buying pressure tends to stop a decline. Resistance is where selling pressure tends to stop a rise. These invisible walls shape every chart you'll ever read.

**Key Concepts:**
- **Support:** A price level where demand is strong enough to prevent further decline
- **Resistance:** A price level where supply is strong enough to prevent further rise
- **Breakout:** Price moves decisively above resistance or below support
- **Role Reversal:** Old resistance often becomes new support (and vice versa) after a breakout
- **Zone vs Line:** Support/resistance works best as zones, not exact penny-perfect prices

**Why Levels Form:**
Previous highs become resistance because traders who bought there and lost money want to "break even" by selling. Previous lows become support because traders who missed the first bounce want to buy at that level again. Round numbers (\$50, \$100) also act as psychological levels.

**How to Identify Levels:**
1. Look for price areas where the stock bounced multiple times (support)
2. Look for price areas where the stock was rejected multiple times (resistance)
3. Draw horizontal lines connecting these touch points
4. Watch for increased volume at these levels — it confirms their importance

**Example:**
A stock bounces at \$38 three times over two months — that's support. It gets rejected at \$45 twice — that's resistance. When it finally breaks above \$45 on heavy volume, the old resistance at \$45 often becomes new support on pullbacks.

**Common Mistakes:**
- Drawing too many lines until every price point has a level
- Expecting exact bounces — use zones of 1–2% instead of exact prices
- Ignoring volume on breakouts — low-volume breakouts often fail
- Shorting at support or buying at resistance without confirmation

**Key Takeaways:**
- **Support = floor, Resistance = ceiling:** Price tends to react at these levels
- **More touches = stronger level:** Three bounces beat one
- **Breakouts change roles:** Old resistance becomes new support
- **Volume confirms:** Strong breakouts come with above-average volume

**Drawing Tips:**
Start with the daily chart and mark only the most obvious levels — the ones price has touched at least twice. Zoom out to the weekly chart to see bigger-picture levels that matter more. Horizontal lines work better than diagonal ones for beginners. When a level breaks, wait for a full daily candle close beyond it before calling it a breakout — intraday wicks can be misleading.



**Summary:**
Support and resistance are the grammar of chart reading. Once you can spot these levels, every chart starts making sense — you see where price is likely to pause, bounce, or break through.`,
      },
      {
        id: 3,
        title: "Trends",
        duration: "13 min",
        difficulty: "Intermediate",
        topics: ["Trends","Direction"],
        content: `A trend is the general direction a stock or market is moving. The classic saying "the trend is your friend" exists because trading with the trend gives you a statistical edge. Fighting the trend is like swimming upstream — possible, but exhausting.

**Key Concepts:**
- **Uptrend:** Series of higher highs and higher lows — buyers in control
- **Downtrend:** Series of lower highs and lower lows — sellers in control
- **Sideways (Range):** Price bouncing between support and resistance — no clear direction
- **Trend Line:** A diagonal line connecting lows (uptrend) or highs (downtrend)
- **Trend Reversal:** When the pattern of highs and lows breaks down

**Identifying Trends:**
In an uptrend, each pullback stops at a higher low than the previous one. Connect those lows with a trend line — price bouncing off it is a buying opportunity. In a downtrend, each rally peaks at a lower high. Connect those highs — rallies to the trend line are potential short entries.

**Trend Timeframes:**
Trends exist on every timeframe. A stock can be in a daily uptrend but a weekly downtrend. The rule of thumb: trade in the direction of the higher timeframe trend. Use the daily chart for direction and the hourly chart for precise entries.

**Example:**
Stock XYZ makes lows at \$30, \$33, \$36 and highs at \$35, \$38, \$42 — clear uptrend. You draw a trend line connecting the lows. When price pulls back to the trend line at \$39 with a bullish candle, that's a trend-following buy setup with a stop below the trend line.

**Common Mistakes:**
- Declaring a trend reversal after one counter-trend day
- Ignoring the higher timeframe — shorting a daily uptrend because of a 5-minute dip
- Drawing trend lines through candle bodies instead of wicks
- Assuming trends last forever — all trends eventually end

**Key Takeaways:**
- **Higher highs + higher lows = uptrend:** The simplest and most reliable definition
- **Trade with the trend:** Your win rate improves dramatically
- **Multiple timeframes matter:** Align your trade with the bigger picture
- **Trend lines provide entries:** Bounces off trend lines are high-probability setups

**Trend Strength Signals:**
A healthy uptrend shows pullbacks that get shallower over time and bounces that reach new highs faster. When pullbacks start reaching deeper levels or taking longer to recover, the trend may be aging. Moving averages can help confirm: price staying above the 50-day MA in an uptrend is a sign of strength. When price breaks below the 50-day MA for multiple days, the trend may be shifting.



**Summary:**
Trends are the prevailing wind of the market. Learn to identify them, draw trend lines, and align your trades with the dominant direction. It's not about predicting turns — it's about riding the wave while it's moving.`,
      },
      {
        id: 4,
        title: "Volume",
        duration: "12 min",
        difficulty: "Intermediate",
        topics: ["Volume","Confirmation"],
        content: `Volume measures how many shares were traded during a period. It's the fuel behind price moves — a price change without volume is like a car running on fumes. Volume confirms whether a move is genuine or likely to fizzle out.

**Key Concepts:**
- **Volume:** Total number of shares traded in a given period
- **Average Volume:** Typical daily trading activity over the past 20–50 days
- **Relative Volume:** Today's volume compared to average (2x = twice normal activity)
- **Volume Spike:** Sudden surge in trading — often signals important news or a breakout
- **Volume Confirmation:** Price move backed by above-average volume is more trustworthy

**Volume Principles:**
- Rising price + rising volume = strong, healthy uptrend
- Rising price + falling volume = weakening trend, potential reversal ahead
- Falling price + rising volume = strong selling pressure, bearish
- Falling price + falling volume = selling losing steam, possible bottom forming

**Volume at Key Levels:**
When price breaks through resistance on 3x average volume, the breakout is likely real — many participants are confirming the move. A breakout on low volume often "fails" as price falls back below resistance because there weren't enough buyers to sustain it.

**Example:**
A stock has average daily volume of 2 million shares. It breaks above \$50 resistance on 8 million shares (4x average) with a strong green candle. This high-volume breakout suggests institutional buying and a high probability the new uptrend continues. A similar breakout on 1 million shares would be suspect.

**Common Mistakes:**
- Ignoring volume completely and only watching price
- Assuming all volume spikes are bullish (high volume on red candles = selling)
- Comparing volume across different stocks without context (Apple vs a small cap)
- Overreacting to pre-market volume which can be thin and misleading

**Key Takeaways:**
- **Volume validates price:** Big moves need big volume to be trusted
- **Compare to average:** Relative volume puts today's activity in context
- **Watch at breakouts:** Volume separates real breakouts from fakeouts
- **Declining volume warns:** Falling volume during a trend signals exhaustion

**Volume Tools on Charts:**
Most charting platforms show volume as bars below the price chart — green bars on up days, red on down days. Compare today's bar height to the average of the last 20 bars. Anything above 1.5x average is notable; above 2x is significant. On Vestera, make it a habit to glance at volume every time you analyze a chart — it takes two seconds and prevents many bad trades.



**Summary:**
Volume is the truth serum of the market. Price can lie, but volume shows you whether real money is behind a move. Make it a habit to check volume on every chart you analyze.`,
      },
      {
        id: 5,
        title: "Technical Indicators",
        duration: "14 min",
        difficulty: "Intermediate",
        topics: ["Indicators","RSI","MACD"],
        content: `Technical indicators are mathematical calculations based on price and/or volume that help identify trends, momentum, and potential reversals. They're tools — not crystal balls — that add context to what you see on the chart.

**Key Concepts:**
- **Moving Average (MA):** Average price over N periods — smooths out noise to show trend direction
- **RSI (Relative Strength Index):** Momentum oscillator (0–100); above 70 = overbought, below 30 = oversold
- **MACD:** Shows relationship between two moving averages; crossovers signal momentum shifts
- **Bollinger Bands:** Price channel based on standard deviation; squeeze signals low volatility before a big move
- **Lag:** All indicators are based on past data — they confirm, not predict

**Popular Indicators Explained:**
- **SMA/EMA (20, 50, 200):** The 200-day MA is the "institutional line" — above it is bullish, below is bearish. Golden Cross (50 crosses above 200) is bullish; Death Cross is bearish.
- **RSI:** Helps identify overextended moves. RSI above 70 in an uptrend can signal a pullback coming. RSI below 30 in a downtrend can signal a bounce.
- **MACD:** When the MACD line crosses above the signal line, momentum is shifting bullish. Below = bearish shift.

**Using Indicators Together:**
Never rely on a single indicator. A strong setup might combine: price bouncing off 50-day MA (trend) + RSI at 35 (oversold) + volume spike (confirmation). This "confluence" of signals is far more reliable than any one indicator alone.

**Example:**
Stock pulls back to its 50-day moving average in an uptrend. RSI drops to 32 (oversold). A hammer candle forms with 2x average volume. Three indicators align — this is a higher-probability buy setup than any single signal.

**Common Mistakes:**
- Adding so many indicators your chart becomes unreadable ("paralysis by analysis")
- Treating overbought/oversold as automatic sell/buy signals (strong trends stay overbought)
- Using indicators without understanding the math behind them
- Ignoring price action in favor of indicator signals

**Key Takeaways:**
- **Indicators confirm, not predict:** Use them to support what price action shows
- **Less is more:** 2–3 indicators used well beat 10 used poorly
- **Confluence is king:** Multiple signals aligning = stronger setup
- **Know the defaults:** 14-period RSI, 12/26/9 MACD, 20/50/200 MAs are standard for a reason

**Summary:**
Technical indicators are your dashboard gauges — they help you read the market's speed, temperature, and direction. Learn a few well, combine them with price action and volume, and you'll have a professional-grade analysis toolkit.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "What does a green candlestick indicate?",
        options: ["Price went down","Close is higher than open","Volume was low","Market was closed"],
        answer: 1,
        explanation: "Green (bullish) candles mean the closing price exceeded the opening price.",
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "What is a support level?",
        options: ["Where price tends to stop rising","Where buying pressure prevents further decline","The highest price ever reached","A type of order"],
        answer: 1,
        explanation: "Support is a floor where buyers historically step in.",
      },
      {
        id: 3,
        type: "true_false",
        question: "After breaking above resistance, that old resistance level often becomes new support.",
        options: ["True","False"],
        answer: 0,
        explanation: "This role reversal is a core concept in technical analysis.",
      },
      {
        id: 4,
        type: "multiple_choice",
        question: "An uptrend is defined by:",
        options: ["Lower highs and lower lows","Higher highs and higher lows","Flat price with no movement","Random price swings"],
        answer: 1,
        explanation: "Higher highs and higher lows = buyers in control.",
      },
      {
        id: 5,
        type: "scenario",
        question: "A stock breaks above resistance on very low volume. What is most likely?",
        options: ["Strong sustained breakout","The breakout may fail without volume confirmation","Automatic 50% gain","Dividend increase"],
        answer: 1,
        explanation: "Low-volume breakouts often fail — volume confirms genuine interest.",
      },
      {
        id: 6,
        type: "multiple_choice",
        question: "RSI above 70 generally suggests:",
        options: ["Oversold conditions","Overbought conditions","Zero volume","Market closed"],
        answer: 1,
        explanation: "RSI above 70 indicates the asset may be overextended to the upside.",
      },
      {
        id: 7,
        type: "true_false",
        question: "The 200-day moving average is widely watched as a long-term trend indicator.",
        options: ["True","False"],
        answer: 0,
        explanation: "Institutional investors and algorithms closely track the 200-day MA.",
      },
      {
        id: 8,
        type: "multiple_choice",
        question: "What does MACD help identify?",
        options: ["Dividend dates","Momentum shifts and trend direction","IPO pricing","Credit scores"],
        answer: 1,
        explanation: "MACD shows the relationship between moving averages and momentum changes.",
      },
      {
        id: 9,
        type: "scenario",
        question: "Price rises but volume declines for several days. This suggests:",
        options: ["An extremely strong trend","A weakening trend that may reverse","Guaranteed continued gains","Time to buy more aggressively"],
        answer: 1,
        explanation: "Rising price on falling volume is a warning sign of trend exhaustion.",
      },
      {
        id: 10,
        type: "multiple_choice",
        question: "What are the four prices shown in a candlestick?",
        options: ["Bid, ask, spread, volume","Open, high, low, close","Buy, sell, hold, short","Revenue, earnings, assets, debt"],
        answer: 1,
        explanation: "OHLC — open, high, low, close — are the four components of every candle.",
      },
    ],
  },
  {
    id: "course-4",
    title: "Fundamental Analysis",
    emoji: "🔬",
    icon: "microscope",
    color: "#a855f7",
    difficulty: "Intermediate",
    estimatedMinutes: 80,
    xpReward: 400,
    coinReward: 200,
    badgeName: "Fundamentals Pro",
    badgeEmoji: "📑",
    description: "Learn to evaluate companies through revenue, earnings, P/E ratios, balance sheets, and cash flow.",
    prerequisite: "course-3",
    lessons: [
      {
        id: 1,
        title: "Revenue",
        duration: "14 min",
        difficulty: "Intermediate",
        topics: ["Fundamentals","Financials"],
        content: `Revenue (also called "top line" or "sales") is the total amount of money a company brings in from its business activities before any expenses are subtracted. It's the starting point for understanding how big and healthy a business is.

**Key Concepts:**
- **Revenue:** Total income from selling products or services
- **Top Line:** Revenue appears at the top of the income statement
- **Revenue Growth:** How fast sales are increasing year-over-year
- **Organic Growth:** Growth from existing business, not acquisitions
- **Revenue vs Profit:** Revenue is total sales; profit is what's left after all expenses

**Why Revenue Matters:**
You can't have profits without revenue. A company with rapidly growing revenue is expanding its market, attracting customers, and building the foundation for future earnings. However, revenue alone doesn't tell the whole story — a company can have huge revenue and still lose money (looking at you, many growth startups).

**Analyzing Revenue:**
- **Growth Rate:** Is revenue growing 5%, 15%, or 30% year-over-year?
- **Consistency:** Steady growth is healthier than erratic spikes
- **Segment Breakdown:** Where does revenue come from? (Products, services, subscriptions, geography)
- **Seasonality:** Retailers spike in Q4; understand the pattern before overreacting to one quarter

**Example:**
Company A: \$10B revenue growing 20%/year — fast-growing, likely reinvesting heavily
Company B: \$50B revenue growing 3%/year — mature, stable, probably returning cash via dividends
Both can be good investments depending on your goals — growth vs income.

**Common Mistakes:**
- Equating high revenue with a good investment (profitability matters too)
- Ignoring revenue quality — one-time sales vs recurring subscription revenue
- Overreacting to a single quarter's miss without seeing the long-term trend
- Not comparing revenue growth to competitors in the same industry

**Key Takeaways:**
- **Revenue = top line:** It's the first number to check on any income statement
- **Growth rate matters:** Faster growing companies often command higher valuations
- **Quality over quantity:** Recurring revenue is more valuable than one-time sales
- **Context is key:** Compare to competitors and historical trends

**Vestera Practice Tip:**
Apply what you learned in this lesson using Vestera's paper trading tools. Pick one stock, walk through the concepts step by step, and write down your observations. Building the habit of structured analysis — not just watching prices — is what separates informed investors from gamblers.



**Summary:**
Revenue tells you how much business a company is doing. It's the foundation of fundamental analysis — but it's only the first chapter. Always dig deeper into profitability, cash flow, and balance sheet health.`,
      },
      {
        id: 2,
        title: "Earnings",
        duration: "15 min",
        difficulty: "Intermediate",
        topics: ["Earnings","EPS"],
        content: `Earnings (also called net income or "the bottom line") represent what's left after a company pays all its expenses, taxes, and costs. This is the money the company actually made — and it's the number that drives stock prices more than almost anything else.

**Key Concepts:**
- **Net Income (Earnings):** Revenue minus all expenses, taxes, and costs
- **EPS (Earnings Per Share):** Net income ÷ shares outstanding — the key per-share metric
- **Earnings Beat/Miss:** Whether actual earnings exceeded or fell short of analyst expectations
- **Earnings Season:** When most companies report quarterly results (Jan, Apr, Jul, Oct)
- **Guidance:** Management's forecast for future earnings — often moves the stock more than past results

**Why Earnings Drive Stock Prices:**
Stock prices reflect expectations of future earnings. When a company beats earnings estimates, the stock often jumps. When it misses, the stock drops — sometimes even if earnings grew, because growth wasn't fast enough. The market's reaction to earnings matters as much as the numbers themselves.

**Reading an Earnings Report:**
1. **Revenue vs expectations:** Did sales beat or miss?
2. **EPS vs expectations:** Did earnings beat or miss?
3. **Guidance:** What does management expect next quarter/year?
4. **Margins:** Are profits growing faster or slower than revenue?
5. **Key metrics:** Industry-specific numbers (subscribers for Netflix, same-store sales for retailers)

**Example:**
A company reports EPS of \$1.50 vs \$1.40 expected (beat!) but guides next quarter to \$1.20 vs \$1.45 expected (miss on guidance). The stock might drop 10% despite beating this quarter — because the market prices in the future, not the past.

**Common Mistakes:**
- Only looking at EPS without checking revenue growth and margins
- Ignoring one-time charges or gains that distort "adjusted" earnings
- Buying before earnings without understanding the risk of a gap down
- Treating all earnings beats as equal — context and guidance matter more

**Key Takeaways:**
- **Earnings = bottom line:** What's left after everything is paid
- **EPS is the headline number:** Earnings per share is what analysts and investors track
- **Expectations drive reactions:** Beating or missing estimates moves stocks
- **Guidance is forward-looking:** The market cares more about tomorrow than yesterday

**Earnings Calendar Strategy:**
Mark earnings dates on your calendar for any stock you own or watch. Many investors reduce position size before earnings to limit gap risk. If you hold through earnings, size the position so a 10–15% gap won't devastate your portfolio. After earnings, read the press release and listen to the earnings call replay (or read the transcript) — management tone often matters as much as the numbers.



**Summary:**
Earnings are the scoreboard of business. Learning to read earnings reports, understand beats and misses, and focus on guidance will make you a far more informed investor than someone who only watches stock prices.`,
      },
      {
        id: 3,
        title: "P/E Ratio",
        duration: "13 min",
        difficulty: "Intermediate",
        topics: ["Valuation","Ratios"],
        content: `The Price-to-Earnings (P/E) ratio is the most widely used valuation metric in investing. It tells you how much investors are willing to pay for each dollar of a company's earnings — essentially the "price tag" on the company's profit-generating ability.

**Key Concepts:**
- **P/E Ratio:** Stock price ÷ earnings per share (EPS)
- **Trailing P/E:** Based on past 12 months of actual earnings
- **Forward P/E:** Based on estimated future earnings — more predictive
- **Industry P/E:** Compare a stock's P/E to its sector average for context
- **PEG Ratio:** P/E divided by earnings growth rate — adjusts for growth

**Interpreting P/E:**
- **Low P/E (under 15):** Could be undervalued, or the market expects slow growth/trouble ahead
- **Average P/E (15–25):** Typical for mature, stable companies
- **High P/E (over 30):** Market expects high growth — or the stock is overpriced
- **Negative P/E:** Company is losing money — P/E doesn't apply

**P/E in Context:**
A P/E of 50 sounds expensive, but if the company is growing earnings at 40%/year, it might be reasonable. A P/E of 8 sounds cheap, but if earnings are declining, it's a "value trap." Always compare P/E to growth rate, industry peers, and historical averages.

**Example:**
Stock A: P/E of 12, growing earnings 5%/year — fairly valued for a slow grower
Stock B: P/E of 40, growing earnings 35%/year — PEG of 1.14, potentially reasonable
Stock C: P/E of 8, earnings declining 10%/year — cheap for a reason (value trap)

**Common Mistakes:**
- Comparing P/E across different industries (tech vs utilities have very different normal P/Es)
- Using P/E for unprofitable companies (negative earnings = meaningless P/E)
- Assuming low P/E always means "cheap" — it often means "troubled"
- Ignoring one-time earnings distortions that temporarily inflate or deflate P/E

**Key Takeaways:**
- **P/E = price tag on earnings:** How much you pay per dollar of profit
- **Context is everything:** Compare to industry, growth rate, and history
- **Forward P/E is more useful:** Based on estimates, not just past results
- **PEG adjusts for growth:** P/E alone misses the growth picture

**Historical P/E Context:**
Compare a stock's current P/E to its own 5-year average P/E. If a company normally trades at 25x but is now at 15x, the market may be pessimistic — or earnings may be temporarily inflated. Also check the forward P/E (based on next year's estimated earnings) which is often more relevant than trailing P/E for growth companies.



**Summary:**
The P/E ratio is your starting point for valuation, not your ending point. Use it to compare companies within the same industry, adjust for growth with PEG, and always ask: "Why is this P/E high or low?" The answer tells you what the market expects.`,
      },
      {
        id: 4,
        title: "Balance Sheets",
        duration: "15 min",
        difficulty: "Intermediate",
        topics: ["Balance Sheet","Assets"],
        content: `A balance sheet is a snapshot of what a company owns, what it owes, and what's left for shareholders at a specific point in time. It's one of the three core financial statements and essential for understanding a company's financial health and stability.

**Key Concepts:**
- **Assets:** Everything the company owns (cash, inventory, equipment, buildings)
- **Liabilities:** Everything the company owes (debt, accounts payable, loans)
- **Shareholders' Equity:** Assets minus liabilities — the "net worth" belonging to shareholders
- **The Equation:** Assets = Liabilities + Shareholders' Equity (always balances)
- **Working Capital:** Current assets minus current liabilities — short-term financial health

**Key Balance Sheet Items:**
- **Cash & Equivalents:** Liquid money — the company's financial cushion
- **Total Debt:** Short-term + long-term debt obligations
- **Debt-to-Equity Ratio:** Total debt ÷ shareholders' equity — measures leverage
- **Book Value:** Shareholders' equity ÷ shares outstanding — theoretical value per share
- **Goodwill:** Premium paid for acquisitions above fair value — can indicate overpayment

**What to Look For:**
A healthy balance sheet has ample cash, manageable debt, and growing equity. Red flags include: debt growing faster than assets, declining cash reserves, current liabilities exceeding current assets (liquidity crisis), and goodwill that's a large percentage of total assets.

**Example:**
Company X: \$5B assets, \$2B liabilities, \$3B equity → Debt/Equity = 0.67 (moderate leverage)
Company Y: \$5B assets, \$4.5B liabilities, \$0.5B equity → Debt/Equity = 9.0 (dangerously leveraged)
If revenue drops 20%, Company Y could face bankruptcy while Company X weathers the storm.

**Common Mistakes:**
- Only reading the income statement and ignoring the balance sheet
- Not checking debt levels before investing — debt kills companies in downturns
- Ignoring off-balance-sheet liabilities (leases, pension obligations)
- Comparing book value to stock price without understanding intangible assets

**Key Takeaways:**
- **Assets = Liabilities + Equity:** The fundamental accounting equation
- **Debt is dangerous:** High leverage amplifies both gains and losses
- **Cash is king:** Strong cash reserves provide survival and opportunity
- **Read it quarterly:** Balance sheets update every quarter in 10-Q filings

**Red Flag Checklist:**
Before buying any stock, scan the balance sheet for these warning signs: cash declining for multiple quarters, debt growing faster than revenue, current liabilities exceeding current assets, goodwill exceeding 30% of total assets, or frequent "one-time" charges that keep recurring. Healthy companies grow equity over time and maintain manageable debt levels.



**Summary:**
The balance sheet reveals whether a company is financially strong or fragile. Before investing, always check: How much debt? How much cash? Is equity growing? A profitable income statement means nothing if the balance sheet is crumbling.`,
      },
      {
        id: 5,
        title: "Cash Flow",
        duration: "14 min",
        difficulty: "Intermediate",
        topics: ["Cash Flow","FCF"],
        content: `Cash flow tracks the actual movement of money in and out of a business. A company can report positive earnings on paper while running out of cash — which is why cash flow analysis is critical for seeing the real financial picture.

**Key Concepts:**
- **Operating Cash Flow:** Cash generated from core business operations
- **Investing Cash Flow:** Cash spent on or received from investments (equipment, acquisitions)
- **Financing Cash Flow:** Cash from issuing debt, stock, or paying dividends/buybacks
- **Free Cash Flow (FCF):** Operating cash flow minus capital expenditures — cash available to shareholders
- **Cash Flow Statement:** The financial statement showing all cash movements

**Why Cash Flow Beats Earnings:**
Accounting allows companies to recognize revenue and expenses at different times than cash actually moves. A company might report \$100M in earnings but only generate \$20M in cash if customers haven't paid yet. Enron had "profits" but no cash — cash flow would have exposed the fraud.

**Analyzing Cash Flow:**
- **FCF positive and growing:** The company generates real cash — can pay dividends, buy back stock, or reinvest
- **FCF negative:** The company is burning cash — needs to raise money or cut costs
- **Operating CF > Net Income:** High-quality earnings (cash backs up the profit)
- **Operating CF < Net Income:** Potential red flag — earnings may not be real

**Example:**
Company A: Net income \$500M, operating cash flow \$600M → earnings quality is high
Company B: Net income \$500M, operating cash flow \$100M → where did the cash go? Investigate accounts receivable, inventory buildup, or aggressive accounting

**Common Mistakes:**
- Ignoring cash flow and only looking at EPS
- Not subtracting capital expenditures when calculating free cash flow
- Assuming positive operating cash flow means the company is healthy (financing could be propping it up)
- Overlooking that fast-growing companies often have negative FCF while investing heavily

**Key Takeaways:**
- **Cash is real, earnings can be manipulated:** Cash flow is harder to fake
- **Free cash flow is king:** FCF shows what the company can actually return to shareholders
- **Compare CF to earnings:** Operating CF should roughly track net income over time
- **Find it in the 10-Q/10-K:** Cash flow statements are in SEC filings

**Summary:**
Cash flow is the truth teller of financial statements. A company that consistently generates strong free cash flow is fundamentally healthy. One that reports profits but bleeds cash is a warning sign — no matter how good the story sounds.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "Revenue is also known as:",
        options: ["The bottom line","The top line","Net income","Free cash flow"],
        answer: 1,
        explanation: "Revenue appears at the top of the income statement — hence \"top line.\"",
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "EPS stands for:",
        options: ["Earnings per stock","Earnings per share","Equity per shareholder","Exchange price standard"],
        answer: 1,
        explanation: "EPS = net income divided by shares outstanding.",
      },
      {
        id: 3,
        type: "true_false",
        question: "A company can have high revenue and still be unprofitable.",
        options: ["True","False"],
        answer: 0,
        explanation: "Many growth companies have massive revenue but spend even more, resulting in losses.",
      },
      {
        id: 4,
        type: "multiple_choice",
        question: "A P/E ratio of 25 means:",
        options: ["The stock costs $25","Investors pay $25 for every $1 of earnings","The company earns 25% annually","25% dividend yield"],
        answer: 1,
        explanation: "P/E = price per share ÷ earnings per share.",
      },
      {
        id: 5,
        type: "scenario",
        question: "Stock A has P/E of 8 with declining earnings. Stock B has P/E of 35 with 40% growth. Which is likely the value trap?",
        options: ["Stock B","Stock A","Both are traps","Neither"],
        answer: 1,
        explanation: "Low P/E with declining earnings is often a value trap — cheap for a reason.",
      },
      {
        id: 6,
        type: "multiple_choice",
        question: "The balance sheet equation is:",
        options: ["Revenue = Expenses + Profit","Assets = Liabilities + Equity","Cash = Debt + Income","Price = Earnings × P/E"],
        answer: 1,
        explanation: "Assets always equal liabilities plus shareholders' equity.",
      },
      {
        id: 7,
        type: "true_false",
        question: "High debt-to-equity ratio always means a company is about to go bankrupt.",
        options: ["True","False"],
        answer: 1,
        explanation: "Some industries (utilities, banks) normally carry high debt. Context and ability to service debt matter.",
      },
      {
        id: 8,
        type: "multiple_choice",
        question: "Free cash flow is calculated as:",
        options: ["Revenue minus expenses","Operating cash flow minus capital expenditures","Total assets minus liabilities","Stock price times shares"],
        answer: 1,
        explanation: "FCF = operating cash flow - capex — the cash truly available.",
      },
      {
        id: 9,
        type: "scenario",
        question: "A company reports $200M net income but only $30M operating cash flow. What should you do?",
        options: ["Buy immediately — great profits","Investigate — earnings quality may be poor","Ignore cash flow entirely","Short the stock without research"],
        answer: 1,
        explanation: "Large gap between earnings and cash flow is a red flag worth investigating.",
      },
      {
        id: 10,
        type: "multiple_choice",
        question: "When do most US companies report quarterly earnings?",
        options: ["Monthly","Four times per year in Jan/Apr/Jul/Oct","Once per year","Only during IPOs"],
        answer: 1,
        explanation: "Earnings season clusters around four periods each year.",
      },
    ],
  },
  {
    id: "course-5",
    title: "Personal Finance",
    emoji: "💵",
    icon: "wallet",
    color: "#06b6d4",
    difficulty: "Beginner",
    estimatedMinutes: 70,
    xpReward: 350,
    coinReward: 175,
    badgeName: "Money Master",
    badgeEmoji: "💰",
    description: "Build financial literacy with budgeting, emergency funds, credit, compound interest, and retirement accounts.",
    prerequisite: "course-4",
    lessons: [
      {
        id: 1,
        title: "Budgeting",
        duration: "13 min",
        difficulty: "Beginner",
        topics: ["Budgeting","Money Management"],
        content: `A budget is a plan for your money — telling every dollar where to go before you spend it. Without a budget, money has a way of disappearing. With one, you control your spending, hit your savings goals, and create the surplus that fuels your investing journey.

**Key Concepts:**
- **Income:** All money coming in — salary, side gigs, allowance, freelance work
- **Fixed Expenses:** Same amount every month — rent, car payment, subscriptions, loan minimums
- **Variable Expenses:** Changes monthly — food, gas, entertainment, clothing
- **Net Worth:** Total assets minus total liabilities — your true financial score
- **Pay Yourself First:** Automatically save/invest before spending on wants

**The 50/30/20 Rule:**
1. **50% Needs:** Rent, utilities, groceries, transportation, minimum debt payments
2. **30% Wants:** Dining out, streaming, hobbies, shopping, travel
3. **20% Savings & Debt Payoff:** Emergency fund, retirement accounts, extra loan payments

**Building Your Budget:**
1. Track every expense for one month (use an app or spreadsheet)
2. Categorize into needs, wants, and savings
3. Compare to the 50/30/20 targets and adjust
4. Automate savings transfers on payday
5. Review and tweak monthly

**Example:**
Take-home income: \$3,000/month
- Needs (50%): \$1,500 — rent \$900, groceries \$300, transport \$200, utilities \$100
- Wants (30%): \$900 — dining \$200, subscriptions \$50, hobbies \$250, clothing \$200, fun \$200
- Savings (20%): \$600 — emergency fund \$200, Roth IRA \$400

**Common Mistakes:**
- Making a budget so strict you can't stick to it — allow some fun money
- Forgetting irregular expenses (car registration, holiday gifts, annual subscriptions)
- Lifestyle inflation — spending more every time income increases instead of saving the raise
- Not tracking spending — awareness alone reduces unnecessary purchases by 10–20%

**Key Takeaways:**
- **Budget = freedom:** Knowing where money goes reduces financial stress
- **50/30/20 is a starting framework:** Adjust percentages to your situation
- **Automate savings:** Remove willpower from the equation
- **Review monthly:** Small adjustments prevent big problems

**Practice Tip:**
Track every dollar you spend for one week using your phone notes or a free app. Most people are surprised by how much goes to small purchases. That awareness alone is the first step toward a budget that actually works.

**Summary:**
Budgeting isn't about restriction — it's about intention. Every dollar you save through smart budgeting is a dollar you can invest. Master your budget, and you've mastered the foundation of all financial success.`,
      },
      {
        id: 2,
        title: "Emergency Funds",
        duration: "12 min",
        difficulty: "Beginner",
        topics: ["Emergency Fund","Safety Net"],
        content: `An emergency fund is money set aside specifically for unexpected expenses — a car repair, medical bill, job loss, or any financial surprise. It's the financial safety net that prevents you from going into debt or selling investments at the worst possible time.

**Key Concepts:**
- **Emergency Fund:** 3–6 months of essential expenses saved in an accessible account
- **High-Yield Savings Account:** Pays 4–5% interest while keeping money safe and accessible
- **Essential Expenses:** Rent, food, utilities, insurance, minimum debt payments — not wants
- **Liquidity:** How quickly you can access your money without penalty
- **Opportunity Cost:** Emergency funds earn less than stocks, but that's the price of safety

**How Much Do You Need?**
- **Minimum:** $1,000 starter fund (while paying off high-interest debt)
- **Standard:** 3 months of essential expenses for stable employment
- **Conservative:** 6 months if income is variable, you're self-employed, or you're the sole earner
- **Calculate:** Add up monthly essentials × 3 or 6 = your target

**Where to Keep It:**
Your emergency fund belongs in a high-yield savings account — NOT invested in stocks. The whole point is that it's safe and available instantly. You don't want to need $5,000 for a car repair and discover your fund dropped 30% in a market crash.

**Example:**
Monthly essentials: $2,000 (rent, food, utilities, insurance, phone, transport)
3-month target: $6,000
6-month target: $12,000
Save $200/month → 3-month fund in 30 months, or $500/month → 12 months

**Common Mistakes:**
- Investing your emergency fund in stocks (wrong tool for the job)
- Using the emergency fund for vacations or planned purchases
- Never starting because the full amount feels overwhelming — start with $500
- Keeping it in a checking account earning 0.01% when high-yield accounts pay 4%+

**Key Takeaways:**
- **3–6 months of essentials:** The standard target for most people
- **Keep it safe and accessible:** High-yield savings, not stocks or CDs with penalties
- **Start small, build steadily:** Even $25/week adds up
- **Only for true emergencies:** Not for sales, trips, or wants

**Building Momentum:**
If saving $6,000 feels impossible, break it into milestones: $500, then $1,000, then one month of expenses, and so on. Celebrate each milestone — it keeps motivation high. Once your starter fund hits $1,000, shift focus to any high-interest debt above 8% APR, then resume building toward the full 3–6 month target. The habit matters more than the speed.

**Summary:**
An emergency fund is your financial airbag. It protects your investments, prevents debt spirals, and gives you the confidence to invest aggressively with your other money. Build it before you invest — it's rule number one.`,
      },
      {
        id: 3,
        title: "Credit Scores",
        duration: "13 min",
        difficulty: "Beginner",
        topics: ["Credit","FICO"],
        content: `Your credit score is a three-digit number (300–850) that tells lenders how trustworthy you are with borrowed money. It affects whether you get approved for loans, credit cards, apartments, and even some jobs — and it determines the interest rate you'll pay.

**Key Concepts:**
- **FICO Score:** The most common credit score model, ranging from 300 to 850
- **Credit Report:** Detailed history of your borrowing and payment behavior
- **Credit Utilization:** Percentage of available credit you're using — keep under 30%
- **Payment History:** Whether you pay bills on time — the single biggest factor (35%)
- **Credit Age:** How long your accounts have been open — longer is better

**FICO Score Factors:**
1. **Payment History (35%):** Pay every bill on time, every time
2. **Amounts Owed (30%):** Keep credit utilization below 30% (below 10% is excellent)
3. **Length of Credit History (15%):** Don't close your oldest accounts
4. **Credit Mix (10%):** Having different types (credit card, student loan) helps slightly
5. **New Credit (10%):** Too many recent applications can temporarily lower your score

**Score Ranges:**
- **800–850:** Exceptional — best rates on everything
- **740–799:** Very good — approved with great rates
- **670–739:** Good — approved with decent rates
- **580–669:** Fair — may face higher rates or need a co-signer
- **Below 580:** Poor — difficulty getting approved

**Example:**
You have a credit card with a \$1,000 limit. You charge \$800/month and pay it off. Your utilization is 80% — that hurts your score even though you pay in full. Solution: request a limit increase to \$3,000 (utilization drops to 27%) or pay mid-cycle before the statement closes.

**Common Mistakes:**
- Missing payments even by one day (set up autopay for at least the minimum)
- Closing old credit cards (shortens your credit history)
- Applying for too many credit cards at once (hard inquiries add up)
- Not checking your credit report for errors (free at AnnualCreditReport.com)
- Co-signing loans for friends without understanding the risk to YOUR score

**Key Takeaways:**
- **Pay on time, every time:** Payment history is 35% of your score
- **Keep utilization low:** Under 30%, ideally under 10%
- **Don't close old accounts:** Length of history matters
- **Check your report annually:** Errors are common and fixable

**Summary:**
Your credit score is your financial reputation. Build it early, protect it fiercely, and you'll save thousands in interest over your lifetime. A good credit score is one of the highest-ROI things you can manage as a young adult.`,
      },
      {
        id: 4,
        title: "Compound Interest",
        duration: "14 min",
        difficulty: "Beginner",
        topics: ["Compound Interest","Growth"],
        content: `Compound interest is earning returns on your returns — the snowball effect that turns small, regular investments into substantial wealth over time. Albert Einstein reportedly called it the "eighth wonder of the world." Whether or not he said it, the math is undeniable.

**Key Concepts:**
- **Principal:** The original amount you invest or deposit
- **Interest:** The return earned each period on your balance
- **Compound Growth:** Returns calculated on your growing total, not just the original deposit
- **Compounding Frequency:** How often interest is added — daily, monthly, or annually
- **Time:** The most powerful variable — compounding rewards patience above all

**Formula:**
A = P × (1 + r/n)^(nt)
- A = Final amount
- P = Principal (starting amount)
- r = Annual interest rate (as decimal)
- n = Compounding periods per year
- t = Time in years

**Simple vs Compound:**
Simple interest adds the same dollar amount each year — linear growth. Compound interest adds to a growing base — exponential growth. At 10% for 20 years, $1,000 grows to $3,000 with simple interest but $6,727 with compound interest.

**Example:**
$100/month invested at 7% annual return (compounded monthly):
- After 10 years: ~$17,400 (contributed $12,000)
- After 20 years: ~$52,400 (contributed $24,000)
- After 30 years: ~$121,900 (contributed $36,000)
Growth does the heavy lifting — after 30 years, you've contributed $36K but have $122K.

**Common Mistakes:**
- Waiting to start because the amount feels too small
- Withdrawing early and resetting the compounding clock
- Not reinvesting dividends — all returns must stay invested to compound fully
- Forgetting compound interest works against you on debt (24% credit card APR compounds monthly!)

**Key Takeaways:**
- **Time beats amount:** Starting 10 years earlier often matters more than contributing more
- **Reinvest everything:** Dividends and gains must stay invested to compound
- **Debt compounds too:** High-interest debt destroys wealth as fast as investing builds it
- **Start now:** Every month you wait is compound growth you'll never recover

**The Rule of 72:**
Quick mental math trick: divide 72 by your annual return rate to estimate how many years until your money doubles. At 8% return, money doubles every 9 years (72 ÷ 8 = 9). At 10%, every 7.2 years. Four doublings over 36 years turns $1,000 into $16,000 without adding another cent.

**Where Compounding Shows Up:**
Savings accounts, CDs, bonds, stock market returns, and retirement accounts all compound. Even credit card debt compounds against you — which is why clearing high-interest debt is as important as investing early.

**Summary:**
Compound interest is the engine of wealth building. Give it time, reinvest consistently, and even modest contributions grow into life-changing amounts. The best time to start was yesterday. The second best time is today.`,
      },
      {
        id: 5,
        title: "Retirement Accounts (401(k), Roth IRA, Traditional IRA)",
        duration: "15 min",
        difficulty: "Beginner",
        topics: ["Retirement","IRAs","401k"],
        content: `Retirement accounts are special investment accounts with tax advantages designed to help you save for the future. Understanding the differences between a 401(k), Roth IRA, and Traditional IRA can save you hundreds of thousands of dollars over your lifetime.

**Key Concepts:**
- **401(k):** Employer-sponsored retirement plan; often includes company matching — free money
- **Traditional IRA:** Individual account with pre-tax contributions; pay taxes on withdrawal in retirement
- **Roth IRA:** Individual account with after-tax contributions; all growth and qualified withdrawals are tax-free
- **Employer Match:** Your company contributes extra money when you contribute (e.g., 50% match up to 6% of salary)
- **Contribution Limits:** 401(k): \$23,000/year (2024); IRA: \$7,000/year (\$8,000 if 50+)

**401(k) — The Employer Plan:**
If your employer offers a 401(k) with a match, contribute at least enough to get the full match — it's an instant 50–100% return. Contributions reduce your taxable income now. Money grows tax-deferred until retirement. Limited investment options (usually a menu of funds chosen by the employer).

**Traditional IRA:**
You contribute pre-tax dollars and get a tax deduction now. Money grows tax-deferred. You pay ordinary income tax when you withdraw in retirement. Best when you expect to be in a lower tax bracket in retirement than you are now.

**Roth IRA:**
You contribute after-tax dollars (no deduction now). All growth and qualified withdrawals after age 59½ are 100% tax-free — forever. Best for young investors in low tax brackets who expect higher income later. No required minimum distributions.

**Which to Choose?**
1. First: 401(k) up to employer match (free money!)
2. Second: Max out Roth IRA (\$7,000/year) for tax-free growth
3. Third: Return to 401(k) and max it out (\$23,000/year)
4. Fourth: Taxable brokerage account for additional investing

**Example:**
Age 18, part-time job earning \$8,000/year:
- Open a Roth IRA (earned income required, but no age minimum)
- Contribute \$200/month (\$2,400/year — well under the \$7,000 limit)
- At 7% return until age 65: ~\$525,000 completely tax-free
- Same contributions in a taxable account would lose ~15–25% to taxes on gains

**Common Mistakes:**
- Not contributing enough to get the full 401(k) employer match
- Withdrawing retirement funds early (10% penalty + taxes before age 59½)
- Choosing Traditional IRA when you're in a low tax bracket (Roth is usually better for teens)
- Keeping retirement money in cash instead of investing it in stock/bond funds

**Key Takeaways:**
- **Get the match:** 401(k) employer match is the best guaranteed return available
- **Roth IRA for youth:** Tax-free growth is incredibly valuable over decades
- **Use tax advantages:** These accounts exist to help you — use them fully
- **Invest the money:** Don't let retirement accounts sit in cash — invest in low-cost index funds

**Summary:**
Retirement accounts are the most powerful wealth-building tools available to you. Start a Roth IRA as early as possible, grab every employer match, and let decades of tax-advantaged compounding work in your favor. Your future self will thank you.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "In the 50/30/20 budget rule, what percentage goes to savings?",
        options: ["10%","20%","30%","50%"],
        answer: 1,
        explanation: "20% of income goes to savings and debt payoff in the 50/30/20 framework.",
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "How much should a standard emergency fund cover?",
        options: ["1 week of expenses","3–6 months of essential expenses","1 year of total spending","10% of income"],
        answer: 1,
        explanation: "Most experts recommend 3–6 months of essential expenses.",
      },
      {
        id: 3,
        type: "true_false",
        question: "Emergency funds should be invested in the stock market for higher returns.",
        options: ["True","False"],
        answer: 1,
        explanation: "Emergency funds need to be safe and instantly accessible — use a high-yield savings account.",
      },
      {
        id: 4,
        type: "multiple_choice",
        question: "What is the biggest factor in your FICO credit score?",
        options: ["Credit utilization","Payment history","Credit age","Number of credit cards"],
        answer: 1,
        explanation: "Payment history accounts for 35% of your FICO score.",
      },
      {
        id: 5,
        type: "scenario",
        question: "Your credit card has a $2,000 limit and you charge $1,800/month. What should you do?",
        options: ["Nothing — paying in full is enough","Request a limit increase or pay before statement closes to lower utilization","Close the card immediately","Apply for 5 more cards"],
        answer: 1,
        explanation: "High utilization hurts your score even if you pay in full — lower it below 30%.",
      },
      {
        id: 6,
        type: "multiple_choice",
        question: "What makes compound interest more powerful than simple interest?",
        options: ["Higher rates guaranteed","You earn returns on your returns","Government insurance","No risk involved"],
        answer: 1,
        explanation: "Compounding calculates returns on the growing total, creating exponential growth.",
      },
      {
        id: 7,
        type: "true_false",
        question: "Starting to invest at 18 vs 30 can more than double your retirement savings with the same contributions.",
        options: ["True","False"],
        answer: 0,
        explanation: "Extra years of compounding dramatically increase final balances.",
      },
      {
        id: 8,
        type: "multiple_choice",
        question: "Which retirement account offers tax-free qualified withdrawals?",
        options: ["Traditional IRA","401(k)","Roth IRA","Regular brokerage account"],
        answer: 2,
        explanation: "Roth IRA contributions are after-tax, but all qualified withdrawals are tax-free.",
      },
      {
        id: 9,
        type: "scenario",
        question: "Your employer matches 50% of 401(k) contributions up to 6% of salary. You earn $50,000. Minimum contribution to get full match?",
        options: ["$500","$1,500","$3,000","$6,000"],
        answer: 2,
        explanation: "6% of $50,000 = $3,000 — contribute this to get the full 50% match ($1,500 free).",
      },
      {
        id: 10,
        type: "multiple_choice",
        question: "What is the 2024 IRA contribution limit for under age 50?",
        options: ["$3,000","$5,000","$7,000","$23,000"],
        answer: 2,
        explanation: "The IRA limit is $7,000/year ($8,000 if age 50+). The $23,000 limit is for 401(k)s.",
      },
    ],
  },
  {
    id: "course-6",
    title: "Advanced Investing",
    emoji: "🏆",
    icon: "trophy",
    color: "#ef4444",
    difficulty: "Advanced",
    estimatedMinutes: 85,
    xpReward: 500,
    coinReward: 250,
    badgeName: "Market Master",
    badgeEmoji: "👑",
    description: "Explore options, bonds, REITs, commodities, and portfolio rebalancing for sophisticated investors.",
    prerequisite: "course-5",
    lessons: [
      {
        id: 1,
        title: "Options (Introduction)",
        duration: "16 min",
        difficulty: "Advanced",
        topics: ["Options","Derivatives"],
        content: `Stock options give you the right — but not the obligation — to buy or sell a stock at a specific price before a certain date. They're one of the most versatile tools in investing, used for speculation, income generation, and hedging. But they come with significant risk and complexity.

**Key Concepts:**
- **Call Option:** The right to BUY a stock at the strike price before expiration
- **Put Option:** The right to SELL a stock at the strike price before expiration
- **Strike Price:** The agreed-upon price at which you can buy or sell
- **Expiration Date:** When the option expires — after this date, it's worthless if out of the money
- **Premium:** The price you pay to buy an option contract

**How Options Work:**
One option contract controls 100 shares. If you buy a call with a \$50 strike for \$3 premium, you pay \$300 (\$3 × 100). If the stock rises to \$60, your call is worth at least \$10 per share (\$1,000 total) minus your \$300 premium = \$700 profit. If the stock stays below \$50, you lose your entire \$300 premium.

**Key Terms:**
- **In the Money (ITM):** Option has intrinsic value (call: stock > strike; put: stock < strike)
- **Out of the Money (OTM):** No intrinsic value — only time value remains
- **At the Money (ATM):** Strike price equals current stock price
- **Theta (Time Decay):** Options lose value every day — time is the enemy of option buyers

**Basic Strategies:**
- **Long Call:** Bullish bet with limited risk (premium paid) and unlimited upside
- **Long Put:** Bearish bet or portfolio insurance with limited risk
- **Covered Call:** Own 100 shares + sell a call = income strategy with capped upside
- **Protective Put:** Own shares + buy a put = insurance against a crash

**Example:**
You own 100 shares of XYZ at \$80. You're worried about a short-term drop but don't want to sell. You buy a put with a \$75 strike for \$2 (\$200 total). If XYZ drops to \$65, your put is worth at least \$10 (\$1,000), offsetting most of your stock loss. If XYZ rises, you only lose the \$200 premium — cheap insurance.

**Common Mistakes:**
- Buying OTM options because they're "cheap" — most expire worthless
- Ignoring time decay — options lose value daily, even if the stock doesn't move
- Trading options without understanding the Greeks (delta, theta, vega)
- Using options for gambling instead of as part of a defined strategy

**Key Takeaways:**
- **Options are contracts, not ownership:** They give rights, not shares
- **Limited risk for buyers:** You can only lose the premium paid
- **Time decay is real:** Theta eats option value every day
- **Start with covered calls and protective puts:** Safest strategies for beginners

**Summary:**
Options are powerful but dangerous in untrained hands. Learn the basics, paper trade them on Vestera, and never risk money you can't afford to lose. Master stocks and ETFs first — options are an advanced tool, not a starting point.`,
      },
      {
        id: 2,
        title: "Bonds",
        duration: "14 min",
        difficulty: "Advanced",
        topics: ["Bonds","Fixed Income"],
        content: `Bonds are loans you make to governments or corporations. In exchange, they pay you interest (coupon) and return your principal at maturity. Bonds are the "steady Eddie" of investing — lower returns than stocks, but much more predictable income and lower volatility.

**Key Concepts:**
- **Bond:** A debt security where you lend money to an issuer for a set period
- **Coupon Rate:** The annual interest rate paid on the bond's face value
- **Face Value (Par):** The amount repaid at maturity, typically $1,000 per bond
- **Maturity Date:** When the issuer repays the principal
- **Yield:** The effective return considering current price, coupon, and time to maturity

**Types of Bonds:**
- **Treasury Bonds:** Issued by the US government — safest investment available
- **Corporate Bonds:** Issued by companies — higher yield but credit risk
- **Municipal Bonds:** Issued by state/local governments — often tax-free interest
- **High-Yield (Junk) Bonds:** Lower-rated companies — high yield, high default risk

**Bond Price vs Interest Rates:**
Bonds have an inverse relationship with interest rates. When rates rise, existing bond prices fall (because new bonds pay more). When rates fall, existing bond prices rise. This is crucial for understanding bond fund performance.

**Example:**
You buy a $1,000 bond with a 5% coupon ($50/year). If interest rates rise to 7%, new bonds pay $70/year on $1,000. Your 5% bond is less attractive, so its market price drops to ~$714 to match the 7% yield. If you hold to maturity, you still get $1,000 back — but selling early means a loss.

**Common Mistakes:**
- Assuming bonds can't lose money (they can, especially long-duration bonds when rates rise)
- Chasing high-yield junk bonds without understanding default risk
- Ignoring duration — long-term bonds are much more sensitive to rate changes
- Not considering that inflation erodes fixed bond payments over time

**Key Takeaways:**
- **Bonds = lending:** You receive interest and get principal back at maturity
- **Inverse rate relationship:** Rates up = bond prices down
- **Treasuries are safest:** US government bonds have never defaulted
- **Use for stability:** Bonds reduce portfolio volatility and provide income

**Bond Funds vs Individual Bonds:**
Most beginners should use bond ETFs (like BND or AGG) rather than buying individual bonds. Bond funds provide instant diversification, monthly income, and easy buying/selling. Individual bonds require large minimums ($1,000+ per bond) and can be illiquid.

**When Bonds Shine:**
Bonds tend to outperform stocks during recessions and market panics. A portfolio with 70% stocks and 30% bonds typically drops less during crashes than an all-stock portfolio — and recovers faster because bonds often rise when stocks fall.

**Summary:**
Bonds provide stability, income, and diversification in a stock-heavy portfolio. They won't make you rich, but they protect you during stock market crashes and provide predictable cash flow. Every balanced portfolio includes them.`,
      },
      {
        id: 3,
        title: "REITs",
        duration: "13 min",
        difficulty: "Advanced",
        topics: ["REITs","Real Estate"],
        content: `REITs (Real Estate Investment Trusts) let you invest in real estate without buying property. They own and operate income-producing properties — malls, apartments, data centers, cell towers — and pay out most of their income as dividends. REITs combine real estate exposure with stock-like liquidity.

**Key Concepts:**
- **REIT:** A company that owns, operates, or finances income-producing real estate
- **90% Rule:** REITs must distribute at least 90% of taxable income as dividends
- **Equity REITs:** Own and manage physical properties (apartments, offices, warehouses)
- **Mortgage REITs (mREITs):** Lend money for mortgages or buy existing mortgages — higher risk
- **Diversification:** REITs give real estate exposure without the hassle of being a landlord

**Types of REIT Properties:**
- **Residential:** Apartment complexes, single-family rentals
- **Commercial:** Office buildings, shopping centers, hotels
- **Industrial:** Warehouses, logistics centers (booming with e-commerce)
- **Specialty:** Data centers, cell towers, healthcare facilities, self-storage
- **Diversified:** Mix of property types

**Why Invest in REITs?**
Real estate has historically provided strong returns, inflation protection, and low correlation with stocks. REITs let you access this with as little as one share. They pay high dividends (often 3–6% yield) because of the 90% payout requirement. You can buy REIT ETFs (like VNQ) for broad exposure.

**Example:**
Instead of saving \$50,000 for a down payment on a rental property, you buy shares of a residential REIT ETF. You get exposure to thousands of apartment units nationwide, receive quarterly dividends, and can sell anytime the market is open — no tenants, toilets, or property management required.

**Common Mistakes:**
- Confusing equity REITs with mortgage REITs (very different risk profiles)
- Ignoring that REIT dividends are taxed as ordinary income (not qualified dividend rates)
- Not considering interest rate sensitivity — REITs often drop when rates rise
- Overconcentrating in one property type (e.g., only office REITs in a remote-work world)

**Key Takeaways:**
- **Real estate without being a landlord:** REITs handle everything
- **High dividend income:** 90% payout rule means generous distributions
- **Rate sensitive:** REITs often struggle when interest rates rise
- **Use REIT ETFs:** VNQ or similar for instant diversification across properties

**Evaluating REIT Quality:**
Look at Funds From Operations (FFO) instead of standard earnings — it's the REIT-specific measure of cash generation. Check occupancy rates, lease terms, and geographic diversification. A REIT with 95%+ occupancy across multiple property types and regions is generally more stable than one concentrated in a single city or property type.



**Summary:**
REITs bridge the gap between real estate investing and stock market convenience. They add income, diversification, and inflation protection to your portfolio — without the headaches of direct property ownership.`,
      },
      {
        id: 4,
        title: "Commodities",
        duration: "14 min",
        difficulty: "Advanced",
        topics: ["Commodities","Gold","Oil"],
        content: `Commodities are raw materials — gold, oil, wheat, copper, natural gas — traded on global markets. They offer diversification because they often move independently of stocks and bonds, especially during inflationary periods. Commodities can be accessed through ETFs, futures, or stocks of commodity-producing companies.

**Key Concepts:**
- **Commodity:** A basic physical asset traded on commodity exchanges
- **Hard Commodities:** Mined or extracted — gold, silver, oil, copper
- **Soft Commodities:** Agricultural — wheat, corn, coffee, cotton
- **Futures Contract:** Agreement to buy/sell a commodity at a set price on a future date
- **Contango/Backwardation:** Futures pricing conditions that affect commodity ETF returns

**Popular Commodity Investments:**
- **Gold (GLD):** Traditional "safe haven" during crises and inflation
- **Oil (USO):** Energy exposure — highly volatile, geopolitically driven
- **Broad Commodities (DBC):** Diversified basket of energy, metals, and agriculture
- **Mining Stocks:** Indirect commodity exposure through companies that extract resources

**Why Include Commodities?**
Commodities often rise during inflation when stocks and bonds struggle. Gold has been a store of value for thousands of years. A small allocation (5–10%) can reduce overall portfolio volatility and provide a hedge against unexpected economic shocks.

**Example:**
During 2022, stocks and bonds both fell significantly. Gold held relatively steady, and oil surged due to geopolitical events. An investor with 5% in a broad commodity ETF had a cushion that pure stock/bond portfolios lacked.

**Common Mistakes:**
- Over-allocating to commodities (5–10% is enough for most portfolios)
- Buying commodity ETFs without understanding contango decay (especially oil ETFs)
- Treating gold as a "always goes up" investment — it can stagnate for decades
- Trading commodity futures without understanding leverage and margin requirements

**Key Takeaways:**
- **Inflation hedge:** Commodities often rise when paper assets fall
- **Small allocation:** 5–10% is sufficient for diversification benefits
- **Use ETFs, not futures:** GLD, DBC, and similar are safer for most investors
- **Understand the risks:** Commodities are volatile and don't produce income

**Commodity Cycles:**
Commodities tend to move in multi-year cycles driven by supply and demand imbalances. Oil might surge when production cuts meet rising demand, then crash when supply floods back. Understanding these cycles helps with timing — but for most investors, a small passive allocation through a broad commodity ETF is smarter than trying to trade cycles.



**Summary:**
Commodities are the wild card of portfolio construction — they behave differently from stocks and bonds, providing diversification and inflation protection. A modest allocation through ETFs adds resilience without dominating your portfolio.`,
      },
      {
        id: 5,
        title: "Portfolio Rebalancing",
        duration: "15 min",
        difficulty: "Advanced",
        topics: ["Rebalancing","Portfolio Management"],
        content: `Portfolio rebalancing is the process of realigning your investments back to your target allocation. Over time, some assets grow faster than others, shifting your portfolio away from your intended risk level. Rebalancing forces you to sell high and buy low — systematically and without emotion.

**Key Concepts:**
- **Target Allocation:** Your planned mix of stocks, bonds, and other assets (e.g., 70/30)
- **Drift:** When market movements shift your actual allocation away from targets
- **Rebalancing:** Selling overweight assets and buying underweight ones to restore targets
- **Rebalancing Band:** A threshold (e.g., 5%) that triggers a rebalance when any asset class drifts beyond it
- **Tax-Loss Harvesting:** Selling losing positions to offset capital gains taxes

**Why Rebalance?**
Without rebalancing, a 70/30 stock/bond portfolio can drift to 85/15 after a strong bull market — exposing you to far more risk than you planned. Rebalancing after the 2008 crash (when stocks were cheap) would have you buying stocks at fire-sale prices. It's disciplined contrarian investing built into a system.

**Rebalancing Strategies:**
1. **Calendar Rebalancing:** Adjust quarterly or annually on a set schedule
2. **Band Rebalancing:** Rebalance when any asset class drifts more than 5% from target
3. **Cash Flow Rebalancing:** Direct new contributions to underweight assets (no selling needed)
4. **Hybrid:** Combine calendar checks with band triggers

**Example:**
Target: 60% stocks (\$6,000), 40% bonds (\$4,000) on a \$10,000 portfolio
After a bull market: 72% stocks (\$7,200), 28% bonds (\$2,800)
Rebalance: Sell \$1,200 of stocks, buy \$1,200 of bonds → back to 60/40
This forces you to take profits on winners and add to laggards.

**Common Mistakes:**
- Never rebalancing — letting a bull market silently increase your risk
- Rebalancing too frequently (monthly) — triggers unnecessary taxes and transaction costs
- Rebalancing in taxable accounts without considering tax implications
- Changing your target allocation based on recent market performance (stick to the plan)

**Key Takeaways:**
- **Rebalancing controls risk:** Prevents your portfolio from becoming too aggressive or conservative
- **Sell high, buy low:** Systematic rebalancing enforces contrarian discipline
- **Annual or band-based:** Don't overdo it — once or twice a year is usually enough
- **Use new money when possible:** Directing contributions avoids triggering taxes

**Summary:**
Rebalancing is the maintenance that keeps your portfolio running smoothly. It's not exciting, but it's essential. Set your targets, check periodically, and rebalance with discipline — your future self will thank you when the next market downturn hits and your allocation is exactly where it should be.`,
      },
    ],
    finalQuiz: [
      {
        id: 1,
        type: "multiple_choice",
        question: "A call option gives you the right to:",
        options: ["Sell a stock at a set price","Buy a stock at a set price","Short a stock","Receive dividends"],
        answer: 1,
        explanation: "Call options grant the right (not obligation) to buy at the strike price.",
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "What is the maximum loss for an option buyer?",
        options: ["Unlimited","The premium paid","The strike price","100% of portfolio"],
        answer: 1,
        explanation: "Option buyers can only lose what they paid for the premium.",
      },
      {
        id: 3,
        type: "true_false",
        question: "When interest rates rise, existing bond prices typically fall.",
        options: ["True","False"],
        answer: 0,
        explanation: "Bond prices and interest rates have an inverse relationship.",
      },
      {
        id: 4,
        type: "multiple_choice",
        question: "REITs must distribute at least what percentage of taxable income?",
        options: ["50%","75%","90%","100%"],
        answer: 2,
        explanation: "The 90% payout rule is what makes REITs high-dividend investments.",
      },
      {
        id: 5,
        type: "scenario",
        question: "You want real estate exposure without managing properties. Best option?",
        options: ["Buy a single rental house","Invest in a diversified REIT ETF","Buy land in another country","Mortgage your home to invest"],
        answer: 1,
        explanation: "REIT ETFs provide diversified real estate exposure with stock-like liquidity.",
      },
      {
        id: 6,
        type: "multiple_choice",
        question: "Gold is often considered a hedge against:",
        options: ["Deflation","Inflation and economic uncertainty","Low interest rates only","Strong stock markets"],
        answer: 1,
        explanation: "Gold historically holds value during inflation and crises.",
      },
      {
        id: 7,
        type: "true_false",
        question: "Portfolio rebalancing helps maintain your target risk level over time.",
        options: ["True","False"],
        answer: 0,
        explanation: "Without rebalancing, portfolios drift toward higher risk after bull markets.",
      },
      {
        id: 8,
        type: "multiple_choice",
        question: "What is \"theta\" in options trading?",
        options: ["Price sensitivity to stock moves","Time decay — how much value options lose daily","Volatility sensitivity","Interest rate impact"],
        answer: 1,
        explanation: "Theta measures daily time decay — the enemy of option buyers.",
      },
      {
        id: 9,
        type: "scenario",
        question: "Your 60/40 portfolio drifts to 75/25 after a bull market. What should you do?",
        options: ["Do nothing — let winners run forever","Rebalance by selling stocks and buying bonds","Sell everything and go to cash","Switch to 100% stocks"],
        answer: 1,
        explanation: "Rebalancing restores your intended risk level by trimming winners and adding to laggards.",
      },
      {
        id: 10,
        type: "multiple_choice",
        question: "Which bond type is considered the safest?",
        options: ["High-yield corporate bonds","US Treasury bonds","Emerging market bonds","Mortgage REITs"],
        answer: 1,
        explanation: "US Treasury bonds are backed by the full faith and credit of the US government.",
      },
    ],
  }];

export const TOTAL_COURSE_LESSONS = COURSE_CATALOG.reduce(
  (sum, course) => sum + course.lessons.length,
  0,
);

/** Ordered list of course ids (course-1 … course-6) */
export const COURSE_IDS = COURSE_CATALOG.map((course) => course.id);

/** Every course has exactly 5 lessons */
export const LESSONS_PER_COURSE = 5;

/** Alias used by academy progress hook */
export const TOTAL_LESSONS = TOTAL_COURSE_LESSONS;

export interface CourseConfig {
  id: string;
  name: string;
  badge: string;
  badgeEmoji: string;
  color: string;
  prerequisite: string | null;
}

export function getCourseById(id: string): Course | undefined {
  return COURSE_CATALOG.find((course) => course.id === id);
}

export function getLessonById(courseId: string, lessonId: number): CourseLesson | undefined {
  const course = getCourseById(courseId);
  return course?.lessons.find((lesson) => lesson.id === lessonId);
}

export function getCourseConfig(id: string): CourseConfig | undefined {
  const course = getCourseById(id);
  if (!course) return undefined;
  return {
    id: course.id,
    name: course.title,
    badge: course.badgeName,
    badgeEmoji: course.badgeEmoji,
    color: course.color,
    prerequisite: course.prerequisite,
  };
}

export function getPrevCourseId(courseId: string): string | null {
  return getCourseById(courseId)?.prerequisite ?? null;
}
