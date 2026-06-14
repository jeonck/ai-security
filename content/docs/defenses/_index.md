---
title: "③ 방어 기법"
weight: 3
---

AI 시스템에 대한 공격이 다양화됨에 따라, 이에 대응하는 방어 기법들도 함께 발전해 왔습니다. 방어 기법은 단독으로 학습하기보다, **어떤 공격을 막기 위해 등장했는지**를 짝지어 이해하는 것이 효과적입니다. 이 섹션에서는 대표적인 세 가지 방어 기법군을 다루며, 각 기법이 대응하는 공격 유형을 함께 살펴봅니다.

## 공격-방어 매핑으로 보는 큰 그림

| 방어 기법 | 주로 대응하는 공격 | 핵심 아이디어 |
|---|---|---|
| 적대적 훈련 (Adversarial Training) | [적대적 예제 (Adversarial Examples)](../attacks/adversarial-examples) | 훈련 과정에 적대적 예제를 포함시켜 모델의 견고성(robustness)을 높임 |
| 차분 프라이버시 (Differential Privacy) | [모델 탈취 / 멤버십 추론 (Model Theft)](../attacks/model-theft) | 학습 데이터 하나하나가 모델 출력에 주는 영향을 수학적으로 제한하여 개인정보 유출 방지 |
| 설명 가능한 AI (XAI) | [데이터 포이즈닝 (Data Poisoning)](../attacks/data-poisoning) | 모델의 판단 근거를 시각화/정량화하여 이상 행동과 백도어를 탐지하고 신뢰성을 확보 |

{{< callout type="info" >}}
방어 기법은 "은탄환(silver bullet)"이 아닙니다. 적대적 훈련은 정확도 저하를 동반하고, 차분 프라이버시는 모델 성능과 공정성에 영향을 주며, XAI는 그 자체로 새로운 공격 표면이 될 수 있습니다. 각 기법의 트레이드오프를 함께 이해하는 것이 중요합니다.
{{< /callout >}}

## 왜 공격과 방어를 짝지어 공부해야 하는가

1. **위협 모델이 방어 설계를 결정합니다.** 예를 들어 적대적 예제 방어는 "테스트 시점에 입력이 미세하게 조작된다"는 위협 모델을 가정하지만, 차분 프라이버시는 "훈련 데이터 자체가 유출될 수 있다"는 전혀 다른 위협 모델을 다룹니다. 방어 기법을 공격 시나리오와 분리해서 외우면 실제 보안 설계에서 적용 시점과 우선순위를 잘못 판단하기 쉽습니다.
2. **방어는 종종 다른 공격에 새로운 약점을 만듭니다.** 차분 프라이버시로 멤버십 추론을 방어하면 모델의 소수 클래스 정확도가 떨어져 공정성 문제가 생길 수 있고, XAI로 설명을 제공하면 그 설명 자체가 모델 추출(model extraction) 공격에 활용될 수 있습니다. 이런 이차 효과를 이해하려면 공격-방어 양쪽을 모두 알아야 합니다.
3. **규제와 거버넌스 요구사항은 방어 기법의 적용을 요구합니다.** [NIST AI RMF](../governance/nist-ai-rmf)와 같은 프레임워크는 투명성(transparency), 견고성(robustness), 프라이버시 보호를 명시적으로 요구하므로, 방어 기법은 단순한 기술 선택이 아니라 컴플라이언스 요구사항이기도 합니다.

## 이 섹션의 구성

{{< cards >}}
  {{< card link="adversarial-training" title="적대적 훈련 (Adversarial Training)" subtitle="적대적 예제에 대응하기 위해 훈련 과정 자체를 견고하게 만드는 기법" >}}
  {{< card link="differential-privacy" title="차분 프라이버시 (Differential Privacy)" subtitle="모델 탈취 및 멤버십 추론, 데이터 유출에 대응하는 수학적 프라이버시 보장" >}}
  {{< card link="xai" title="설명 가능한 AI (XAI)" subtitle="모델의 판단을 설명하여 이상 탐지, 감사, 신뢰성 확보에 활용" >}}
  {{< card link="../../labs/lab6-adversarial-training-defense/" title="Lab 6: 적대적 훈련으로 모델 방어하기" subtitle="Lab 1의 FGSM/PGD 공격에 대한 robust accuracy를 적대적 훈련 적용 전/후로 비교합니다" icon="pencil-alt" >}}
{{< /cards >}}

## 공격 섹션과의 연결

- [적대적 예제 (Adversarial Examples)](../attacks/adversarial-examples) ↔ [적대적 훈련](adversarial-training)
- [모델 탈취 (Model Theft)](../attacks/model-theft) ↔ [차분 프라이버시](differential-privacy)
- [데이터 포이즈닝 (Data Poisoning)](../attacks/data-poisoning) ↔ [설명 가능한 AI (XAI)](xai)

각 방어 기법 페이지에서는 해당 공격 페이지로 돌아가는 링크와, 실습이 가능한 경우 [레드팀 실습](../red-teaming/art-foolbox-practice) 페이지로의 링크를 함께 제공합니다.
