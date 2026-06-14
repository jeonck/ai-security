---
title: "실습 (Hands-on Labs)"
cascade:
  type: docs
sidebar:
  open: true
---

## 이 섹션은 무엇이 다른가

[학습 로드맵](/docs)은 AI 보안의 개념과 이론을 체계적으로 설명하고, [레드팀·실전 경험](/docs/red-teaming)은 레드팀을 "왜", "어떤 방법론으로" 수행하는지에 대한 접근 방식과 포트폴리오 전략을 다룹니다.

반면 이 **실습(Labs)** 섹션은 둘 중 어느 쪽도 아닙니다. 여기에는 **그대로 따라 하면 재현되는, 단계별로 실행 가능한 실습 가이드**만 담습니다. 각 실습은 다음과 같은 동일한 구조를 따릅니다.

1. **목표** — 이 실습을 통해 무엇을 확인/측정하는가
2. **사전 준비** — 필요한 패키지, 환경, 데이터
3. **단계별 실행** — 복사해서 실행할 수 있는 코드와 명령어
4. **결과 확인** — 출력을 어떻게 해석하고 무엇을 기록해야 하는가
5. **체크리스트** — 실습을 완료했는지 자가 점검

{{< callout type="info" >}}
모든 실습은 **Python 3.9+ 환경**을 전제로 합니다. `venv` 또는 `conda`로 격리된 가상환경을 만든 뒤 진행하는 것을 권장합니다.

```bash
python -m venv ai-sec-lab
source ai-sec-lab/bin/activate   # Windows: ai-sec-lab\Scripts\activate
```
{{< /callout >}}

## 실습 목록

{{< cards >}}
  {{< card link="lab1-adversarial-attack" title="Lab 1: 적대적 공격 실습" subtitle="ART로 이미지 분류기에 FGSM/PGD 공격을 실행하고 정확도 하락과 ASR을 측정합니다" >}}
  {{< card link="lab2-rag-redteam" title="Lab 2: RAG 챗봇 레드팀 실습" subtitle="악성 문서 삽입을 통한 간접 프롬프트 인젝션과 출력 처리 취약점을 테스트합니다" >}}
  {{< card link="lab3-ai-risk-register" title="Lab 3: AI 위험 등록부 작성하기" subtitle="OWASP·MITRE ATLAS·NIST AI RMF·EU AI Act를 통합해 AI 기능 1개의 위험 등록부를 작성합니다" >}}
  {{< card link="lab4-model-serving-security" title="Lab 4: AI 모델 서빙 API 보안 점검" subtitle="최소 ML 추론 API를 띄우고 네트워크·웹·암호학·ML 기초 관점에서 보안 설정을 점검/개선합니다" >}}
  {{< card link="lab5-data-poisoning-attack" title="Lab 5: 데이터 포이즈닝 공격 실습" subtitle="scikit-learn 분류 모델에 label-flipping과 백도어 트리거 포이즌을 주입하고 정확도/ASR을 측정합니다" >}}
  {{< card link="lab6-adversarial-training-defense" title="Lab 6: 적대적 훈련으로 모델 방어하기" subtitle="FGSM/PGD에 대한 robust accuracy를 방어 적용 전/후로 비교하고 정확도-강건성 트레이드오프를 관찰합니다" >}}
  {{< card link="lab7-supply-chain-check" title="Lab 7: AI 모델 공급망 보안 점검" subtitle="pip-audit·SBOM·체크섬으로 모델의 의존성과 출처를 점검하고 모델 카드를 작성합니다" >}}
{{< /cards >}}

{{< callout type="warning" >}}
이 섹션의 모든 실습은 **본인이 소유하거나 명시적으로 권한을 부여받은 모델/시스템**에서만 수행하세요. 타인의 서비스, 공개 API, 프로덕션 시스템에 대한 무단 공격 시도는 서비스 약관 위반 및 법적 책임을 수반할 수 있습니다. 모든 실습은 로컬 환경 또는 본인이 통제하는 테스트 환경에서 수행하는 것을 전제로 합니다.
{{< /callout >}}
