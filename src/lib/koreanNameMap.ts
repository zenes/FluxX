// Fallback dictionary for Korean stock names
// Used when yahoo-finance2 returns English names for Korean stocks or popular US stocks.

export const koreanNameMap: Record<string, string> = {
    // Top US Tech Stocks
    'AAPL': '애플',
    'MSFT': '마이크로소프트',
    'GOOGL': '알파벳 A',
    'GOOG': '알파벳 C',
    'AMZN': '아마존닷컴',
    'NVDA': '엔비디아',
    'TSLA': '테슬라',
    'META': '메타 플랫폼스',

    // Top KR Stocks
    '005930.KS': '삼성전자',
    '000660.KS': 'SK하이닉스',
    '373220.KS': 'LG에너지솔루션',
    '207940.KS': '삼성바이오로직스',
    '005380.KS': '현대차',
    '000270.KS': '기아',
    '068270.KS': '셀트리온',
    '051910.KS': 'LG화학',
    '005490.KS': 'POSCO홀딩스',
    '035420.KS': 'NAVER',
    '035720.KS': '카카오',

    // Popular Korean ETFs
    '446720.KS': 'SOL 미국배당다우존스',
    '476830.KS': 'KODEX 미국배당커버드콜',
    '305080.KS': 'TIGER 미국배당다우존스',
};
