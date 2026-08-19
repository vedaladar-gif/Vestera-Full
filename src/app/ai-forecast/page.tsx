'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './aiForecast.module.css';
import StockSearch from '@/components/AIForecast/StockSearch';
import StockHeader from '@/components/AIForecast/StockHeader';
import IntegrationBar from '@/components/AIForecast/IntegrationBar';
import OutlookCard from '@/components/AIForecast/OutlookCard';
import PriceChart from '@/components/AIForecast/PriceChart';
import HorizonForecastSection from '@/components/AIForecast/HorizonForecastSection';
import ScenarioCard from '@/components/AIForecast/ScenarioCard';
import WhyAI from '@/components/AIForecast/WhyAI';
import RiskAnalysis from '@/components/AIForecast/RiskAnalysis';
import ModelPerformance from '@/components/AIForecast/ModelPerformance';
import AISummary from '@/components/AIForecast/AISummary';
import LoadingState from '@/components/AIForecast/LoadingState';
import PredictAISection from '@/components/AIForecast/PredictAI/PredictAISection';
import TodayForecastCard from '@/components/AIForecast/PredictAI/TodayForecastCard';
import { usePredictAI } from '@/components/AIForecast/PredictAI/usePredictAI';
import type { AnalysisResponse } from '@/components/AIForecast/types';

const REFRESH_MS = 90_000;

function AIForecastInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const symbol = searchParams.get('symbol')?.toUpperCase() || null;

    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const { data: predictAIData, error: predictAIError } = usePredictAI(symbol);

    const load = useCallback(async (sym: string, silent = false) => {
        if (!silent) { setLoading(true); setError(null); setErrorDetail(null); }
        try {
            const res = await fetch(`/api/ai-forecast/${encodeURIComponent(sym)}`);
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || 'Unable to retrieve current market data. Please try again.');
                setErrorDetail(json.reason || null);
                if (!silent) setData(null);
                return;
            }
            setData(json);
            setError(null);
        } catch {
            setError('Unable to retrieve current market data. Please try again.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!symbol) { setData(null); return; }
        void load(symbol);
        const id = setInterval(() => void load(symbol, true), REFRESH_MS);
        return () => clearInterval(id);
    }, [symbol, load]);

    const selectSymbol = (sym: string) => {
        router.push(`/ai-forecast?symbol=${sym}`);
    };

    return (
        <div className={styles.page}>
            <div className={styles.inner}>
                <div className={styles.hero}>
                    <h1 className={styles.heroTitle}>AI Forecast</h1>
                    <p className={styles.heroSubtitle}>
                        Vestera&apos;s quantitative research terminal — live market data + a transparent AI/ML-driven outlook model.
                    </p>
                    <StockSearch onSelect={selectSymbol} />
                </div>

                {!symbol && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📊</div>
                        <div className={styles.emptyTitle}>Search a stock to get started</div>
                        <div className={styles.emptyText}>Try AAPL, NVDA, TSLA, MSFT, or SPY.</div>
                    </div>
                )}

                {symbol && loading && <LoadingState />}

                {symbol && !loading && error && (
                    <div className={styles.errorCard}>
                        <div>{error}</div>
                        {errorDetail && <div className={styles.errorSub}>{errorDetail}</div>}
                        <button className={styles.retryBtn} onClick={() => void load(symbol)}>Try again</button>
                    </div>
                )}

                {symbol && !loading && !error && data && (
                    <>
                        <StockHeader quote={data.quote} dataUpdatedAt={data.dataUpdatedAt} />
                        <IntegrationBar
                            symbol={data.symbol}
                            authenticated={!!data.userContext?.authenticated}
                            ownsPosition={data.userContext?.ownsPosition}
                            shares={data.userContext?.shares}
                        />
                        <OutlookCard
                            category={data.outlook.category}
                            compositeScore={data.outlook.compositeScore}
                            confidence={data.outlook.confidence}
                            price={data.quote.price}
                        />
                        {predictAIData && (
                            <TodayForecastCard
                                forecast={predictAIData.todayForecast}
                                symbol={predictAIData.symbol}
                                modelVersion={predictAIData.modelVersion}
                            />
                        )}
                        <PriceChart symbol={data.symbol} />
                        <HorizonForecastSection
                            title="Short-Term Forecast"
                            subtitle="1 Day, 1 Week, and 1 Month outlook from the model"
                            horizons={data.shortTerm}
                        />
                        <HorizonForecastSection
                            title="Long-Term Forecast"
                            subtitle="3 Months to 3 Years — ranges widen and confidence decreases with uncertainty"
                            horizons={data.longTerm}
                        />
                        <ScenarioCard scenarios={data.scenarios} />
                        <WhyAI positive={data.factors.positive} negative={data.factors.negative} />
                        <RiskAnalysis risk={data.risk} />
                        <ModelPerformance symbol={data.symbol} />
                        <AISummary summary={data.summary} />

                        <PredictAISection symbol={data.symbol} data={predictAIData} error={predictAIError} />

                        <p className={styles.disclaimer}>
                            AI forecasts are estimates generated from historical and current market data and are not guaranteed.
                            Forecasts can be wrong, especially during unexpected market events. This feature is for educational
                            purposes only and is not financial advice.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AIForecastPage() {
    return (
        <Suspense fallback={<div className={styles.page} />}>
            <AIForecastInner />
        </Suspense>
    );
}
