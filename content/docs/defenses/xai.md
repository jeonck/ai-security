---
title: "설명 가능한 AI (XAI)"
weight: 3
---

설명 가능한 AI(Explainable AI, XAI)는 "블랙박스"로 여겨지는 머신러닝 모델의 내부 동작이나 개별 예측의 근거를 사람이 이해할 수 있는 형태로 제공하는 기법들을 말합니다. AI 보안의 맥락에서 XAI는 단순한 "설명"을 넘어, **이상 탐지, 모델 행동 감사, 백도어/포이즈닝 탐지, 신뢰성·책임성(accountability) 확보**를 위한 도구로 활용됩니다. 동시에, XAI가 제공하는 설명 자체가 새로운 공격 표면이 될 수 있다는 점도 함께 이해해야 합니다.

{{< callout type="info" >}}
XAI 기법은 크게 **모델에 무관한(model-agnostic) 사후(post-hoc) 설명 기법**(SHAP, LIME 등)과 **모델 구조에 내재된 설명 기법**(attention, saliency map 등)으로 나눌 수 있습니다. 보안 활용 시에는 어떤 종류의 설명인지, 그리고 그 설명이 얼마나 신뢰할 수 있는지(faithfulness)를 함께 고려해야 합니다.
{{< /callout >}}

## 1. 대표적인 XAI 기법 개요

### SHAP (SHapley Additive exPlanations)

- 게임 이론의 **Shapley value** 개념을 머신러닝 예측에 적용한 기법
- 각 입력 특성(feature)이 예측 결과에 기여한 정도를 "협력 게임에서의 보상 분배"처럼 공정하게 분배하여 계산
- 특정 예측값 `f(x)`를 기준선(baseline, 예: 전체 데이터의 평균 예측값)으로부터의 차이로 분해: `f(x) - E[f(X)] = Σ_i φ_i`, 여기서 `φ_i`는 특성 `i`의 Shapley value
- 장점: 이론적으로 일관된 공정성 보장(efficiency, symmetry, dummy, additivity 등의 axiom 만족)
- 단점: 정확한 계산은 특성 개수에 대해 지수적(exponential) 비용 → KernelSHAP, TreeSHAP, DeepSHAP 등 근사/특화 알고리즘 사용

### LIME (Local Interpretable Model-agnostic Explanations)

- 복잡한 모델의 예측을 **국소적으로(locally)** 설명하기 위해, 관심 있는 입력 근처에서 샘플을 생성하고 그 샘플들에 대한 모델 출력을 이용해 **단순한 해석 가능 모델(선형 모델 등)**을 적합(fit)
- 즉 "이 특정 입력 근처에서는 모델이 대략 이런 선형 관계로 동작한다"는 국소적 근사를 제공
- 장점: 모델 구조에 무관하게(model-agnostic) 적용 가능, 텍스트/이미지/테이블 데이터 모두 적용
- 단점: 샘플링 방식과 perturbation 방법에 따라 설명이 불안정(instability)할 수 있고, 국소 근사가 실제 모델의 전역 동작을 대표하지 못할 수 있음

### Attention Visualization

- Transformer 등 attention 메커니즘을 사용하는 모델에서, 특정 출력 토큰을 생성할 때 입력의 어느 부분에 "주의(attention weight)"를 더 많이 두었는지 시각화
- 자연어처리, 멀티모달 모델 등에서 직관적인 해석을 제공 (예: 번역 모델이 어떤 원문 단어에 집중해 번역어를 생성했는지)
- 주의점: attention weight가 항상 "모델의 진짜 판단 근거"를 의미하지는 않는다는 비판적 연구들이 존재 ("Attention is not Explanation" 논쟁) — 보조적 신호로 활용하는 것이 안전

### Saliency Maps (Gradient 기반 시각화)

- 입력(주로 이미지)의 각 픽셀에 대해, 출력에 대한 그래디언트(`∂output/∂input`)의 크기를 시각화하여 "어떤 픽셀이 예측에 가장 큰 영향을 미쳤는가"를 보여줌
- 대표 기법: Vanilla Gradient, Grad-CAM, Integrated Gradients, SmoothGrad 등
- Grad-CAM은 CNN의 마지막 컨볼루션 레이어의 그래디언트를 이용해 클래스별 활성화 영역을 히트맵으로 표현 → 이미지 분류기가 "어디를 보고" 판단했는지 직관적으로 확인 가능
- 주의점: saliency map은 노이즈에 민감하며, 시각적으로 그럴듯해 보이지만 실제 모델 결정과 무관한 패턴을 보여줄 수 있음(fragility of saliency maps 연구)

## 2. XAI의 보안 역할

### 이상 탐지 (Anomaly Detection)

정상적인 입력에 대한 모델의 설명 패턴(예: SHAP value 분포, attention 패턴)을 기준선으로 학습해두면, 추론 시점에 이 패턴이 비정상적으로 벗어나는 입력을 탐지할 수 있습니다. 예를 들어:

- 정상적인 이미지 분류에서는 saliency가 객체 영역에 집중되는데, 적대적 예제에서는 배경이나 무의미한 영역에 saliency가 분산되는 경우가 관찰됨
- 이런 차이를 이용해 적대적 입력 탐지기를 구성하는 연구들이 존재 (단, 적응형 공격에는 우회될 수 있음)

### 모델 행동 감사 (Model Behavior Auditing)

- 모델이 배포 후 어떤 특성에 의존해 의사결정을 내리는지 주기적으로 점검 → **모델 드리프트(drift)**나 의도하지 않은 **shortcut learning**(예: 의료 영상 분류기가 병변이 아닌 영상 장비의 워터마크를 학습) 발견
- 규제 산업(금융, 의료, 채용 등)에서는 "왜 이런 결정을 내렸는가"에 대한 설명 의무가 있으며, SHAP/LIME 기반 설명이 감사 증거(audit trail)로 활용됨

### 포이즈닝/백도어 탐지에의 활용

[데이터 포이즈닝(Data Poisoning)](../attacks/data-poisoning) 및 백도어(트로이목마) 공격은 종종 모델이 특정 트리거 패턴(예: 이미지의 작은 패치, 텍스트의 특정 문구)에 비정상적으로 강하게 반응하도록 학습시킵니다. XAI는 이를 탐지하는 데 활용될 수 있습니다.

- 백도어가 삽입된 모델은 트리거가 포함된 입력에 대해 **saliency/attention이 트리거 영역에 비정상적으로 집중**되는 경향을 보일 수 있음
- 다수의 입력에 대한 설명을 클러스터링하여, "정상적인 설명 패턴과 동떨어진" 소수의 입력군을 탐지 (예: Spectral Signatures, Activation Clustering과 결합한 접근)
- 다만 정교하게 설계된 백도어는 설명 패턴까지 정상처럼 보이도록 적응될 수 있어, XAI 단독으로는 완전한 탐지 수단이 되기 어렵고 다른 탐지 기법과 병행 사용해야 함

### 신뢰성과 책임성 (Trust & Accountability)

- 사용자/규제기관/감사자에게 "왜 이 결정이 내려졌는가"를 제공함으로써 시스템에 대한 신뢰를 구축
- 사고(incident) 발생 시 원인 분석(root cause analysis)에 필요한 근거 자료 제공
- [NIST AI RMF](../governance/nist-ai-rmf)를 비롯한 다수의 AI 거버넌스 프레임워크가 **투명성(Transparency)**과 **설명가능성(Explainability)**을 핵심 요구사항으로 명시하고 있음

## 3. XAI 자체의 공격 표면

XAI는 보안을 강화하는 도구이지만, 동시에 새로운 위협을 만들어낼 수 있습니다.

### 설명을 이용한 모델 추출 (Model Extraction via Explanations)

- 모델의 예측값뿐 아니라 SHAP value나 gradient 기반 설명까지 API로 제공하면, 공격자는 이 추가 정보를 이용해 모델의 결정 경계(decision boundary)를 훨씬 효율적으로 추정할 수 있음
- 설명은 본질적으로 "모델이 입력의 어느 부분에 민감한가"에 대한 그래디언트 수준의 정보를 노출하는 것이므로, [모델 탈취](../attacks/model-theft) 공격의 질의 효율성을 크게 높여줄 수 있음

### 설명을 이용한 적대적 예제 생성

- saliency map이나 gradient 기반 설명은 본질적으로 `∂output/∂input` 정보를 담고 있어, 이를 그대로 [적대적 예제](../attacks/adversarial-examples) 생성에 활용 가능 (사실상 화이트박스 그래디언트 정보를 제공하는 것과 유사한 효과)

### 설명 자체의 조작 (Manipulating Explanations)

- 공격자가 모델 파라미터를 약간 조정하거나 입력을 perturbation하여, **예측 결과는 그대로 유지하면서 설명만 다르게 보이도록** 만들 수 있다는 연구들이 존재 (예: "차별적인 결정을 내리지만 설명은 공정한 것처럼 보이게" 하는 공격)
- 이는 XAI를 "투명성 확보"의 증거로만 신뢰할 경우, 오히려 거짓 신뢰(false sense of trust)를 줄 수 있음을 시사

{{< callout type="warning" >}}
프로덕션 API에서 설명(SHAP/그래디언트 등)을 외부에 노출할 때는, 일반 예측 API보다 더 신중한 접근 제어와 rate limiting이 필요합니다. 설명은 "추가 정보 누출 채널"이 될 수 있습니다.
{{< /callout >}}

## 4. 실무 적용 가이드

- 설명 기법을 선택할 때는 **충실도(faithfulness)**와 **안정성(stability/robustness)**을 함께 평가해야 합니다. 그럴듯해 보이지만 모델의 실제 동작과 무관한 설명은 오히려 잘못된 결론으로 이어질 수 있습니다.
- 보안 모니터링에 XAI를 사용할 경우, 단일 기법에 의존하지 말고 여러 설명 기법(SHAP + saliency + attention 등)의 결과를 교차 검증하는 것이 권장됩니다.
- 외부에 노출되는 설명 정보의 양은 "필요한 최소한"으로 제한하고, 모델 추출/적대적 예제 생성에 악용될 수 있는 그래디언트 수준의 raw 정보는 가능하면 가공/제한된 형태로 제공해야 합니다.
- 거버넌스 차원에서 설명가능성 요구사항을 충족하기 위해 어떤 XAI 기법을 사용했는지, 그 한계는 무엇인지 모델 문서(model card)에 명시하는 것이 바람직합니다.

## 관련 페이지

- XAI가 탐지를 돕는 공격: [데이터 포이즈닝 (Data Poisoning)](../attacks/data-poisoning)
- 투명성 요구사항과 거버넌스: [NIST AI RMF](../governance/nist-ai-rmf)
