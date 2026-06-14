---
title: "② 공격 기법"
weight: 2
---

AI 시스템을 위협하는 공격 기법은 크게 두 갈래로 나눌 수 있습니다. 하나는 **전통적인 머신러닝(ML) 시대부터 연구되어 온 공격**들이고, 다른 하나는 **LLM(대형 언어 모델) 시대에 본격적으로 부각된 공격**들입니다. 이 구분을 명확히 이해하는 것이 이 지식베이스 전체를 관통하는 핵심 축입니다.

## 전통적 ML 시대의 공격

분류기, 회귀 모델, 추천 시스템 등 전통적인 ML 모델을 대상으로 한 공격은 2010년대 중반부터 학계에서 활발히 연구되었습니다.

- **적대적 예제 (Adversarial Examples)**: 입력에 사람이 인지하기 어려운 미세한 변형(perturbation)을 가해 모델의 출력을 의도적으로 잘못되게 만드는 공격입니다. 이미지 분류기를 속이는 스티커, 표지판 변형 등이 대표적입니다.
- **데이터 포이즈닝 (Data Poisoning)**: 학습 데이터 자체를 오염시켜 모델이 처음부터 잘못 학습하도록 만드는 공격입니다. 백도어(backdoor)를 심거나 특정 클래스의 성능을 저하시키는 방식이 있습니다.
- **모델 탈취 및 추출 (Model Theft & Extraction)**: 모델에 반복적으로 질의(query)하여 그 동작을 복제하거나, 학습 데이터의 일부를 역으로 추출하는 공격입니다.

## LLM 시대에 부각된 공격

ChatGPT, Claude 등 대형 언어 모델이 다양한 애플리케이션의 핵심 구성요소로 자리잡으면서, 자연어 인터페이스 자체를 악용하는 새로운 공격 표면이 등장했습니다.

- **프롬프트 인젝션 (Prompt Injection)**: 모델에게 전달되는 입력(사용자 프롬프트뿐 아니라 외부 문서, 검색 결과, 도구 출력 등)에 악의적인 지시를 삽입하여 모델의 원래 의도를 가로채는 공격입니다.
- **탈옥 (Jailbreak)**: 모델에 내재된 안전 정책이나 가드레일을 우회하여, 본래 거부해야 할 응답을 생성하도록 유도하는 공격입니다.

물론 이 구분이 절대적인 것은 아닙니다. 예를 들어 데이터 포이즈닝은 LLM의 파인튜닝 데이터나 RAG(Retrieval-Augmented Generation) 인덱스에도 그대로 적용될 수 있고, 모델 추출은 LLM API에도 위협이 됩니다. 하지만 "어떤 공격이 어떤 시대적 맥락에서 왜 주목받았는가"를 이해하면, 새로운 공격이 등장했을 때 그것이 기존 공격의 변형인지 완전히 새로운 위협인지 빠르게 판단할 수 있습니다.

{{< callout type="info" >}}
**공격 이해가 방어의 출발점입니다.** 각 공격 기법은 그에 대응하는 구체적인 방어 기법과 1:1 또는 N:N으로 연결됩니다. 예를 들어 적대적 예제는 [적대적 훈련](../defenses/adversarial-training)으로, 데이터 포이즈닝은 [공급망 보안](../infrastructure/supply-chain-risk)과 [데이터 거버넌스](../governance/nist-ai-rmf)로, 모델 탈취는 [모델 서빙 보안](../infrastructure/model-serving-security)의 레이트 리미팅 등으로, 프롬프트 인젝션과 탈옥은 [OWASP LLM Top 10](../governance/owasp-llm-top10) 기반의 입출력 검증 및 [레드티밍](../red-teaming/llm-red-teaming)으로 대응합니다. 공격의 메커니즘을 모른 채 방어 체크리스트만 따르면, 새로운 변형 공격에 무력해질 수밖에 없습니다.
{{< /callout >}}

## 이 섹션에서 다루는 내용

아래 5개 페이지는 각각 하나의 공격 기법을 다루며, 정의, 대표적인 기법, 실제 사례, 그리고 대응되는 방어 기법으로의 링크를 포함합니다.

{{< cards >}}
  {{< card link="adversarial-examples" title="적대적 예제" subtitle="입력 perturbation으로 모델을 속이는 공격 (FGSM, PGD, C&W)" >}}
  {{< card link="data-poisoning" title="데이터 포이즈닝" subtitle="학습 데이터 및 RAG 인덱스 오염 공격" >}}
  {{< card link="model-theft" title="모델 탈취 및 추출" subtitle="쿼리 기반 모델 복제와 멤버십 추론" >}}
  {{< card link="prompt-injection" title="프롬프트 인젝션" subtitle="LLM에 악의적 지시를 주입하는 공격 (OWASP LLM01)" >}}
  {{< card link="jailbreak" title="탈옥" subtitle="안전 가드레일을 우회하는 기법들" >}}
  {{< card link="../../labs/lab5-data-poisoning-attack/" title="Lab 5: 데이터 포이즈닝 공격 실습" subtitle="label-flipping·백도어 포이즌 주입과 정확도/ASR 측정 실습" icon="pencil-alt" >}}
{{< /cards >}}
