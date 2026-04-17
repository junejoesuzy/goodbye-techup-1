# kt cloud TECH UP — 굿바이 랜딩페이지

> KT Cloud TECH UP 1기 챌린저 수료 기념 굿바이 메시지 월(Message Wall)

---

## 🚀 GitHub Pages 배포 방법 (5분 완성)

### 1단계 — 레포지토리 생성
1. GitHub 로그인 후 우측 상단 **`+` → `New repository`** 클릭
2. Repository name: `ktcloud-techup-goodbye` (원하는 이름 가능)
3. **Public** 선택
4. `Create repository` 클릭

### 2단계 — 파일 업로드
아래 파일/폴더를 **모두** 레포지토리에 업로드합니다.

```
📁 업로드할 파일 목록
├── index.html
├── .nojekyll          ← 반드시 포함!
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── stars.js
└── images/
    ├── logo-white.png
    ├── logo-dark.png
    ├── rocket.png
    ├── bg-space.png
    ├── bg-stars.png
    └── flag.png
```

**업로드 방법:**
- 레포지토리 메인 페이지 → `Add file` → `Upload files`
- 폴더 구조 그대로 드래그 앤 드롭
- `Commit changes` 클릭

> ⚠️ **`.nojekyll` 파일 주의**: 이름이 점(.)으로 시작해서 숨김파일로 보일 수 있어요.  
> 파일 탐색기에서 숨김 파일 표시를 켜거나, GitHub 업로드 시 직접 확인하세요.

### 3단계 — GitHub Pages 활성화
1. 레포지토리 상단 **`Settings`** 탭 클릭
2. 좌측 메뉴 **`Pages`** 클릭
3. **Source** 섹션 → `Deploy from a branch` 선택
4. **Branch** → `main` / `root` 선택 후 **`Save`**
5. 잠시 후 상단에 🟢 `Your site is live at https://[유저명].github.io/[레포명]/` 표시

### 4단계 — 링크 공유
```
https://[GitHub유저명].github.io/[레포지토리명]/
```
이 링크를 챌린저들에게 공유하면 바로 접속 가능합니다! 🎉

---

## 📁 파일 구조

```
index.html          — 메인 랜딩페이지
.nojekyll           — GitHub Pages Jekyll 비활성화
css/
  style.css         — 전체 스타일
js/
  app.js            — 메시지 저장/관리 로직 (localStorage)
  stars.js          — 별 Canvas 애니메이션
images/
  logo-white.png    — kt cloud TECH UP 화이트 로고
  logo-dark.png     — kt cloud TECH UP 다크 로고
  rocket.png        — 히어로 로켓 이미지
  bg-space.png      — 우주 배경
  bg-stars.png      — 별 배경
  flag.png          — 수료 깃발
```

---

## 💾 데이터 저장 방식

- **localStorage 기반** — 별도 서버/DB 없이 동작
- 메시지는 방문자의 브라우저에 저장됨
- GitHub Pages만으로 완전히 운영 가능

> ⚠️ 브라우저 캐시/쿠키를 전체 삭제하면 메시지가 사라질 수 있습니다.

---

## 🔐 관리자 기능

| 항목 | 내용 |
|------|------|
| 관리자 버튼 | 헤더 우측 `관리자` 버튼 클릭 |
| 비밀번호 | `ktcloud05!` |
| 카드 삭제 | 관리자 모드에서 카드 호버 → ✕ 버튼 클릭 |
| 로그아웃 | 상단 초록 바 `로그아웃` 버튼 |
| 세션 유지 | 새로고침해도 관리자 모드 유지 (탭 닫으면 초기화) |

---

## ✅ 구현된 기능

- 🌌 우주 배경 별 Canvas 애니메이션 + 유성 효과
- 🖼️ kt cloud TECH UP 공식 로고 사용
- ✍️ 메시지 작성 모달 (이름·과정명·이모지·색상·해시태그·본문)
- 🃏 그라디언트 메시지 카드 (6가지 색상) — 3:4 비율 세로형
- 📱 반응형 (5열 → 4열 → 3열 → 2열 → 1열 자동 조정)
- 🔐 관리자 비밀번호 인증 + 카드 삭제
