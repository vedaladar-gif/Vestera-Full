import { FIRST_YEAR, INDEX_RETURNS, LAST_YEAR } from './wallStreetHistory';

export type Sector = 'Tech' | 'Consumer' | 'Retail' | 'Banking' | 'Energy' | 'Industrial' | 'Health' | 'Autos' | 'Travel' | 'Media';

type CompanyDef = {
    realName: string;
    codeName: string;
    sector: Sector;
    description: string;
    dividend: number;
    beta: number;
    // Year-to-year wobble added between known prices.
    vol: number;
    // Bankrupt companies keep their last price afterwards. Acquired ones are only used while they still traded.
    fate?: 'bankrupt' | 'acquired';
    // Approximate split-adjusted year-end prices. Only the ratios between years matter.
    prices: Record<number, number> | number[];
};

export type Company = Omit<CompanyDef, 'prices'> & {
    key: number;
    firstYear: number;
    lastYear: number;
    // One entry per year from BASE_YEAR through LAST_YEAR, null before the company was listed.
    prices: Array<number | null>;
};

const BASE_YEAR = FIRST_YEAR - 1;

const DEFS: CompanyDef[] = [
    {
        realName: 'Coca-Cola', codeName: 'ColaCo', sector: 'Consumer', dividend: 0.03, beta: 0.7, vol: 0.1,
        description: 'A global soft-drink company. People buy drinks in good years and bad years, so it tends to move less than other stocks.',
        prices: [
            0.38, 0.45, 0.55, 0.48, 0.58, 0.66, 0.75, 0.65, 0.85, 1.0,
            1.1, 1.05, 1.35, 1.6, 1.2, 0.62, 0.85, 0.95, 0.9, 0.85,
            0.8, 0.75, 0.85, 1.0, 1.2, 1.3, 1.8, 2.4, 2.6, 3.0,
            5.0, 6.0, 10.0, 10.5, 11.2, 13.0, 18.5, 26.0, 33.0, 33.5,
            29.0, 30.0, 23.0, 22.0, 25.0, 21.0, 20.0, 24.0, 31.0, 22.6,
            28.5, 33.0, 35.0, 36.0,
        ],
    },
    {
        realName: 'IBM', codeName: 'Apex Machines', sector: 'Tech', dividend: 0.025, beta: 1.0, vol: 0.12,
        description: 'A giant maker of business computers and office machines. It has been one of the most famous companies in the market.',
        prices: [
            6, 6.5, 9.5, 7, 9, 9.5, 10.5, 11, 17, 19.5,
            22, 19.8, 21, 25, 15.4, 10.5, 14, 17.5, 17.2, 18.6,
            16, 17, 14.2, 24, 30.5, 30.75, 38.75, 30, 28.75, 30.5,
            23.5, 28.25, 22.25, 12.5, 14, 18.25, 22.75, 37.75, 52.5, 92,
            108, 85, 121, 77.5, 92.7, 98.6, 82, 97, 108, 84,
            131, 147, 184, 192,
        ],
    },
    {
        realName: 'Citigroup (Citibank)', codeName: 'Harbor Bank', sector: 'Banking', dividend: 0.035, beta: 1.2, vol: 0.15,
        description: 'One of the biggest banks in the country. Banks do well when loans are repaid, and badly when many loans go wrong at once.',
        prices: [
            10, 11, 14, 13, 17, 19, 20, 17, 22, 28,
            25, 30, 40, 50, 46, 30, 33, 33, 28, 24,
            23, 22, 25, 33, 40, 37, 48, 52, 35, 50,
            55, 25, 21, 43, 72, 80, 130, 200, 250, 248,
            418, 510, 505, 352, 485, 482, 485, 557, 294, 67,
            33, 47, 26.3, 39.6,
        ],
    },
    {
        realName: 'Sears', codeName: 'Titan Retail', sector: 'Retail', dividend: 0.035, beta: 1.0, vol: 0.14,
        description: 'A huge department store and mail-order catalog company. It does well when shoppers feel confident.',
        prices: [
            10, 11, 14, 13, 16, 18, 20, 18, 22, 24,
            25, 26, 32, 36, 28, 16, 21, 22, 15, 13,
            12, 10.5, 11, 18, 22, 20, 24, 24, 21, 25,
            24, 16, 24, 28, 33, 38, 45, 52, 55, 50,
            36, 41, 57, 29, 58, 67, 118, 172, 105, 40,
            85, 76, 33, 42,
        ],
    },
    {
        realName: 'Xerox', codeName: 'CopyMaster', sector: 'Tech', dividend: 0.015, beta: 1.3, vol: 0.2,
        description: 'The company behind the office copy machine. Its technology made it a star, but new technology can also replace it.',
        prices: [
            1, 1.6, 4, 4.5, 8, 12, 16, 18, 22, 22,
            24, 22, 27, 32, 26, 11, 11, 11, 9, 10,
            11.5, 11, 7.5, 7.5, 9, 7.5, 10, 11, 10.5, 10.5,
            10.5, 6.5, 12, 14, 16, 18, 24, 30, 42, 66,
            26, 5.2, 11.7, 9, 15.6, 19.2, 16.5, 19.2, 18.3, 9,
            9.6, 13, 9, 7.7,
        ],
    },
    {
        realName: 'Ford', codeName: 'NorthStar Motors', sector: 'Autos', dividend: 0.045, beta: 1.2, vol: 0.18,
        description: 'A big car maker. Fuel prices, interest rates, and how confident people feel about big purchases all matter.',
        prices: [
            4, 4.4, 5, 4.5, 5.2, 5.5, 5.5, 4, 5, 5.5,
            4.5, 5.5, 7, 7.5, 4.2, 3.6, 4.3, 6, 5.5, 5.2,
            4, 2.6, 2.3, 5, 7.5, 8, 10.5, 10.5, 14, 18.5,
            16, 10.5, 11, 16.5, 24, 21, 22, 25, 38, 46,
            42, 23, 15.7, 9.3, 16, 14.6, 7.7, 7.5, 6.7, 2.3,
            10, 16.8, 10.8, 12.95,
        ],
    },
    {
        realName: 'Exxon', codeName: 'Nova Energy', sector: 'Energy', dividend: 0.045, beta: 0.7, vol: 0.12,
        description: 'A giant oil company. It often rises when fuel prices rise, even if other stocks fall.',
        prices: [
            1.2, 1.1, 1.3, 1.5, 1.85, 2.2, 2.05, 1.75, 1.95, 2.2,
            1.85, 2.0, 2.3, 2.7, 3.0, 2.1, 2.8, 3.3, 2.9, 3.0,
            3.5, 5.1, 3.9, 3.75, 4.7, 5.6, 6.9, 8.8, 9.5, 11,
            12.5, 12.9, 15.2, 15.3, 15.8, 15.2, 20, 24.5, 30.6, 36.6,
            40.3, 43.5, 39.3, 35, 41, 51.3, 56.2, 76.6, 93.7, 80,
            68, 73, 85, 86.5,
        ],
    },
    {
        realName: 'Kodak', codeName: 'Snapshot Photo', sector: 'Consumer', dividend: 0.02, beta: 0.9, vol: 0.14,
        description: 'The leading maker of cameras and photo film. Almost every family buys its film, for now.',
        prices: [
            11, 12, 15, 14, 17, 19, 26, 36, 41, 44,
            42, 40, 54, 81, 72, 35, 57, 46, 27, 29,
            27, 36, 36, 43, 39, 37, 34, 46, 49, 45,
            41, 41.6, 48, 40.5, 56.25, 47.75, 67, 80.25, 60.6, 72,
            66.25, 39.4, 29.4, 35, 25.7, 32.2, 23.4, 25.8, 21.9, 6.6,
            4.2, 5.36, 0.65, 0.04,
        ],
    },
    {
        realName: 'General Electric', codeName: 'Volta Industries', sector: 'Industrial', dividend: 0.03, beta: 1.0, vol: 0.12,
        description: 'A giant maker of everything from light bulbs and fridges to jet engines and power plants.',
        prices: { 1959: 0.95, 1965: 1.1, 1968: 1.0, 1972: 1.6, 1974: 0.75, 1980: 1.1, 1982: 1.6, 1987: 3.6, 1990: 4.8, 1995: 12, 1999: 51, 2000: 48, 2002: 26, 2007: 37, 2008: 16, 2009: 15, 2012: 21 },
    },
    {
        realName: 'General Motors', codeName: 'Crown Motors', sector: 'Autos', dividend: 0.05, beta: 1.1, vol: 0.15, fate: 'bankrupt',
        description: 'The biggest car maker in the country, with a brand for every budget and a huge workforce.',
        prices: { 1959: 50, 1965: 100, 1970: 80, 1972: 80, 1974: 30, 1976: 78, 1980: 45, 1983: 74, 1987: 65, 1990: 34, 1992: 32, 1995: 52, 1999: 72, 2000: 51, 2002: 37, 2004: 40, 2005: 19, 2007: 25, 2008: 3.2, 2009: 0.5 },
    },
    {
        realName: 'Procter & Gamble', codeName: 'HomeGoods Co.', sector: 'Consumer', dividend: 0.03, beta: 0.6, vol: 0.09,
        description: 'Makes soap, toothpaste, laundry detergent, and other things families buy every week.',
        prices: { 1959: 0.6, 1965: 1.0, 1973: 3.0, 1974: 2.0, 1980: 2.3, 1985: 3.8, 1990: 11, 1995: 21, 1999: 55, 2000: 39, 2003: 50, 2007: 73, 2008: 62, 2009: 60, 2012: 68 },
    },
    {
        realName: 'Johnson & Johnson', codeName: 'CareWell', sector: 'Health', dividend: 0.025, beta: 0.6, vol: 0.09,
        description: 'Makes bandages, baby shampoo, and prescription medicines.',
        prices: { 1959: 0.4, 1965: 1.0, 1973: 4.2, 1974: 2.8, 1980: 3, 1985: 5, 1990: 9, 1995: 21, 1999: 47, 2000: 52, 2002: 54, 2007: 67, 2008: 60, 2012: 70 },
    },
    {
        realName: 'Walmart', codeName: 'ValueMart', sector: 'Retail', dividend: 0.01, beta: 0.8, vol: 0.15,
        description: 'A discount store chain that started in small towns and keeps opening new stores everywhere.',
        prices: { 1970: 0.025, 1971: 0.03, 1975: 0.05, 1980: 0.15, 1985: 1.3, 1990: 7.5, 1993: 13, 1995: 11, 1997: 20, 1999: 69, 2000: 53, 2002: 50, 2005: 47, 2007: 47, 2008: 56, 2012: 68 },
    },
    {
        realName: "McDonald's", codeName: 'QuickBite', sector: 'Consumer', dividend: 0.02, beta: 0.8, vol: 0.12,
        description: 'A fast-food burger chain that keeps opening restaurants in new towns and new countries.',
        prices: { 1965: 0.15, 1970: 1.0, 1973: 2.6, 1974: 1.1, 1975: 2.2, 1980: 1.9, 1985: 4.2, 1990: 8, 1995: 22, 1999: 40, 2002: 16, 2003: 25, 2007: 59, 2008: 62, 2012: 88 },
    },
    {
        realName: 'Disney', codeName: 'Dreamland Studios', sector: 'Media', dividend: 0.01, beta: 1.1, vol: 0.15,
        description: 'Makes cartoons and family movies, and runs famous theme parks.',
        prices: { 1959: 0.1, 1965: 0.3, 1970: 2.2, 1973: 4, 1974: 1.0, 1980: 2.0, 1984: 2.8, 1987: 6.5, 1990: 11, 1995: 20, 1997: 33, 2000: 29, 2002: 16, 2003: 23, 2007: 32, 2008: 23, 2009: 32, 2012: 50 },
    },
    {
        realName: 'Boeing', codeName: 'SkyWorks Aircraft', sector: 'Industrial', dividend: 0.025, beta: 1.1, vol: 0.18,
        description: 'Builds passenger jets and military aircraft. Orders boom and bust with the airline business.',
        prices: { 1959: 2.2, 1965: 4, 1967: 6.5, 1970: 1.5, 1974: 1.8, 1978: 9, 1980: 9, 1985: 13, 1987: 13, 1990: 23, 1995: 39, 1997: 49, 1998: 32, 2000: 66, 2002: 33, 2003: 42, 2007: 87, 2008: 43, 2009: 54, 2012: 75 },
    },
    {
        realName: 'Polaroid', codeName: 'InstaPic', sector: 'Tech', dividend: 0.01, beta: 1.3, vol: 0.22, fate: 'bankrupt',
        description: 'Makes cameras that print a finished photo in about a minute.',
        prices: { 1959: 40, 1962: 60, 1966: 100, 1972: 125, 1974: 15, 1980: 25, 1985: 35, 1988: 40, 1990: 25, 1995: 47, 1997: 49, 1999: 19, 2000: 6, 2001: 0.05 },
    },
    {
        realName: 'Pan Am', codeName: 'Globe Airways', sector: 'Travel', dividend: 0.01, beta: 1.3, vol: 0.25, fate: 'bankrupt',
        description: 'A famous airline flying passengers across oceans to dozens of countries.',
        prices: { 1959: 25, 1964: 30, 1967: 35, 1969: 20, 1970: 12, 1974: 3, 1977: 6, 1980: 5, 1985: 7, 1988: 3, 1990: 1, 1991: 0.05 },
    },
    {
        realName: 'Intel', codeName: 'ChipForge', sector: 'Tech', dividend: 0.01, beta: 1.4, vol: 0.25,
        description: 'Makes the tiny chips that act as the brains of computers.',
        prices: { 1971: 0.15, 1972: 0.25, 1973: 0.4, 1974: 0.25, 1978: 0.4, 1980: 0.55, 1983: 1.2, 1985: 0.75, 1987: 1.2, 1990: 1.1, 1995: 7, 1997: 19, 1999: 41, 2000: 30, 2002: 16, 2003: 32, 2007: 27, 2008: 15, 2009: 20, 2012: 21 },
    },
    {
        realName: 'Apple', codeName: 'Orchard Computers', sector: 'Tech', dividend: 0, beta: 1.4, vol: 0.3,
        description: 'Makes personal computers designed to be easy for anyone to use.',
        prices: { 1980: 0.1, 1982: 0.12, 1983: 0.1, 1985: 0.08, 1987: 0.3, 1989: 0.27, 1991: 0.43, 1992: 0.47, 1993: 0.24, 1995: 0.29, 1997: 0.12, 1998: 0.36, 1999: 0.92, 2000: 0.27, 2002: 0.25, 2003: 0.38, 2005: 2.6, 2007: 7.1, 2008: 3.0, 2009: 7.5, 2010: 11.5, 2011: 14.5, 2012: 19 },
    },
    {
        realName: 'Microsoft', codeName: 'Keystone Software', sector: 'Tech', dividend: 0.01, beta: 1.2, vol: 0.25,
        description: 'Writes the software that runs most personal computers.',
        prices: { 1986: 0.1, 1987: 0.25, 1988: 0.24, 1989: 0.4, 1990: 0.6, 1992: 1.1, 1993: 1.0, 1994: 1.5, 1995: 4.4, 1996: 8, 1997: 16, 1998: 35, 1999: 58, 2000: 22, 2002: 26, 2003: 27, 2007: 36, 2008: 19, 2009: 30, 2012: 27 },
    },
    {
        realName: 'Home Depot', codeName: 'BuildRight Stores', sector: 'Retail', dividend: 0.01, beta: 1.1, vol: 0.2,
        description: 'Giant warehouse stores selling tools, lumber, and supplies for home projects.',
        prices: { 1981: 0.15, 1983: 0.9, 1985: 0.5, 1987: 1.0, 1990: 3, 1995: 10, 1997: 20, 1999: 69, 2000: 46, 2002: 24, 2003: 35, 2007: 27, 2008: 23, 2009: 29, 2012: 62 },
    },
    {
        realName: 'Nike', codeName: 'Stride Athletics', sector: 'Consumer', dividend: 0.01, beta: 1.0, vol: 0.2,
        description: 'Designs running shoes and sportswear, advertised by star athletes.',
        prices: { 1980: 0.4, 1985: 0.4, 1987: 0.6, 1990: 2.3, 1993: 2.2, 1995: 4.3, 1996: 7.5, 1997: 4.9, 1999: 6.2, 2000: 7, 2002: 11, 2003: 17, 2007: 32, 2008: 25, 2009: 33, 2012: 52 },
    },
    {
        realName: 'Enron', codeName: 'Meridian Energy', sector: 'Energy', dividend: 0.03, beta: 1.0, vol: 0.15, fate: 'bankrupt',
        description: 'A fast-growing energy trading company that Wall Street loves.',
        prices: { 1986: 7, 1990: 7, 1993: 14.5, 1995: 19, 1997: 21, 1998: 29, 1999: 44, 2000: 83, 2001: 0.3 },
    },
    {
        realName: 'Merck', codeName: 'Remedy Labs', sector: 'Health', dividend: 0.03, beta: 0.7, vol: 0.12,
        description: 'Researches and sells prescription medicines and vaccines.',
        prices: { 1959: 0.6, 1965: 1.2, 1970: 2.2, 1973: 3.5, 1974: 2.5, 1980: 2.7, 1985: 5, 1987: 10, 1990: 15, 1992: 22, 1995: 33, 1998: 74, 2000: 94, 2003: 46, 2004: 32, 2007: 58, 2008: 30, 2009: 36, 2012: 41 },
    },
    {
        realName: 'Pfizer', codeName: 'Vital Pharma', sector: 'Health', dividend: 0.03, beta: 0.7, vol: 0.12,
        description: 'A large maker of medicines, from antibiotics to heart drugs.',
        prices: { 1959: 0.3, 1965: 0.5, 1970: 1.0, 1973: 1.3, 1974: 0.9, 1980: 1.1, 1985: 1.7, 1987: 2, 1990: 3.1, 1995: 8, 1998: 42, 1999: 32, 2000: 46, 2003: 35, 2007: 23, 2008: 18, 2009: 18, 2012: 25 },
    },
    {
        realName: '3M', codeName: 'Adhesa Corp', sector: 'Industrial', dividend: 0.025, beta: 0.9, vol: 0.1,
        description: 'Makes tape, sandpaper, sticky notes, and thousands of other inventions for homes and factories.',
        prices: { 1959: 3, 1965: 5, 1970: 7, 1973: 11, 1974: 6, 1980: 7, 1985: 11, 1987: 16, 1990: 21, 1995: 33, 1999: 49, 2000: 60, 2003: 85, 2007: 84, 2008: 58, 2009: 83, 2012: 93 },
    },
    {
        realName: 'Caterpillar', codeName: 'Yellow Iron Co.', sector: 'Industrial', dividend: 0.03, beta: 1.2, vol: 0.15,
        description: 'Builds bulldozers, tractors, and heavy machines for construction and mining.',
        prices: { 1959: 5, 1965: 8, 1970: 8, 1973: 12, 1974: 9, 1975: 13, 1980: 15, 1982: 9, 1985: 10, 1987: 15, 1990: 12, 1992: 13, 1995: 29, 1997: 48, 1999: 47, 2000: 47, 2003: 41, 2007: 72, 2008: 45, 2009: 57, 2012: 90 },
    },
    {
        realName: 'DuPont', codeName: 'Polymer Chemical', sector: 'Industrial', dividend: 0.04, beta: 1.0, vol: 0.1,
        description: 'A chemical company that invented many of the plastics and fabrics people use every day.',
        prices: { 1959: 13, 1965: 12, 1970: 7, 1973: 10, 1974: 6, 1980: 8, 1985: 12, 1987: 15, 1990: 18, 1995: 35, 1997: 60, 1998: 53, 2000: 48, 2003: 46, 2007: 44, 2008: 25, 2009: 34, 2012: 45 },
    },
    {
        realName: 'Bethlehem Steel', codeName: 'Forge Steel', sector: 'Industrial', dividend: 0.04, beta: 1.2, vol: 0.2, fate: 'bankrupt',
        description: 'One of the biggest steel makers in the country, supplying bridges, ships, and skyscrapers.',
        prices: { 1959: 50, 1965: 35, 1970: 25, 1973: 30, 1974: 25, 1977: 20, 1980: 22, 1982: 15, 1986: 5, 1988: 20, 1990: 15, 1995: 14, 1998: 8, 2000: 2, 2001: 0.1 },
    },
    {
        realName: 'Chrysler', codeName: 'Liberty Motors', sector: 'Autos', dividend: 0.03, beta: 1.4, vol: 0.25, fate: 'acquired',
        description: 'The third-biggest car maker, known for close calls and big comebacks.',
        prices: { 1959: 60, 1962: 25, 1965: 50, 1968: 60, 1970: 25, 1974: 8, 1979: 6, 1980: 4, 1982: 15, 1983: 27, 1987: 23, 1990: 13, 1992: 30, 1995: 55, 1997: 35, 1998: 55 },
    },
    {
        realName: 'Texas Instruments', codeName: 'Circuit Instruments', sector: 'Tech', dividend: 0.015, beta: 1.3, vol: 0.2,
        description: 'Makes electronic chips, and was one of the first to sell pocket calculators.',
        prices: { 1959: 6, 1960: 9, 1962: 4, 1965: 7, 1970: 8, 1973: 9, 1974: 6, 1980: 11, 1985: 9, 1987: 10, 1990: 9, 1995: 13, 1997: 22, 1999: 48, 2000: 47, 2003: 29, 2007: 33, 2008: 16, 2009: 26, 2012: 31 },
    },
    {
        realName: 'Hewlett-Packard', codeName: 'Garage Electronics', sector: 'Tech', dividend: 0.01, beta: 1.2, vol: 0.18,
        description: 'Makes electronic test equipment and calculators, and later printers and personal computers.',
        prices: { 1959: 0.6, 1965: 1.2, 1970: 2.5, 1973: 4, 1974: 2.5, 1980: 6, 1985: 9, 1987: 13, 1990: 7, 1995: 20, 1997: 30, 1999: 54, 2000: 32, 2002: 17, 2003: 23, 2007: 50, 2008: 36, 2009: 51, 2010: 42, 2012: 14 },
    },
    {
        realName: 'Philip Morris', codeName: 'Burley Tobacco Co.', sector: 'Consumer', dividend: 0.045, beta: 0.7, vol: 0.12,
        description: 'Sells the best-selling cigarettes in the world, along with a growing list of food brands.',
        prices: { 1959: 0.1, 1965: 0.15, 1970: 0.4, 1973: 0.8, 1974: 0.6, 1980: 1, 1985: 2.5, 1990: 10, 1992: 16, 1993: 11, 1995: 18, 1998: 25, 1999: 13, 2000: 25, 2003: 30, 2007: 45, 2008: 37, 2009: 48, 2012: 70 },
    },
    {
        realName: 'Gillette', codeName: 'KeenEdge', sector: 'Consumer', dividend: 0.025, beta: 0.8, vol: 0.12, fate: 'acquired',
        description: 'Makes razors and blades used by millions of people every morning.',
        prices: { 1959: 1, 1965: 1.5, 1970: 1.3, 1973: 1.5, 1974: 0.8, 1980: 1, 1985: 2.5, 1987: 4, 1990: 7.5, 1995: 13, 1998: 23, 1999: 20, 2000: 18, 2002: 15, 2004: 22 },
    },
    {
        realName: 'Kmart', codeName: 'BargainWay', sector: 'Retail', dividend: 0.03, beta: 1.0, vol: 0.18, fate: 'bankrupt',
        description: 'A chain of discount department stores found in almost every suburb.',
        prices: { 1959: 0.5, 1965: 1.2, 1970: 4, 1972: 7, 1974: 3, 1980: 3.2, 1985: 5.5, 1987: 4.8, 1990: 6, 1992: 8, 1994: 4.5, 1995: 2.5, 1998: 5, 1999: 3.4, 2000: 1.8, 2001: 1.9, 2002: 0.05 },
    },
    {
        realName: 'Digital Equipment Corp.', codeName: 'MiniByte Computers', sector: 'Tech', dividend: 0, beta: 1.4, vol: 0.25, fate: 'acquired',
        description: 'Makes smaller, cheaper computers for labs, schools, and offices.',
        prices: { 1966: 2, 1970: 10, 1972: 15, 1974: 6, 1980: 15, 1982: 13, 1985: 20, 1987: 33, 1990: 9.5, 1992: 5.5, 1994: 5.5, 1995: 10, 1996: 6, 1997: 6 },
    },
    {
        realName: 'Wang Laboratories', codeName: 'WordStation Labs', sector: 'Tech', dividend: 0.01, beta: 1.5, vol: 0.3, fate: 'bankrupt',
        description: 'Makes word-processing machines and office computers.',
        prices: { 1967: 1, 1970: 2, 1974: 1, 1980: 6, 1982: 10, 1984: 9, 1985: 6, 1987: 4, 1989: 2, 1991: 0.8, 1992: 0.02 },
    },
    {
        realName: 'Lehman Brothers', codeName: 'Lantern Brothers', sector: 'Banking', dividend: 0.01, beta: 1.6, vol: 0.2, fate: 'bankrupt',
        description: 'A big Wall Street investment bank that borrows heavily to make large bets.',
        prices: { 1994: 7, 1995: 10, 1997: 12, 1998: 11, 1999: 21, 2000: 34, 2002: 27, 2003: 39, 2005: 64, 2006: 78, 2007: 65, 2008: 0.01 },
    },
    {
        realName: 'Amazon', codeName: 'RiverMarket Online', sector: 'Retail', dividend: 0, beta: 1.5, vol: 0.35,
        description: 'Sells books over the internet, and wants to sell almost everything else too.',
        prices: { 1997: 0.15, 1998: 1.3, 1999: 3.8, 2000: 0.78, 2001: 0.54, 2002: 0.94, 2003: 2.6, 2004: 2.2, 2005: 2.4, 2006: 2.0, 2007: 4.6, 2008: 2.6, 2009: 6.7, 2010: 9, 2011: 8.7, 2012: 12.5 },
    },
    {
        realName: 'Cisco', codeName: 'NetBridge Systems', sector: 'Tech', dividend: 0, beta: 1.4, vol: 0.25,
        description: 'Makes the equipment that links computers into networks and the internet.',
        prices: { 1990: 0.12, 1991: 0.35, 1992: 0.6, 1993: 0.85, 1994: 0.75, 1995: 1.6, 1996: 2.8, 1997: 3.7, 1998: 11.6, 1999: 26.8, 2000: 19, 2001: 18, 2002: 13, 2003: 24, 2004: 19, 2005: 17, 2006: 27, 2007: 27, 2008: 16, 2009: 24, 2010: 20, 2011: 18, 2012: 19.6 },
    },
    {
        realName: 'Dell', codeName: 'DirectPC', sector: 'Tech', dividend: 0, beta: 1.4, vol: 0.3,
        description: 'Sells personal computers straight to customers by phone and online.',
        prices: { 1988: 0.15, 1990: 0.2, 1992: 0.7, 1993: 0.35, 1994: 0.6, 1995: 1.1, 1996: 3.3, 1997: 10.5, 1998: 36.6, 1999: 51, 2000: 17.4, 2001: 27, 2002: 27, 2003: 34, 2004: 42, 2005: 30, 2006: 25, 2007: 24.5, 2008: 10.2, 2009: 14.4, 2010: 13.5, 2011: 14.6, 2012: 10.1 },
    },
    {
        realName: 'Yahoo', codeName: 'Portal One', sector: 'Tech', dividend: 0, beta: 1.6, vol: 0.35,
        description: 'A popular website for searching, news, and free email.',
        prices: { 1996: 1.4, 1997: 4.3, 1998: 29, 1999: 108, 2000: 15, 2001: 8.9, 2002: 8.2, 2003: 22.5, 2004: 37.7, 2005: 39, 2006: 25.5, 2007: 23, 2008: 12.2, 2009: 16.8, 2010: 16.6, 2011: 16.1, 2012: 19.9 },
    },
    {
        realName: 'Compaq', codeName: 'PortaCom', sector: 'Tech', dividend: 0, beta: 1.5, vol: 0.3, fate: 'acquired',
        description: 'Makes portable and desktop personal computers that compete with the biggest names.',
        prices: { 1983: 0.5, 1985: 0.6, 1987: 2, 1990: 3.5, 1991: 1.8, 1992: 3, 1994: 4.4, 1996: 8, 1997: 18.8, 1998: 42, 1999: 27, 2000: 15, 2001: 9.8 },
    },
    {
        realName: 'Starbucks', codeName: 'Roastery Coffee', sector: 'Consumer', dividend: 0, beta: 1.1, vol: 0.25,
        description: 'A chain of coffee shops opening new stores in nearly every city.',
        prices: { 1992: 0.6, 1993: 1, 1995: 1.3, 1996: 1.8, 1997: 2.4, 1998: 3.5, 1999: 3.0, 2000: 5.5, 2001: 4.8, 2002: 5.1, 2003: 8.3, 2004: 15.6, 2005: 15, 2006: 17.7, 2007: 10.2, 2008: 4.7, 2009: 11.5, 2010: 16, 2011: 23, 2012: 26.8 },
    },
    {
        realName: 'Lucent Technologies', codeName: 'Signal Networks', sector: 'Tech', dividend: 0.01, beta: 1.5, vol: 0.3, fate: 'acquired',
        description: 'Makes telephone and internet network equipment for phone companies.',
        prices: { 1996: 10, 1997: 20, 1998: 55, 1999: 75, 2000: 13.5, 2001: 6.3, 2002: 1.3, 2003: 2.8, 2004: 3.8, 2005: 2.7, 2006: 2.8 },
    },
    {
        realName: 'Blockbuster', codeName: 'ReelTime Video', sector: 'Media', dividend: 0.01, beta: 1.0, vol: 0.3, fate: 'bankrupt',
        description: 'Rents movies and video games from stores in almost every neighborhood.',
        prices: { 1999: 13.5, 2000: 8.4, 2001: 25, 2002: 12, 2003: 18, 2004: 9.5, 2005: 3.7, 2006: 5.3, 2007: 3.9, 2008: 1.3, 2009: 0.67, 2010: 0.02 },
    },
    {
        realName: 'Halliburton', codeName: 'DrillCo Services', sector: 'Energy', dividend: 0.02, beta: 1.2, vol: 0.2,
        description: 'Drills wells and provides oilfield services to energy companies.',
        prices: { 1959: 1.5, 1965: 2, 1970: 4, 1973: 8, 1974: 8, 1975: 9, 1978: 11, 1979: 16, 1980: 20, 1981: 18, 1982: 9, 1986: 4.5, 1987: 6, 1990: 10, 1994: 8, 1995: 12, 1997: 30, 1998: 15, 1999: 20, 2000: 18, 2002: 9, 2003: 13, 2005: 31, 2006: 31, 2007: 38, 2008: 18, 2009: 30, 2012: 35 },
    },
    {
        realName: 'American Airlines', codeName: 'Eagle Air', sector: 'Travel', dividend: 0.01, beta: 1.4, vol: 0.25, fate: 'bankrupt',
        description: 'One of the largest airlines in the country. Fuel prices and the economy decide its good and bad years.',
        prices: { 1959: 15, 1965: 30, 1967: 40, 1970: 12, 1974: 4, 1978: 10, 1980: 9, 1982: 20, 1985: 30, 1987: 25, 1989: 60, 1990: 30, 1992: 40, 1994: 27, 1997: 64, 1998: 59, 1999: 67, 2000: 39, 2001: 22, 2002: 6.6, 2003: 13, 2004: 11, 2005: 22, 2006: 30, 2007: 14, 2008: 10.7, 2009: 7.7, 2010: 7.8, 2011: 0.35 },
    },
    {
        realName: 'Penn Central (Pennsylvania Railroad)', codeName: 'Junction Rail', sector: 'Travel', dividend: 0.03, beta: 1.1, vol: 0.18, fate: 'bankrupt',
        description: 'One of the biggest railroads in the country, carrying freight and passengers.',
        prices: { 1959: 16, 1960: 12, 1962: 12, 1965: 35, 1966: 32, 1968: 70, 1969: 30, 1970: 4 },
    },
    {
        realName: 'Zenith Electronics', codeName: 'Vista Electronics', sector: 'Tech', dividend: 0.01, beta: 1.3, vol: 0.25, fate: 'bankrupt',
        description: 'Makes televisions and radios for American living rooms.',
        prices: { 1959: 10, 1965: 30, 1966: 40, 1970: 25, 1973: 30, 1974: 6, 1976: 15, 1980: 10, 1985: 15, 1987: 25, 1990: 5, 1993: 8, 1995: 3, 1997: 6, 1998: 1, 1999: 0.05 },
    },
    {
        realName: 'Avon', codeName: 'Doorbell Beauty', sector: 'Consumer', dividend: 0.035, beta: 0.9, vol: 0.15,
        description: 'Sells makeup and perfume through sales reps who visit customers at home.',
        prices: { 1959: 3, 1965: 8, 1970: 18, 1972: 34, 1974: 6, 1980: 10, 1985: 6.5, 1987: 6, 1990: 8, 1995: 9, 1999: 16.5, 2000: 24, 2003: 34, 2004: 39, 2005: 28, 2007: 39, 2008: 24, 2009: 31, 2012: 14.4 },
    },
    {
        realName: 'PepsiCo', codeName: 'FizzSnack Co.', sector: 'Consumer', dividend: 0.025, beta: 0.7, vol: 0.1,
        description: 'Sells soft drinks and salty snack chips around the world.',
        prices: { 1959: 0.3, 1965: 0.6, 1970: 1.0, 1973: 1.6, 1974: 0.9, 1980: 1.6, 1985: 3.6, 1987: 5.6, 1990: 13, 1995: 28, 1998: 41, 1999: 35, 2000: 50, 2002: 42, 2003: 47, 2007: 76, 2008: 55, 2009: 61, 2012: 68 },
    },
    {
        realName: 'Berkshire Hathaway', codeName: 'Prairie Holdings', sector: 'Banking', dividend: 0, beta: 0.8, vol: 0.15,
        description: 'A struggling textile mill that a careful investor is turning into a company that buys other companies.',
        prices: { 1965: 0.013, 1970: 0.027, 1973: 0.054, 1974: 0.027, 1975: 0.025, 1980: 0.25, 1985: 1.73, 1987: 1.95, 1990: 4.42, 1995: 21.5, 1998: 46.7, 1999: 37.6, 2000: 47.3, 2002: 48.5, 2003: 56.3, 2007: 94.7, 2008: 64.4, 2009: 66, 2012: 89.4 },
    },
    {
        realName: 'Chevron', codeName: 'Pacific Oil', sector: 'Energy', dividend: 0.04, beta: 0.8, vol: 0.12,
        description: 'A large oil company that drills for oil, refines it, and runs gas stations.',
        prices: { 1959: 2.5, 1965: 3.5, 1970: 4.5, 1973: 6, 1974: 4, 1980: 13, 1982: 7.5, 1985: 9.5, 1987: 10, 1990: 18, 1995: 26, 1997: 38, 1999: 43, 2000: 42, 2002: 33, 2003: 43, 2005: 57, 2007: 93, 2008: 74, 2009: 77, 2012: 108 },
    },
    {
        realName: 'Wells Fargo', codeName: 'Frontier Bank', sector: 'Banking', dividend: 0.035, beta: 1.1, vol: 0.15,
        description: 'A large bank that grew from the West Coast to branches across the country.',
        prices: { 1959: 0.3, 1965: 0.5, 1970: 0.6, 1973: 0.9, 1974: 0.6, 1980: 0.9, 1985: 2.3, 1987: 2.2, 1990: 3.0, 1991: 2.6, 1995: 11, 1997: 17, 1999: 20, 2000: 28, 2003: 29, 2007: 30, 2008: 29, 2009: 27, 2012: 34 },
    },
];

function noise(key: number, year: number) {
    let t = (key * 2654435761 + year * 40503) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5) * 2;
}

function expand(def: CompanyDef, key: number): Array<number | null> {
    const out: Array<number | null> = Array(LAST_YEAR - BASE_YEAR + 1).fill(null);
    if (Array.isArray(def.prices)) {
        def.prices.forEach((price, at) => { out[at] = price; });
        return out;
    }
    const known = def.prices;
    const years = Object.keys(known).map(Number).sort((a, b) => a - b);
    out[years[0] - BASE_YEAR] = known[years[0]];
    for (let k = 0; k < years.length - 1; k += 1) {
        const from = years[k];
        const to = years[k + 1];
        const moves: number[] = [];
        for (let year = from + 1; year <= to; year += 1) {
            moves.push(def.beta * Math.log(1 + INDEX_RETURNS[year - FIRST_YEAR]) + def.vol * noise(key, year));
        }
        const fix = (Math.log(known[to] / known[from]) - moves.reduce((sum, move) => sum + move, 0)) / moves.length;
        let level = Math.log(known[from]);
        moves.forEach((move, step) => {
            level += move + fix;
            out[from + 1 + step - BASE_YEAR] = Math.exp(level);
        });
    }
    const last = years[years.length - 1];
    if (def.fate === 'bankrupt') for (let year = last + 1; year <= LAST_YEAR; year += 1) out[year - BASE_YEAR] = known[last];
    return out;
}

function listedRange(def: CompanyDef) {
    if (Array.isArray(def.prices)) return { firstYear: BASE_YEAR, lastYear: BASE_YEAR + def.prices.length - 1 };
    const years = Object.keys(def.prices).map(Number);
    return { firstYear: Math.min(...years), lastYear: Math.max(...years) };
}

export const COMPANIES: Company[] = DEFS.map((def, key) => ({ ...def, key, ...listedRange(def), prices: expand(def, key) }));

export function companyPrice(company: Company, year: number) {
    return company.prices[year - BASE_YEAR] ?? null;
}
