# ADR-001: 기본 기술 스택

| 항목 | 내용 |
|------|------|
| 상태 | 확정 |
| 날짜 | 2026-08-26 |
| 관련 PRD | Phase 1 전체 |

---

## 컨텍스트

1인 에이전시가 학급용 웹앱을 빠르게 만들고, 나중에 Vercel에 올린다. DB는 직접 SQL보다 클라이언트/대시보드로 다루는 쪽을 선호한다. 인터뷰에서 스택은 **기본값**으로 확정했다.

---

## 검토한 대안

| 대안 | 장점 | 단점 |
|------|------|------|
| A. Next.js + Supabase + Tailwind + shadcn | 이미 뼈대 있음. Auth·DB·Storage 한곳. 에이전시 기본 스택 | Supabase 프로젝트 생성 필요 |
| B. Next.js만, DB 나중 | 착수 빠름 | 로그인·포인트·재고를 가짜 데이터로 두 번 일함 |
| C. 다른 BaaS / 자체 서버 | 자유도 | 1인 운영 비용 |

---

## 결정

**A. Next.js 16 App Router + Supabase (Postgres, Auth, Storage) + Tailwind + shadcn/ui + pnpm**

인터뷰 “기본”과 Phase 0 셋업이 같다. 상품 사진은 Storage, 학생·상품·주문은 Postgres 테이블로 본다.

---

## 결과·영향

- 구현 채팅은 Supabase JS Client를 우선하고, raw SQL은 마이그레이션·RLS 정도만
- 페이지 Metadata는 넣되, 교내 전용이라 검색 노출은 목표가 아님 (`noindex` 검토)
- GA4/GTM은 필수가 아님. 자리만 나중에 훅

---

## 후속

- [ ] Supabase 프로젝트 생성 및 env (`NEXT_PUBLIC_SUPABASE_URL`, anon key)
- [ ] 학생/상품/주문 RLS 초안
- [ ] Storage 버킷 `product-images` (비공개 또는 공개 URL 정책 결정)
