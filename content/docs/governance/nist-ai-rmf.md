---
title: "NIST AI RMF"
weight: 3
---

**NIST AI Risk Management Framework(AI RMF)**는 미국 국립표준기술연구소(NIST)가 발표한 AI 위험관리 프레임워크입니다. OWASP나 ATLAS가 "무엇이 취약하고 공격자가 어떻게 움직이는가"라는 보안 중심 시각을 제공하는 반면, NIST AI RMF는 **"조직이 AI 위험을 어떤 절차로 식별·평가·대응·관리해야 하는가"**라는 거버넌스 프로세스를 제시합니다.

{{< callout type="info" >}}
NIST AI RMF는 보안에만 한정되지 않습니다. 공정성(fairness), 안전성(safety), 신뢰성(reliability), 프라이버시 등 "신뢰할 수 있는 AI(Trustworthy AI)"의 여러 속성을 포괄합니다. 이 페이지에서는 보안/위험관리 관점에서 핵심만 추립니다.
{{< /callout >}}

## 4단계 핵심 구조: Govern → Map → Measure → Manage

NIST AI RMF의 핵심은 4개의 기능(Function)으로 구성된 순환 구조입니다. 이 4단계는 한 번 실행하고 끝나는 것이 아니라, AI 시스템의 생애주기 전반에서 반복적으로 수행됩니다.

| 단계 | 핵심 질문 | 주요 활동 |
|---|---|---|
| **Govern** | "위험관리를 위한 조직 체계가 갖춰져 있는가?" | 정책/역할/책임 정의, 위험 허용 수준(risk tolerance) 설정, 거버넌스 보드 운영 |
| **Map** | "이 AI 시스템의 맥락과 위험은 무엇인가?" | 시스템의 목적·사용자·데이터·이해관계자 식별, 위험 카테고리 매핑 |
| **Measure** | "위험을 어떻게 측정하고 평가할 것인가?" | 평가 지표 정의, 테스트/레드팀 결과 측정, 신뢰성·강건성·공정성 평가 |
| **Manage** | "식별된 위험에 어떻게 대응할 것인가?" | 우선순위화, 위험 대응(완화/수용/이전/회피), 사고 대응 및 배포 중단 |

이 4단계는 [MITRE ATLAS](mitre-atlas)에서 만든 레이어별 위협 매핑 결과를 **Map** 단계의 입력으로 사용하고, [OWASP LLM Top 10](owasp-llm-top10)의 4계층 분류를 **Measure** 단계에서 측정 항목 설계에 활용하는 식으로 자연스럽게 연결됩니다.

### 단계별 좀 더 구체적인 활동

**Govern**
- AI 시스템 도입/변경에 대한 승인 프로세스 정의
- 보안, 법무, 프로덕트, ML 엔지니어링 간 책임 경계(RACI) 명확화
- 제3자(외부 모델 제공자, 데이터 벤더) 관리 정책

**Map**
- 시스템의 의도된 목적과 실제 사용 맥락(intended vs. actual use) 차이 식별
- 영향을 받는 이해관계자(최종 사용자, 데이터 주체, 운영자) 식별
- 위 [MITRE ATLAS](mitre-atlas) 4-레이어 모델을 활용한 위험 카테고리 도출

**Measure**
- 정량적 지표(정확도, 강건성, 응답 시간) + 정성적 평가(레드팀 결과, 사용자 피드백) 결합
- 배포 전 평가뿐 아니라 **배포 후 지속적 모니터링** 체계 구축
- 평가 결과를 Govern 단계의 위험 허용 수준과 비교

**Manage**
- 측정된 위험에 대한 대응 계획(완화 조치, 보상 통제) 수립
- 사고 발생 시 대응 절차(누가 무엇을 하는가) 정의
- **배포 중단(deactivation) 기준과 절차** 사전 정의 — 이것이 자주 누락되는 영역입니다.

## GenAI 프로파일이 강조하는 위험 범주

NIST는 AI RMF의 일반 프레임워크 위에 **생성형 AI(Generative AI) 전용 프로파일**을 추가로 발표했습니다. 이 프로파일은 LLM/GenAI 시스템에 특화된 위험 범주를 제시하는데, 학습 시 반드시 기억해야 할 항목들은 다음과 같습니다.

| 위험 범주 | 설명 | 관련 페이지 |
|---|---|---|
| Confabulation (Hallucination) | 모델이 사실이 아닌 내용을 그럴듯하게 생성 | [OWASP LLM09 Misinformation](owasp-llm-top10) |
| CBRN 정보 위험 | 화학·생물·방사능·핵 관련 위험 정보 생성/증폭 가능성 | — |
| Privacy / 데이터 노출 | 학습 데이터나 입력에 포함된 개인정보가 출력으로 노출 | [OWASP LLM02 Sensitive Information Disclosure](owasp-llm-top10) |
| Information Security | 모델/시스템이 새로운 보안 공격 표면을 만드는지 (프롬프트 인젝션 등) | [프롬프트 인젝션](../attacks/prompt-injection), [탈옥](../attacks/jailbreak) |
| Intellectual Property (IP) | 학습 데이터의 저작권 문제, 모델 출력의 IP 침해 가능성 | — |
| Value Chain & Component Integration | 외부 모델/데이터/플러그인 등 공급망 구성요소 통합 시 발생하는 위험 | [공급망 리스크](../infrastructure/supply-chain-risk) |
| Harmful Bias and Homogenization | 편향된 출력, 다양성 감소(여러 사용자가 비슷한 출력만 받음) | — |
| Dangerous/Violent/Hateful Content | 유해/위험 콘텐츠 생성 | [탈옥](../attacks/jailbreak) |

{{< callout type="warning" >}}
이 표는 GenAI 프로파일이 다루는 위험 범주의 학습용 요약입니다. 각 범주에 대한 정식 정의와 제안된 대응 활동(action)은 NIST의 공식 문서(AI 600-1)를 참고해야 합니다.
{{< /callout >}}

## 지속적 측정과 운영 중단 체계의 중요성

NIST AI RMF에서 실무자가 가장 자주 놓치는 부분이 바로 **Measure와 Manage의 "지속성"**입니다.

- **지속적 측정 (Continuous Measurement)**: AI 시스템은 배포 후에도 입력 분포, 모델 버전, 외부 데이터(RAG 인덱스 등)가 계속 변합니다. 배포 시점의 평가 결과가 6개월 후에도 유효하다고 가정해서는 안 됩니다. 따라서 운영 중에도 주기적인 레드팀/평가/모니터링이 필요합니다. → [인프라·공급망 보안](../infrastructure/_index)에서 다루는 모니터링/로깅 체계와 직접 연결됩니다.

- **사고 대응 및 배포 중단 (Incident Response & Deactivation)**: "이 모델/기능을 즉시 멈출 수 있는가?"는 위험관리에서 가장 중요한 질문 중 하나입니다. 다음과 같은 질문에 사전에 답이 준비되어 있어야 합니다.
  - 어떤 지표/이벤트가 발생하면 자동/수동으로 배포를 중단하는가? (예: 특정 유형의 프롬프트 인젝션 성공률이 임계치를 초과)
  - 중단 권한은 누구에게 있는가? 중단 후 사용자/이해관계자에게 어떻게 communication하는가?
  - 부분적 중단(특정 기능만 끄기)과 전체 중단을 구분할 수 있는 아키텍처인가?

이 두 가지는 운영(operations) 영역의 문제이기 때문에, [레드팀·실전 경험](../red-teaming/_index) 섹션에서 다루는 지속적 레드티밍/모니터링 실습과 함께 학습하는 것이 효과적입니다.

{{< callout type="info" >}}
**핵심 요약**: NIST AI RMF는 "한 번 평가하고 끝"이 아니라 **Govern → Map → Measure → Manage의 순환을 반복**하는 프로세스입니다. 특히 Measure(지속적 측정)와 Manage(중단 체계)를 배포 전이 아니라 **운영 단계의 핵심 과제**로 보는 시각이, 실무 인터뷰에서 깊이 있는 답변을 만드는 차별점이 됩니다.
{{< /callout >}}
