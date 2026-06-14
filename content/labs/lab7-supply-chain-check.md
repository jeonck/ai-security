---
title: "Lab 7: AI 모델 공급망 보안 점검"
weight: 7
---

이 실습에서는 [Lab 4: AI 모델 서빙 API 보안 점검](../lab4-model-serving-security/)에서 만든 `model.joblib`(또는 새로 학습한 간단한 분류 모델)을 대상으로, [공급망 보안](../../docs/infrastructure/supply-chain-risk/)에서 다룬 SBOM(Software Bill of Materials)·의존성 점검·출처(Provenance) 기록의 개념을 직접 실습합니다. "이 모델은 어떤 코드/라이브러리/데이터로 만들어졌고, 무결성을 어떻게 검증하는가"에 답할 수 있는 최소한의 산출물을 만드는 것이 목표입니다.

## 목표

- `pip-audit`으로 현재 환경의 의존성 취약점을 점검하고 결과를 해석한다.
- SBOM(JSON)을 생성해 "이 프로젝트가 무엇으로 구성되어 있는가"를 기계가 읽을 수 있는 형태로 기록한다.
- 모델 파일의 SHA256 체크섬을 계산해 최소한의 출처 증명(provenance) 기록을 만든다.
- 위 정보를 종합한 모델 카드(Model Card)를 작성해, [공급망 보안 → SBOM for AI](../../docs/infrastructure/supply-chain-risk/)에서 설명한 "AI SBOM"의 축소판을 경험한다.

{{< callout type="info" >}}
이 실습은 패키지를 실제로 공격하거나 악성 코드를 실행하지 않습니다. 모두 **읽기 전용 점검**(스캔, 해시 계산, 메타데이터 작성)으로 구성되어 있어 로컬 환경에서 안전하게 수행할 수 있습니다.
{{< /callout >}}

## 사전 준비

```bash
pip install pip-audit cyclonedx-bom scikit-learn joblib
```

`model.joblib`이 없다면 Lab 4와 동일한 방식으로 간단한 모델을 학습해 둡니다.

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

### 1단계: 의존성 취약점 스캔

`pip-audit`은 현재 환경(또는 `requirements.txt`)에 설치된 패키지를 PyPI Advisory DB와 비교해 알려진 CVE를 찾아줍니다. 이는 [공급망 보안 → 의존성 무결성](../../docs/infrastructure/supply-chain-risk/)에서 설명한 "SCA(Software Composition Analysis) 도구를 CI 파이프라인에 통합한다"는 권고를 로컬에서 먼저 체험해보는 단계입니다.

```bash
# 현재 가상환경에 설치된 패키지 전체를 점검
pip-audit

# requirements.txt 기준으로 점검하고 싶다면
pip freeze > requirements.txt
pip-audit -r requirements.txt
```

확인할 점:

- 취약점이 보고된 패키지가 있다면, 어떤 CVE이고 어떤 버전에서 수정되었는가?
- scikit-learn, numpy, joblib처럼 모델 자체가 의존하는 핵심 라이브러리에 취약점이 있는가, 아니면 무관한 개발 도구에만 있는가?
- 결과가 "No known vulnerabilities found"라도, 이는 "현재 시점에 알려진 것이 없다"는 의미일 뿐 영구적인 안전을 보장하지 않는다는 점을 기록해 둡니다.

### 2단계: SBOM 생성

`cyclonedx-bom`(CycloneDX 표준)을 사용해 현재 환경의 패키지 구성을 JSON SBOM으로 출력합니다. 이 파일은 [공급망 보안 → AI SBOM의 구성 요소](../../docs/infrastructure/supply-chain-risk/)에서 설명한 "프레임워크/라이브러리 버전 목록"에 해당합니다.

```bash
# CycloneDX 형식의 SBOM을 JSON으로 생성
cyclonedx-py environment -o sbom.json

# 생성된 SBOM의 구성요소 개수와 상위 5개 확인
python3 - <<'EOF'
import json
sbom = json.load(open("sbom.json"))
components = sbom.get("components", [])
print(f"총 구성요소 수: {len(components)}")
for c in components[:5]:
    print(f"- {c['name']} {c.get('version', '?')}")
EOF
```

확인할 점:

- `sbom.json`에 scikit-learn, numpy, joblib이 정확한 버전으로 기록되어 있는가?
- 이 파일 하나만으로 "이 모델을 재현하려면 어떤 라이브러리 조합이 필요한가"를 다른 사람에게 전달할 수 있는가?

### 3단계: 모델 체크섬/출처 기록

모델 가중치 파일(`model.joblib`)의 SHA256 해시를 계산합니다. 이는 [공급망 보안 → 데이터셋 출처 검증](../../docs/infrastructure/supply-chain-risk/)에서 설명한 "받아오는 즉시 해시를 기록하고, 이후 해시가 달라지면 변경 사항을 검토한다"는 원칙을 모델 파일에 적용한 것입니다.

```bash
# macOS
shasum -a 256 model.joblib

# Linux
sha256sum model.joblib
```

```python
# provenance.py — 최소한의 출처 기록을 JSON으로 생성
import hashlib
import json
import datetime
import sklearn

def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

provenance = {
    "artifact": "model.joblib",
    "sha256": sha256_of("model.joblib"),
    "created_at": datetime.datetime.utcnow().isoformat() + "Z",
    "training_script": "train_model.py",
    "training_dataset": "sklearn.datasets.load_iris (built-in)",
    "framework": f"scikit-learn=={sklearn.__version__}",
}

with open("provenance.json", "w") as f:
    json.dump(provenance, f, indent=2)

print(json.dumps(provenance, indent=2))
```

```bash
python provenance.py
```

확인할 점:

- 같은 `train_model.py`를 다시 실행하면 체크섬이 동일한가, 달라지는가? (LogisticRegression은 시드를 고정하지 않으면 학습 결과가 달라질 수 있습니다 — 재현성과 출처 추적의 관계를 직접 관찰합니다.)
- `provenance.json`의 `sha256` 값을 변조하거나, `model.joblib`을 다른 모델로 교체한 뒤 다시 해시를 계산하면 값이 달라지는지 확인합니다. → 이것이 "모델 무결성 검증"의 가장 기본적인 형태입니다.

### 4단계: 모델 카드 작성

위 1~3단계에서 얻은 정보를 종합해, [공급망 보안 → SBOM for AI](../../docs/infrastructure/supply-chain-risk/)에서 설명한 모델 카드의 축소판을 작성합니다.

```yaml
# model-card.yaml
model_name: iris-logistic-regression
version: "1.0.0"
description: >
  scikit-learn LogisticRegression 기반 Iris 품종 분류 모델.
  Lab 4(모델 서빙 보안) 및 Lab 7(공급망 보안 점검) 실습용으로 제작됨.

provenance:
  training_script: train_model.py
  training_dataset: sklearn.datasets.load_iris (내장 데이터셋, 150개 샘플)
  framework: "scikit-learn (provenance.json 참조)"
  artifact_sha256: "<provenance.json의 sha256 값을 붙여넣기>"

dependencies:
  sbom_file: sbom.json
  pip_audit_result: "<1단계 pip-audit 실행 결과 요약 — 예: 'No known vulnerabilities found'>"

intended_use:
  - "Iris 꽃의 4가지 측정값(sepal/petal 길이·너비)으로 품종(3종) 분류"
  - "교육/실습용 — 프로덕션 의사결정에 사용하지 않음"

known_limitations:
  - "학습 데이터(Iris)가 150개 샘플로 매우 작아 실제 분류 성능을 대표하지 않음"
  - "입력 피처의 단위/범위가 학습 데이터와 다르면 예측이 무의미함"
  - "시드 미고정으로 재학습 시 가중치가 달라질 수 있음 (재현성 낮음)"

security_notes:
  - "모델 파일은 joblib(pickle 기반) 형식 — 신뢰할 수 없는 출처의 .joblib 파일은 로드하지 말 것"
  - "artifact_sha256과 실제 파일의 해시가 일치하는지 배포 전 반드시 확인"
```

## 결과 확인

| 점검 항목 | 도구 | 결과 (예시) | 조치 |
|---|---|---|---|
| 의존성 취약점 | `pip-audit` | 발견된 CVE 수, 영향받는 패키지/버전 | 영향받는 패키지 업그레이드 또는 완화 방안 기록 |
| SBOM 생성 | `cyclonedx-py` | `sbom.json` (구성요소 N개) | 버전 관리에 포함해 배포 시점마다 갱신 |
| 모델 체크섬 | `sha256sum`/`shasum` | `model.joblib`의 SHA256 값 | `provenance.json`에 기록, 배포 전 재검증 |
| 모델 카드 | 수동 작성 | `model-card.yaml` | 출처/의존성/한계를 한 곳에서 추적 가능 |

## 체크리스트

- [ ] `pip-audit`을 실행하고, 취약점이 있다면 어떤 CVE인지, 없다면 그 의미의 한계(시점성)를 이해했다.
- [ ] `cyclonedx-py`로 `sbom.json`을 생성하고, scikit-learn/numpy/joblib 버전이 정확히 기록되었음을 확인했다.
- [ ] `model.joblib`의 SHA256 체크섬을 계산하고 `provenance.json`에 기록했다.
- [ ] 모델 파일을 변경(또는 재학습)한 뒤 체크섬이 달라지는 것을 확인해, 무결성 검증의 원리를 이해했다.
- [ ] `model-card.yaml`에 출처, 의존성, 알려진 제약사항, 보안 주의사항을 모두 채웠다.
- [ ] 이 산출물(`sbom.json`, `provenance.json`, `model-card.yaml`)이 사고 발생 시 "이 모델에 어떤 구성요소가 영향을 받는가"를 답하는 데 어떻게 쓰일 수 있는지 설명할 수 있다.

## 학습효과

- **공급망 보안 산출물 경험**: pip-audit, SBOM, 체크섬, 모델 카드라는 4가지 산출물을 직접 만들어봄으로써, "이 모델이 무엇으로 구성되고 어디서 왔는가"에 답할 수 있는 최소한의 AI 공급망 보안 체계를 경험합니다.
- **점검 결과의 시점성 이해**: 의존성 취약점 점검 결과가 갖는 "시점성"(현재까지 알려진 것일 뿐, 영구적 안전을 보장하지 않음)이라는 한계를 이해하고, 지속적인 재점검의 필요성을 인식합니다.
- **생애주기 관점 확립**: [Lab 4](../lab4-model-serving-security/)의 서빙 보안과 이 실습의 공급망 보안을 연결해, 모델의 전체 생애주기(개발 → 배포 → 운영) 관점에서 보안을 바라보는 시각을 갖춥니다.

## 더 살펴보기

{{< cards >}}
  {{< card link="../../docs/infrastructure/supply-chain-risk/" title="공급망 보안" subtitle="사전학습 모델·데이터셋·의존성의 공급망 리스크와 SBOM for AI" >}}
  {{< card link="../../docs/infrastructure/mlops-pipeline-security/" title="MLOps 파이프라인 보안" subtitle="데이터 수집부터 모니터링까지 파이프라인 단계별 보안" >}}
  {{< card link="../lab4-model-serving-security/" title="Lab 4: AI 모델 서빙 API 보안 점검" subtitle="최소 ML 추론 API의 네트워크·웹·암호학·ML 기초 보안 점검" >}}
{{< /cards >}}
