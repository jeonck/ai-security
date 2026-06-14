---
title: "Lab 1: 이미지 분류기에 적대적 공격 실행하기"
weight: 1
---

이 실습에서는 PyTorch로 학습된 작은 CNN(MNIST 분류기)에 대해, IBM의 **ART**(Adversarial Robustness Toolbox)를 사용하여 FGSM과 PGD 공격을 직접 실행합니다. 공격 전후의 정확도를 비교하고, 공격 성공률(Attack Success Rate, ASR)을 계산합니다.

관련 개념은 [적대적 예제 (Adversarial Examples)](/docs/attacks/adversarial-examples) 문서를 참고하세요.

## 목표

- FGSM(Fast Gradient Sign Method)과 PGD(Projected Gradient Descent) 공격을 ART로 생성한다.
- 공격 전/후 모델 정확도를 측정하여 perturbation 크기($\epsilon$)에 따른 정확도 하락을 관찰한다.
- 공격 성공률(ASR = 공격으로 인해 오분류된 샘플 수 / 전체 샘플 수)을 계산한다.
- (선택) 적대적 훈련을 적용한 모델과 비교하여 방어 효과를 체감한다.

{{< callout type="info" >}}
이 실습은 약 10~20분 내에 CPU 환경에서도 실행 가능합니다. GPU가 있다면 더 빠르게 진행됩니다.
{{< /callout >}}

## 사전 준비

### 1. 패키지 설치

```bash
pip install adversarial-robustness-toolbox torch torchvision numpy matplotlib
```

설치 후 버전 확인:

```bash
python -c "import art; print(art.__version__)"
python -c "import torch; print(torch.__version__)"
```

### 2. 데이터셋 준비

MNIST는 `torchvision.datasets`를 통해 자동으로 다운로드됩니다. 별도 준비가 필요 없습니다.

```python
import torchvision

# 최초 실행 시 ./data 폴더에 자동 다운로드됩니다.
train_set = torchvision.datasets.MNIST(root="./data", train=True, download=True)
test_set = torchvision.datasets.MNIST(root="./data", train=False, download=True)
```

## 단계별 실행

### 1단계: 간단한 CNN 모델 정의 및 학습

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
import numpy as np

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class SimpleCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.pool(torch.relu(self.conv1(x)))
        x = self.pool(torch.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = torch.relu(self.fc1(x))
        return self.fc2(x)

transform = transforms.Compose([transforms.ToTensor()])
train_set = torchvision.datasets.MNIST(root="./data", train=True, download=True, transform=transform)
test_set = torchvision.datasets.MNIST(root="./data", train=False, download=True, transform=transform)

train_loader = DataLoader(train_set, batch_size=128, shuffle=True)
test_loader = DataLoader(test_set, batch_size=256, shuffle=False)

model = SimpleCNN().to(device)
optimizer = optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

# 빠른 실습을 위해 2 epoch만 학습합니다 (정확도 ~98% 도달 가능)
for epoch in range(2):
    model.train()
    for x, y in train_loader:
        x, y = x.to(device), y.to(device)
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()
        optimizer.step()
    print(f"Epoch {epoch+1} 완료")
```

### 2단계: ART `PyTorchClassifier`로 래핑

ART는 공격 알고리즘과 모델 사이의 인터페이스로 `PyTorchClassifier`를 제공합니다.

```python
from art.estimators.classification import PyTorchClassifier

classifier = PyTorchClassifier(
    model=model,
    loss=criterion,
    optimizer=optimizer,
    input_shape=(1, 28, 28),
    nb_classes=10,
    clip_values=(0.0, 1.0),  # 입력 픽셀 값 범위
    device_type="gpu" if torch.cuda.is_available() else "cpu",
)
```

### 3단계: 공격 전 베이스라인 정확도 측정

```python
# 테스트셋 전체를 numpy 배열로 변환
x_test = np.concatenate([x.numpy() for x, _ in test_loader])
y_test = np.concatenate([y.numpy() for _, y in test_loader])

preds_clean = np.argmax(classifier.predict(x_test), axis=1)
acc_clean = np.mean(preds_clean == y_test)
print(f"공격 전 정확도: {acc_clean * 100:.2f}%")
```

### 4단계: FGSM 공격 생성 및 평가

```python
from art.attacks.evasion import FastGradientMethod

fgsm = FastGradientMethod(estimator=classifier, eps=0.2)
x_test_fgsm = fgsm.generate(x=x_test)

preds_fgsm = np.argmax(classifier.predict(x_test_fgsm), axis=1)
acc_fgsm = np.mean(preds_fgsm == y_test)
print(f"FGSM 공격 후 정확도 (eps=0.2): {acc_fgsm * 100:.2f}%")
```

### 5단계: PGD 공격 생성 및 평가

PGD는 FGSM을 반복(iteration)하며 매 스텝마다 $\epsilon$-ball 내부로 투영하는 더 강력한 공격입니다.

```python
from art.attacks.evasion import ProjectedGradientDescent

pgd = ProjectedGradientDescent(
    estimator=classifier,
    eps=0.2,
    eps_step=0.02,
    max_iter=40,
)
x_test_pgd = pgd.generate(x=x_test)

preds_pgd = np.argmax(classifier.predict(x_test_pgd), axis=1)
acc_pgd = np.mean(preds_pgd == y_test)
print(f"PGD 공격 후 정확도 (eps=0.2, max_iter=40): {acc_pgd * 100:.2f}%")
```

### 6단계: 공격 성공률(ASR) 계산

ASR은 "원래 맞췄던 샘플 중 공격으로 인해 틀리게 된 비율"로 정의하는 것이 일반적입니다.

```python
def attack_success_rate(preds_clean, preds_adv, y_true):
    correctly_classified = preds_clean == y_true
    now_misclassified = preds_adv != y_true
    successful = correctly_classified & now_misclassified
    return np.sum(successful) / np.sum(correctly_classified)

asr_fgsm = attack_success_rate(preds_clean, preds_fgsm, y_test)
asr_pgd = attack_success_rate(preds_clean, preds_pgd, y_test)

print(f"FGSM ASR: {asr_fgsm * 100:.2f}%")
print(f"PGD ASR: {asr_pgd * 100:.2f}%")
```

### 7단계 (선택): $\epsilon$ 값에 따른 정확도 곡선 그리기

perturbation 크기가 커질수록 정확도가 어떻게 떨어지는지 시각화합니다.

```python
import matplotlib.pyplot as plt

eps_values = [0.0, 0.05, 0.1, 0.15, 0.2, 0.3]
accuracies = []

for eps in eps_values:
    if eps == 0.0:
        accuracies.append(acc_clean)
        continue
    attack = FastGradientMethod(estimator=classifier, eps=eps)
    x_adv = attack.generate(x=x_test)
    preds_adv = np.argmax(classifier.predict(x_adv), axis=1)
    accuracies.append(np.mean(preds_adv == y_test))

plt.plot(eps_values, accuracies, marker="o")
plt.xlabel("epsilon")
plt.ylabel("정확도")
plt.title("FGSM: epsilon에 따른 정확도 하락")
plt.grid(True)
plt.savefig("fgsm_epsilon_curve.png")
print("그래프를 fgsm_epsilon_curve.png 로 저장했습니다.")
```

## 결과 확인

각 단계의 출력값을 아래와 같은 표로 정리하면, 보고서나 포트폴리오에 그대로 활용할 수 있습니다.

| 조건 | 정확도 | ASR |
|---|---|---|
| 공격 없음 (Clean) | ~98% | - |
| FGSM (eps=0.2) | ~30~50% | ~50~70% |
| PGD (eps=0.2, max_iter=40) | ~5~15% | ~85~95% |

해석 시 확인할 포인트:

- **PGD가 FGSM보다 정확도를 훨씬 더 많이 떨어뜨려야 합니다.** PGD는 반복적 최적화이므로 단일 스텝인 FGSM보다 항상 같거나 더 강력합니다. 만약 두 값이 거의 같다면 `max_iter`나 `eps_step` 설정을 다시 확인하세요.
- **$\epsilon$이 커질수록 정확도는 단조 감소**해야 합니다. 그래프가 단조 감소 형태가 아니라면 데이터 전처리(0~1 정규화 vs `clip_values` 불일치) 문제를 점검하세요.
- **ASR이 100%에 가까우면** 모델이 그래디언트 기반 공격에 거의 무방비 상태라는 의미입니다. 이는 "취약점이 있다"가 아니라 "방어를 적용하지 않은 일반 모델의 정상적인 상태"입니다 — 다음 단계인 적대적 훈련의 출발점이 됩니다.

{{< callout type="info" >}}
실제 수치는 학습 epoch 수, 랜덤 시드, 하드웨어에 따라 달라질 수 있습니다. 중요한 것은 **"공격 없음 > FGSM > PGD" 순서로 정확도가 떨어지는 경향성**을 직접 관찰하는 것입니다.
{{< /callout >}}

### 다음 단계: 방어 적용해보기

공격을 재현했다면, [적대적 훈련 (Adversarial Training)](/docs/defenses/adversarial-training) 문서를 참고하여 동일한 모델을 PGD 적대적 예제로 재학습시키고, 위 실험을 다시 실행해 정확도/ASR이 어떻게 개선되는지 비교해 보세요. ART의 `AdversarialTrainer` 클래스를 사용하면 비교적 적은 코드로 구현할 수 있습니다.

## 체크리스트

- [ ] PyTorch CNN 모델을 MNIST로 학습시켰다.
- [ ] ART `PyTorchClassifier`로 모델을 래핑했다.
- [ ] 공격 전 베이스라인 정확도를 측정했다.
- [ ] `FastGradientMethod`(FGSM)로 적대적 예제를 생성하고 정확도를 측정했다.
- [ ] `ProjectedGradientDescent`(PGD)로 적대적 예제를 생성하고 정확도를 측정했다.
- [ ] FGSM과 PGD 각각의 공격 성공률(ASR)을 계산했다.
- [ ] (선택) $\epsilon$ 값에 따른 정확도 곡선을 그려보았다.
- [ ] (선택) 적대적 훈련을 적용한 모델로 동일 실험을 재실행하고 before/after를 비교했다.
- [ ] 측정한 표/그래프를 캡처하여 포트폴리오나 학습 노트에 기록했다.

## 더 살펴보기

{{< cards >}}
  {{< card link="../../docs/attacks/adversarial-examples/" title="적대적 예제 개념" subtitle="FGSM/PGD/C&W의 수학적 원리와 white-box/black-box 구분" >}}
  {{< card link="../../docs/defenses/adversarial-training/" title="적대적 훈련" subtitle="이 실습에서 측정한 ASR을 낮추는 대표적 방어 기법" >}}
  {{< card link="../../tools/adversarial-ml-tools/" title="적대적 ML 도구 모음" subtitle="ART 외 Foolbox, CleverHans 등 관련 도구 비교" >}}
{{< /cards >}}
