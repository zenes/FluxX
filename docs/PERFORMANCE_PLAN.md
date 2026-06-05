# 성능 개선 계획 (Performance Improvement Plan)

> 작성일: 2026-06-05
> 대상: `/v2/m` 모바일 페이지 네비게이션 지연 문제
> 목표: 페이지 전환 체감 속도 개선

---

## 1. 진단 (Diagnosis)

### 1.1 핵심 병목
`src/app/v2/m/page.tsx`가 서버 렌더 중 **Yahoo Finance API를 종목 수 × 2회** 외부 호출하는 구조.

```
src/app/v2/m/page.tsx (Server Component)
  ├─ getAssets() / getWatchlistStocks() / getUserSettings() / ... (DB, 빠름)
  └─ getInitialMarketData()
       └─ getStockQuotes(allSymbols)   ← src/lib/stock-service.ts
            ├─ yahooFinance.quote([...])          (1차 외부 호출, 약 ~1초)
            └─ symbols.map(yahooFinance.chart())  (sparkline용 N회 추가 호출)
```

현재 보유 종목 수 기준:
- Asset(stock): **11개**
- Watchlist: **14개**
- 환율 `KRW=X`, 금 `GC=F` 포함 → **약 27개 심볼**
- → 페이지 1회 로드 시 **최대 약 54회 외부 호출**

### 1.2 부수 요인
| 항목 | 영향 | 위치 |
|---|---|---|
| `layout.tsx`에서 `getUserSettings()` 매번 호출 | 모든 페이지 전환에 100~300ms 추가 | `src/app/layout.tsx:53` |
| 시세 in-memory 캐시 TTL 1분 | 1분 지나면 전부 재호출, dev hot reload 시 무효화 | `src/lib/stock-service.ts:7` |
| Dev 모드 첫 컴파일 | 5~15초 지연 | Next.js dev 본질적 한계 |
| Sparkline은 quote와 별도 호출 | 호출 수가 2배로 늘어남 | `src/lib/stock-service.ts:54-77` |

### 1.3 측정 권장
개선 전 baseline 확보:
```bash
# 1) 운영 빌드 측정 (dev 모드 노이즈 제거)
npm run build && npm start
# 브라우저 DevTools > Network > 페이지 전환 시간 기록

# 2) 서버 응답 시간 로그 확인
# stock-service.ts의 console.log로 캐시 hit/miss 비율 확인
```

---

## 2. 개선 방안 (Improvement Options)

### 🥇 A. 시세를 클라이언트 SWR로 분리 (가장 효과 큼)
**핵심**: 서버 렌더에서 Yahoo Finance 호출 제거. 페이지는 DB 데이터만으로 즉시 렌더.

**구현 개요**:
1. `/v2/m/page.tsx`에서 `getInitialMarketData()` 제거
2. `SimpleModeV2Container`(클라이언트)에서 SWR로 `/api/stock-price` 호출
3. 초기 렌더: 스켈레톤 / 캐시된 마지막 가격
4. 데이터 도착 시 부드럽게 채움 (framer-motion 활용 가능)

**예상 효과**: 페이지 응답 시간 1~2초 → 100~300ms (체감 10배+)

**트레이드오프**:
- 초기 가격 표시가 약간 지연됨 (대신 페이지 자체는 즉시 보임)
- 클라이언트 fetch 로직 추가 (SWR 또는 React Query 의존성)
- SSR SEO는 우선순위 낮음 (본인 사용, 비공개)

**의존성 추가**: `swr` (가볍고 검증됨)

**작업 범위**: 중 (Container 컴포넌트 1개 + 신규 hook + page.tsx 단순화)

---

### 🥈 B. Suspense + Streaming
**핵심**: 서버 fetch는 유지하되, 빠른 영역(DB 결과)을 먼저 스트리밍하고 시세는 별도 Suspense 경계에서 로드.

**구현 개요**:
1. `MarketDataLoader`라는 별도 Server Component 분리
2. `/v2/m/page.tsx`에서 `<Suspense fallback={<Skeleton/>}><MarketDataLoader/></Suspense>`로 감쌈
3. HTML 셸은 즉시 도착, 시세 영역만 늦게 채워짐

**예상 효과**: 첫 페인트(FCP)는 빨라지지만 "완성 시간"은 비슷. 체감은 개선됨.

**트레이드오프**:
- A보다 작업 적지만 효과도 작음
- 서버 부담은 그대로
- A의 디딤돌로 활용 가능

**작업 범위**: 소

---

### 🥉 C. 캐시 강화 + Sparkline 분리
**핵심**: `getStockQuotes`를 stale-while-revalidate 패턴으로 전환, sparkline은 별도 lazy.

**구현 개요**:
1. **TTL 1분 → 5분**으로 연장
2. **Stale-while-revalidate**: 캐시 hit이면 즉시 응답 + 백그라운드에서 갱신 (현재는 hit 시에만 응답)
3. **Sparkline 분리**: quote 응답에서 빼고 별도 `/api/stock-sparkline?symbols=...`로 분리, 클라이언트에서 후속 fetch
4. **Next.js `unstable_cache` 도입**: in-memory 대신 Next.js 캐시 레이어 사용 (운영 환경에서 재시작 시에도 살아남음, 검토 필요)

**예상 효과**: 외부 호출 50% 이상 감소. Yahoo 차단/Rate limit 위험 감소.

**트레이드오프**:
- 가격이 최대 5분까지 stale할 수 있음 (자산 모니터링 용도엔 충분)
- Sparkline은 약간 늦게 그려짐
- A와 함께 적용하면 시너지 큼

**작업 범위**: 소~중

---

### 🏅 D. `layout.tsx`의 `getUserSettings` 제거
**핵심**: 매 페이지 DB 쿼리를 세션 토큰/쿠키 기반으로 대체.

**구현 개요**:
1. 사용자 테마/설정을 NextAuth 세션 토큰에 저장 (이미 `auth.config.ts`에서 token 관리 중)
2. `RootLayout`에서 `getUserSettings` 대신 `auth()` 결과에서 추출
3. 설정 변경 시에만 토큰 갱신 (`update` trigger 이미 존재)

**예상 효과**: 모든 페이지 전환에서 100~300ms 절감.

**트레이드오프**:
- 세션 토큰 크기 증가 (테마 등 몇 바이트 수준이라 무시 가능)
- 설정 변경 후 즉시 반영 위해 토큰 update 호출 필요

**작업 범위**: 소

---

### 🛠️ E. Dev 환경 가속 (Quick Wins)
**핵심**: 코드 변경 없이 즉시 가능한 dev 속도 개선.

**즉시 적용 가능**:
```bash
# Turbopack (5~10x 빠른 컴파일)
npm run dev -- --turbo

# 운영 빌드로 실제 사용자 체감 측정
npm run build && npm start
```

**검토 항목**:
- Next.js 14.2 → 14.x 최신 또는 15 업그레이드 시 Turbopack 안정성 점검
- `next.config.mjs`에 `experimental.optimizePackageImports` 추가 (`lucide-react`, `recharts` 등 무거운 패키지)

**예상 효과**: dev 첫 컴파일 5~15초 → 1~3초.

**작업 범위**: 최소

---

## 3. 추천 실행 순서 (Recommended Roadmap)

### Phase 0 — Baseline 측정 (10분)
- [ ] `npm run dev -- --turbo`로 dev 속도 개선 확인
- [ ] `npm run build && npm start`로 운영 모드 속도 측정
- [ ] 운영 모드도 답답하면 Phase 1 진행, 괜찮으면 우선순위 하향

### Phase 1 — 가장 큰 임팩트 (반나절~1일)
- [ ] **A. 시세 클라이언트 SWR 분리** — `/v2/m` 페이지
- [ ] **C-1. 캐시 TTL 1분 → 5분**, stale-while-revalidate 패턴
- [ ] 검증: 페이지 전환 시간 측정, 체감 확인

### Phase 2 — 부가 최적화 (반나절)
- [ ] **C-2. Sparkline 분리**, 클라이언트 lazy load
- [ ] **D. `layout.tsx` DB 쿼리 제거**, 세션 토큰 활용
- [ ] 검증

### Phase 3 — 선택 사항
- [ ] **B. Suspense Streaming** — A로 충분하면 생략 가능
- [ ] `next.config.mjs` 패키지 최적화
- [ ] Next.js 15 마이그레이션 검토 (별도 작업)

---

## 4. 측정 지표 (Metrics)

| 지표 | 측정 방법 | 목표 |
|---|---|---|
| 페이지 응답 시간 (TTFB) | DevTools Network | < 200ms |
| First Contentful Paint | Lighthouse 모바일 | < 1.5s |
| 페이지 전환 체감 시간 | 수동 (눈으로) | 즉시 |
| Yahoo Finance 호출 빈도 | `stock-service.ts` 콘솔 로그 | 1분당 < 5회 |
| 캐시 hit ratio | `stock-service.ts` 로그 비율 | > 80% |

---

## 5. 참고 사항 (Notes)

- **본인 사용 도구**라는 전제에서 SEO/SSR은 우선순위 낮음 → 클라이언트 fetch 적극 활용 OK
- **Supabase 복귀 시**: 현재는 SQLite라 DB 쿼리가 빠르지만, PostgreSQL/네트워크 RTT 추가되면 layout DB 쿼리 영향이 커짐 → Phase 2 D 항목 우선순위 상승
- **PWA 마감 단계와 시너지**: 오프라인 폴백 시 시세 캐시를 보여주는 패턴이 본 계획의 C 항목과 자연스럽게 연결됨

---

## 6. 관련 파일 (Affected Files)

| 파일 | 변경 종류 | 단계 |
|---|---|---|
| `src/app/v2/m/page.tsx` | 시세 fetch 제거 | A |
| `src/components/v2/mobile/SimpleModeV2Container.tsx` | SWR 통합 | A |
| `src/lib/stock-service.ts` | TTL/SWR/sparkline 분리 | C |
| `src/app/api/stock-price/route.ts` | 클라이언트용 엔드포인트 정비 | A |
| (신규) `src/app/api/stock-sparkline/route.ts` | Sparkline 전용 엔드포인트 | C |
| `src/app/layout.tsx` | `getUserSettings` 제거 | D |
| `auth.config.ts` / `auth.ts` | 세션 토큰에 설정 추가 | D |
| `next.config.mjs` | optimizePackageImports | E |
| `package.json` | `swr` 의존성 추가 | A |
