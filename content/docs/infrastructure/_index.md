---
title: "④ 인프라·공급망 보안"
weight: 4
---

AI 시스템의 보안 사고를 다루다 보면 자주 등장하는 오해가 있습니다. "AI 보안은 완전히 새로운 분야이고, 기존 보안 지식은 별로 쓸모가 없다"는 생각입니다. 하지만 Google이 제시한 **SAIF(Secure AI Framework, 보안 AI 프레임워크)** 의 관점은 다릅니다 — AI 보안 문제의 상당 부분은 **이미 알고 있는 클라우드·플랫폼·공급망 보안 모범 사례를, AI 파이프라인을 구성하는 새로운 컴포넌트들에 정확히 적용하는 일**입니다.

## SAIF 관점: AI 파이프라인 = 기존 보안 통제의 새로운 적용 대상

전통적인 소프트웨어 시스템의 공격 표면(네트워크, 인증/인가, 의존성 관리, 접근 제어, 로깅/모니터링)은 AI 시스템에도 그대로 존재합니다. 다만 다음과 같은 **AI 고유의 컴포넌트**가 새로운 보호 대상으로 추가됩니다.

| AI 파이프라인 컴포넌트 | 기존 보안 개념의 적용 | AI 고유의 추가 고려사항 |
|---|---|---|
| **모델 프레임워크 & 코드** | 소스코드 보안, 의존성 스캐닝, SAST | PyTorch/TensorFlow 등 ML 프레임워크의 CVE, pickle 역직렬화 위험 |
| **학습/튜닝/평가 파이프라인** | CI/CD 보안, 파이프라인 접근 제어 | 학습 데이터 무결성, 실험 추적 시스템 권한, 평가 데이터셋 오염 방지 |
| **데이터 & 모델 저장소** | 스토리지 암호화, IAM, 버전 관리 | 학습 데이터셋·모델 가중치의 출처(Provenance) 추적, 모델 카드 |
| **모델 서빙(Serving)** | API 게이트웨이, rate limiting, 인증/인가 | 추론 입출력 검증, 모델 추출 방어, 모델 DoS(OWASP LLM04) |

즉, 보안팀이 이미 운영 중인 **IAM, 네트워크 분리, 시크릿 관리, SBOM(Software Bill of Materials), 취약점 스캐닝** 같은 통제들을 "모델 가중치 파일", "학습 데이터셋", "실험 추적 서버", "추론 엔드포인트" 같은 새로운 자산 유형에 빠짐없이 적용하는 것이 인프라·공급망 보안의 핵심입니다.

{{< callout type="info" >}}
이 관점은 [거버넌스·리스크 관리](../governance) 섹션의 [OWASP LLM Top 10](../governance/owasp-llm-top10)과도 직접 연결됩니다. LLM04(모델 DoS), LLM05(공급망 취약점) 같은 항목은 본질적으로 "AI 컴포넌트에 적용되지 않은 기존 보안 통제"의 문제입니다.
{{< /callout >}}

## 이 섹션에서 다루는 내용

1. **[MLOps 파이프라인 보안](mlops-pipeline-security)** — 데이터 수집부터 모니터링까지 ML 파이프라인 각 단계의 보안 고려사항과 CI/CD 접근 제어
2. **[모델 서빙 보안](model-serving-security)** — 추론 엔드포인트 보호, 모델 레지스트리 권한 분리, 모델 무결성 검증, 모델 DoS 방어
3. **[공급망 보안](supply-chain-risk)** — 사전학습 모델·오픈소스 가중치·데이터셋·의존성에 내재된 공급망 리스크와 SBOM for AI

{{< cards >}}
  {{< card link="mlops-pipeline-security" title="MLOps 파이프라인 보안" subtitle="데이터 수집→전처리→학습→평가→배포→모니터링 단계별 보안과 CI/CD 접근 제어" icon="cog" >}}
  {{< card link="model-serving-security" title="모델 서빙 보안" subtitle="추론 엔드포인트 보호, 모델 레지스트리, 무결성 검증, 모델 DoS 방어" icon="server" >}}
  {{< card link="supply-chain-risk" title="공급망 보안" subtitle="사전학습 모델·데이터셋·의존성의 공급망 리스크와 SBOM for AI" icon="link" >}}
  {{< card link="../../labs/lab7-supply-chain-check/" title="Lab 7: AI 모델 공급망 보안 점검" subtitle="pip-audit·SBOM·체크섬으로 모델의 의존성과 출처를 점검하고 모델 카드를 작성합니다" icon="pencil-alt" >}}
{{< /cards >}}
