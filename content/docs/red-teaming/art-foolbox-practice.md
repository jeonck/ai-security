---
title: "ART·Foolbox로 적대적 공격 실습하기"
weight: 1
---

[적대적 예제(Adversarial Examples)](../attacks/adversarial-examples)와 [적대적 훈련(Adversarial Training)](../defenses/adversarial-training)을 글로만 읽으면 "입력에 작은 노이즈를 더해서 모델을 속인다"는 문장이 추상적으로 느껴집니다. 이 페이지에서는 오픈소스 라이브러리인 **IBM Adversarial Robustness Toolbox(ART)**와 **Foolbox**를 사용해, 실제로 이미지 분류기를 속이고, 공격 성공률을 측정하고, 방어까지 적용하는 전체 흐름을 코드로 따라갑니다.

{{< callout type="info" >}}
이 페이지의 코드는 학습 목적의 의사 코드/축약 코드입니다. 실제 실행 시에는 라이브러리 버전에 따라 API가 달라질 수 있으니 공식 문서를 함께 참고하세요.
{{< /callout >}}

## 1. 도구 소개

### IBM Adversarial Robustness Toolbox (ART)

ART는 IBM이 주도하는 오픈소스 프로젝트로, PyTorch·TensorFlow·Keras·scikit-learn 등 다양한 프레임워크의 모델을 감싸서(wrap) 동일한 인터페이스로 공격·방어를 적용할 수 있게 해줍니다.

- **공격(Evasion)**: FGSM, PGD, Carlini & Wagner(C&W), DeepFool, Boundary Attack 등
- **방어(Defense)**: 적대적 훈련, 입력 전처리(spatial smoothing, feature squeezing), 탐지(detector) 기법
- **추출/추론 공격**: 모델 추출(model extraction), 멤버십 추론(membership inference), 데이터 포이즈닝(poisoning) 시뮬레이션까지 포함

### Foolbox

Foolbox는 PyTorch/TensorFlow/JAX 모델에 대해 다양한 적대적 공격을 "최소한의 코드"로 적용하는 데 특화된 라이브러리입니다. ART보다 가볍고, 공격 자체에 집중하고 싶을 때 적합합니다.

| 항목 | ART | Foolbox |
| --- | --- | --- |
| 강점 | 공격+방어+추출 등 종합 툴킷 | 빠르고 간결한 공격 API |
| 적합한 용도 | 적대적 훈련까지 포함한 end-to-end 실습 | 다양한 공격을 빠르게 비교/탐색 |
| 학습 곡선 | 다소 높음 (estimator 추상화 이해 필요) | 낮음 |

## 2. 설치

```bash
# 가상환경 권장
python -m venv venv
source venv/bin/activate

# ART (PyTorch 백엔드 예시)
pip install adversarial-robustness-toolbox torch torchvision

# Foolbox
pip install foolbox
```

## 3. 실습 환경: 작은 이미지 분류기

실습은 MNIST(손글씨 숫자) 또는 CIFAR-10 같은 작고 가벼운 데이터셋과, 몇 개의 컨볼루션 레이어로 구성된 간단한 CNN으로 충분합니다. 처음부터 ImageNet급 대형 모델로 실습할 필요는 없습니다 — 핵심은 "perturbation이 모델의 결정 경계를 어떻게 넘는가"를 관찰하는 것입니다.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        return self.fc2(x)

# 모델 학습은 일반적인 MNIST 학습 루프로 진행 (생략)
model = SimpleCNN()
model.eval()
```

## 4. ART로 FGSM 공격 적용하기

**FGSM(Fast Gradient Sign Method)**은 손실함수의 입력에 대한 기울기(gradient)의 부호(sign)를 이용해, 한 번의 연산으로 적대적 예제를 생성하는 가장 기본적인 공격입니다.

```python
from art.estimators.classification import PyTorchClassifier
from art.attacks.evasion import FastGradientMethod
import torch.nn as nn

loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

# 1. ART의 estimator로 모델을 감싼다
classifier = PyTorchClassifier(
    model=model,
    loss=loss_fn,
    optimizer=optimizer,
    input_shape=(1, 28, 28),
    nb_classes=10,
    clip_values=(0.0, 1.0),
)

# 2. FGSM 공격 객체 생성 (epsilon = perturbation 크기)
fgsm = FastGradientMethod(estimator=classifier, eps=0.1)

# 3. 테스트 이미지에 공격 적용
x_test_adv = fgsm.generate(x=x_test)  # x_test: numpy array, shape (N, 1, 28, 28)
```

`eps`는 perturbation의 최대 크기(L-infinity norm 기준)를 의미합니다. `eps`가 클수록 공격은 강해지지만, 사람의 눈에도 변형이 보이기 쉬워집니다 — 이 트레이드오프를 직접 `eps=0.01, 0.05, 0.1, 0.3`으로 바꿔가며 관찰해보세요.

## 5. ART로 PGD 공격 적용하기

**PGD(Projected Gradient Descent)**는 FGSM을 여러 번 반복하면서, 매 스텝마다 perturbation을 `eps` 범위 안으로 다시 projection(투영)하는 방식입니다. FGSM보다 훨씬 강력하며, "강건성 평가의 표준 벤치마크"로 자주 사용됩니다.

```python
from art.attacks.evasion import ProjectedGradientDescent

pgd = ProjectedGradientDescent(
    estimator=classifier,
    eps=0.1,        # 전체 perturbation 한계
    eps_step=0.01,  # 각 반복(iteration)당 이동 크기
    max_iter=40,    # 반복 횟수
)

x_test_adv_pgd = pgd.generate(x=x_test)
```

{{< callout type="warning" >}}
PGD는 FGSM보다 계산량이 훨씬 많습니다. `max_iter`와 데이터 수를 작게 설정해 먼저 동작을 확인한 뒤, 점진적으로 늘려가세요.
{{< /callout >}}

## 6. Foolbox로 빠르게 공격 비교하기

여러 공격을 빠르게 비교하고 싶을 때는 Foolbox가 편리합니다.

```python
import foolbox as fb

fmodel = fb.PyTorchModel(model, bounds=(0, 1))

attack = fb.attacks.LinfPGD()
raw, clipped, is_adv = attack(
    fmodel, images, labels, epsilons=[0.01, 0.03, 0.1, 0.3]
)

# is_adv: 각 epsilon 값에서 공격이 성공했는지 여부 (Boolean tensor)
```

`epsilons` 리스트에 여러 값을 한 번에 넘기면, "perturbation 크기 대비 공격 성공률" 곡선을 한 번의 호출로 얻을 수 있어 비교 실험에 효율적입니다.

## 7. 공격 성공률 측정하기

공격 성공률(Attack Success Rate, ASR)은 가장 기본적이면서도 중요한 지표입니다.

```python
import numpy as np

def attack_success_rate(classifier, x_orig, x_adv, y_true):
    pred_orig = np.argmax(classifier.predict(x_orig), axis=1)
    pred_adv = np.argmax(classifier.predict(x_adv), axis=1)

    # 원래 정답을 맞췄던 샘플 중, 공격 후 틀리게 된 비율
    correct_mask = (pred_orig == y_true)
    fooled = (pred_adv[correct_mask] != y_true[correct_mask])
    return fooled.mean()

asr_fgsm = attack_success_rate(classifier, x_test, x_test_adv, y_test)
asr_pgd = attack_success_rate(classifier, x_test, x_test_adv_pgd, y_test)

print(f"FGSM ASR: {asr_fgsm:.2%}")
print(f"PGD  ASR: {asr_pgd:.2%}")
```

측정할 때 함께 기록해두면 좋은 값들:

- **eps 값별 ASR**: perturbation 크기에 따른 공격 성공률 변화
- **원본 vs 적대적 예제의 시각적 차이**: `matplotlib`으로 나란히 출력해 "사람 눈에는 안 보이는데 모델은 속는다"는 것을 직접 확인
- **신뢰도(confidence) 변화**: 공격 전후 모델이 예측에 대해 갖는 확신도 변화
- **Transferability**: 한 모델에서 생성한 적대적 예제가 다른 구조의 모델에도 통하는지

## 8. ART로 적대적 훈련(Adversarial Training) 적용하기

이제 [적대적 훈련](../defenses/adversarial-training)을 직접 적용해, 방어 전후의 강건성을 비교합니다. ART는 `AdversarialTrainer`를 통해 이 과정을 추상화합니다.

```python
from art.defences.trainer import AdversarialTrainer

# 학습 중 사용할 공격 (보통 PGD를 사용)
attack_for_training = ProjectedGradientDescent(
    estimator=classifier, eps=0.1, eps_step=0.01, max_iter=10
)

trainer = AdversarialTrainer(classifier, attacks=attack_for_training, ratio=0.5)

# ratio=0.5: 배치의 50%는 원본, 50%는 적대적 예제로 학습
trainer.fit(x_train, y_train, nb_epochs=20, batch_size=128)
```

훈련 완료 후, **동일한 PGD 공격을 다시 적용**하여 ASR을 비교합니다:

```python
x_test_adv_after = pgd.generate(x=x_test)
asr_after = attack_success_rate(classifier, x_test, x_test_adv_after, y_test)

print(f"PGD ASR (방어 전): {asr_pgd:.2%}")
print(f"PGD ASR (방어 후): {asr_after:.2%}")
```

여기서 관찰해야 할 핵심은 다음 두 가지입니다.

1. **PGD ASR이 줄어든다** — 적대적 훈련이 효과가 있음을 보여줍니다.
2. **일반 테스트 정확도(clean accuracy)가 약간 떨어질 수 있다** — 이것이 적대적 훈련의 대표적인 트레이드오프입니다. "강건성을 얻으면 일반 성능을 일부 희생한다"는 점을 데이터로 직접 확인하는 것이 이 실습의 핵심 학습 목표입니다.

## 9. 실습 체크리스트

- [ ] 간단한 CNN을 MNIST/CIFAR-10으로 학습시켰다
- [ ] ART로 FGSM, PGD 공격을 각각 적용하고 `eps`를 바꿔가며 ASR을 측정했다
- [ ] Foolbox로 동일한 공격을 적용해 결과를 ART와 비교했다
- [ ] 원본/적대적 이미지를 시각화하여 perturbation의 "보이지 않음"을 확인했다
- [ ] ART의 `AdversarialTrainer`로 방어를 적용하고, clean accuracy와 robust accuracy(ASR의 반대)를 before/after로 표로 정리했다
- [ ] 이 실습 결과를 GitHub README와 짧은 보고서로 정리했다 (→ [포트폴리오 프로젝트](portfolio-projects) 참고)

이 실습은 [적대적 예제](../attacks/adversarial-examples)에서 다룬 이론을 코드로 검증하고, [적대적 훈련](../defenses/adversarial-training)에서 다룬 방어 기법의 효과와 한계를 직접 데이터로 확인하는 과정입니다. 다음 페이지에서는 이미지 분류기를 넘어, LLM과 에이전트를 대상으로 한 레드티밍으로 넘어갑니다.
