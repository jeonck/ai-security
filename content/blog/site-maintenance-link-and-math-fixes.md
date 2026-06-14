---
title: "사이트 점검: 깨진 링크와 LaTeX 수식 렌더링 수정"
date: 2026-06-15T09:00:00+09:00
tags:
  - 공지
  - 운영
---

사이트 전반의 내부 링크 404와 LaTeX 수식이 렌더링되지 않던 문제를 점검하고 수정했습니다. 같은 구조(Hugo + Hextra)로 사이트를 만들 때 반복될 수 있는 문제라서, 원인과 해결 방법을 정리해 둡니다.

<!--more-->

## 1. 내부 링크 404 문제

### 증상

문서 본문이나 카드(`{{</* card */>}}`)에서 다른 페이지로 연결되는 링크를 클릭하면 다수가 404로 연결되었습니다.

### 원인 — Hugo pretty URL과 상대 경로의 깊이 불일치

Hugo는 기본적으로 `content/docs/attacks/jailbreak.md`를 **leaf bundle 형태의 pretty URL**인 `/docs/attacks/jailbreak/`로 렌더링합니다. 즉, 렌더링된 페이지의 실제 경로는 소스 파일 경로보다 한 단계 더 깊습니다.

그 결과:
- 같은 카테고리의 다른 문서로 가는 상대 링크는 `./other-doc/`이 아니라 `../other-doc/`이어야 합니다.
- 다른 카테고리의 문서로 가는 링크는 `../../other-category/other-doc/`처럼 한 단계 더 올라가야 합니다.
- 섹션 인덱스(`_index.md`)로 가는 링크는 `../section/_index`가 아니라 `../../section/`로 써야 합니다.
- `labs/*.md`에서 카드 숏코드로 `link="/docs/..."`처럼 절대 경로를 쓰면 `baseURL`의 `/ai-security/` 접두사가 누락되어 깨집니다 (Hextra의 `card.html` 숏코드가 절대 경로 `link=`에는 `relURL`을 적용하지 않는 동작 때문). 이 경우 `link="../../docs/.../"` 형태의 상대 경로로 바꿔야 합니다.

### 해결

1. 로컬에서 `hugo server --disableFastRender`로 전체 빌드를 띄우고, sitemap을 크롤링해 모든 `<a href>`를 실제로 요청해보는 스크립트로 깨진 링크를 전부 수집했습니다.
2. `content/docs/*/*.md` (인덱스 제외)와 `content/labs/*.md`, `content/tools/*.md`에서 상대 링크 깊이를 일괄 보정했습니다 (총 85개 링크, 27개 파일).
3. 재크롤링으로 깨진 링크 0개를 확인 후 커밋/푸시했습니다.

> 코드 예시(`[클릭](javascript:alert(1))` 같은 XSS 데모용 텍스트)는 링크가 아니므로, 일괄 변환 스크립트를 돌릴 때 이런 패턴이 함께 바뀌지 않는지 diff를 반드시 확인해야 합니다.

## 2. LaTeX 수식이 렌더링되지 않는 문제

### 증상

`content/docs/attacks/adversarial-examples.md`처럼 `$x$`, `$\delta$` 같은 인라인 수식과 `$$x' = x + \epsilon \cdot \text{sign}(...)$$` 같은 블록 수식이 모두 원본 텍스트(`$`, `\` 포함)로 그대로 노출되었습니다.

### 원인 — goldmark `passthrough` 확장 미설정

Hextra 테마는 `_markup/render-passthrough.html` 렌더 훅에서 `transform.ToMath`를 호출해 KaTeX용 HTML/MathML을 생성하고, 이때만 `hasMath` 플래그를 세팅해 `<head>`에 KaTeX 스크립트/CSS를 로드합니다. 그런데 이 렌더 훅은 **goldmark의 `passthrough` 확장이 활성화되고 수식 구분자(delimiter)가 설정되어 있어야만** 호출됩니다. `hugo.toml`에 해당 설정이 전혀 없으면 `$...$`, `$$...$$`는 그냥 일반 텍스트로 취급되어 markdown 파서가 글자 그대로 출력합니다.

### 해결

`hugo.toml`의 `[markup.goldmark]`에 다음 설정을 추가했습니다.

```toml
[markup.goldmark.extensions.passthrough]
  enable = true
  [markup.goldmark.extensions.passthrough.delimiters]
    block = [['\[', '\]'], ['$$', '$$']]
    inline = [['\(', '\)'], ['$', '$']]
```

로컬 빌드로 확인한 결과 인라인/블록 수식 모두 `katex`, `katex-display`, `katex-html`, `katex-mathml` 클래스로 정상 렌더링되었습니다.

## 요약

| 문제 | 원인 | 해결 |
| --- | --- | --- |
| 내부 링크 404 | pretty URL로 인해 leaf 페이지가 소스보다 한 단계 깊어짐 | 상대 경로에 `../` 한 단계 추가, 절대경로 카드 링크는 상대경로로 전환 |
| LaTeX 수식 미렌더링 | goldmark `passthrough` 확장 미설정 → KaTeX 미로드 | `hugo.toml`에 `markup.goldmark.extensions.passthrough` 설정 추가 |

두 가지 모두 신규 Hugo + Hextra 사이트를 만들 때 처음부터 설정해 두면 피할 수 있는 문제라서, 이 사이트를 빠르게 복제하기 위한 스킬(`hextra-roadmap-kb`)의 기본 템플릿에도 반영했습니다.
