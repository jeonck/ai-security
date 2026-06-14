---
title: "Lab 6: 적대적 훈련으로 모델 방어하기"
weight: 6
---

[Lab 1](../lab1-adversarial-attack/)에서는 PyTorch CNN(MNIST 분류기)에 ART의 FGSM/PGD 공격을 적용해 정확도가 급격히 떨어지는 것을 확인했습니다. 이 실습에서는 같은 모델과 같은 공격을 그대로 재사용하되, 이번에는 **"방어자"의 입장**에서 적대적 훈련(Adversarial Training)을 적용하고, 방어 적용 전/후의 robust accuracy를 직접 비교합니다.

## 목표

- 베이스라인 모델의 clean accuracy와 FGSM/PGD에 대한 robust accuracy를 측정한다.
- ART를 이용한 adversarial training(PGD 기반)으로 같은 모델을 재학습한다.
- 방어 적용 전/후 robust accuracy 변화를 비교하고, clean accuracy 하락(정확도-강건성 트레이드오프)을 관찰한다.

{{< callout type="warning" >}}
이 실습은 **로컬 환경**(CPU 또는 단일 GPU)에서 수행하세요. adversarial training은 일반 훈련보다 수 배 더 오래 걸리므로, 빠른 실습을 위해 작은 모델과 적은 epoch/iteration 수를 사용합니다. 실제 프로덕션 모델에 적용할 때는 훈련 시간과 비용이 크게 증가한다는 점을 감안해야 합니다.
{{< /callout >}}

## 사전 준비

[Lab 1](../lab1-adversarial-attack/)과 동일한 프레임워크(PyTorch + ART)를 사용합니다. 이미 설치했다면 이 단계는 건너뛰어도 됩니다.

```bash
pip install adversarial-robustness-toolbox torch torchvision numpy
```

```bash
python -c "import art; print(art.__version__)"
python -c "import torch; print(torch.__version__)"
```

## 단계별 실행

### 1단계: 베이스라인 모델 학습

Lab 1과 동일한 `SimpleCNN`을 MNIST로 학습합니다. 이미 Lab 1을 진행했다면 같은 코드를 재사용해도 됩니다.

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
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

def train(model, loader, epochs=2):
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    criterion = nn.CrossEntropyLoss()
    model.train()
    for epoch in range(epochs):
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optimizer.step()
        print(f"Epoch {epoch+1} 완료")
    return optimizer, criterion

baseline_model = SimpleCNN().to(device)
optimizer, criterion = train(baseline_model, train_loader, epochs=2)

x_test = np.concatenate([x.numpy() for x, _ in test_loader])
y_test = np.concatenate([y.numpy() for _, y in test_loader])
```

### 2단계: ART로 래핑하고 베이스라인의 clean / robust accuracy 측정

```python
from art.estimators.classification import PyTorchClassifier
from art.attacks.evasion import FastGradientMethod, ProjectedGradientDescent

baseline_classifier = PyTorchClassifier(
    model=baseline_model,
    loss=criterion,
    optimizer=optimizer,
    input_shape=(1, 28, 28),
    nb_classes=10,
    clip_values=(0.0, 1.0),
    device_type="gpu" if torch.cuda.is_available() else "cpu",
)

def evaluate(classifier, x, y):
    preds = np.argmax(classifier.predict(x), axis=1)
    return np.mean(preds == y)

# Clean accuracy
acc_clean_before = evaluate(baseline_classifier, x_test, y_test)

# FGSM robust accuracy
fgsm = FastGradientMethod(estimator=baseline_classifier, eps=0.2)
x_test_fgsm = fgsm.generate(x=x_test)
acc_fgsm_before = evaluate(baseline_classifier, x_test_fgsm, y_test)

# PGD robust accuracy
pgd_eval = ProjectedGradientDescent(estimator=baseline_classifier, eps=0.2, eps_step=0.02, max_iter=40)
x_test_pgd = pgd_eval.generate(x=x_test)
acc_pgd_before = evaluate(baseline_classifier, x_test_pgd, y_test)

print(f"[방어 전] Clean accuracy: {acc_clean_before * 100:.2f}%")
print(f"[방어 전] FGSM(eps=0.2) robust accuracy: {acc_fgsm_before * 100:.2f}%")
print(f"[방어 전] PGD(eps=0.2, max_iter=40) robust accuracy: {acc_pgd_before * 100:.2f}%")
```

이 시점에서 FGSM/PGD robust accuracy는 clean accuracy보다 크게 낮을 것입니다 — [Lab 1](../lab1-adversarial-attack/)에서 확인한 것과 동일한 결과입니다.

### 3단계: 적대적 훈련(Adversarial Training) 적용

[적대적 훈련(Adversarial Training)](../../docs/defenses/adversarial-training/) 문서에서 다룬 min-max 최적화를 그대로 구현합니다. 매 미니배치마다 PGD로 적대적 예제를 생성한 뒤, 그 적대적 예제로 모델을 학습시킵니다(Madry et al. 방식의 단순화된 버전).

```python
adv_model = SimpleCNN().to(device)
adv_optimizer = optim.Adam(adv_model.parameters(), lr=1e-3)
adv_criterion = nn.CrossEntropyLoss()

adv_classifier = PyTorchClassifier(
    model=adv_model,
    loss=adv_criterion,
    optimizer=adv_optimizer,
    input_shape=(1, 28, 28),
    nb_classes=10,
    clip_values=(0.0, 1.0),
    device_type="gpu" if torch.cuda.is_available() else "cpu",
)

# 훈련용 PGD: 빠른 훈련을 위해 max_iter를 평가용보다 작게 설정 (대표적인 비용 절감 패턴)
pgd_train = ProjectedGradientDescent(estimator=adv_classifier, eps=0.2, eps_step=0.04, max_iter=7)

def adversarial_train(classifier, attack, loader, epochs=2):
    for epoch in range(epochs):
        for x, y in loader:
            x_np, y_np = x.numpy(), y.numpy()
            # 미니배치 절반은 깨끗한 예제, 절반은 PGD 적대적 예제로 구성
            half = len(x_np) // 2
            x_adv = attack.generate(x=x_np[:half])
            x_mixed = np.concatenate([x_adv, x_np[half:]], axis=0)
            y_mixed = y_np
            classifier.fit(x_mixed, y_mixed, batch_size=len(x_mixed), nb_epochs=1, verbose=False)
        print(f"Adversarial training epoch {epoch+1} 완료")

adversarial_train(adv_classifier, pgd_train, train_loader, epochs=2)
```

{{< callout type="info" >}}
ART는 `art.defences.trainer.AdversarialTrainer` 클래스도 제공합니다. 위 코드는 그 동작 원리(미니배치마다 적대적 예제를 생성해 섞어서 학습)를 직접 풀어 쓴 버전입니다. `AdversarialTrainer`를 사용하면 다음과 같이 더 간결하게 작성할 수 있습니다.

```python
from art.defences.trainer import AdversarialTrainer

trainer = AdversarialTrainer(adv_classifier, attacks=pgd_train, ratio=0.5)
trainer.fit(x_train, y_train, nb_epochs=2, batch_size=128)
```
{{< /callout >}}

### 4단계: 같은 공격으로 재측정 및 비교

방어 전 측정에 사용한 것과 **동일한 FGSM/PGD 설정**(eps=0.2)으로 적대적 훈련된 모델을 평가합니다. 동일한 위협 모델로 비교해야 의미 있는 결과를 얻을 수 있습니다.

```python
# Clean accuracy (방어 후)
acc_clean_after = evaluate(adv_classifier, x_test, y_test)

# FGSM robust accuracy (방어 후)
fgsm_after = FastGradientMethod(estimator=adv_classifier, eps=0.2)
x_test_fgsm_after = fgsm_after.generate(x=x_test)
acc_fgsm_after = evaluate(adv_classifier, x_test_fgsm_after, y_test)

# PGD robust accuracy (방어 후)
pgd_after = ProjectedGradientDescent(estimator=adv_classifier, eps=0.2, eps_step=0.02, max_iter=40)
x_test_pgd_after = pgd_after.generate(x=x_test)
acc_pgd_after = evaluate(adv_classifier, x_test_pgd_after, y_test)

print(f"[방어 후] Clean accuracy: {acc_clean_after * 100:.2f}%")
print(f"[방어 후] FGSM(eps=0.2) robust accuracy: {acc_fgsm_after * 100:.2f}%")
print(f"[방어 후] PGD(eps=0.2, max_iter=40) robust accuracy: {acc_pgd_after * 100:.2f}%")

print("\n=== 방어 전/후 비교 ===")
print(f"Clean accuracy:        {acc_clean_before*100:.2f}% -> {acc_clean_after*100:.2f}%")
print(f"FGSM robust accuracy:  {acc_fgsm_before*100:.2f}% -> {acc_fgsm_after*100:.2f}%")
print(f"PGD robust accuracy:   {acc_pgd_before*100:.2f}% -> {acc_pgd_after*100:.2f}%")
```

## 결과 확인

각 단계의 출력값을 아래와 같은 표로 정리합니다.

| 지표 | 베이스라인 (방어 전) | 적대적 훈련 후 (방어 후) |
|---|---|---|
| Clean accuracy | ~98% | 약간 하락 (예: ~95~97%) |
| FGSM(eps=0.2) robust accuracy | ~30~50% | 크게 향상 (예: ~70~85%) |
| PGD(eps=0.2, max_iter=40) robust accuracy | ~5~15% | 크게 향상 (예: ~40~60%) |

해석 시 확인할 포인트:

- **FGSM/PGD robust accuracy는 방어 후 뚜렷하게 향상**되어야 합니다. 향상이 거의 없다면 adversarial training의 `eps`/`max_iter` 설정이 평가 공격보다 약하거나, 훈련 epoch 수가 너무 적은지 확인하세요.
- **Clean accuracy는 방어 후 소폭 하락**하는 경향이 있습니다. 이것이 [적대적 훈련(Adversarial Training)](../../docs/defenses/adversarial-training/) 문서에서 다룬 **robustness-accuracy tradeoff**입니다. 하락이 전혀 없다면 오히려 적대적 훈련이 충분히 적용되지 않았을 가능성을 의심해 보세요.
- **PGD robust accuracy 향상폭이 FGSM보다 작을 수 있습니다.** PGD는 더 강한 공격이므로, 약한 위협 모델(FGSM)에 대한 방어가 강한 위협 모델(PGD)에는 완전히 전이되지 않는 경우가 흔합니다.

{{< callout type="info" >}}
실제 수치는 학습 epoch 수, PGD 훈련 시 `max_iter`, 랜덤 시드, 하드웨어에 따라 달라질 수 있습니다. 중요한 것은 **"robust accuracy는 향상되지만 clean accuracy는 소폭 하락한다"는 트레이드오프 패턴**을 직접 관찰하는 것입니다.
{{< /callout >}}

{{< callout type="warning" >}}
이 실습에서 측정한 robust accuracy는 **PGD(eps=0.2, max_iter=40)라는 특정 공격에 대한 결과**일 뿐입니다. [적대적 훈련(Adversarial Training)](../../docs/defenses/adversarial-training/) 문서의 "실무 적용 시 비용과 한계"에서 설명한 것처럼, 더 강한 적응형 공격(adaptive attack)이나 다른 `eps`/norm(L2 등)에 대해서는 방어 효과가 줄어들 수 있습니다. "방어를 적용했다"는 것이 "모든 공격에 안전하다"를 의미하지 않습니다.
{{< /callout >}}

## 체크리스트

- [ ] [Lab 1](../lab1-adversarial-attack/)과 동일한 모델/공격 설정으로 베이스라인의 clean accuracy를 측정했다.
- [ ] 베이스라인 모델에 대해 FGSM과 PGD robust accuracy를 측정했다.
- [ ] PGD 기반 adversarial training 루프(또는 `AdversarialTrainer`)로 같은 모델을 재학습했다.
- [ ] 동일한 FGSM/PGD 설정으로 적대적 훈련된 모델의 robust accuracy를 재측정했다.
- [ ] 방어 전/후 clean accuracy와 robust accuracy를 표로 비교했다.
- [ ] clean accuracy 하락(정확도-강건성 트레이드오프)을 관찰하고 그 의미를 설명할 수 있다.
- [ ] 측정한 표를 캡처하여 포트폴리오나 학습 노트에 기록했다.

## 학습효과

- **공격자-방어자 관점 전환**: [Lab 1](../lab1-adversarial-attack/)에서 확인한 취약점을 그대로 이어받아, 같은 모델/공격으로 적대적 훈련(Adversarial Training)을 직접 구현하며 방어자 시각을 갖춥니다.
- **트레이드오프의 수치화**: 방어 적용 전/후의 robust accuracy와 clean accuracy를 동일한 위협 모델(FGSM/PGD, eps=0.2)로 비교해, robustness-accuracy tradeoff를 직접 측정합니다.
- **방어의 한계 인식**: "방어를 적용했다"는 것이 모든 공격에 대한 안전을 의미하지 않음을 이해하고, 더 강한/적응형 공격에 대한 후속 검증의 필요성을 인식합니다.

## 더 살펴보기

{{< cards >}}
  {{< card link="../../docs/defenses/adversarial-training/" title="적대적 훈련 (Adversarial Training)" subtitle="Min-Max 최적화, PGD 기반 훈련, TRADES, robustness-accuracy tradeoff의 이론적 배경" >}}
  {{< card link="../../docs/attacks/adversarial-examples/" title="적대적 예제 개념" subtitle="FGSM/PGD/C&W의 수학적 원리와 white-box/black-box 구분" >}}
  {{< card link="../lab1-adversarial-attack/" title="Lab 1: 적대적 공격 실습" subtitle="이 실습에서 방어한 FGSM/PGD 공격을 직접 생성하고 ASR을 계산하는 실습" icon="pencil-alt" >}}
{{< /cards >}}
