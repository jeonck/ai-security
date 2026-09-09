---
title: "AWS Bedrock Guardrails"
weight: 6
---

Amazon Bedrock Guardrails는 **관리형 가드레일 서비스**입니다. 오픈소스 프레임워크와 비교했을 때의 차이는 명확합니다 — 분류 모델을 직접 운영하지 않고, 정책을 콘솔이나 API로 정의하면 AWS가 추론을 대신합니다. 대신 커스터마이즈 여지는 제한되고 요청당 비용이 발생합니다.

## 여섯 가지 정책

| 정책 | 하는 일 |
|---|---|
| **콘텐츠 필터 (Content filters)** | Hate, Insults, Sexual, Violence, Misconduct, **Prompt Attack** 6개 카테고리를 강도별(NONE/LOW/MEDIUM/HIGH)로 차단. 텍스트와 이미지 모두 지원 |
| **거부 주제 (Denied topics)** | 자연어로 정의한 주제(예: "투자 자문")를 차단 |
| **단어 필터 (Word filters)** | 욕설 기본 목록 + 커스텀 단어·구문 |
| **민감정보 필터 (Sensitive information filters)** | 50종 이상의 PII 엔터티를 탐지해 `BLOCK` 또는 `ANONYMIZE`. 커스텀 정규식 추가 가능 |
| **문맥적 근거 검사 (Contextual grounding check)** | 응답이 제공된 근거에 기반하는지, 질문과 관련 있는지를 점수로 판정 → [환각](../hallucination/) 억제 |
| **자동 추론 검사 (Automated Reasoning checks)** | 정책 문서를 **형식 논리 모델로 변환**해, 응답이 그 정책과 논리적으로 모순되지 않는지 **수학적으로 검증** |

{{< callout type="info" >}}
콘텐츠 필터에는 **Standard 티어**가 있어, 오탈자 같은 변형에도 견디는 문맥 이해와 **60개 언어 지원**을 제공합니다. 한국어 트래픽을 다룬다면 티어 선택이 탐지 품질에 직접 영향을 줍니다 — [입력 가드레일](../input-guardrails/)에서 언급한 오픈 모델의 한국어 약점을 보완하는 실질적인 이유가 됩니다.
{{< /callout >}}

### Automated Reasoning checks

가장 특징적인 기능입니다. 샘플링 기반 테스트가 "많이 해봤더니 괜찮더라"라면, 이쪽은 **형식 검증(formal verification)** 으로 "이 응답은 정책과 모순된다"를 증명하는 접근입니다.

1. 사내 정책·규정 문서를 업로드하면 서비스가 이를 **논리 규칙과 변수의 집합**으로 변환합니다.
2. 사람이 그 변환 결과를 검토·수정합니다 (이 단계가 생략 불가능한 핵심입니다).
3. 런타임에 모델 응답을 이 논리 모델과 대조해 `VALID` / `INVALID` / `SATISFIABLE` 등의 판정과 근거를 반환합니다.

2024년 12월 프리뷰로 공개되어 2025년 8월 정식 출시됐고, 이후 리전이 계속 확대되어 2026년 6월에는 아시아 태평양(시드니)이 추가됐습니다. AWS는 이 기능이 정확한 응답 판별에서 **최대 99% 정확도**를 낸다고 밝히고 있습니다.

{{< callout type="warning" >}}
"99%"와 "수학적 보장"이라는 표현은 **변환된 논리 모델이 실제 정책을 올바르게 표현했을 때** 성립하는 이야기입니다. 정책 문서를 논리로 옮기는 과정에서 누락되거나 왜곡된 조건이 있으면, 검증은 잘못된 모델에 대해 완벽하게 동작합니다. 벤더의 정확도 수치를 그대로 통제 근거로 인용하지 말고, **자체 시나리오로 검증한 결과**를 [위험 등록부](../../governance/ai-risk-register/)에 남기세요.
{{< /callout >}}

## 구성과 배포

```bash
# 1) 가드레일 생성
aws bedrock create-guardrail \
  --name "corp-chatbot-guardrail" \
  --blocked-input-messaging "요청을 처리할 수 없습니다." \
  --blocked-outputs-messaging "응답을 제공할 수 없습니다." \
  --content-policy-config '{
      "filtersConfig": [
        {"type":"PROMPT_ATTACK","inputStrength":"HIGH","outputStrength":"NONE"},
        {"type":"HATE","inputStrength":"HIGH","outputStrength":"HIGH"},
        {"type":"VIOLENCE","inputStrength":"HIGH","outputStrength":"HIGH"}
      ]}' \
  --sensitive-information-policy-config '{
      "piiEntitiesConfig": [
        {"type":"EMAIL","action":"ANONYMIZE"},
        {"type":"CREDIT_DEBIT_CARD_NUMBER","action":"BLOCK"}
      ]}'

# 2) 버전 생성 — 운영에는 DRAFT가 아니라 고정 버전을 붙일 것
aws bedrock create-guardrail-version --guardrail-identifier <ID>
```

{{< callout type="warning" >}}
`PROMPT_ATTACK` 필터의 `outputStrength`는 `NONE`이어야 합니다. 인젝션 탐지는 입력 방향에만 적용되는 카테고리이며, 출력 강도를 올리면 설정 오류가 됩니다.
{{< /callout >}}

### 호출 방식 두 가지

```python
import boto3
rt = boto3.client("bedrock-runtime")

# (A) 모델 호출에 가드레일을 붙이기
resp = rt.converse(
    modelId="anthropic.claude-sonnet-4-5-20250929-v1:0",
    messages=[{"role": "user", "content": [{"text": user_input}]}],
    guardrailConfig={"guardrailIdentifier": GID, "guardrailVersion": "1"},
)

# (B) ApplyGuardrail API — 모델 호출과 분리해 단독 검사
check = rt.apply_guardrail(
    guardrailIdentifier=GID, guardrailVersion="1",
    source="INPUT",                                  # 또는 "OUTPUT"
    content=[{"text": {"text": user_input}}],
)
print(check["action"])          # NONE | GUARDRAIL_INTERVENED
print(check["assessments"])     # 어떤 정책이 왜 걸렸는지
```

{{< callout type="info" >}}
**`ApplyGuardrail`이 실무에서 더 유용한 경우가 많습니다.** Bedrock 외부 모델(자체 호스팅 오픈 모델, 타사 API)이나 RAG 검색 결과, 심지어 에이전트의 도구 출력에도 같은 정책을 적용할 수 있어, **모델 벤더와 무관한 단일 정책 지점**을 만들 수 있습니다. 스트리밍 응답에도 적용 가능합니다.
{{< /callout >}}

## 운영 시 고려사항

| 항목 | 내용 |
|---|---|
| **버전 고정** | 운영 트래픽에 `DRAFT`를 쓰지 말 것. 정책 변경이 즉시 프로덕션에 반영되어 대량 오탐을 낼 수 있음 |
| **지연** | 가드레일은 추가 추론입니다. 입력·출력 양방향에 걸면 왕복 지연이 늘어남 — 카테고리를 필요한 것만 켜세요 |
| **비용** | 텍스트 단위 과금. 모든 요청에 전 정책을 거는 구성은 비용이 빠르게 커집니다 |
| **장애 시 동작** | 가드레일 호출 실패 시 요청을 통과시킬지 차단할지를 **명시적으로 결정**할 것 (기본은 fail-closed 권장) |
| **로깅** | CloudWatch로 `GUARDRAIL_INTERVENED` 이벤트와 assessment를 남겨 [위험 등록부](../../governance/ai-risk-register/)·감사 증적으로 활용 |
| **자체 검증** | 벤더 정확도 수치가 아니라, 자사 한국어 트래픽 표본으로 오탐/미탐률을 직접 측정 |

## 오픈소스와의 선택

| | Bedrock Guardrails | 오픈소스 ([NeMo·Guardrails AI](../frameworks/)) |
|---|---|---|
| 운영 부담 | 낮음 | 분류 모델을 직접 서빙해야 함 |
| 커스터마이즈 | 정책 설정 범위 내 | 임계값·모델·로직 전면 제어 |
| 데이터 이동 | 요청이 AWS를 통과 | 온프레미스 유지 가능 |
| 비용 구조 | 요청당 과금 | 인프라 고정비 |
| 대화 흐름 통제 | 거부 주제 수준 | Colang으로 다중 턴 정책 기술 |

규제 산업에서 데이터 반출이 제약이거나 임계값을 세밀히 조정해야 한다면 오픈소스가, 빠르게 기준선을 세우고 운영 인력을 아끼려면 관리형이 맞습니다. 실무에서는 **관리형으로 기준선을 깔고, 조직 고유 위험은 자체 검증 로직으로 덧붙이는 하이브리드**가 흔한 형태입니다.

## 더 살펴보기

- [가드레일 프레임워크](../frameworks/) — 오픈소스 대안 비교
- [환각과 탐지](../hallucination/) — Contextual grounding과 오픈 모델 탐지기의 관계
- [OWASP LLM Top 10](../../governance/owasp-llm-top10/) — 각 정책이 어떤 항목에 대응하는지 매핑
