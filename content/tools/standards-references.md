---
title: "표준 및 참고 문서"
weight: 3
---

AI 보안은 빠르게 변화하는 분야이기 때문에, 특정 책이나 강의보다 **공식 표준 문서와 프레임워크 원문**을 직접 읽는 것이 가장 신뢰할 수 있는 정보원입니다. [거버넌스·리스크 관리](/docs/governance) 섹션에서 다룬 핵심 표준들의 원문 링크와 간단한 설명을 이곳에 모아두었습니다.

{{< callout type="info" >}}
이 문서들은 모두 지속적으로 업데이트됩니다. 버전과 항목명이 바뀔 수 있으니, [거버넌스·리스크 관리](/docs/governance)에서 설명하는 "프레임워크의 구조와 사고방식"을 먼저 이해한 뒤, 세부 항목은 항상 아래 원문 링크에서 최신 버전을 확인하세요.
{{< /callout >}}

## OWASP Top 10 for LLM Applications

**요약**: LLM 기반 애플리케이션에서 가장 빈번히 발생하는 10가지 취약점(프롬프트 인젝션, 과도한 권한 위임, 민감정보 노출 등)을 정리한 목록입니다. 전통적인 웹 OWASP Top 10과 같은 형식으로, LLM 애플리케이션 개발자와 보안 담당자가 가장 먼저 참고해야 할 체크리스트입니다.

**원문**: https://owasp.org/www-project-top-10-for-large-language-model-applications/

**관련 학습 페이지**: [OWASP LLM Top 10](/docs/governance/owasp-llm-top10) — 10개 항목을 4계층(프롬프트/출력/툴 실행/권한) 프레임으로 재분류해 실무에서 활용하는 방법을 다룹니다.

## MITRE ATLAS

**요약**: MITRE ATT&CK의 AI 시스템 버전으로, 공격자가 AI/ML 시스템을 노릴 때 사용하는 **전술(Tactics)과 기법(Techniques)**을 체계적으로 정리한 지식베이스입니다. 데이터 수집(reconnaissance) 단계부터 모델 탈취, 데이터 포이즈닝, 적대적 예제 생성, 영향(impact) 단계까지의 공격 체인을 표준화된 용어로 기술합니다. 위협모델링과 레드팀 시나리오 설계에 직접 활용됩니다.

**원문**: https://atlas.mitre.org/

**관련 학습 페이지**: [MITRE ATLAS](/docs/governance/mitre-atlas) — ATLAS의 전술 매트릭스를 OWASP LLM Top 10의 4계층과 연결해, "공격자가 어떤 순서로 시스템을 노리는가"를 시간축 관점에서 설명합니다.

## NIST AI Risk Management Framework (AI RMF)

**요약**: 미국 NIST(국립표준기술연구소)가 발행한 AI 시스템의 위험을 관리하기 위한 자발적(voluntary) 프레임워크입니다. AI 시스템의 신뢰성(trustworthiness)을 정의하고, 이를 **Govern(거버넌스) – Map(맵핑) – Measure(측정) – Manage(관리)**의 4가지 핵심 기능으로 구조화합니다. 조직 차원의 AI 위험관리 프로세스를 설계할 때 가장 널리 참조되는 프레임워크입니다.

**원문**: https://www.nist.gov/itl/ai-risk-management-framework

**관련 학습 페이지**: [NIST AI RMF](/docs/governance/nist-ai-rmf) — Govern/Map/Measure/Manage 4기능을 AI 보안 실무 활동(위험 등록부 작성, 통제 매핑 등)에 적용하는 방법을 다룹니다.

## NIST Generative AI Profile

**요약**: NIST AI RMF의 부속 문서로, **생성형 AI(Generative AI)**에 특화된 위험(환각, 유해 콘텐츠 생성, 딥페이크, 학습 데이터 유출, 환경 영향 등)과 이를 관리하기 위한 실행 항목(actions)을 제공합니다. AI RMF의 일반적인 4기능을 생성형 AI/LLM 맥락에 맞게 구체화한 보충 자료로 이해하면 됩니다.

**원문**: https://www.nist.gov/itl/ai-risk-management-framework (NIST AI RMF 페이지 내 "Generative AI Profile" 섹션에서 확인 가능)

**관련 학습 페이지**: [NIST AI RMF](/docs/governance/nist-ai-rmf) — AI RMF 본문과 함께, 생성형 AI/LLM 시스템에 적용할 때의 추가 고려사항을 설명합니다.

## EU AI Act

**요약**: 유럽연합이 제정한 세계 최초의 포괄적 AI 규제법입니다. AI 시스템을 위험 수준에 따라 **금지(prohibited), 고위험(high-risk), 제한적 위험(limited risk), 최소 위험(minimal risk)**의 4단계로 분류하고, 각 단계에 맞는 의무(투명성, 위험관리, 인적 감독 등)를 부과합니다. 글로벌 서비스를 운영하는 조직이라면 컴플라이언스 관점에서 반드시 이해해야 할 규제입니다.

**원문**: https://artificialintelligenceact.eu/

**관련 학습 페이지**: [EU AI Act](/docs/governance/eu-ai-act) — 위험 기반 분류 체계와 각 단계별 의무를, 앞서 다룬 NIST AI RMF·OWASP LLM Top 10과 비교하며 설명합니다.

## Google SAIF (Secure AI Framework)

**요약**: Google이 발표한 AI 시스템 보안을 위한 개념적 프레임워크입니다. 안전한 기본값(secure-by-default) 인프라 확장, 위협 탐지·대응의 AI 적용, 입력/출력 제어 자동화, 모델 보호 강화 등 6개의 핵심 요소로 구성되며, AI 시스템의 **개발-배포-운영 전체 생명주기**에 걸친 보안 통제를 다룹니다. [학습 로드맵](/docs)에서 추천하는 학습 순서(거버넌스 → 인프라/공급망 → 방어 기법) 설계에도 SAIF의 생명주기 관점이 반영되어 있습니다.

**원문**: https://safety.google/cybersecurity-advancements/saif/

**관련 학습 페이지**: [거버넌스·리스크 관리](/docs/governance) — SAIF의 생명주기 관점이 OWASP, NIST, MITRE ATLAS 등 다른 프레임워크와 어떻게 보완적으로 맞물리는지 개괄합니다.

## Microsoft AI Red Teaming 가이드

**요약**: Microsoft AI Red Team이 자체 경험을 바탕으로 공개한 AI 시스템 레드티밍 가이드입니다. "먼저 수동 레드팀으로 위험 표면을 드러낸 뒤, 자동화된 측정·완화로 연결하라"는 접근 방식을 제시하며, 책임감 있는 AI(Responsible AI) 위험과 전통적 보안 위험을 함께 다루는 통합적 레드팀 방법론을 설명합니다. PyRIT(도구 섹션 참고)도 이 가이드의 철학을 구현한 결과물입니다.

**원문**: Microsoft Learn의 "Planning red teaming for large language models (LLMs) and their applications" 문서를 검색해 참고하세요 (https://learn.microsoft.com 에서 "AI red teaming" 검색).

**관련 학습 페이지**: [LLM·에이전트 레드티밍](/docs/red-teaming/llm-red-teaming) — 이 가이드의 접근 방식을 기반으로 작은 RAG 챗봇을 직접 레드티밍하는 실습을 안내합니다. 사용 도구는 [LLM 레드팀 도구](llm-redteam-tools)를 참고하세요.

## 표준 간 관계 한눈에 보기

| 문서 | 성격 | 주요 용도 |
|---|---|---|
| OWASP LLM Top 10 | 취약점 체크리스트 | 애플리케이션/코드 레벨 점검 |
| MITRE ATLAS | 공격 기법 분류체계 | 위협모델링, 레드팀 시나리오 설계 |
| NIST AI RMF | 위험관리 프로세스 프레임워크 | 조직 차원의 거버넌스 구축 |
| NIST GenAI Profile | NIST AI RMF의 생성형 AI 보충자료 | LLM 특화 위험 식별 |
| EU AI Act | 법적 규제 | 컴플라이언스, 법적 의무 판단 |
| Google SAIF | 보안 생명주기 프레임워크 | 개발-배포-운영 보안 설계 |
| Microsoft AI Red Teaming 가이드 | 레드팀 방법론 | 실전 레드팀 프로세스 설계 |

## 더 알아보기

- [거버넌스·리스크 관리](/docs/governance) — 위 표준들을 서로 연결해 "어떤 질문에 어떤 표준을 참조해야 하는가"를 설명합니다.
- [학습 로드맵](/docs) — 표준/거버넌스 학습이 전체 AI 보안 학습 흐름에서 어디에 위치하는지 확인할 수 있습니다.
- [실습 (Labs)](/labs) — 표준의 체크리스트를 실제 시스템에 적용해보는 실습을 제공합니다.
