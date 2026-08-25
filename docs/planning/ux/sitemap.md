# 사이트맵 (Sitemap)

> **양파** — 학생 몰 + 학번 관리자

---

## 전체 구조

```
/                          상품 목록 (홈 = 몰)          [P1]
├── /login                 학번 로그인                  [P1]
│   ├── /login/setup       이름 확인·비밀번호 설정      [P1]
│   └── /login/forgot      학번+이름 → 새 비밀번호      [P1]
├── /products/[id]         상품 상세                    [P1]
├── /me                    마이페이지 요약              [P1]
│   ├── /me/orders         구매 목록·수령 전 취소       [P1]
│   └── /me/wishlist       찜 목록                      [P1]
└── /admin                 대시보드                     [P1, role=admin]
    ├── /admin/products
    ├── /admin/products/new
    ├── /admin/products/[id]
    ├── /admin/points      개별·일괄 포인트             [P1]
    ├── /admin/students/import
    ├── /admin/orders      수령 완료                    [P1]
    └── (충전)             토스페이먼츠                 [P3]
```

공개 회원가입·`/donate` 없음.

---

## Phase 0 — 현재

| URL | 설명 | 상태 |
|-----|------|------|
| `/` | Next.js 스타터 | ✅ 뼈대만 |

---

## Phase 1+ (예정)

| URL | Phase | 설명 |
|-----|-------|------|
| `/login` | 1 | 학번 로그인 |
| `/login/setup` | 1 | 이름 확인 + 비밀번호 최초 설정 |
| `/login/forgot` | 1 | 학번 + 이름 → 재설정 |
| `/` | 1 | 상품 목록 |
| `/products/[id]` | 1 | 상세·찜·구매 |
| `/me` | 1 | 포인트 요약 |
| `/me/orders` | 1 | 구매 목록, 수령 전 취소 |
| `/me/wishlist` | 1 | 찜 |
| `/admin` | 1 | 관리자 학번만 |
| `/admin/products*` | 1 | 상품 |
| `/admin/points` | 1 | 포인트 지급 |
| `/admin/students/import` | 1 | CSV |
| `/admin/orders` | 1 | 수령 처리 |
| 충전 URL | 3 | 토스페이먼츠 |

---

## 네비게이션 (목표)

**학생 헤더:** 로고(`/`) · 카테고리 · 찜 · 마이(포인트) · 로그아웃  
`role=admin`이면 **관리** 링크 추가.

**관리자:** 상품 · 포인트 · 명단 CSV · 주문 수령 · 몰 미리보기 · 로그아웃

**비로그인:** `/login`만. 몰은 로그인 후. 검색 노출 없음 (교내·휴대폰).
