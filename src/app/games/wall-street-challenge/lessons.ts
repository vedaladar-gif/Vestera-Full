import type { AssetId } from '@/lib/wallStreetTypes';
import type { IconName } from './icons';

export type Slide = {
    kicker?: string;
    title: string;
    icon: IconName;
    text: string;
    list?: Array<{ label: string; value: number }>;
};

export const ASSET_ICON: Record<AssetId, IconName> = {
    SAVE: 'bank',
    GOVB: 'capitol',
    CORP: 'office',
    VMKT: 'fund',
    GOLD: 'bars',
    ENRG: 'flame',
    S1: 'stocks',
    S2: 'stocks',
    S3: 'stocks',
    S4: 'stocks',
    S5: 'stocks',
    S6: 'stocks',
    S7: 'stocks',
    S8: 'stocks',
};

export const CARD_TITLE: Partial<Record<AssetId, string>> = {
    SAVE: 'Savings Account',
    GOVB: 'Government Bonds',
    CORP: 'Corporate Bonds',
    VMKT: 'Vestera Market Fund',
    GOLD: 'Gold',
    ENRG: 'Energy',
};

const STOCK_LESSON = [
    'A [stock] is a small piece of ownership in a company. When the company grows, your piece can be worth more.',
    'Single stocks move a lot. Good news can lift one company quickly, and bad news can drop it just as fast.',
    'Owning several different companies means one bad day does not sink your whole [portfolio].',
];

export const ASSET_LESSONS: Record<AssetId, string[]> = {
    SAVE: [
        'A savings account is the safest place for money you might need soon.',
        'The bank pays you a little [interest], so your balance grows slowly and never falls.',
        'Safe does not mean growing fast. Over 20 years, money in savings usually grows less than invested money.',
    ],
    GOVB: [
        'A [bond] is a loan. When you buy a government bond fund, you are lending money to the government.',
        'In return you earn steady interest. Government bonds are one of the lowest-risk investments.',
        'When interest rates rise, older bonds become less attractive, so their price can dip a little.',
    ],
    CORP: [
        'Corporate bonds are loans to large companies instead of the government.',
        'Companies pay a bit more interest than the government, because lending to a company carries a bit more risk.',
        'They still move much less than stocks, so they can steady a [portfolio].',
    ],
    VMKT: [
        'The Vestera Market Fund is an [index fund]. One purchase gives you a small piece of hundreds of companies.',
        'If one company has a bad year, it barely matters. If the whole market has a bad year, the fund falls too.',
        'Buying a little with every paycheck and holding for years is called [dollar-cost averaging].',
    ],
    GOLD: [
        'Gold has been valued for thousands of years.',
        'When stocks and bonds fall, gold has often held its value. Investors tend to buy it during a crisis.',
        'Keep in mind that gold does not pay interest or [dividends]. It only earns money if its price rises.',
    ],
    ENRG: [
        'Energy is a [commodity]: raw materials like oil and natural gas.',
        'You are not buying a barrel of oil. You are buying shares whose price follows supply and demand.',
        'Energy prices jump around with world news. It can balance a portfolio, but only for investors ready for a bumpy ride.',
    ],
    S1: STOCK_LESSON,
    S2: STOCK_LESSON,
    S3: STOCK_LESSON,
    S4: STOCK_LESSON,
    S5: [],
    S6: [],
    S7: [],
    S8: [],
};

export const FIRST_STOCKS: AssetId[] = ['S1', 'S2', 'S3', 'S4'];

export const HOW_TO_PLAY: Slide[] = [
    { title: 'Wall Street Challenge', icon: 'calendar', text: 'You have 20 years to build your fortune. The game has 8 rounds, and each round covers two and a half years.' },
    { title: 'Paychecks', icon: 'paycheck', text: 'Every six months you get paid. It starts at $2,000 and grows over time. Anything you do not invest stays as [pocket cash].' },
    { title: 'Buy and Sell', icon: 'stocks', text: 'Use the buy and sell buttons on each investment. For stocks, choose 1, 10, 25, or MAX shares first.' },
    { title: 'Market News', icon: 'news', text: 'The market follows a real 20-year stretch of history, and the companies are real ones under [code names]. Each game draws a different set of companies. Every round begins with that era\'s news. At the end you find out which years and companies you played.' },
    { title: 'New Investments', icon: 'unlock', text: 'You start with savings, bonds, and the market fund. New investments appear as the years go by.' },
    { title: 'Win', icon: 'trophy', text: 'The player with the highest [net worth] after 20 years wins. Try to beat the Steady Investor too.' },
];

export function assetSlides(id: AssetId, title: string): Slide[] {
    return ASSET_LESSONS[id].map(text => ({ title, icon: ASSET_ICON[id], text }));
}
