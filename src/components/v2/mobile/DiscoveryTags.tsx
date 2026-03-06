'use client';

import React from 'react';
import { cn } from '@/lib/utils';

import { Mail, Coffee, ShoppingBag, Newspaper, Sparkles, Globe } from 'lucide-react';

const TAGS = [
    { id: 'all', label: '전체', icon: <Sparkles className="size-5" /> },
    { id: 'trending', label: '인기', icon: <Coffee className="size-5" /> },
    { id: 'dividend', label: '고배당', icon: <ShoppingBag className="size-5" /> },
    { id: 'tech', label: '기술주', icon: <Newspaper className="size-5" /> },
    { id: 'crypto', label: '메일', icon: <Mail className="size-5" /> },
    { id: 'gold', label: '뉴스', icon: <Globe className="size-5" /> },
];

interface DiscoveryTagsProps {
    activeTag: string;
    onTagChange: (id: string) => void;
}

export default function DiscoveryTags({ activeTag, onTagChange }: DiscoveryTagsProps) {
    return (
        <div className="flex gap-6 overflow-x-auto hide-scrollbar px-2 py-2">
            {TAGS.map((tag, index) => {
                const isActive = activeTag === tag.id;
                return (
                    <button
                        key={tag.id}
                        onClick={() => onTagChange(tag.id)}
                        className={cn(
                            "flex flex-col items-center gap-1.5 shrink-0 transition-all active:scale-90",
                            isActive ? "text-[#38C798]" : "text-[#313131] dark:text-white/60"
                        )}
                    >
                        <div className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            isActive
                                ? "bg-[#38C798]/10 text-[#38C798]"
                                : "bg-[#F5F5F7] dark:bg-white/5"
                        )}>
                            {tag.icon}
                        </div>
                        <span className="text-[12px] font-bold tracking-tight">
                            {tag.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
