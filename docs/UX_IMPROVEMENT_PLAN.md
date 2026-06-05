# UX 개선 계획 (UX Improvement Plan)

> 작성일: 2026-06-05
> 대상: 본인 사용 중 발견된 실 사용성 이슈
> 관련: [ROUTING_PLAN.md](./ROUTING_PLAN.md), [PERFORMANCE_PLAN.md](./PERFORMANCE_PLAN.md), [MOBILE_CONNECTION.md](./MOBILE_CONNECTION.md)
>
> **참고**: 본 문서의 라우트 명칭은 [ROUTING_PLAN.md](./ROUTING_PLAN.md) 정리 후 기준으로 갱신됨 — 옵션 A의 데스크탑 입력 페이지는 **`/d/portfolio`**, 단기 우회의 V1 페이지는 정리되며 사라짐.

---

## 1. 이슈 #1 — PC 전용 데이터 입력 페이지 부재

### 1.1 현황
- `/v2` (Desktop V2) → **"Coming Soon" 플레이스홀더만 존재** (`src/app/v2/page.tsx`)
- 메인 라우트 `/` → `/v2/m`(모바일)로 강제 리다이렉트
- 데이터 입력은 모두 모바일 시트(`AssetEntrySheetV2`, `StockEntryFormV2`) 기준으로 설계됨
  - 한 손 조작 / 좁은 폭 / 키패드 입력 가정
  - PC에서 마우스 + 키보드 사용 시 비효율적
- 레거시 V1 데스크탑(`/v1/operations`)은 존재하지만 디자인/데이터 흐름이 분리되어 있어 운영 부담

### 1.2 진짜 문제
- 자산 매수 기록, 배당 입력 등 **대량/연속 입력 작업이 PC에서 압도적으로 빠른데** 그게 막혀 있음
- 모바일 시트는 한 번에 하나씩 입력하는 UX → 10건 입력 시 시트 열고 닫기 반복
- 키보드 단축키(Tab/Enter), 큰 화면에서의 리스트 조회 + 즉시 편집 같은 PC만의 장점을 못 살림

### 1.3 개선 방향 (3가지 옵션)

#### 옵션 A. **PC 전용 "데이터 입력 페이지" 신규 구축** (추천)
**컨셉**: 모바일은 조회/분석 중심, PC는 입력/관리 중심으로 역할 분리

**구현 개요**:
- `/v2/desktop` 또는 `/v2/admin` 라우트 신설 (또는 `/v2/entry`)
- 한 화면에 다음을 동시 노출:
  - 좌측: 자산 리스트(검색/필터)
  - 중앙: 인라인 편집 가능한 테이블 (수량/단가/계좌)
  - 우측: 빠른 입력 폼 (Tab 키로 종목→수량→단가→계좌→Enter로 즉시 저장)
- 키보드 우선 UX: Tab 순서, Enter 확정, Esc 취소, Cmd+S 일괄 저장
- 시세 자동 채우기 (현재가 → 평단 입력 시 기본값)
- 배당 일괄 입력 모드 (CSV 붙여넣기 또는 월별 그리드)

**필요 컴포넌트** (신규/재활용):
- 신규: `DesktopEntryShell`, `AssetEntryGrid`, `QuickEntryPanel`, `BulkDividendImporter`
- 재활용: `getAssets`, `addStockEntry`, `addDividendRecord` 등 기존 서버 액션 그대로

**트레이드오프**:
- 유지보수 코드량 증가 (모바일 + 데스크탑 두 트리)
- 다만 입력 액션은 서버 액션 공유라서 비즈니스 로직 중복은 최소

**작업 범위**: 중~대 (3~5일)

---

#### 옵션 B. **V1 operations 정리 + V2 데이터 모델로 통합**
**컨셉**: 이미 작동하는 `/v1/operations`를 살려 V2 스타일로 리스킨

**구현 개요**:
- `/v1/operations`의 입력 UI(`AssetModal`, `StockEntryForm`) → V2 디자인 토큰 적용
- 라우트는 `/v2/operations`로 이동
- 기존 V1 그래프/위젯은 제거하고 입력 기능만 남김

**트레이드오프**:
- 빠르게 가능 (이미 동작)
- 단, V1 코드 정리 부담. UI 양식이 옛 패턴이라 리스킨 비용 큼
- 신규 옵션 A에 비해 미래 확장성 떨어짐

**작업 범위**: 중 (1~2일)

---

#### 옵션 C. **모바일 UI 그대로, 데스크탑은 너비만 확장**
**컨셉**: `/v2/m` 그대로 두고 데스크탑에서는 max-width 늘려서 표시

**트레이드오프**:
- 작업량 최소 (CSS만 손봄)
- 하지만 본질적 입력 효율 개선 없음 — 이 옵션은 권장 안 함

**작업 범위**: 소 (반나절)

### 1.4 추천
**옵션 A**가 가장 큰 가치. 본인이 매일 쓰는 도구 + 입력 작업이 부담이라는 문제 정의에 가장 맞음. 다만 일단은 **옵션 B로 단기 우회**하고 시간 날 때 A로 본격 작업하는 단계적 접근도 가능.

---

## 2. 이슈 #2 — 자산 상세 카드(`StockDetailSheetV2`) 스크롤 UI 깨짐

### 2.1 현황 (코드 위치)
파일: `src/components/v2/mobile/StockDetailSheetV2.tsx`

```tsx
// line 629~640: 시트 컨테이너 (시트 자체가 drag="y"로 드래그 가능)
<motion.div
    drag="y"
    dragConstraints={{ top: 0 }}
    onDragEnd={(_, info) => {
        if (info.offset.y > 100 || info.velocity.y > 500) onClose();
    }}
    className="fixed bottom-0 left-0 right-0 h-auto max-h-[92vh] rounded-t-[40px]
               p-0 overflow-hidden ... flex flex-col z-[130]"
>
    {/* Handle */}
    <div className="relative pt-3 pb-2 flex justify-center shrink-0">
        ...
    </div>

    {/* line 673: 내부 스크롤 영역 */}
    <div className="overflow-y-auto hide-scrollbar pb-10">
        {/* 헤더, 차트, 상세, 거래 내역 등 긴 콘텐츠 */}
    </div>
</motion.div>
```

### 2.2 원인 진단 (추정)

| # | 원인 | 증상 |
|---|---|---|
| 1 | **시트 전체에 `drag="y"` 적용** | 사용자가 내부 콘텐츠를 위로 스크롤하려고 손가락을 위로 밀면, framer-motion이 드래그로 가로채 시트 자체가 약간 움직임. 반대로 닫으려고 아래로 끌 때도 내부 스크롤과 충돌 |
| 2 | **`overscroll-behavior` 미설정** | 내부 스크롤이 맨 위/맨 아래에 닿으면 스크롤 체이닝으로 body까지 스크롤됨 (배경 페이지가 같이 움직임) |
| 3 | **`max-h-[92vh]`의 `vh` 단위 문제** | 모바일 브라우저 주소창 가변 → 실제 높이가 화면보다 살짝 큼/작음 → 아래쪽 콘텐츠가 가려지거나 빈 공간 발생. `dvh`(dynamic viewport height) 도입 필요 |
| 4 | **body 스크롤 잠금 부재** | 시트 열려있을 때 백그라운드 body의 overflow가 잠기지 않으면, 시트 외부(검은 배경) 터치 시 페이지가 스크롤됨 |
| 5 | **드래그 영역 미분리** | "드래그하여 닫기"는 핸들 영역(상단 회색 바)에서만 의도되어야 하는데 시트 전체에 걸려 있음 |

### 2.3 개선안

#### 안 1. **드래그 영역 분리** (핵심)
시트 전체 → 핸들 영역에만 드래그 적용:

```tsx
// 시트 컨테이너에서 drag 제거
<motion.div className="fixed bottom-0 ... flex flex-col">

    {/* Handle에만 drag 적용 */}
    <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
            if (info.offset.y > 80 || info.velocity.y > 500) onClose();
        }}
        className="relative pt-3 pb-2 flex justify-center shrink-0 touch-none"
    >
        <div className="w-12 h-1 bg-zinc-200 rounded-full" />
    </motion.div>

    <div className="overflow-y-auto ...">...</div>
</motion.div>
```

#### 안 2. **스크롤 체이닝 차단**
내부 스크롤 영역에 `overscroll-behavior: contain` 추가:

```tsx
<div
    className="overflow-y-auto hide-scrollbar pb-10"
    style={{ overscrollBehavior: 'contain' }}
>
```

#### 안 3. **동적 뷰포트 단위 적용**
`92vh` → `92dvh`(또는 `100svh`/`100lvh`):

```tsx
className="... max-h-[92dvh] ..."
```

Tailwind 3.4+는 `max-h-[92dvh]` arbitrary value로 직접 작동. 미지원 브라우저 fallback 필요 시 인라인 style로 `max-height: 92dvh`와 `max-height: 92vh` 동시 지정.

#### 안 4. **body 스크롤 잠금**
시트 열림 상태일 때 body 스크롤 잠금 훅 추가:

```tsx
useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
}, [isOpen]);
```

또는 `framer-motion`의 `<MotionConfig>` + Radix `Dialog`로 교체 (Radix가 body lock 자동 처리).

#### 안 5. **"맨 위에서만 드래그 닫기" 패턴** (선택)
사용자가 내부 콘텐츠를 스크롤 최상단으로 올린 상태에서만 드래그-to-close 활성화:

```tsx
const [canDragClose, setCanDragClose] = useState(true);

<div
    onScroll={(e) => setCanDragClose(e.currentTarget.scrollTop === 0)}
    className="overflow-y-auto ..."
>
```

핸들에 `drag={canDragClose ? "y" : false}` 전달. 자연스러운 BottomSheet UX (vaul, react-spring-bottom-sheet 등이 사용하는 패턴).

#### 안 6. **라이브러리 도입 검토** (장기)
`vaul` (https://vaul.emilkowal.ski/) — shadcn 진영의 drag-to-close BottomSheet. 위 모든 문제를 검증된 방식으로 해결.

**트레이드오프**:
- 도입 시 기존 `StockDetailSheetV2`, `AssetEntrySheetV2`, `DividendDetailSheetV2`, `SettingsSheetV2` 등 시트 컴포넌트 다수를 마이그레이션 (~1일)
- 장기적으로 유지보수 부담 감소

### 2.4 권장 작업 순서
1. **즉시 적용 (30분)**: 안 1 + 안 2 + 안 3 — 가장 작은 변경으로 큰 효과
2. **검증 후 추가 (1시간)**: 안 4 (body lock), 안 5 (조건부 drag)
3. **검토 후 결정 (별도 작업)**: 안 6 (vaul 마이그레이션)

---

## 3. 추천 실행 순서 (Recommended Roadmap)

### Phase 1 — 빠른 UX 수정 (1~2시간)
- [ ] **이슈 #2 — 안 1, 2, 3 적용**: `StockDetailSheetV2` 드래그/스크롤 분리, dvh 적용
- [ ] 다른 Sheet 컴포넌트(`AssetEntrySheetV2`, `DividendDetailSheetV2`, `SettingsSheetV2`)도 동일 패턴 적용
- [ ] 실기기(iPhone)에서 검증

### Phase 2 — 단기 PC 입력 우회 (1~2일)
- [ ] **이슈 #1 — 옵션 B**: `/v1/operations` 라우트를 살리고 V2 디자인 토큰으로 리스킨
- [ ] 또는 `/v2/m`를 데스크탑에서도 쓸 수 있도록 max-width 확장 + 키보드 단축키 일부 추가

### Phase 3 — 본격 PC 데이터 입력 페이지 (3~5일)
- [ ] **이슈 #1 — 옵션 A**: `/v2/entry`(가칭) 신규 페이지
- [ ] AssetEntryGrid (인라인 편집 테이블)
- [ ] QuickEntryPanel (키보드 우선 폼)
- [ ] BulkDividendImporter (CSV/그리드 일괄 입력)
- [ ] 시세 자동 채우기

### Phase 4 — 시트 UX 본격 개선 (선택)
- [ ] **이슈 #2 — 안 6**: `vaul` 라이브러리 도입, 시트 컴포넌트 마이그레이션
- [ ] 모션/제스처 검증

---

## 4. 영향 파일 (Affected Files)

### 이슈 #1
| 파일 | 변경 | Phase |
|---|---|---|
| (신규) `src/app/v2/entry/page.tsx` | 데스크탑 입력 페이지 | 3 |
| (신규) `src/components/v2/desktop/AssetEntryGrid.tsx` | 인라인 편집 그리드 | 3 |
| (신규) `src/components/v2/desktop/QuickEntryPanel.tsx` | 키보드 우선 폼 | 3 |
| `src/app/v1/operations/page.tsx` | 단기 우회로 정비 | 2 |
| `src/app/operations/ClientOperations.tsx` | 단기 우회로 정비 | 2 |
| `src/lib/actions.ts` | 일괄 입력용 액션 추가 (선택) | 3 |

### 이슈 #2
| 파일 | 변경 | Phase |
|---|---|---|
| `src/components/v2/mobile/StockDetailSheetV2.tsx` | 드래그 영역 분리, dvh, overscroll | 1 |
| `src/components/v2/mobile/AssetEntrySheetV2.tsx` | 동일 패턴 적용 | 1 |
| `src/components/v2/mobile/DividendDetailSheetV2.tsx` | 동일 패턴 적용 | 1 |
| `src/components/v2/mobile/SettingsSheetV2.tsx` | 동일 패턴 적용 | 1 |
| `src/components/v2/mobile/AssetGrowthDetailSheetV2.tsx` | 동일 패턴 적용 | 1 |
| (신규 훅) `src/hooks/useBodyScrollLock.ts` | body lock 재사용 훅 | 1 |
| `package.json` | `vaul` 추가 (Phase 4) | 4 |

---

## 5. 측정 / 검증 기준 (Acceptance Criteria)

### 이슈 #1
- [ ] PC에서 자산 10건 연속 입력에 걸리는 시간 < 2분
- [ ] 마우스 없이 키보드만으로 1건 입력 가능 (Tab → 값 → Enter)
- [ ] 시세 자동 채우기로 평단/현재가 수동 입력 불필요

### 이슈 #2
- [ ] 시트 내부 스크롤 중 시트 자체가 움직이지 않음
- [ ] 핸들 영역만 드래그-to-close 작동
- [ ] 시트가 열려있을 때 배경 페이지가 스크롤되지 않음
- [ ] iPhone Safari에서 주소창 가변 시에도 시트 하단 콘텐츠가 가려지지 않음
- [ ] 시트 닫기/열기 시 깜빡임/위치 점프 없음

---

## 6. 참고 사항 (Notes)

- **본인 사용 도구라는 전제**: 옵션 A의 데스크탑 페이지는 폴리시 수준을 너무 높일 필요 없음. "내가 빠르게 입력할 수 있으면 끝".
- **모바일 우선 정책 유지**: 데스크탑 추가가 모바일 UX를 후순위로 미루지 않도록, 두 트리를 명확히 분리 (모바일 = 조회/분석, 데스크탑 = 입력/관리).
- **PERFORMANCE_PLAN과의 시너지**: 시트가 열릴 때 시세 캐시 활용(C 항목) + body lock으로 백그라운드 fetch 최소화하면 시트 인터랙션이 더 가벼워짐.
- **PWA 마감 시너지**: dvh 단위 적용은 PWA 풀스크린 모드에서 viewport 안정성 확보에도 기여.
