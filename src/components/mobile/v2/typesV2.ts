export type AssetType = 'KR' | 'US' | 'INDEX' | 'FX';

export interface MarketAsset {
    id: string | number;
    type: AssetType;
    name: string;
    ticker: string;
    currentPrice: number;
    changeAmount: number;
    changeRate: number; // Percentage
}

export const INITIAL_STOCKS: MarketAsset[] = [
    { id: 'kr-1', type: 'KR', name: 'KODEX 미국배당커버드콜액티브', ticker: '476830', currentPrice: 12770, changeAmount: 85, changeRate: 0.67 },
    { id: 'us-1', type: 'US', name: 'Apple Inc.', ticker: 'AAPL', currentPrice: 182.52, changeAmount: 1.2, changeRate: 0.66 },
    { id: 'kr-2', type: 'KR', name: 'SOL 미국배당다우존스', ticker: '446720', currentPrice: 13085, changeAmount: 25, changeRate: 0.19 },
    { id: 'us-2', type: 'US', name: 'NVIDIA Corporation', ticker: 'NVDA', currentPrice: 880.08, changeAmount: 25.1, changeRate: 2.94 },
    { id: 'idx-1', type: 'INDEX', name: 'S&P 500', ticker: '^SPX', currentPrice: 5123.69, changeAmount: 15.2, changeRate: 0.30 },
    { id: 'us-3', type: 'US', name: 'Tesla, Inc.', ticker: 'TSLA', currentPrice: 175.22, changeAmount: -1.5, changeRate: -0.85 },
    { id: 'fx-1', type: 'FX', name: 'USD/KRW', ticker: 'USDKRW=X', currentPrice: 1335.50, changeAmount: 2.5, changeRate: 0.19 },
    { id: 'kr-3', type: 'KR', name: '삼성전자', ticker: '005930', currentPrice: 73000, changeAmount: 500, changeRate: 0.69 },
];
