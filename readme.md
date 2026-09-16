# Study Jew

현재 저장소에는 실제로 사용하는 파일만 남깁니다.

- `edit.html` — 기존 메인 앱
- `review.html` — 메인 앱을 건드리지 않고 로컬 문제은행을 카드식으로 검수하는 독립 페이지
- `sw.js` — 메인 앱 서비스 워커
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — PWA 파일
- `hotfix-v6.js`, `hotfix-v9.js`, `hotfix-v11.js`, `hotfix-v19.js` — 현재 `sw.js`가 실제로 불러오는 성취기준 호환/수정 코드
- `curriculum-v6.json`, `curriculum-assets/` — 별도 교육과정 페이지에서 재사용할 교육과정 데이터와 이미지

메인 앱의 일반 저장 동작에는 교육과정 백업을 끼워 넣지 않습니다. 교육과정 편집은 별도 로컬 저장소에 즉시 저장하고 서버 동기화만 묶어서 처리합니다.

`review.html`은 `study-jew-v4`의 문제은행을 읽기만 하고 원본 문제은행은 수정하지 않습니다. 검수 판정과 메모는 `study-jew-bank-review-v1`에 따로 저장하며 XLSX로 내보낼 수 있습니다.

실험용 복구 페이지, 폐기된 교육과정 UI, 사용하지 않는 과거 hotfix 파일은 제거했습니다.