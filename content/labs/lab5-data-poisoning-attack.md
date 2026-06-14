---
title: "Lab 5: 데이터 포이즈닝 공격 실습"
weight: 5
---

이 실습에서는 scikit-learn으로 작은 분류 모델을 학습시키고, **학습 데이터 자체를 오염**시키는 두 가지 공격을 직접 실행합니다. (1) 레이블을 무작위로 뒤집는 **label-flipping** 포이즌 비율을 늘려가며 정확도 하락을 관찰하고, (2) 이미지 코너에 작은 트리거 패턴을 심는 **백도어(backdoor)** 포이즌 샘플을 주입해, 트리거가 있을 때만 특정 클래스로 오분류되는 현상을 재현합니다.

관련 개념은 [데이터 포이즈닝 (Data Poisoning)](../../docs/attacks/data-poisoning/) 문서를 참고하세요. [Lab 1](../lab1-adversarial-attack/)이 "학습이 끝난 모델"을 추론 시점에 속이는 적대적 예제를 다뤘다면, 이 실습은 "모델이 만들어지는 과정" 자체를 오염시키는 공격에 초점을 둡니다.

## 목표

- Label-flipping 포이즌 비율(0%, 5%, 10%, 20%, 40%)에 따른 테스트 정확도 하락을 측정한다.
- 이미지 코너에 작은 트리거 패치를 심은 백도어 포이즌 샘플을 학습 데이터에 주입하고, 트리거 유무에 따른 공격 성공률(ASR)을 계산한다.
- 데이터 오염이 "정상 테스트셋에서는 잘 드러나지 않는다"는 백도어 공격의 위험성을 직접 체감하고, 데이터 검증/공급망 보안과의 연결 지점을 이해한다.

{{< callout type="warning" >}}
이 실습은 **본인 로컬 환경**에서, 직접 만든 데이터셋(`load_digits`)으로만 수행하세요. 여기서 다루는 기법을 실제 서비스 중인 모델이나 타인의 데이터셋에 적용하는 것은 불법이며, 이 실습의 목적은 **방어 관점에서 위험을 이해**하는 데 있습니다.
{{< /callout >}}

## 사전 준비

```bash
pip install scikit-learn numpy
```

설치 후 버전 확인:

```bash
python -c "import sklearn; print(sklearn.__version__)"
```

이 실습은 `sklearn.datasets.load_digits()` (8x8 손글씨 숫자 이미지, 0~9 클래스)를 사용합니다. 별도 다운로드 없이 scikit-learn에 내장되어 있습니다.

## 단계별 실행

### 1단계: 정상 모델 학습 (베이스라인)

```python
import numpy as np
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

RANDOM_STATE = 42
digits = load_digits()
X, y = digits.data, digits.target  # X: (n_samples, 64), 8x8 이미지를 펼친 벡터

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=RANDOM_STATE, stratify=y
)

baseline = LogisticRegression(max_iter=2000).fit(X_train, y_train)
baseline_acc = accuracy_score(y_test, baseline.predict(X_test))
print(f"베이스라인 정확도: {baseline_acc * 100:.2f}%")
```

정상적으로 학습하면 `load_digits` + `LogisticRegression` 조합에서 약 95~97%의 정확도가 나옵니다. 이 값이 이후 실험의 기준선이 됩니다.

### 2단계: Label-Flipping 포이즌 주입 후 정확도 비교

훈련 데이터 중 일부 샘플의 레이블을 무작위로 다른 클래스로 뒤집습니다. 테스트셋은 절대 오염시키지 않습니다 — "정상 테스트셋으로는 평가했을 때 모델 성능이 어떻게 보이는가"를 확인하는 것이 핵심입니다.

```python
def label_flip_poison(X, y, poison_ratio, n_classes, random_state=0):
    """훈련 데이터의 poison_ratio 비율만큼 레이블을 무작위로 뒤집는다."""
    rng = np.random.RandomState(random_state)
    X_poisoned, y_poisoned = X.copy(), y.copy()
    n_poison = int(len(y) * poison_ratio)
    poison_idx = rng.choice(len(y), size=n_poison, replace=False)

    for idx in poison_idx:
        original = y_poisoned[idx]
        # 원래 레이블과 다른 클래스 중 무작위로 선택
        choices = [c for c in range(n_classes) if c != original]
        y_poisoned[idx] = rng.choice(choices)

    return X_poisoned, y_poisoned, poison_idx


poison_ratios = [0.0, 0.05, 0.10, 0.20, 0.40]
results_flip = []

for ratio in poison_ratios:
    X_p, y_p, _ = label_flip_poison(X_train, y_train, ratio, n_classes=10, random_state=1)
    model = LogisticRegression(max_iter=2000).fit(X_p, y_p)
    acc = accuracy_score(y_test, model.predict(X_test))
    results_flip.append((ratio, acc))
    print(f"포이즌 비율 {ratio:.0%}: 테스트 정확도 {acc * 100:.2f}%")
```

비율을 0%에서 40%까지 늘려가며 정확도가 어떻게 단조 감소하는지 관찰합니다. 5~10% 수준의 비교적 낮은 포이즌 비율에서도 정확도가 눈에 띄게 떨어지는지, 아니면 모델이 어느 정도 "버텨내는지"를 확인해 보세요.

### 3단계: 백도어 트리거 패턴 주입 후 ASR 측정

이번에는 레이블을 무작위로 뒤집는 대신, **이미지 코너에 작은 트리거 패치**(픽셀 값이 최댓값인 2x2 블록)를 추가한 샘플을 만들고, 그 샘플들의 레이블을 모두 공격자가 정한 **타깃 클래스**로 바꿔서 훈련 데이터에 섞어 넣습니다. 목표는 "트리거가 없는 입력은 정상적으로 분류하지만, 트리거가 있으면 무조건 타깃 클래스로 분류하는" 모델을 만드는 것입니다.

```python
TARGET_CLASS = 0  # 공격자가 원하는 타깃 클래스
TRIGGER_VALUE = X.max()  # 8x8 이미지의 픽셀 최댓값 (load_digits는 0~16 범위)


def add_trigger(X_flat, trigger_value=TRIGGER_VALUE):
    """8x8로 펼쳐진 이미지의 좌상단 2x2 코너에 트리거 패치를 추가한다."""
    X_img = X_flat.reshape(-1, 8, 8).copy()
    X_img[:, 0:2, 0:2] = trigger_value  # 좌상단 2x2 블록을 최댓값으로 고정
    return X_img.reshape(-1, 64)


def backdoor_poison(X, y, target_class, poison_ratio, random_state=0):
    """poison_ratio 비율의 샘플에 트리거를 추가하고 레이블을 target_class로 바꾼다."""
    rng = np.random.RandomState(random_state)
    n_poison = int(len(y) * poison_ratio)
    poison_idx = rng.choice(len(y), size=n_poison, replace=False)

    X_poisoned, y_poisoned = X.copy(), y.copy()
    X_poisoned[poison_idx] = add_trigger(X_poisoned[poison_idx])
    y_poisoned[poison_idx] = target_class

    return X_poisoned, y_poisoned


# 훈련 데이터의 15%에 백도어 트리거 주입
X_bd_train, y_bd_train = backdoor_poison(
    X_train, y_train, TARGET_CLASS, poison_ratio=0.15, random_state=2
)

backdoor_model = LogisticRegression(max_iter=2000).fit(X_bd_train, y_bd_train)

# (1) 깨끗한 테스트셋: 트리거 없음 -> 정상적으로 분류되어야 함
clean_acc = accuracy_score(y_test, backdoor_model.predict(X_test))
print(f"깨끗한 테스트셋 정확도 (트리거 없음): {clean_acc * 100:.2f}%")

# (2) 트리거가 있는 테스트셋: 모두 TARGET_CLASS로 분류되는지 확인
X_test_triggered = add_trigger(X_test)
preds_triggered = backdoor_model.predict(X_test_triggered)

# ASR = "원래 타깃 클래스가 아니었던 샘플 중, 트리거로 인해 타깃 클래스로 바뀐 비율"
not_target_mask = y_test != TARGET_CLASS
asr = np.mean(preds_triggered[not_target_mask] == TARGET_CLASS)
print(f"백도어 공격 성공률 (ASR): {asr * 100:.2f}%")
```

확인할 점:

- `clean_acc`는 1단계의 베이스라인 정확도와 거의 비슷해야 합니다. 즉, 트리거가 없는 정상적인 입력에 대해서는 모델이 멀쩍 둔 백도어를 가지고 있어도 정상 동작합니다 — 이것이 백도어 탐지가 어려운 이유입니다.
- `asr`이 높을수록(이상적으로는 100%에 가까울수록), "트리거만 붙이면 어떤 숫자든 `TARGET_CLASS`로 분류된다"는 의미입니다.
- 비교를 위해, 트리거 없이 동일한 비율(15%)을 1단계 베이스라인 데이터 그대로 학습한 모델에 같은 `X_test_triggered`를 넣어보면 ASR이 훨씬 낮게 나옵니다(트리거 패턴 자체가 우연히 분류에 영향을 주는 정도). 이 차이가 "백도어가 의도적으로 학습되었음"을 보여주는 증거입니다.

### 4단계: 방어 기법과의 연결

위 실험에서 확인했듯, label-flipping과 백도어 포이즌은 **정상 테스트셋만으로는 탐지하기 어렵습니다**. 실제 방어는 모델 학습 이후가 아니라 그 이전, 즉 데이터 파이프라인 단계에서 이루어져야 합니다.

- **데이터 검증(Label consistency check)**: 학습 데이터의 일부를 다른 모델이나 사람이 재검토하여, 레이블과 입력이 서로 일치하지 않는 비율(label-flipping의 흔적)이 비정상적으로 높은지 확인합니다.
- **이상치/클러스터 분석**: 백도어 트리거처럼 "특정 영역에 비정상적으로 균일한 픽셀 값을 가진" 샘플은 일반적인 데이터 분포에서 벗어난 이상치로 탐지될 가능성이 있습니다. 활성화(activation) 클러스터링 같은 기법은 같은 레이블 내에서도 트리거가 있는 샘플이 별도의 클러스터를 형성하는 현상을 이용합니다.
- **데이터 출처(Provenance) 관리**: [공급망 리스크](../../docs/infrastructure/supply-chain-risk/)에서 다루는 것처럼, 학습 데이터가 어디서 왔는지, 누가 레이블링했는지를 추적하고 신뢰할 수 없는 소스의 데이터는 별도로 검증합니다.
- **적대적 훈련과의 차이**: [적대적 훈련(Adversarial Training)](../../docs/defenses/adversarial-training/)은 추론 시점의 perturbation에 대한 견고성을 높이는 기법으로, 학습 데이터 자체의 무결성 문제인 포이즈닝에는 직접적인 해법이 되지 않습니다. 포이즈닝 방어는 "모델을 더 견고하게 만드는 것"이 아니라 "오염된 데이터가 학습 파이프라인에 들어오지 못하게 막는 것"에 초점을 둡니다.

## 결과 확인

2단계와 3단계의 결과를 아래와 같은 표로 정리합니다.

| 포이즌 비율 | Label-Flipping 정확도 | 백도어 깨끗한 테스트 정확도 | 백도어 ASR (트리거 적용) |
|---|---|---|---|
| 0% (베이스라인) | ~95~97% | - | - |
| 5% | (측정값) | - | - |
| 10% | (측정값) | - | - |
| 15% (백도어) | - | ~베이스라인과 유사 | (측정값, 일반적으로 80~100%) |
| 20% | (측정값) | - | - |
| 40% | (측정값) | - | - |

해석 시 확인할 포인트:

- Label-flipping은 포이즌 비율이 올라갈수록 정확도가 **단조 감소**해야 합니다. 40%에서도 정확도가 거의 떨어지지 않는다면 `random_state`나 `n_classes` 설정을 다시 확인하세요.
- 백도어의 "깨끗한 테스트 정확도"는 베이스라인과 거의 동일해야 합니다. 만약 크게 떨어진다면 포이즌 비율이 너무 높거나 트리거 패치가 너무 큽니다.
- 백도어 ASR이 낮게 나온다면(예: 30% 미만), 포이즌 비율을 늘리거나(`poison_ratio` 증가) 트리거를 더 뚜렷하게(`TRIGGER_VALUE` 유지, 패치 크기 확대) 만들어 보세요.

{{< callout type="info" >}}
실제 수치는 `random_state`, 포이즌 비율, 모델 종류에 따라 달라질 수 있습니다. 중요한 것은 "**정상 테스트셋에서는 문제가 거의 드러나지 않지만, 트리거가 있는 입력에서는 거의 항상 같은 클래스로 오분류된다**"는 백도어 공격의 패턴을 직접 관찰하는 것입니다.
{{< /callout >}}

## 체크리스트

- [ ] `load_digits`로 베이스라인 모델을 학습하고 정상 정확도를 측정했다.
- [ ] Label-flipping 포이즌 비율(0~40%)에 따른 정확도 하락 곡선을 측정했다.
- [ ] 이미지 코너에 트리거 패치를 추가하는 `add_trigger` 함수를 구현했다.
- [ ] 훈련 데이터 일부에 백도어 트리거를 주입하고 타깃 클래스로 레이블을 바꿔 모델을 학습했다.
- [ ] 트리거가 없는 테스트셋에서는 정확도가 베이스라인과 유사함을 확인했다.
- [ ] 트리거가 있는 테스트셋에서 ASR(공격 성공률)을 계산했다.
- [ ] 위 표를 채워 "포이즌 비율 -> 정확도/ASR" 관계를 정리했다.
- [ ] 데이터 검증/출처 관리가 왜 모델 자체의 방어보다 먼저 필요한지 설명할 수 있다.

## 학습효과

- "추론 시점 공격(적대적 예제)"과 "학습 시점 공격(데이터 포이즈닝)"의 차이를 코드로 직접 구현하며 명확히 구분하게 된다.
- label-flipping 비율에 따른 정확도 하락, 백도어 트리거의 ASR을 수치로 측정함으로써 "정상 테스트셋만으로는 오염을 탐지하기 어렵다"는 포이즈닝 공격의 위험성을 체감한다.
- 데이터 검증·이상치 분석·출처(Provenance) 관리가 왜 모델 자체의 견고성 강화보다 먼저 다뤄야 하는 문제인지 설명할 수 있게 된다.

## 더 살펴보기

{{< cards >}}
  {{< card link="../../docs/attacks/data-poisoning/" title="데이터 포이즈닝 개념" subtitle="Label flipping, 백도어, clean-label 포이즈닝과 공급망/RAG 인덱스 오염" >}}
  {{< card link="../../docs/attacks/adversarial-examples/" title="적대적 예제" subtitle="추론 시점에 입력을 조작하는 공격과의 차이" >}}
  {{< card link="../../docs/infrastructure/supply-chain-risk/" title="공급망 리스크" subtitle="데이터셋·모델·의존성의 출처 추적과 무결성 검증" >}}
  {{< card link="../../docs/defenses/adversarial-training/" title="적대적 훈련" subtitle="추론 시점 견고성 강화 기법과 포이즈닝 방어의 차이" >}}
{{< /cards >}}
