---
title: "AI와 협업할 때 '가이드라인'이 왜 필수일까? — 안전한 개발을 위한 AI 행동 강령"
date: 2026-06-19T14:10:00-05:00
tags:
  - AI 거버넌스
  - AI 안전
  - 개발 생산성
  - AI 협업
---

최근 소프트웨어 개발 현장에서 AI 코딩 에이전트는 없어서는 안 될 '천재적인 동료'가 되었습니다. 하지만 이 동료는 때때로 우리가 의도하지 않은 위험한 실수를 저지르기도 합니다. 프로젝트에 치명적인 보안 사고를 예방하고, 인간과 AI가 안전하게 협업하기 위해 반드시 필요한 'AI 행동 강령(Context rules)'의 중요성과 그 구조를 쉽게 풀어드립니다.

<!--more-->
---

## 1. 왜 AI에게 별도의 '행동 강령'이 필요한가요?

전통적인 프로그래밍은 인간 개발자가 한 줄 한 줄 로직을 짭니다. 반면 AI는 학습된 데이터를 기반으로 확률적으로 코드를 제안합니다. 이 과정에서 AI는 **보안보다는 기능 구현에 우선순위**를 두는 경향이 있어, 다음과 같은 위험에 노출될 수 있습니다.

* **보안 불감증:** 비밀번호나 API 키를 코드에 직접 적어버리는 실수.
* **개인정보 침해:** 고객의 이름이나 연락처를 로그에 남기는 실수.
* **통제 불가능:** 인간의 확인 없이 데이터베이스를 지우거나 배포를 진행하는 경우.

---

## 2. AI 행동 강령(Context Rules)의 핵심 4요소

프로젝트의 보안을 지키는 '콘텍스트 규칙'은 크게 네 가지 기둥으로 나뉩니다.

### ① 절대 무너지지 않는 보안 (Hard Rules)
- **비밀 절대 금지:** API 키나 토큰은 절대 코드에 넣지 말고 `.env` 파일에 격리합니다.
- **클라이언트 vs 서버 분리:** 브라우저에서 읽히면 안 되는 인증 로직은 서버에만 둡니다.

### ② 개발자의 '브레이크' 시스템 (Production Safety)
AI가 운영 환경에 영향을 주는 코드를 변경할 때는 반드시 **인간의 승인**이 필요합니다. "무엇을, 왜 바꾸려는지" AI가 스스로 요약하게 함으로써 인간이 리스크를 사전에 검토할 수 있도록 합니다.

### ③ 데이터 프라이버시 (Data & Privacy)
AI가 개인정보(이름, 이메일, 전화번호 등)를 다루지 않도록 원천 차단합니다. 이는 현대 소프트웨어 개발에서 가장 중요한 **컴플라이언스(Compliance)** 영역입니다.

### ④ 에스컬레이션 (Escalation)
AI가 혼자 해결하기 어려운 상황(테스트 실패, 복잡한 인증 로직 수정 등)이 오면, 무리하게 진행하지 않고 인간에게 도움을 요청하도록 정의합니다.

---

## 3. 이 가이드라인이 가져오는 변화

단순히 규칙을 정하는 것을 넘어, 이 가이드라인은 **'책임감 있는 AI 생태계'**를 만듭니다.

1.  **실수 감소:** 보안 사고를 예방하여 유지보수 비용을 획기적으로 줄입니다.
2.  **생산성 향상:** '어디까지 해도 되는지' 명확한 가이드가 있으므로 AI가 더 당당하고 정확하게 코드를 작성합니다.
3.  **지속 가능한 개발:** 개발팀의 노하우가 규칙으로 기록되어, 새로운 팀원이나 새로운 AI 모델이 투입되어도 동일한 수준의 보안을 유지할 수 있습니다.

---

## 결론: AI는 도구, 운전대는 인간이 잡아야 합니다

AI 행동 강령은 AI를 속박하는 것이 아니라, **안전한 울타리 안에서 AI가 최대한의 능력을 발휘하도록 돕는 역할**을 합니다. 보안 사고는 한 번의 실수로 발생하지만, 잘 설계된 행동 강령은 수천 번의 실수를 사전에 막아줍니다.

여러분의 프로젝트에도 지금 당장 AI를 위한 '행동 강령'을 도입해보시는 건 어떨까요? 안전한 코드, 그 시작은 명확한 가이드라인에서 출발합니다.


## AI 행동 강령(Context Rules) 예시

 하나의 예시로  `CONTEXT.md` 파일의 내용은 다음과 같습니다.

```text

# CONTEXT.md — AI Coding Agent Rules

 

## Who this is for

This file sets the rules for any AI agent working in this codebase.

Read this before generating, modifying, or reviewing any code.

 

---

 

## Hard rules (never break these)

 

### Credentials & secrets

- Never hardcode API keys, passwords, tokens, or secrets in code

- All secrets go in environment variables (.env file) only

- Never commit .env files to version control

- If you find a hardcoded credential, stop and flag it before doing anything else

 

### Frontend vs backend

- Never put authentication logic, password validation, or access control on the frontend

- API keys must never be readable by a browser

- User session flags must be validated server-side, not client-side

- If you're tempted to put something sensitive in JavaScript that runs in the browser — don't

 

### Data & privacy

- Never log or expose personally identifiable information (PII): names, emails, SSNs, credit card numbers, phone numbers

- If an input contains PII, redact it before passing it to any external service or LLM

- Do not store user data on external servers without explicit approval

 

### Packages & dependencies

- Only install packages from the approved list or official registries (npm, PyPI)

- Never install a package you invented or that you're not certain exists

- If you're unsure whether a package is real, ask before installing

- Pin all dependency versions explicitly

 

---

 

## Before touching production

 

Stop. Write a plain-English summary of:

- What you are about to change

- Why

- What could go wrong

- Whether a human needs to approve this first

 

High-stakes actions (database changes, auth changes, payment flows, sending emails) require explicit human sign-off before execution.

 

---

 

## How to handle errors

 

- If a test fails, fix the code — do not delete or modify the test

- If you can't fix something, say so clearly rather than working around it

- Never mock a result to make a test pass

- Small changes only — modify the minimum number of files needed to accomplish the task

 

---

 

## Security checks before every commit

 

Run these before any code leaves the machine:

- No hardcoded secrets (Semgrep or similar)

- No PII in logs

- No packages not present in requirements.txt / package.json before this session

- No changes to authentication or access control logic without human review

 

---

 

## When to escalate to a human

 

Escalate (don't proceed autonomously) when:

- The change touches payment processing, authentication, or user data

- You're modifying more than 5 files at once

- You're adding a new external service or API integration

- A test is failing and you don't know why

- Something feels off

 

---

 

*This file is part of the project's security baseline. Do not modify without team approval.*

  

