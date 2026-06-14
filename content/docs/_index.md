---
title: AI 보안 학습 로드맵
linkTitle: 학습 로드맵
cascade:
  type: docs
sidebar:
  open: true
---

## AI 보안, 어떻게 공부해야 할까

AI 보안은 크게 **다섯 개 지식 축**과 **하나의 실전 축**으로 나눌 수 있습니다.

1. **[기반 지식](foundations)** — 일반 보안(네트워크·웹·암호학)과 ML/딥러닝 기초를 함께 다집니다. 둘 중 하나만 알면 AI 보안을 이해할 때 반쪽 이해에 그칩니다.
2. **[공격 기법](attacks)** — 적대적 예제, 데이터 포이즈닝, 모델 탈취는 전통 ML 시대부터의 공격이고, 프롬프트 인젝션·탈옥은 LLM 시대에 새로 부각된 영역입니다.
3. **[방어 기법](defenses)** — 공격 유형에 대응하는 방어 방법론(적대적 훈련, 차분 프라이버시, XAI 등)을 짝지어 학습합니다.
4. **[인프라·공급망 보안](infrastructure)** — MLOps 파이프라인, 모델 서빙, 의존성·공급망 리스크를 다룹니다.
5. **[거버넌스·리스크 관리](governance)** — OWASP LLM Top 10, MITRE ATLAS, NIST AI RMF, EU AI Act 등 규제·표준 흐름을 이해합니다.
6. **[레드팀·실전 경험](red-teaming)** — ART/Foolbox 실습, AI 레드티밍, 버그바운티, 12주 로드맵으로 지식을 체화합니다.

{{< callout type="info" >}}
**추천 학습 순서: ② → ⑤ → ④ → ③ → ① → ⑥**

지금 시장에서 가장 빨리 부딫히는 문제는 "모델 자체를 깨는 일"보다 "**LLM이 들어간 앱과 에이전트를 안전하게 운영하는 일**"입니다.
OWASP는 prompt injection, insecure output handling, excessive agency 같은 애플리케이션/에이전트 계층 이슈를 핵심 위험으로 제시하고,
Microsoft도 먼저 수동 레드팀으로 위험 표면을 드러낸 뒤 측정·완화로 연결하라고 권합니다.

즉 **RAG/agent/chatbot 보안 → 거버넌스 → 인프라/공급망 → 방어 기법 → 기반 지식 → 레드팀** 순으로 학습하면
훨씬 빠르게 실무 감각이 생기고, 이후 모델 탈취·데이터 포이즈닝·멤버십 추론 같은 전통 ML 보안 주제로 깊게 들어가면 균형이 좋습니다.
{{< /callout >}}

## 배경별 추천 진입점

{{< cards >}}
  {{< card link="governance" title="GRC / 보안기획" subtitle="NIST 기반 위험관리 + OWASP 기반 통제 목록 + 사고대응·벤더관리 구조를 먼저 잡습니다." icon="scale" >}}
  {{< card link="attacks" title="AppSec / Backend / Platform" subtitle="LLM 앱 보안 → 에이전트 권한 통제 → 서빙/공급망 → 레드팀 순서로 진행합니다." icon="code" >}}
  {{< card link="foundations" title="ML Engineer / Data Scientist" subtitle="데이터·평가 파이프라인 신뢰성 → 프라이버시/IP → 모델·데이터 스토리지 → 레드팀 순서가 좋습니다." icon="chip" >}}
{{< /cards >}}

## 12주 학습 플랜

| 주차 | 내용 |
|---|---|
| 1~4주차 | OWASP LLM Top 10을 기준으로 취약점을 분류하고, 작은 RAG/에이전트 앱에 직접 공격해 봅니다. |
| 5~8주차 | SAIF 관점으로 서빙, 스토리지, 프레임워크, 의존성, 권한 체계를 정리합니다. |
| 9~10주차 | MITRE ATLAS 전술로 위협모델을 만들고 레드팀 시나리오를 구조화합니다. |
| 11~12주차 | NIST 형식으로 위험 등록부, 운영 통제, 사고대응까지 문서화합니다. |

자세한 실습 가이드는 [레드팀·실전 경험](red-teaming) 섹션을 참고하세요.

## 전체 섹션

{{< cards >}}
  {{< card link="foundations" title="① 기반 지식" subtitle="일반 보안 + ML/DL 기초" icon="academic-cap" >}}
  {{< card link="attacks" title="② 공격 기법" subtitle="적대적 예제, 포이즈닝, 탈취, 프롬프트 인젝션, 탈옥" icon="shield-exclamation" >}}
  {{< card link="defenses" title="③ 방어 기법" subtitle="적대적 훈련, 차분 프라이버시, XAI" icon="lock-closed" >}}
  {{< card link="infrastructure" title="④ 인프라·공급망 보안" subtitle="MLOps, 모델 서빙, 공급망 리스크" icon="server" >}}
  {{< card link="governance" title="⑤ 거버넌스·리스크 관리" subtitle="OWASP, MITRE ATLAS, NIST AI RMF, EU AI Act" icon="scale" >}}
  {{< card link="red-teaming" title="⑥ 레드팀·실전 경험" subtitle="ART/Foolbox, AI 레드티밍, 버그바운티, 12주 로드맵" icon="beaker" >}}
{{< /cards >}}
