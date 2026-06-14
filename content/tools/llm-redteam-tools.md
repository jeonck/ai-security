---
title: "LLM 레드팀 도구"
weight: 2
---

LLM과 에이전트 시스템은 전통적인 분류기와 달리 **자연어 프롬프트를 통한 공격(프롬프트 인젝션, 탈옥)**, **민감정보 유출**, **유해 콘텐츠 생성** 같은 새로운 위험을 가집니다. 아래 도구들은 이런 위험을 체계적으로 탐색하고 측정하기 위해 Microsoft, NVIDIA, Meta 등 주요 기관과 오픈소스 커뮤니티가 만든 LLM/에이전트 레드티밍·평가 도구입니다. [LLM·에이전트 레드티밍](/docs/red-teaming/llm-red-teaming)에서 다룬 개념을 실제로 자동화하고 확장할 때 사용합니다.

{{< callout type="info" >}}
직접 실습 환경에서 따라 해보고 싶다면 [LLM·에이전트 레드티밍](/docs/red-teaming/llm-red-teaming)과 [실습 (Labs)](/labs) 섹션을 참고하세요. 이 페이지는 도구의 개요와 설치/사용 방법에 집중합니다.
{{< /callout >}}

## Microsoft PyRIT (Python Risk Identification Tool)

**용도**: Microsoft AI Red Team이 개발한 프레임워크로, LLM 및 생성형 AI 시스템에 대한 **자동화된 레드티밍 오케스트레이션**을 제공합니다. 공격 프롬프트 생성기, 변형(converter, 예: 인코딩/언어 변경), 대상 시스템 호출, 응답 채점(scorer)을 조합해 "공격 → 변형 → 전송 → 채점"의 반복 루프를 자동화할 수 있습니다.

**설치**

```bash
pip install pyrit
```

**대표 사용 예시**

```python
from pyrit.orchestrator import PromptSendingOrchestrator
from pyrit.prompt_target import OpenAIChatTarget

target = OpenAIChatTarget()
orchestrator = PromptSendingOrchestrator(prompt_target=target)
await orchestrator.send_prompts_async(prompt_list=["..."])
```

**GitHub**: https://github.com/Azure/PyRIT

PyRIT은 "수동 레드팀이 발견한 위험을 자동화된 반복 테스트로 확장한다"는 Microsoft의 레드팀 철학을 그대로 구현한 도구입니다.

## NVIDIA Garak

**용도**: LLM의 취약점을 스캔하는 "취약점 스캐너(vulnerability scanner)"입니다. 프롬프트 인젝션, 탈옥, 데이터 유출, 유해 콘텐츠 생성, 환각(hallucination) 등 다양한 "probe(탐색기)"를 미리 정의해두고, 대상 모델에 자동으로 실행한 뒤 결과를 채점합니다. nmap이 네트워크 포트를 스캔하듯, garak은 LLM의 "취약점 표면"을 스캔한다고 비유할 수 있습니다.

**설치**

```bash
pip install garak
```

**대표 사용 예시 (CLI)**

```bash
# OpenAI 모델에 대해 promptinject(프롬프트 인젝션) probe 실행
garak --model_type openai --model_name gpt-4o-mini --probes promptinject
```

**GitHub**: https://github.com/leondz/garak

다양한 probe를 한 번에 실행하면 모델별 "약점 프로파일"을 빠르게 얻을 수 있어, 여러 모델/버전을 비교 평가할 때 특히 유용합니다.

## promptfoo

**용도**: 원래는 LLM 애플리케이션의 **프롬프트 품질 평가(eval) 도구**로 시작했지만, 현재는 `redteam` 기능을 통해 프롬프트 인젝션, 탈옥, PII 유출, 시스템 프롬프트 추출 등 다양한 공격 시나리오를 자동 생성하고 실행하는 LLM 레드팀 도구로도 널리 쓰입니다. YAML 설정 기반으로 CI/CD 파이프라인에 통합하기 쉽다는 점이 특징입니다.

**설치**

```bash
npm install -g promptfoo
```

**대표 사용 예시 (CLI)**

```bash
# 레드팀 설정 생성 및 실행
promptfoo redteam init
promptfoo redteam run
promptfoo redteam report
```

**GitHub**: https://github.com/promptfoo/promptfoo

promptfoo는 "공격 탐색"과 "정기적인 회귀 테스트"를 같은 도구로 처리할 수 있어, 한 번의 레드팀 결과를 CI 파이프라인의 **지속적 가드레일 테스트**로 전환하는 데 적합합니다.

## Giskard

**용도**: ML 모델 및 LLM 애플리케이션을 위한 **품질·안전성 테스트 프레임워크**입니다. RAG 파이프라인, 챗봇, 분류 모델 등에 대해 편향(bias), 환각, 프롬프트 인젝션, 성능 저하 등을 자동으로 탐지하는 "스캔(scan)" 기능을 제공하며, 결과를 대시보드 형태의 리포트로 생성합니다.

**설치**

```bash
pip install giskard
```

**대표 사용 예시**

```python
import giskard

# LLM 애플리케이션을 감싸는 함수를 정의한 뒤 스캔 실행
giskard_model = giskard.Model(model=my_llm_app, model_type="text_generation")
results = giskard.scan(giskard_model)
results.to_html("scan_report.html")
```

**GitHub**: https://github.com/Giskard-AI/giskard

Giskard는 보안 취약점뿐 아니라 **품질 회귀**(데이터 드리프트, 성능 저하)까지 함께 탐지하므로, 레드팀 결과를 "운영 품질 모니터링"과 묶어서 보고하고 싶을 때 적합합니다.

## Meta Purple Llama / Llama Guard

**용도**: Meta가 공개한 **생성형 AI 안전성 도구 모음**입니다. 대표적으로 `Llama Guard`는 사용자 입력과 모델 출력을 분류하여 유해 콘텐츠 여부를 판단하는 **세이프가드 분류 모델**(safeguard classifier)이고, `CyberSecEval`은 LLM이 생성하는 코드의 보안 취약점이나 사이버 공격 지원 가능성을 평가하는 벤치마크입니다. 즉 Purple Llama는 "공격 도구"보다는 **모델/애플리케이션에 적용할 가드레일과 평가 벤치마크**에 가깝습니다.

**설치 / 사용**

```bash
# Llama Guard는 Hugging Face를 통해 일반 모델처럼 로드해 사용합니다
pip install transformers torch
```

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-Guard-3-8B")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-Guard-3-8B")
# chat 형식으로 입력/출력을 분류해 안전/위반 카테고리를 반환
```

**GitHub**: https://github.com/meta-llama/PurpleLlama

Llama Guard와 같은 가드레일 모델은 [LLM·에이전트 레드티밍](/docs/red-teaming/llm-red-teaming)에서 발견한 위험을 **운영 단계에서 차단하는 방어 계층**으로 활용할 수 있습니다 — 레드팀(공격 탐색)과 가드레일(운영 방어)은 한 쌍으로 묶어 생각하는 것이 좋습니다.

## 도구 선택 가이드

| 상황 | 추천 도구 |
|---|---|
| 다양한 공격 시나리오를 오케스트레이션하며 자동화 파이프라인을 만들고 싶다 | PyRIT |
| 모델의 전반적인 취약점 표면을 빠르게 스캔하고 싶다 | Garak |
| 레드팀 결과를 CI/CD의 지속적 가드레일 테스트로 운영하고 싶다 | promptfoo |
| 보안 취약점과 품질 회귀(편향, 환각 등)를 함께 보고 싶다 | Giskard |
| 운영 환경에 입력/출력 안전성 분류기를 배치하고 싶다 | Llama Guard (Purple Llama) |

## 더 알아보기

- [LLM·에이전트 레드티밍](/docs/red-teaming/llm-red-teaming) — 작은 RAG 챗봇을 대상으로 프롬프트 인젝션, 시스템 프롬프트 유출 등을 직접 테스트하는 실습 가이드입니다.
- [실습 (Labs)](/labs) — 이 페이지에서 소개한 도구들을 실제로 설치하고 실행하는 단계별 실습 환경을 제공합니다.
- [학습 로드맵](/docs) — LLM 레드티밍이 전체 AI 보안 학습 흐름에서 어디에 위치하는지 확인할 수 있습니다.
