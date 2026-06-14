---
title: "적대적 ML 도구"
weight: 1
---

전통적인 적대적 머신러닝(Adversarial ML) 영역은 이미지 분류기, 회귀 모델, NLP 분류기 등을 대상으로 **입력에 작은 변형을 더해 모델을 속이는 공격**과, 이를 막기 위한 **방어 기법**을 연구하는 분야입니다. 아래 도구들은 이 분야에서 가장 널리 쓰이는 오픈소스 라이브러리로, [적대적 예제](/docs/attacks/adversarial-examples)와 [적대적 훈련](/docs/defenses/adversarial-training)에서 다룬 개념을 직접 코드로 확인할 수 있게 해줍니다.

{{< callout type="info" >}}
실제로 손을 움직여 따라 해보고 싶다면 [ART·Foolbox로 적대적 공격 실습하기](/docs/red-teaming/art-foolbox-practice)와 [실습 (Labs)](/labs) 섹션을 참고하세요. 이 페이지는 도구 자체의 개요와 설치 방법에 집중합니다.
{{< /callout >}}

## IBM Adversarial Robustness Toolbox (ART)

**용도**: 적대적 공격(evasion), 방어(adversarial training, 전처리, 탐지), 모델 추출, 멤버십 추론, 데이터 포이즈닝 시뮬레이션까지 포괄하는 종합 툴킷입니다. PyTorch, TensorFlow, Keras, scikit-learn, XGBoost 등 다양한 프레임워크의 모델을 동일한 `Estimator` 인터페이스로 감싸서 사용할 수 있습니다.

**설치**

```bash
pip install adversarial-robustness-toolbox
# PyTorch 모델을 다룰 경우
pip install adversarial-robustness-toolbox torch torchvision
```

**대표 사용 예시**

```python
from art.estimators.classification import PyTorchClassifier
from art.attacks.evasion import FastGradientMethod

classifier = PyTorchClassifier(
    model=model, loss=loss_fn, optimizer=optimizer,
    input_shape=(1, 28, 28), nb_classes=10, clip_values=(0.0, 1.0),
)
attack = FastGradientMethod(estimator=classifier, eps=0.1)
x_adv = attack.generate(x=x_test)
```

**GitHub**: https://github.com/Trusted-AI/adversarial-robustness-toolbox

특징적으로 ART는 단순 공격/방어를 넘어, **모델 탈취(model extraction)**와 **멤버십 추론(membership inference)** 같은 프라이버시 공격까지 같은 라이브러리 안에서 다룰 수 있어, [모델 탈취 및 추출](/docs/attacks/model-theft) 주제를 실습할 때도 유용합니다.

## Foolbox

**용도**: PyTorch, TensorFlow, JAX 모델에 대해 다양한 적대적 공격을 "최소한의 코드"로 빠르게 적용하는 데 특화된 경량 라이브러리입니다. ART보다 학습 곡선이 낮고, 여러 공격을 빠르게 비교/탐색하고 싶을 때 적합합니다.

**설치**

```bash
pip install foolbox
```

**대표 사용 예시**

```python
import foolbox as fb

fmodel = fb.PyTorchModel(model, bounds=(0, 1))
attack = fb.attacks.LinfPGD()
raw, clipped, is_adv = attack(fmodel, images, labels, epsilons=[0.01, 0.03, 0.1, 0.3])
```

**GitHub**: https://github.com/bethgelab/foolbox

여러 `epsilon` 값을 한 번에 넘겨 "perturbation 크기 대비 공격 성공률" 곡선을 손쉽게 얻을 수 있다는 점이 Foolbox의 가장 큰 장점입니다.

## CleverHans

**용도**: 적대적 예제 연구의 초기부터 사용되어온 대표적인 라이브러리로, FGSM, PGD, Carlini & Wagner(C&W) 등 핵심 공격 알고리즘의 레퍼런스 구현을 제공합니다. 현재는 PyTorch, TensorFlow2, JAX 버전을 함께 제공하며, 연구 논문에서 공격을 재현하거나 새로운 공격을 ART/Foolbox와 비교 검증할 때 자주 인용됩니다.

**설치**

```bash
pip install cleverhans
```

**대표 사용 예시**

```python
from cleverhans.torch.attacks.fast_gradient_method import fast_gradient_method

x_adv = fast_gradient_method(model, x_test, eps=0.1, norm=float("inf"))
```

**GitHub**: https://github.com/cleverhans-lab/cleverhans

{{< callout type="info" >}}
ART, Foolbox, CleverHans는 동일한 공격(FGSM, PGD 등)을 서로 다른 구현으로 제공합니다. 같은 모델에 세 라이브러리를 모두 적용해 결과를 비교하면, "구현 차이가 결과에 얼마나 영향을 주는가"라는 재현성(reproducibility) 감각을 얻을 수 있습니다.
{{< /callout >}}

## TextAttack (NLP 적대적 공격)

**용도**: 이미지가 아닌 **텍스트 분류기, 감정 분석, 자연어 추론(NLI) 모델** 등을 대상으로 한 적대적 공격에 특화된 라이브러리입니다. 단어 치환(synonym substitution), 문자 단위 변형(character-level perturbation), 패러프레이징 등을 통해 "사람이 보면 의미가 같지만 모델은 다르게 분류하는" 입력을 생성합니다. Hugging Face `transformers`와 자연스럽게 연동됩니다.

**설치**

```bash
pip install textattack
```

**대표 사용 예시 (CLI)**

```bash
# 사전 학습된 BERT 감정분석 모델에 TextFooler 공격 적용
textattack attack --recipe textfooler \
  --model bert-base-uncased-imdb \
  --num-examples 10
```

**GitHub**: https://github.com/QData/TextAttack

TextAttack은 [프롬프트 인젝션](/docs/attacks/prompt-injection)이나 [탈옥](/docs/attacks/jailbreak)처럼 LLM을 직접 대상으로 하는 공격과는 결이 다릅니다. 오히려 분류기형 NLP 모델(스팸 필터, 콘텐츠 모더레이션 분류기 등)의 강건성을 평가할 때 사용한다는 점을 기억해두면, LLM 레드팀 도구와의 역할 구분이 명확해집니다.

## 도구 선택 가이드

| 상황 | 추천 도구 |
|---|---|
| 이미지 분류기에 공격+방어+추출까지 종합적으로 실습하고 싶다 | ART |
| 여러 공격을 빠르게 비교/탐색하고 싶다 | Foolbox |
| 논문에 나온 공격을 정확히 재현하고 싶다 | CleverHans |
| 텍스트 분류기/모더레이션 모델의 강건성을 평가하고 싶다 | TextAttack |

## 더 알아보기

- [ART·Foolbox로 적대적 공격 실습하기](/docs/red-teaming/art-foolbox-practice) — ART와 Foolbox를 사용해 FGSM/PGD 공격부터 적대적 훈련까지 전체 흐름을 단계별로 따라가는 실습 가이드입니다.
- [실습 (Labs)](/labs) — 이 페이지에서 소개한 도구들을 실제로 설치하고 실행하는 단계별 실습 환경을 제공합니다.
- [학습 로드맵](/docs) — 적대적 ML 공격/방어가 전체 AI 보안 학습 흐름에서 어디에 위치하는지 확인할 수 있습니다.
