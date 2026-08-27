# 기획 문서 목차

> **양파** — 관심 떨어진 굿즈를 기부하면 포인트를 받고, 쇼핑몰처럼 정리된 상품을 포인트로 구매하는 학급 굿즈 교환 서비스  
> 기획 산출물은 코드와 분리하여 이 디렉터리에서 관리합니다.

## 문서 구조

| 문서 | 경로 | 설명 |
|------|------|------|
| 로드맵 | [roadmap.md](./roadmap.md) | Phase별 개발 계획 |
| 미확정 사항 | [open-questions.md](./open-questions.md) | 확정 대기 항목 |
| PRD | [prd/](./prd/) | 기능별 기획서 |
| 사이트맵 | [ux/sitemap.md](./ux/sitemap.md) | 페이지·URL |
| 사용자 흐름 | [ux/user-flows.md](./ux/user-flows.md) | 시나리오 |
| ADR | [../decisions/](../decisions/) | 기술·기획 결정 |

---

## 진행 현황

### ✅ 완료 (Phase 0)

- Next.js 16.3.3 (App Router) + TypeScript + Tailwind CSS 4 + ESLint
- `src/` + `@/*` 경로 별칭, 패키지 매니저 `pnpm`
- shadcn/ui (base-nova) + Lucide

### ✅ 완료 (Phase 1)

- 학번 로그인, CSV 명단, 쇼핑몰(목록·상세·찜·구매), 관리자 상품·포인트 지급, 마이페이지, 수령 전 취소, 관리자 수령 완료

### 📋 예정

- **Phase 2** — 앱 기부 신청은 하지 않음 (실물+수동 지급으로 대체). 필요 시 재검토
- **Phase 3** — 토스페이먼츠 충전 (학생 수수료 0, PG는 우리가 흡수)
- **Phase 4** — 파일럿 이후 학교 단위 구독 유료화

- **Phase 2** — 앱 기부 신청은 하지 않음 (실물+수동 지급으로 대체). 필요 시 재검토
- **Phase 3** — 토스페이먼츠 충전 (학생 수수료 0, PG는 우리가 흡수)
- **Phase 4** — 파일럿 이후 학교 단위 구독 유료화

상세는 [roadmap.md](./roadmap.md) 참고.

---

## 문서 작성 규칙

1. PRD: `prd/NNN-기능-slug.md`
2. ADR: `decisions/NNN-주제.md`
3. 확정 후 GitHub Issue ↔ PRD 1:1 연결
4. 구현 시: **Issue 번호 + PRD 경로**를 Agent에 전달
5. 구현 브랜치: `feat/p{phase}-{step}-{feature}` (예: `feat/p1-1-student-login`)

## 관련

- 기술 스택: Next.js + Supabase + Tailwind + shadcn/ui
- 저장소: `onion-market` (로컬)
- 생성일: 2026-08-26
