# 라우트/네이밍 정리 계획 (Routing & Naming Plan)

> 작성일: 2026-06-05
> 상태: **확정 (Approved)** — 사용자 합의 완료
> 관련: [UX_IMPROVEMENT_PLAN.md](./UX_IMPROVEMENT_PLAN.md), [PERFORMANCE_PLAN.md](./PERFORMANCE_PLAN.md)

---

## 1. 원칙 (Principles)

1. **버전 prefix 제거** — `v1`, `v2`는 구현 디테일. URL에 노출하지 않음.
2. **최상단은 디바이스 분기** — `/m`(모바일), `/d`(데스크탑).
3. **모바일 = 조회·분석 중심, 데스크탑 = 입력·관리 중심** — 역할 명확히 분리.
4. **행위/의미 중심 네이밍** — `operations`, `intelligence` 같은 모호한 단어 제거.

---

## 2. 확정된 라우트 구조

```
/                          → 디바이스 감지 후 /m 또는 /d로 리다이렉트
/login                     → 로그인
/register                  → 회원가입
/admin/users               → 관리자 (그대로)

# 모바일 (조회·분석 중심)
/m                         → 메인 대시보드 (자산 요약 + 시세)
/m/dividends               → 배당
/m/insights                → 인사이트 (분포·분석)
/m/settings                → 설정

# 데스크탑 (입력·관리 중심)
/d                         → 데스크탑 대시보드
/d/portfolio               → 자산 관리 (보유 + 매수 기록 + 인라인 편집)
/d/dividends               → 배당 관리
/d/accounts                → 증권 계좌 관리
/d/insights                → 인사이트
/d/settings                → 설정

# API
/api/*                     → 그대로
```

---

## 3. 매핑 — 현재 → 신규 (Migration Map)

| 현재 경로 | 신규 경로 | 처리 |
|---|---|---|
| `/v2/m` | **`/m`** | 리다이렉트 (301) + 사이드바 링크 교체 |
| `/v2/settings` | `/m/settings` | 리다이렉트 |
| `/v1` | `/d` | 리다이렉트 |
| `/v1/operations` | **`/d/portfolio`** | 리다이렉트 + 컴포넌트 이동 |
| `/v1/account` | `/d/accounts` | 리다이렉트 (단수→복수) |
| `/v1/dividends` | `/d/dividends` | 리다이렉트 |
| `/v1/intelligence` | `/d/insights` | 리다이렉트 |
| `/v1/m/*` | (삭제) | `/m`으로 흡수, 페이지 제거 |
| `/v2` | (삭제) | 빈 placeholder 제거 |
| `/settings` (root) | (삭제) | `/m/settings`로 통합 |
| `/operations` (root) | (삭제) | `/d/portfolio`로 통합 |
| `/intelligence` (root) | (삭제) | `/d/insights`로 통합 |
| `/account` (root) | (삭제) | `/d/accounts`로 통합 |
| `/dividends` (root) | (삭제) | `/d/dividends`로 통합 |

---

## 4. 네이밍 결정 사유 (Naming Rationale)

| 변경 | 사유 |
|---|---|
| `v1`/`v2` 제거 | 구현 버전이 URL에 노출되면 추후 v3 → URL이 끝없이 늘어남. 의미 없음. |
| `/m`, `/d` 디바이스 prefix | 짧고 명확. 모바일/데스크탑 역할 분리를 URL이 즉시 전달. |
| `operations` → **`portfolio`** | "operations"는 행위가 모호함 (운영? 수술?). 실제 기능은 자산 보유 + 매수 기록 관리. "portfolio"는 친숙한 금융 용어, 두 기능 모두 자연스럽게 포괄. |
| `intelligence` → **`insights`** | "intelligence"는 멋있지만 콘텐츠를 안 드러냄. "insights"는 분석 결과/통찰을 직접 표현. |
| `account` → `accounts` | 증권 계좌가 여러 개일 수 있으므로 복수형이 자연스러움. |
| `/v2/m`의 `m` 중첩 제거 | `/m`이 곧 모바일임을 더 직접적으로 표현. |
| 빈 `/v2` 제거 | placeholder는 라우트 낭비. 데스크탑은 `/d`로 직행. |

---

## 5. 진입 동작 (`/` 라우트)

### 디바이스 감지 + 리다이렉트
- `User-Agent` 기반으로 `/m` 또는 `/d`로 자동 분기 (서버 컴포넌트에서 `headers()` 활용)
- 모바일 폭이라도 사용자가 `/d` URL을 직접 치면 데스크탑 화면 표시 (반응형 강제 X)

### 디바이스 전환 토글 (선택)
- 사이드바 또는 설정 메뉴에 "PC 모드로 보기 / 모바일로 보기" 버튼 제공
- 쿠키에 사용자 선호 저장 → 다음 진입 시 우선 적용

---

## 6. 구현 단계 (Phase Roadmap)

### Phase 1 — 새 라우트 구조 추가 (반나절~1일)
- [ ] `src/app/m/` 디렉터리 신설, 기존 `v2/m/` 콘텐츠 복사 및 import 경로 보정
- [ ] `src/app/d/` 디렉터리 신설, `v1/`의 데스크탑 페이지 이동 (`operations` → `portfolio`, `account` → `accounts`, `intelligence` → `insights`)
- [ ] `src/app/page.tsx` — 디바이스 감지 후 `/m` 또는 `/d`로 리다이렉트
- [ ] 사이드바(`AppSidebar`)와 모바일 탭(`MobileTabs`) 링크 새 경로로 교체

### Phase 2 — 구 라우트 리다이렉트 (반나절)
- [ ] `next.config.mjs`에 `redirects()` 추가:
  - `/v2/m` → `/m` (301)
  - `/v2/settings` → `/m/settings`
  - `/v1` → `/d`
  - `/v1/operations` → `/d/portfolio`
  - `/v1/account` → `/d/accounts`
  - `/v1/intelligence` → `/d/insights`
  - `/v1/dividends` → `/d/dividends`
  - `/v1/m/*` → `/m/*`
  - 루트 중복 라우트(`/operations`, `/intelligence`, `/account`, `/dividends`, `/settings`) → 데스크탑 또는 모바일로
- [ ] `auth.config.ts`의 `protectedPaths` 새 경로로 업데이트
- [ ] `lib/actions.ts`의 `revalidatePath` 호출 모두 새 경로로 교체

### Phase 3 — 레거시 제거 (반나절)
- [ ] `src/app/v1/` 디렉터리 삭제
- [ ] `src/app/v2/` 디렉터리 삭제 (구 `/v2/m` 콘텐츠가 `/m`으로 이동 완료된 후)
- [ ] 루트의 중복 라우트(`/operations`, `/intelligence`, `/account`, `/dividends`, `/settings`) 디렉터리 삭제
- [ ] 컴포넌트 폴더명 정리:
  - `src/components/v2/mobile/` → `src/components/mobile/v2/` 또는 `src/components/m/`
  - `src/components/mobile/` (V1 모바일) → 삭제
- [ ] dead code 점검 (`ClientOperations.tsx`, `IntelligenceClient.tsx` 등의 root 컴포넌트들)

### Phase 4 — 검증
- [ ] 모든 라우트 수동 진입 테스트 (구 URL, 신 URL 양쪽)
- [ ] 인증 보호 라우트 정상 동작 확인
- [ ] 시세/배당/계좌 CRUD 동작 회귀 테스트
- [ ] 즐겨찾기/북마크 호환성 (구 URL → 신 URL 리다이렉트 작동)

---

## 7. 영향 파일 (Affected Files)

### 신규 (Phase 1)
| 파일 | 용도 |
|---|---|
| `src/app/m/layout.tsx` | 모바일 공통 레이아웃 |
| `src/app/m/page.tsx` | 모바일 메인 대시보드 |
| `src/app/m/dividends/page.tsx` | 모바일 배당 |
| `src/app/m/insights/page.tsx` | 모바일 인사이트 |
| `src/app/m/settings/page.tsx` | 모바일 설정 |
| `src/app/d/layout.tsx` | 데스크탑 공통 레이아웃 |
| `src/app/d/page.tsx` | 데스크탑 대시보드 |
| `src/app/d/portfolio/page.tsx` | 자산 관리 (구 operations) |
| `src/app/d/accounts/page.tsx` | 증권 계좌 |
| `src/app/d/dividends/page.tsx` | 배당 관리 |
| `src/app/d/insights/page.tsx` | 인사이트 |
| `src/app/d/settings/page.tsx` | 설정 |

### 수정 (Phase 2)
| 파일 | 변경 |
|---|---|
| `src/app/page.tsx` | UA 감지 후 `/m` 또는 `/d`로 리다이렉트 |
| `next.config.mjs` | `redirects()` 추가 |
| `auth.config.ts` | `protectedPaths` 갱신 |
| `src/lib/actions.ts` | `revalidatePath` 경로 갱신 (20+ 곳) |
| `src/components/AppSidebar.tsx` | 사이드바 링크 갱신 |
| `src/middleware.ts` | matcher 검토 |

### 삭제 (Phase 3)
- `src/app/v1/**`
- `src/app/v2/**`
- `src/app/operations/`, `intelligence/`, `account/`, `dividends/`, `settings/` (루트 중복분)
- `src/components/mobile/` (V1 모바일 컴포넌트, 사용처 없으면)

---

## 8. 검증 기준 (Acceptance Criteria)

- [ ] 새 URL(`/m`, `/d/portfolio` 등) 모두 정상 접근
- [ ] 구 URL이 모두 새 URL로 301 리다이렉트
- [ ] 인증 보호 라우트가 새 경로 기준으로 작동
- [ ] 자산 추가/수정/삭제, 배당 추가/수정/삭제, 계좌 관리 모두 회귀 없음
- [ ] `revalidatePath`가 정확히 새 경로를 무효화
- [ ] 사이드바/탭바 네비게이션이 새 URL을 가리킴
- [ ] PC에서 `/` 진입 시 `/d`로, 모바일에서 `/` 진입 시 `/m`으로 자동 이동
- [ ] 디바이스 전환 토글이 쿠키에 저장되고 다음 진입 시 우선 적용

---

## 9. 위험과 완화 (Risks & Mitigation)

| 위험 | 영향 | 완화 |
|---|---|---|
| 즐겨찾기/북마크 깨짐 | 사용자 본인 즐겨찾기 무효화 | 301 리다이렉트로 자동 호환 (Phase 2 필수) |
| `revalidatePath` 누락 | 캐시 정합성 깨져 stale UI | 수동 audit + 검증 단계에서 자산 CRUD 회귀 테스트 |
| 컴포넌트 import 경로 일괄 변경 시 누락 | 빌드 에러 | TypeScript 컴파일러로 1차 검출, `npm run build`로 검증 |
| 디바이스 감지 오판 (태블릿 등) | 의도와 다른 페이지 | 토글 버튼으로 사용자가 직접 전환 가능하게 |
| Phase 사이 일시적 양쪽 라우트 공존 | 일부 액션이 잘못된 페이지 갱신 | Phase 1·2 같은 PR/세션에서 함께 완료 권장 |

---

## 10. 참고 (Notes)

- 본인 사용 도구라 Public SEO 부담 없음 → 리다이렉트만 잘 깔면 충분.
- UX_IMPROVEMENT_PLAN의 옵션 A(PC 입력 페이지 신규 구축)는 이 라우트 정리 위에 자연스럽게 얹힘 — `/d/portfolio`가 그 무대가 됨.
- 컴포넌트 폴더 정리는 라우트 정리와 별도로 점진 진행 가능 (큰 위험 없음).
