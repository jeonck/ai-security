---
title: "적대적 훈련 (Adversarial Training)"
weight: 1
---

적대적 훈련(Adversarial Training)은 [적대적 예제(Adversarial Examples)](../attacks/adversarial-examples)에 대응하기 위한 가장 직접적이고 널리 연구된 방어 기법입니다. 핵심 아이디어는 단순합니다: 모델이 적대적 예제에 속는다면, 훈련 과정에서부터 적대적 예제를 "보여주고" 올바르게 분류하도록 학습시키자는 것입니다.

{{< callout type="info" >}}
적대적 훈련은 "최선의 알려진 일반적 방어"로 평가받지만, 동시에 정확도 저하, 훈련 비용 증가, 특정 공격에 대한 과적합(overfitting to a threat model) 등의 한계를 가지고 있습니다. 이 페이지에서는 핵심 알고리즘과 트레이드오프를 함께 다룹니다.
{{< /callout >}}

## 1. 기본 개념: Min-Max 최적화

적대적 훈련은 일반적인 경험적 위험 최소화(Empirical Risk Minimization, ERM) 대신, 다음과 같은 **min-max(미니맥스) 최적화** 문제로 정식화됩니다.

```
min_θ  E_(x,y)~D [ max_(δ∈S) L(f_θ(x+δ), y) ]
```

- 내부의 `max` 항: 주어진 입력 `x`에 대해, 허용된 perturbation 집합 `S` (예: L∞ ball, ε 반경) 안에서 손실을 **최대화**하는 적대적 perturbation `δ`를 찾는다 (= 공격자의 역할)
- 외부의 `min` 항: 그렇게 찾은 최악의 perturbation에 대해서도 손실을 **최소화**하도록 모델 파라미터 `θ`를 학습한다 (= 방어자의 역할)

즉, 모델은 "공격자가 보낼 수 있는 가장 나쁜 입력"을 가정하고 그 입력에서도 성능을 유지하도록 훈련됩니다. 이는 적대적 예제 공격(FGSM, PGD 등)의 생성 과정을 훈련 루프 안에 내재화한 것이라고 볼 수 있습니다.

## 2. PGD 기반 적대적 훈련 (Madry et al.)

가장 표준적이고 영향력 있는 구현은 **Projected Gradient Descent(PGD)** 를 내부 최대화 단계의 근사 해법으로 사용하는 방식입니다 (Madry et al., 2018, "Towards Deep Learning Models Resistant to Adversarial Attacks").

### 훈련 절차

1. 미니배치 `(x, y)`를 샘플링한다.
2. 각 `x`에 대해 PGD로 적대적 예제 `x_adv`를 생성한다:
   - `x_adv^0 = x + (랜덤 초기화 노이즈)`
   - 반복 `t = 1..K`: `x_adv^t = Proj_S( x_adv^(t-1) + α · sign(∇_x L(f_θ(x_adv^(t-1)), y)) )`
   - `Proj_S`는 perturbation을 ε-ball(예: L∞ ≤ ε) 내부로 다시 투영(clip)하는 연산
3. `x_adv^K`를 사용해 일반적인 경사하강법으로 `θ`를 업데이트한다.

이 절차는 "공격(내부 루프)"과 "방어(외부 루프)"를 번갈아 수행하는 일종의 게임으로 볼 수 있으며, 충분한 반복 횟수 `K`와 적절한 ε을 사용하면 다양한 화이트박스/블랙박스 적대적 공격에 대해 상당한 견고성을 확보할 수 있습니다.

### 비용

- 매 스텝마다 K번의 추가 forward/backward pass가 필요하므로, 일반 훈련보다 **K배 이상 느림** (K=7~10이 일반적)
- 큰 모델/데이터셋에서는 비용이 매우 커서, Free Adversarial Training, Fast AT(FGSM 기반 single-step) 등 비용 절감 변형이 다수 제안됨

## 3. TRADES 및 주요 변형

PGD 기반 적대적 훈련 외에도 다양한 변형이 제안되었습니다.

### TRADES (TRadeoff-inspired Adversarial DEfense via Surrogate-loss minimization)

TRADES는 손실 함수를 두 항으로 명시적으로 분리합니다.

```
L_TRADES = L(f_θ(x), y) + β · max_(δ∈S) KL( f_θ(x) || f_θ(x+δ) )
```

- 첫 번째 항: 깨끗한(clean) 입력에 대한 일반적인 분류 손실 → **정확도(natural accuracy)** 유지
- 두 번째 항: 깨끗한 입력과 적대적 입력에 대한 모델 출력 분포의 차이(KL divergence) → **견고성(robust accuracy)** 확보
- `β`: 두 목표 사이의 트레이드오프를 조절하는 하이퍼파라미터

TRADES는 robustness-accuracy tradeoff를 하나의 손실함수 안에서 명시적으로 다룬다는 점에서, 단순 PGD 적대적 훈련보다 이론적으로 더 잘 정당화된 접근으로 평가됩니다.

### 기타 변형

- **Ensemble Adversarial Training**: 여러 보조 모델에서 생성한 적대적 예제를 함께 사용하여, 단일 모델의 그래디언트에 과적합되는 것을 방지 (gradient masking 완화)
- **MART (Misclassification-Aware adveRsarial Training)**: 원래 잘못 분류되는 샘플에 더 큰 가중치를 부여
- **AWP (Adversarial Weight Perturbation)**: 파라미터 공간에서도 perturbation을 주어 손실 곡면을 평탄화(flat minima)함으로써 일반화 향상
- **데이터 증강 결합**: AutoAugment, CutMix 등 일반 데이터 증강 기법과 결합하여 robust accuracy를 추가로 끌어올리는 연구들이 다수 존재

## 4. Robustness-Accuracy Tradeoff

적대적 훈련의 가장 잘 알려진 한계는 **견고성과 정확도(특히 clean accuracy) 사이의 트레이드오프**입니다.

- ε(허용 perturbation 크기)가 커질수록 robust accuracy는 향상되지만 clean accuracy는 하락하는 경향이 뚜렷합니다.
- 이는 단순히 최적화의 한계가 아니라, 일부 이론 연구에서는 **표준 정확도를 위한 "유용하지만 비견고한(non-robust) feature"** 와 **견고한 feature** 사이에 본질적인 상충 관계가 있다는 주장도 제기되었습니다 (Tsipras et al., "Robustness May Be at Odds with Accuracy").
- 또한 적대적 훈련은 클래스별로 불균등한 영향을 미칠 수 있어, 특정 클래스(예: 소수 클래스)의 정확도가 더 크게 떨어지는 **공정성(fairness) 이슈**로 이어질 수 있습니다. 이는 [차분 프라이버시](differential-privacy) 적용 시 발생하는 공정성 이슈와 유사한 패턴입니다.

## 5. Certified Defenses 간략 소개

PGD 기반 적대적 훈련은 "경험적(empirical)" 방어로, 더 강력한 미래의 공격에 의해 무력화될 가능성이 항상 존재합니다 (실제로 다수의 경험적 방어가 적응형 공격 앞에서 무너진 사례가 많음). 이에 대한 대안으로 **인증 가능한(certified) 방어**가 연구되고 있습니다.

### 랜덤화 스무딩 (Randomized Smoothing)

- 원본 모델 `f`에 가우시안 노이즈를 추가한 입력들의 다수결(majority vote)로 새로운 "스무딩된" 분류기 `g`를 정의
- `g(x) = argmax_c P_(δ~N(0,σ²I)) [ f(x+δ) = c ]`
- Neyman-Pearson 보조정리를 이용해, 특정 입력에 대해 `g`가 반경 `R` 이내의 L2 perturbation에 대해 **수학적으로 증명 가능한(provable)** 견고성을 가짐을 보장할 수 있음
- 장점: 모델 구조에 독립적이며 인증 가능한 robustness radius를 제공
- 단점: σ가 커질수록 인증 반경은 넓어지지만 clean accuracy가 하락하며, 추론 시 다수의 샘플링이 필요해 비용이 증가

### 기타 인증 방법

- **Interval Bound Propagation (IBP)**, **CROWN/Linear Relaxation** 기반 방법: 신경망의 각 레이어를 통과하는 출력의 상하한(bound)을 전파하여, 주어진 입력 영역 내 최악의 출력을 보장
- 대체로 작은 네트워크/저차원 perturbation에서는 강력하지만, 대규모 모델로의 확장성(scalability)이 큰 과제

## 6. 실무 적용 시 비용과 한계

| 항목 | 설명 |
|---|---|
| 훈련 비용 | PGD 기반은 일반 훈련 대비 수 배~수십 배의 컴퓨팅 비용 발생 |
| 정확도 손실 | clean accuracy 하락은 사용자 경험 및 비즈니스 메트릭에 직접적 영향 |
| 위협 모델 종속성 | 특정 perturbation 종류(예: L∞)에 대해 훈련된 모델은 다른 종류(L2, 회전/이동 등 비정형 변형)에는 취약할 수 있음 |
| 적응형 공격 위험 | "방어가 적용됨"을 아는 공격자는 그 방어를 우회하도록 설계된 적응형(adaptive) 공격을 사용할 수 있음 — 반드시 적응형 공격으로 재평가 필요 |
| 평가의 어려움 | 잘못된 평가 방법(약한 공격으로만 테스트)은 "false sense of security"를 줄 수 있음 (gradient masking/obfuscated gradients 문제) |

{{< callout type="warning" >}}
적대적 훈련을 적용했다고 해서 "안전하다"고 단정해서는 안 됩니다. 반드시 AutoAttack과 같은 표준화된 강한 공격 모음으로 재평가하고, 가능하면 적응형 공격(adaptive attack)을 시도해 봐야 합니다.
{{< /callout >}}

## 관련 페이지

- 이 방어 기법이 대응하는 공격: [적대적 예제 (Adversarial Examples)](../attacks/adversarial-examples)
- 직접 실습해보기: ART(Adversarial Robustness Toolbox)와 Foolbox를 이용해 적대적 예제를 생성하고, 적대적 훈련된 모델과 일반 모델의 견고성을 비교해보는 [ART/Foolbox 실습](../red-teaming/art-foolbox-practice) 페이지를 참고하세요.
