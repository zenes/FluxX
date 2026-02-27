'use client';

import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DUMMY_NEWS = [
    {
        id: 1,
        title: "코스피, 외인·기관 매수에 2600선 탈환 시도... 반도체 강세",
        source: "연합뉴스",
        time: "10분 전",
        category: "증시",
        image: "https://images.unsplash.com/photo-1611974717414-0437feaf9baa?w=400&q=80"
    },
    {
        id: 2,
        title: "비트코인, 사상 최고가 경신 후 숨고르기... 1억원 유지",
        source: "경제데일리",
        time: "35분 전",
        category: "가상자산",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80"
    },
    {
        id: 3,
        title: "삼성전자, 4분기 실적 발표 임박... '어닝 서프라이즈' 기대감",
        source: "금융인사이트",
        time: "1시간 전",
        category: "기업",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80"
    }
];

export default function NewsSectionV2() {
    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-black text-[#2B364B] dark:text-white tracking-tight flex items-center gap-2">
                    <span className="bg-[#FF821D] text-white text-[10px] px-2 py-0.5 rounded-md uppercase tracking-widest">Hot</span>
                    최신 투자 뉴스
                </h3>
                <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600 flex items-center gap-1">
                    전체보기 <ExternalLink className="size-3" />
                </button>
            </div>

            <div className="bg-white dark:bg-[#1A1A1E] rounded-[32px] overflow-hidden shadow-sm border border-zinc-100 dark:border-white/5">
                <div className="divide-y divide-zinc-50 dark:divide-white/5">
                    {DUMMY_NEWS.map((news) => (
                        <div key={news.id} className="p-5 active:bg-zinc-50 dark:active:bg-white/5 transition-colors cursor-pointer flex gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-[#38C798] uppercase tracking-widest">{news.category}</span>
                                    <span className="size-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                                        <Clock className="size-3" /> {news.time}
                                    </div>
                                </div>
                                <h4 className="text-[14px] font-bold text-[#2B364B] dark:text-white leading-snug line-clamp-2">
                                    {news.title}
                                </h4>
                                <p className="text-[11px] text-zinc-400 font-medium">
                                    {news.source}
                                </p>
                            </div>
                            <div className="size-20 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-white/5">
                                <img
                                    src={news.image}
                                    alt={news.title}
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <button className="w-full py-4 text-sm font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-black/20 hover:text-[#38C798] transition-colors">
                    더 많은 뉴스 읽기
                </button>
            </div>
        </div>
    );
}
