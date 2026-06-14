---
title: "Lab 4: AI 모델 서빙 API 보안 점검"
weight: 4
---

이 실습에서는 아주 작은 머신러닝 분류 모델을 **FastAPI 추론 API**로 서빙하고, [기반 지식](../../docs/foundations/) 섹션의 네 가지 영역(네트워크 보안, 웹 보안, 암호학, ML/딥러닝 기초)이 실제 배포 환경에서 어떤 보안 점검 항목으로 이어지는지 직접 확인합니다. "안전한 모델, 뚫리는 시스템"이 되는 가장 흔한 원인 — 인증 없는 엔드포인트, 과도한 에러 메시지, 평문 통신, 입력 검증 부재 — 을 의도적으로 만들고 하나씩 고쳐봅니다.

## 목표

- 최소한의 ML 추론 API를 직접 띄워보고, 기본 설정이 얼마나 취약한 상태인지 확인한다.
- 네트워크/웹/암호학/ML 기초 지식이 실제로 어떤 설정 항목(바인딩 주소, 인증 헤더, TLS, 입력 스키마 검증)에 대응되는지 매핑한다.
- 취약한 버전과 개선된 버전을 비교하여, "기반 지식 → 보안 통제"로 이어지는 흐름을 표로 정리한다.

{{< callout type="warning" >}}
이 실습은 **로컬 환경**(127.0.0.1)에서만 수행하세요. `0.0.0.0` 바인딩 단계는 개념 설명을 위한 것이며, 실제로 외부에 노출된 네트워크에서 실행하지 마세요.
{{< /callout >}}

## 사전 준비

```bash
pip install fastapi uvicorn scikit-learn joblib
```

### 최소 분류 모델 학습

```python
# train_model.py
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
import joblib

X, y = load_iris(return_X_y=True)
model = LogisticRegression(max_iter=200).fit(X, y)
joblib.dump(model, "model.joblib")
print("모델 저장 완료: model.joblib")
```

```bash
python train_model.py
```

## 단계별 실행

### 1단계: 취약한 버전의 추론 API 작성

가장 빠르게 동작하는, 그러나 보안상 여러 문제를 가진 버전부터 만듭니다.

```python
# app_insecure.py
from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI(debug=True)  # (A) 디버그 모드: 에러 발생 시 스택트레이스 노출
model = joblib.load("model.joblib")

@app.post("/predict")
def predict(features: list[float]):  # (B) 입력 개수/범위 검증 없음
    pred = model.predict(np.array([features]))  # (C) 길이가 다르면 500 에러 + 내부 정보 노출
    return {"prediction": int(pred[0])}

# (D) uvicorn app_insecure:app --host 0.0.0.0 --port 8000 로 실행 시 모든 인터페이스에 노출
# (E) API 키/인증 없음 — 누구나 호출 가능
# (F) HTTP 평문 통신 — 입력 데이터(민감 피처일 수 있음)가 그대로 네트워크에 노출
```

```bash
uvicorn app_insecure:app --reload --port 8000
```

### 2단계: 네트워크/웹 보안 관점에서 점검

[네트워크 보안 기초](../../docs/foundations/network-security/)와 [웹 보안 기초](../../docs/foundations/web-security/)에서 다룬 개념을 그대로 적용해 봅니다.

```bash
# (1) 정상 입력
curl -s -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" -d "[5.1, 3.5, 1.4, 0.2]"

# (2) 입력 개수를 일부러 틀려서 에러 메시지 확인 — 디버그 모드의 스택트레이스가
#     모델 내부 구조(feature 개수, 라이브러리 버전 등)를 노출하는지 관찰
curl -s -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" -d "[1.0]"

# (3) 인증 없이 누구나 호출 가능한지 확인 — Authorization 헤더 없이도 200 OK
curl -s -i -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" -d "[5.1, 3.5, 1.4, 0.2]" | head -1
```

확인할 점:

- (2)의 응답에 Python 스택트레이스, 파일 경로, 라이브러리 버전이 노출되는가? → OWASP API8 "보안 설정 오류"에 해당
- (3)에서 인증 없이도 추론 결과를 받을 수 있는가? → OWASP API2 "인증 실패"에 해당
- `--host 0.0.0.0`으로 실행했다면, 같은 네트워크의 다른 기기에서도 접근 가능한가? → 네트워크 경계/방화벽 설정 누락

### 3단계: 암호학·ML 기초 관점에서 점검

[암호학 기초](../../docs/foundations/cryptography/)와 [ML/딥러닝 기초](../../docs/foundations/ml-dl-basics/)에서 다룬 개념을 적용합니다.

- **전송 계층**: 위 호출은 모두 `http://`(평문)입니다. 입력 피처가 사용자의 민감한 정보(예: 의료/금융 데이터)라면, TLS 없이는 네트워크 경로의 누구나 이를 가로챌 수 있습니다.
- **모델 파일 자체**: `model.joblib`은 평문 파일로 저장됩니다. 이 파일에 접근 권한이 있는 사람은 모델을 그대로 복사해 갈 수 있습니다 ([공급망/모델 자산 보호](../../docs/infrastructure/supply-chain-risk/)와 연결).
- **입력 스키마**: 2단계의 (2)에서 본 것처럼, 모델은 "4개의 float 리스트"를 기대하지만 API는 이를 강제하지 않습니다. ML 모델의 입력 전처리 가정이 깨지면 예측 결과가 무의미해지거나 내부 예외가 발생합니다.

### 4단계: 개선된 버전으로 수정

위에서 발견한 문제를 하나씩 고칩니다.

```python
# app_secure.py
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, conlist
import joblib
import numpy as np
import os

app = FastAPI(debug=False)  # (A') 디버그 모드 비활성화
model = joblib.load("model.joblib")
API_KEY = os.environ["MODEL_API_KEY"]  # (E') 환경변수로 주입되는 API 키

class PredictRequest(BaseModel):
    features: conlist(float, min_length=4, max_length=4)  # (B') 입력 개수 강제

@app.post("/predict")
def predict(req: PredictRequest, x_api_key: str = Header(default="")):
    if x_api_key != API_KEY:  # (E') 인증 검증
        raise HTTPException(status_code=401, detail="Unauthorized")
    pred = model.predict(np.array([req.features]))
    return {"prediction": int(pred[0])}

# (D') 운영 환경에서는 --host 127.0.0.1 + 리버스 프록시(TLS 종료) 뒤에 배치
# (F') 리버스 프록시(nginx 등)에서 HTTPS로 종료 후 내부망에서만 평문 통신
```

```bash
export MODEL_API_KEY="local-test-key"
uvicorn app_secure:app --port 8001

# 인증 없이 호출 -> 401
curl -s -i -X POST http://127.0.0.1:8001/predict \
  -H "Content-Type: application/json" -d '{"features":[5.1,3.5,1.4,0.2]}' | head -1

# 잘못된 입력 개수 -> 422 (Pydantic 검증, 스택트레이스 없음)
curl -s -X POST http://127.0.0.1:8001/predict \
  -H "Content-Type: application/json" -H "X-API-Key: local-test-key" -d '{"features":[1.0]}'

# 정상 호출 -> 200
curl -s -X POST http://127.0.0.1:8001/predict \
  -H "Content-Type: application/json" -H "X-API-Key: local-test-key" -d '{"features":[5.1,3.5,1.4,0.2]}'
```

## 결과 확인

각 항목을 취약한 버전(`app_insecure.py`)과 개선된 버전(`app_secure.py`)에서 비교해 기록합니다.

| 기반 지식 영역 | 점검 항목 | 취약한 버전 (app_insecure) | 개선된 버전 (app_secure) |
|---|---|---|---|
| 네트워크 보안 | 바인딩 주소/노출 범위 | `0.0.0.0` 가능, 방화벽 미고려 | `127.0.0.1` + 리버스 프록시 권장 |
| 웹 보안 | 인증/인가 | 없음 (누구나 호출) | API 키 헤더 검증, 실패 시 401 |
| 웹 보안 | 에러 처리/정보 노출 | 디버그 모드, 스택트레이스 노출 | 디버그 비활성화, 일반화된 에러 |
| 암호학 | 전송 계층 보호 | 평문 HTTP | TLS(리버스 프록시)로 종료 |
| ML/딥러닝 기초 | 입력 스키마 검증 | 길이/타입 검증 없음 | Pydantic으로 4개 float 강제 |

## 체크리스트

- [ ] `app_insecure.py`로 인증 없이 추론 API를 호출할 수 있음을 확인했다.
- [ ] 잘못된 입력으로 디버그 모드의 스택트레이스/내부 정보 노출을 확인했다.
- [ ] `0.0.0.0` 바인딩이 네트워크 노출 범위에 어떤 영향을 주는지 이해했다.
- [ ] `app_secure.py`로 API 키 인증(401)과 입력 스키마 검증(422)이 동작함을 확인했다.
- [ ] 평문 HTTP와 TLS(리버스 프록시)의 차이를 설명할 수 있다.
- [ ] 위 5개 항목을 "기반 지식 영역 → 점검 항목 → 개선 방법" 표로 정리했다.

## 더 살펴보기

{{< cards >}}
  {{< card link="../../docs/foundations/network-security/" title="네트워크 보안 기초" subtitle="OSI/TCP-IP 계층별 위협과 AI 서빙 엔드포인트 노출" >}}
  {{< card link="../../docs/foundations/web-security/" title="웹 보안 기초" subtitle="OWASP Top 10과 인증/인가, API 보안" >}}
  {{< card link="../../docs/foundations/cryptography/" title="암호학 기초" subtitle="TLS, 키 관리, 모델 자산 보호" >}}
  {{< card link="../../docs/infrastructure/supply-chain-risk/" title="공급망 리스크" subtitle="모델 파일/의존성 보호와 SBOM" >}}
{{< /cards >}}
