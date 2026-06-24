# TTA 표준 도면 (그림 1~4)

표준 본문 `../draft-v0.2.md`의 그림 1~4를 정식 벡터 도면으로 렌더한 산출물.

| 그림 | 소스 | 벡터 산출물 | 용도 |
|---|---|---|---|
| 그림 1 — 프로토콜 구조 | `fig1-architecture.mmd` | `fig1-architecture.svg` / `.pdf` | 5.0 구조 개요 |
| 그림 2 — 권한위임 등록 시퀀스 | `fig2-registration-seq.mmd` | `fig2-registration-seq.svg` / `.pdf` | 6.1 |
| 그림 3 — 서비스 요청·검증 시퀀스 | `fig3-verification-seq.mmd` | `fig3-verification-seq.svg` / `.pdf` | 6.2 |
| 그림 4 — 위임 이행 감사 시퀀스 | `fig4-audit-seq.mmd` | `fig4-audit-seq.svg` / `.pdf` | 6.3 |

- **`.mmd`** = Mermaid 소스(source of truth). 본문 수정 시 이 파일을 고치고 재빌드한다.
- **`.svg`** = 벡터(웹/작업 초안용, 한글이 선택 가능한 `<text>`로 보존).
- **`.pdf`** = 단일 페이지 벡터(HWP/Word 표준 제출 문서 임베드용, 인쇄 품질).

## 재빌드

```bash
./build.sh          # 모든 fig*.mmd → .svg + .pdf
```

요구사항: `npx`(@mermaid-js/mermaid-cli 11은 자동 설치), 한글 폰트 `Noto Sans CJK KR`.
설정: `mermaid-config.json`(neutral 테마·한글 폰트), `puppeteer-config.json`(`--no-sandbox`).
