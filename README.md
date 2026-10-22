# AI Security

AI 보안을 체계적으로 학습하기 위한 한국어 지식베이스입니다. 개념 → 실습 → 도구 → 실제 사건 분석 순으로 읽도록 구성했습니다.

**https://ai-security.metacog.co.kr**

## 구성

| 섹션 | 내용 |
|---|---|
| [학습 로드맵](https://ai-security.metacog.co.kr/docs/) | ① 기반 지식 ② 공격 기법 ③ 방어 기법 ④ 인프라·공급망 ⑤ 거버넌스 ⑥ 레드팀 ⑦ 가드레일·평가 ⑧ 사례 기술 분석 |
| [실습](https://ai-security.metacog.co.kr/labs/) | 단계별로 재현 가능한 Lab 1~11 (적대적 공격, RAG 레드팀, 위험 등록부, 데이터 포이즈닝, 공급망 점검, 가드레일 파이프라인) + 12주 캡스톤 |
| [도구](https://ai-security.metacog.co.kr/tools/) | 적대적 ML 도구, LLM 레드팀 도구, AI 에이전트 모의해킹 도구(ARTEX), 표준·참고 문서 |
| [블로그](https://ai-security.metacog.co.kr/blog/) | 동향, 규제·표준 업데이트, 사건 분석 (RSS 제공) |
| [용어집](https://ai-security.metacog.co.kr/glossary/) | `data/ko/termbase.yaml` 기반 용어 정의 |

## 로컬에서 실행

[Hugo extended](https://gohugo.io/installation/) **0.161.1**과 테마 서브모듈이 필요합니다. 배포 워크플로가 같은 버전을 쓰므로 버전을 맞추면 CI와 결과가 같습니다.

```bash
git clone --recurse-submodules https://github.com/jeonck/ai-security.git
cd ai-security
hugo server
```

이미 클론했다면 서브모듈만 받으면 됩니다.

```bash
git submodule update --init
```

배포용 빌드 확인:

```bash
hugo --gc --minify
```

## 배포

`main`에 푸시하면 [GitHub Actions](.github/workflows/deploy.yml)가 빌드해 GitHub Pages로 배포합니다. 커스텀 도메인은 `static/CNAME`과 저장소 Pages 설정에 등록되어 있고, 빌드 시 `baseURL`은 `actions/configure-pages`의 출력값이 덮어씁니다.

## 기술 스택

- [Hugo](https://gohugo.io/) + [Hextra](https://github.com/imfing/hextra) 테마 (서브모듈)
- Mermaid 다이어그램, FlexSearch 검색
- 한국어 콘텐츠 (`defaultContentLanguage = 'ko'`)

## 콘텐츠 작성 규칙

[.agents/AGENTS.md](.agents/AGENTS.md)에 한글 마크다운 강조 규칙이 있습니다. 한글 조사나 영문 괄호가 붙는 강조는 `**`가 렌더링에 실패하므로 `<strong>` 태그를 쓰세요.

사실 주장에는 출처를 밝히고, 벤더의 자체 추정치나 당사자가 이의를 제기한 내용은 그렇게 표시합니다. 사건 분석 문서는 ① 잠재적 결함 → ② 공격자의 개입 → ③ 오작동 → ④ 공격 완성의 4단계 틀을 따릅니다.

## 면책

이 저장소의 공격 관련 내용은 **방어와 학습 목적**입니다. 실습은 본인이 소유하거나 서면으로 허가받은 환경에서만 수행하세요. 허가 없는 시스템에 대한 시도는 정보통신망법 등 관련 법령 위반이 될 수 있습니다.
