# Vision Platform — Arquitetura de Processamento de Visão Computacional

> Versão: 1.0.0 | Data: 2026-08-19 | Autor: GeoFissura Team
> Status: Proposta baseada em pesquisa de repositórios open-source e auditoria do código atual

---

## Sumário

1. [Visão Geral do Sistema Atual](#1-visão-geral-do-sistema-atual)
2. [Fluxo de Dados: Captura → Fila → Processamento](#2-fluxo-de-dados)
3. [Schema do Banco de Dados — Tabela `processing_results`](#3-schema-do-banco-de-dados)
4. [Módulos de Visão Computacional](#4-módulos-de-visão-computacional)
   - 4.1 [Fissuras/Rachaduras](#41-fissuras--rachaduras)
   - 4.2 [Identificação de Pessoas e Rastreamento](#42-identificação-de-pessoas-e-rastreamento)
   - 4.3 [EPI (Equipamentos de Proteção Individual)](#43-epi)
   - 4.4 [Placas de Veículos](#44-placas-de-veículos)
   - 4.5 [Contagem de Objetos](#45-contagem-de-objetos)
   - 4.6 [Defeitos em Tecidos](#46-defeitos-em-tecidos)
5. [Pesquisa de Repositórios Open-Source](#5-pesquisa-de-repositórios)
6. [Decisões de Arquitetura](#6-decisões-de-arquitetura)
7. [Próximos Passos](#7-próximos-passos)

---

## 1. Visão Geral do Sistema Atual

### 1.1 Stack Tecnológica

| Componente | Tecnologia | Arquivo |
|------------|-----------|---------|
| API Framework | FastAPI 0.115+ | `src/main.py:147` |
| Banco de dados | PostgreSQL (prod) / SQLite (test) | `src/storage/database.py:6` |
| ORM | SQLAlchemy 2.0 | `src/storage/models.py` |
| Migrations | Alembic | `database/migrations/` |
| Câmera RTSP | OpenCV (cv2.VideoCapture) | `src/camera/rtsp_client.py:26` |
| Validação de frame | OpenCV (Laplacian, brightness) | `src/camera/frame_validator.py:24` |
| Fila de entrega | httpx + retry (5 tentativas) | `src/storage/delivery_queue.py:17` |
| Auth | JWT + bcrypt | `src/auth/dependencies.py:15` |
| Dashboard | Jinja2 + HTMX + Tailwind | `src/templates/` |
| Deploy | Orange Pi 3 LTS (Armbian) | `deploy/setup.sh` |

### 1.2 Tabelas Existentes

| Tabela | Modelo ORM | Colunas | Arquivo |
|--------|-----------|---------|---------|
| `devices` | `Device` | 13 colunas | `src/storage/models.py:13-45` |
| `observations` | `Observation` | 18 colunas | `src/storage/models.py:48-73` |
| `delivery_logs` | `DeliveryLog` | 6 colunas | `src/storage/models.py:76-87` |
| `users` | `User` | 4 colunas | `src/storage/models.py:90-97` |

### 1.3 Fluxo Atual (Sem Processamento)

```
[1] Câmera RTSP
    ↓ cv2.VideoCapture.read()
[2] FrameValidator.validate()      ← scoring 0.0-1.0
    ↓
[3] cv2.imwrite(full.jpg)          ← salva em ./evidence/YYYY/MM/DD/
    ↓
[4] SHA-256 hash
    ↓
[5] _save_observation()            ← INSERT INTO observations (delivery_status='pending')
    ↓
[6] _delivery_loop()               ← background task, 30s intervalo
    ↓ process_delivery_queue()
[7] deliver_observation()          ← POST /api/v1/observations → Central
    ↓
[8] Acknowledgement                ← Central confirma recebimento
```

**O que falta:** Após [5], a observação vai direto para a fila de entrega. Não há etapa de processamento de visão computacional. A imagem é entregue "crua" ao servidor central.

---

## 2. Fluxo de Dados

### 2.1 Fluxo Proposto (Com Processamento)

```
[1] Câmera RTSP
    ↓ cv2.VideoCapture.read()
[2] FrameValidator.validate()
    ↓
[3] cv2.imwrite(full.jpg)
    ↓
[4] SHA-256 hash
    ↓
[5] _save_observation()            ← INSERT observations (status='pending')
    ↓
[6] ═══════════════════════════════ NOVA ETAPA ═══════════════════════════
    ↓ _processing_loop()           ← background task, parallel ao delivery
[7] _run_pipeline(device, frame)   ← roda todos os módulos habilitados
    ↓
    ├─→ FissureDetector.detect()   → ProcessingResult(type='fissure', ...)
    ├─→ PersonDetector.detect()    → ProcessingResult(type='person', ...)
    ├─→ PPEDetector.detect()       → ProcessingResult(type='ppe', ...)
    ├─→ PlateDetector.detect()     → ProcessingResult(type='plate', ...)
    ├─→ ObjectCounter.count()      → ProcessingResult(type='counting', ...)
    └─→ FabricDefectDetector.detect() → ProcessingResult(type='fabric_defect', ...)
    ↓
[8] _save_processing_results()     ← INSERT INTO processing_results
    ↓
[9] _delivery_loop()               ← entrega resultados + imagem à Central
    ↓
[10] Central processa, gera eventos, envia ao GeoFissura
```

### 2.2 Pipeline de Processamento

```python
# Pseudocódigo do pipeline (src/vision/pipeline.py)

class VisionPipeline:
    def __init__(self, device: Device):
        self.modules = self._load_modules(device.task_type)

    def process(self, frame: np.ndarray, observation_id: str) -> list[ProcessingResult]:
        results = []
        for module in self.modules:
            result = module.detect(frame)
            if result:
                results.append(result)
        return results

    def _load_modules(self, task_type: str) -> list[BaseDetector]:
        module_map = {
            "fissure": [FissureDetector],
            "ppe": [PersonDetector, PPEDetector],
            "fabric_quality": [FabricDefectDetector],
            "structural": [ObjectCounter],
            "plate": [PlateDetector],
            "person_tracking": [PersonDetector, PersonReID],
        }
        # Múltiplos módulos podem rodar em paralelo
        return [cls() for cls in module_map.get(task_type, [])]
```

---

## 3. Schema do Banco de Dados

### 3.1 Tabela `processing_results`

Uma observação pode gerar N resultados de processamento (ex: uma imagem detecta 3 pessoas + 1 placa + 2 fissuras).

```sql
CREATE TABLE processing_results (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    observation_id      VARCHAR(128) NOT NULL REFERENCES observations(observation_id),
    device_id           VARCHAR(64)  NOT NULL,

    -- Tipo e versão do processamento
    result_type         VARCHAR(32)  NOT NULL,  -- 'fissure', 'person', 'ppe', 'plate', 'count', 'fabric_defect'
    model_name          VARCHAR(64)  NOT NULL,  -- 'yolo11n-seg', 'fast-alpr', 'reid-mobilenet'
    model_version       VARCHAR(32)  NOT NULL,  -- '2026.08.1', 'v1.2.0'
    confidence          FLOAT        NOT NULL,  -- 0.0 a 1.0

    -- Resultado estruturado (JSON flexível por tipo)
    result_data         JSON         NOT NULL,
    -- Exemplos de result_data:
    -- fissure: {"width_px": 3, "length_px": 45, "area_px": 135, "severity": "medium", "bbox": [x,y,w,h], "mask_path": "obs_001_fissure_mask.png"}
    -- person:  {"person_id": "track_001", "bbox": [x,y,w,h], "reid_embedding": [...], "frame_number": 1234}
    -- ppe:     {"person_id": "track_001", "required": ["helmet", "vest"], "detected": ["helmet"], "missing": ["vest"], "compliant": false}
    -- plate:   {"plate_text": "ABC1D23", "plate_hash": "sha256...", "vehicle_bbox": [x,y,w,h], "plate_bbox": [x,y,w,h]}
    -- count:   {"class": "person", "count": 5, "zone": "entrance", "bboxes": [...]}
    -- fabric_defect: {"defect_type": "hole", "severity": "high", "bbox": [x,y,w,h], "area_px": 250}

    -- Métricas de performance
    inference_ms        INTEGER,              -- tempo de inferência em milissegundos
    image_width         INTEGER,
    image_height        INTEGER,

    -- Rastreabilidade
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at        DATETIME,

    -- Índices
    -- UNIQUE(observation_id, result_type, model_name)  -- idempotência
);

CREATE INDEX idx_processing_results_observation ON processing_results(observation_id);
CREATE INDEX idx_processing_results_device ON processing_results(device_id);
CREATE INDEX idx_processing_results_type ON processing_results(result_type);
CREATE INDEX idx_processing_results_created ON processing_results(created_at);
```

### 3.2 Tabela `tracking_sessions`

Para rastreamento de pessoas/objetos ao longo do tempo (mesma entidade em múltiplos frames).

```sql
CREATE TABLE tracking_sessions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id          VARCHAR(128) NOT NULL UNIQUE,  -- 'track_001_local_001'
    device_id           VARCHAR(64)  NOT NULL,
    entity_type         VARCHAR(32)  NOT NULL,  -- 'person', 'vehicle'
    entity_id           VARCHAR(64),            -- ReID embedding hash ou placa

    -- Temporal
    first_seen_at       DATETIME NOT NULL,
    last_seen_at        DATETIME NOT NULL,
    frame_count         INTEGER NOT NULL DEFAULT 1,

    -- Geometria
    avg_bbox_width      FLOAT,
    avg_bbox_height     FLOAT,
    path_centroids      JSON,  -- [[x1,y1], [x2,y2], ...] centroides ao longo do tempo

    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_device ON tracking_sessions(device_id);
CREATE INDEX idx_tracking_entity ON tracking_sessions(entity_type, entity_id);
CREATE INDEX idx_tracking_active ON tracking_sessions(is_active);
```

### 3.3 Tabela `zone_configs`

Configuração de zonas por câmera (para EPI, contagem, etc).

```sql
CREATE TABLE zone_configs (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id           VARCHAR(64)  NOT NULL,
    zone_name           VARCHAR(64)  NOT NULL,
    zone_type           VARCHAR(32)  NOT NULL,  -- 'ppe_enforcement', 'counting_line', 'counting_region', 'fissure_area'

    -- Geometria do polígono (vertices normalizados 0.0-1.0)
    polygon_vertices    JSON NOT NULL,  -- [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]

    -- Regras específicas por tipo
    zone_config         JSON NOT NULL,
    -- ppe_enforcement: {"required_ppe": ["helmet", "vest"], "alert_on_missing": true}
    -- counting_line:   {"direction": "in_out", "classes": ["person"]}
    -- counting_region: {"classes": ["person", "vehicle"], "max_count": 10}
    -- fissure_area:    {"template_id": "gabarito_01", "reference_points": [[x,y], ...]}

    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zone_device ON zone_configs(device_id);
```

### 3.4 Alterações na Tabela `observations`

Adicionar coluna para indicar se a observação já foi processada:

```sql
ALTER TABLE observations ADD COLUMN processing_status VARCHAR(32) DEFAULT 'none';
-- Valores: 'none', 'pending', 'processing', 'completed', 'failed'

ALTER TABLE observations ADD COLUMN processing_started_at DATETIME;
ALTER TABLE observations ADD COLUMN processing_completed_at DATETIME;
```

### 3.5 Diagrama ER

```text
devices (1) ──────< observations (1) ──────< processing_results (N)
    │                     │
    │                     └───< delivery_logs (N)
    │
    └──────< zone_configs (N)
    │
    └──────< tracking_sessions (N)
```

### 3.6 Mapeamento: Tipo de Tarefa → Módulos de Visão

| task_type (Device) | Módulos executados | result_type | Dataset de treino |
|---|---|---|---|
| `fissure` | FissureDetector | `fissure` | Crack-Seg (Ultralytics), Crack500, DeepCrack |
| `ppe` | PersonDetector + PPEDetector | `person` + `ppe` | SH17, Construction-Safety (Roboflow) |
| `fabric_quality` | FabricDefectDetector | `fabric_defect` | MVTec AD (textile), TILDA |
| `structural` | ObjectCounter | `count` | COCO (pré-treinado) |
| `plate` | PlateDetector | `plate` | Brazilian plates, CCPD |
| `person_tracking` | PersonDetector + PersonReID | `person` | Market-1501, MARS (ReID) |

---

## 4. Módulos de Visão Computacional

### 4.1 Fissuras/Rachaduras

**Objetivo:** Detectar, segmentar e medir fissuras em superfícies de concreto, especialmente em gabaritos colados com 6 círculos de referência.

**Arquitetura recomendada:** YOLO11n-seg (instance segmentation)

**Por quê YOLO11n-seg:**
- Ultralytics tem dataset oficial Crack-Seg (4.029 imagens pré-anotadas)
- Exporta para ONNX → roda no Orange Pi via ONNX Runtime
- Fornece tanto bounding box quanto máscara pixel-level
- ~5 FPS em Raspberry Pi 5 (similar ao Orange Pi)
- Treinamento com 3 linhas de código

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ Sliding window 640x640 (overlap 50%)
    ↓ YOLO11n-seg inference por patch
    ↓ Merge predictions (NMS)
    ↓ OpenCV post-processing:
    ├─→ Medir largura da fissura (largura da máscara em pixels)
    ├─→ Medir comprimento (contorno da máscara)
    ├─→ Calcular área (pixels da máscara)
    ├─→ Classificar severidade: low (<2px), medium (2-5px), high (>5px)
    └─→ Se gabarito detectado: medir em relação aos círculos de referência
    ↓ ProcessingResult(type='fissure', result_data={...})
```

**Referências open-source:**

| Repositório | Stars | O que adotar | Arquivo de referência |
|---|---|---|---|
| `ultralytics/ultralytics` | 40.000+ | Pipeline completo treino→inference→ONNX | Dataset `crack-seg.yaml` |
| `nantonzhang/Awesome-Crack-Detection` | 86 | Revisão de literatura, links para todos os datasets | Lista curada |
| `GT-SCI/GT-CrackSeg` | 16 | Framework modular para comparar arquiteturas | Config YAML |
| `konskyrt/Concrete-Crack-Detection-Segmentation` | 105 | Extração de parâmetros (largura, comprimento, área) via OpenCV | `cv2_utils.py` |
| `arthurflor23/surface-crack-detection` | 163 | U-Net para segmentação + overlay visualization | `src/` |
| `Subham2901/Concrete_Crack_Segmentation` | 50 | Albumentations augmentation + Dice Loss | Data augmentation |
| `CY-Tsai24/YOLO-AMC` | 3 | Attention mechanisms para fissuras finas + benchmark RPi | YAML config |

**Datasets disponíveis:**

| Dataset | Imagens | Resolução | Tarefa |
|---|---|---|---|
| Ultralytics Crack-Seg | 4.029 | Variável | Instance Segmentation |
| Concrete Crack Images (Mendeley) | 40.000 | 227x227 | Classificação binária |
| Crack500 | 500 | 2000x1500 | Segmentação |
| DeepCrack | 537 | Variável | Segmentação |
| SDNET2018 | 56.754 | 256x256 | Classificação |
| RDD2022 | Multi-nacional | Variável | Object Detection |

**Modelo base:** `yolo11n-seg.pt` (pré-treinado COCO, fine-tune no Crack-Seg)

---

### 4.2 Identificação de Pessoas e Rastreamento

**Objetivo:** Detectar pessoas, rastrear ao longo dos frames, e re-identificar a mesma pessoa em momentos diferentes (ReID).

**Arquitetura recomendada:** YOLO11n (detecção) + ByteTrack (rastreamento) + OSNet (ReID)

**Por quê esta combinação:**
- YOLO11n é o detector mais rápido para edge
- ByteTrack é o tracker mais usado em produção (baixa latência)
- OSNet (via boxmot) é o ReID mais leve para edge
- Ultralytics já integra YOLO + ByteTrack/BoTSORT nativamente

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ YOLO11n detect() → [bbox_person1, bbox_person2, ...]
    ↓ ByteTrack track() → [track_id_001, track_id_002, ...]
    ↓ Para cada track ativo:
    ├─→ Crop persona (bbox)
    ├─→ OSNet compute_embedding() → vector[512]
    ├─→ Comparar com embeddings anteriores (cosine similarity > 0.6 = mesma pessoa)
    ├─→ Atualizar tracking_session
    └─→ Se nova pessoa: criar tracking_session
    ↓ ProcessingResult(type='person', result_data={person_id, bbox, reid_embedding})
```

**Referências open-source:**

| Repositório | Stars | O que adotar |
|---|---|---|
| `ultralytics/ultralytics` | 40.000+ | ObjectCounter, RegionCounter, ByteTrack/BoTSORT |
| `mikel-brostrom/yolo_tracking` (BoxMOT) | 5.800+ | ByteTrack, BoTSORT, OSNet ReID, hybrid tracking |
| `ultralytics/solutions` | 5.000+ | ObjectCounter, SpeedEstimator, AIInvoice |
| `TencentYoutuResearch/CrowdCounting-P2PNet` | 534 | Contagem por pontos (densidade) |
| `facebookresearch/sam3` | 10.600+ | SAM3 para segmentação zero-shot |

**Tracker:** ByteTrack (via Ultralytics) — aceito como padrão da indústria.

**ReID model:** `osnet_ain_x0_25.pt` (2.65 MB, ideal para edge).

---

### 4.3 EPI (Equipamentos de Proteção Individual)

**Objetivo:** Detectar se pessoas em uma zona estão usando os EPIs obrigatórios para aquele ambiente.

**Arquitetura recomendada:** YOLO11n (detecção multi-classe) + lógica de compliance por zona

**Por quê YOLO multi-classe:**
- Detecta pessoa + EPIs simultaneamente em uma única inferência
- Classes: `person`, `helmet`, `no-helmet`, `vest`, `no-vest`, `gloves`, `glasses`, `boots`
- Regra de compliance: persona na zona X precisa ter [helmet, vest] → se falta algum → violação

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ YOLO11n detect() → [person, helmet, vest, gloves, ...]
    ↓ Para cada person detectado:
    ├─→ Calcular centro do bbox da pessoa
    ├─→ Verificar em qual zona (zone_config) o centro está
    ├─→ Carregar required_ppe da zona
    ├─→ Verificar quais EPIs estão presentes (IoU com bbox da pessoa > 0.3)
    ├─→ Calcular compliance: missing = required - detected
    └─→ Se missing não vazio → VIOLAÇÃO
    ↓ ProcessingResult(type='ppe', result_data={person_id, required, detected, missing, compliant})
```

**Configuração de zona (exemplo):**
```json
{
    "zone_name": "Area de Solda",
    "zone_type": "ppe_enforcement",
    "polygon_vertices": [[0.1, 0.2], [0.9, 0.2], [0.9, 0.8], [0.1, 0.8]],
    "zone_config": {
        "required_ppe": ["helmet", "vest", "gloves", "glasses"],
        "alert_on_missing": true
    }
}
```

**Referências open-source:**

| Repositório | Stars | O que adotar |
|---|---|---|
| `ahmadmughees/SH17dataset` | 133 | 17 classes de EPI, pesos YOLO pré-treinados |
| `njvisionpower/Safety-Helmet-Wearing-Dataset` | 1.700 | Dataset SHWD (7.581 imagens, helmet/head) |
| `snehilsanyal/Construction-Site-Safety-PPE-Detection` | 202 | Pipeline YOLOv8 com classes de violação |
| `ciber-lab/pictor-ppe` | 147 | Lógica de compliance: W/WH/WV/WHV |
| `HugoLi0213/PPE-Detection-and-Danger-Zone-Monitoring-System` | Novo | Único repo com zone polygon drawing + alerts |
| `CiscoDevNet/ppe-detection` | 35 | Padrão de notificação (push alerts on violation) |

**Datasets:**

| Dataset | Imagens | Classes | Fonte |
|---|---|---|---|
| SH17 | 8.099 | 17 classes EPI | Kaggle |
| SHWD | 7.581 | helmet, head | Google Drive |
| Construction Safety (Roboflow) | 2.801 | 10 classes (incl. violação) | Roboflow |
| CHV | 1.330 | person, vest, 4 cores helmet | Google Drive |

**Modelo base:** `yolo11n.pt` (pré-treinado COCO) → fine-tune no SH17 ou Construction-Safety.

---

### 4.4 Placas de Veículos

**Objetivo:** Detectar e ler placas de veículos (ALPR/ANPR) com suporte a placas brasileiras.

**Arquitetura recomendada:** fast-alpr (YOLOv9-t + CRNN/CTC OCR via ONNX)

**Por quê fast-alpr:**
- MIT license (sem restrições comerciais)
- Zero dependência de PyTorch/TensorFlow em inference (só ONNX Runtime)
- Multi-backend: CUDA, OpenVINO, QNN, DirectML, CPU
- Pluggable: detector e OCR são módulos separados
- `pip install fast-alpr`

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ fast-alpr pipeline:
    ├─→ YOLOv9-t detect vehicle → bbox_vehicle
    ├─→ YOLOv9-t detect plate → bbox_plate (within vehicle bbox)
    ├─→ Crop plate region
    ├─→ CRNN/CTC OCR → plate_text ("ABC1D23")
    ├─→ plate_hash = HMAC-SHA256(plate_text)  ← privacidade
    └─→ confidence score
    ↓ ProcessingResult(type='plate', result_data={plate_text, plate_hash, vehicle_bbox, plate_bbox})
```

**Privacidade (padrão anpr-pipeline):**
- NUNCA armazenar texto da placa em texto puro no banco
- Armazenar apenas hash HMAC-SHA256 da placa
- Permitir busca por placa via hash (input placa → hash → query)
- Log de auditoria para acesso a hashes

**Referências open-source:**

| Repositório | Stars | O que adotar |
|---|---|---|
| `ankandrew/fast-alpr` | 737 | ALPR engine completa, MIT, ONNX |
| `mftnakrsu/automatic_number_plate_recognition_yolo_ocr` | 201 | HMAC hashing, temporal voting, FastAPI |
| `openalpr/openalpr` | 11.440 | Maior comunidade, multi-país |
| `szad670401/hyperlpr` | 6.191 | Mobile-first, Android |
| `sergiomsilva/alpr-unconstrained` | 1.770 | Pipeline end-to-end (vehicle→plate→OCR) |
| `ria-com/nomeroff-net` | 512 | YOLOv8 + RNN OCR, 97% acurácia |

**Modelo base:** `fast-alpr` com YOLOv9-t-384 (detector) + fast-plate-ocr (CRNN/CTC).

---

### 4.5 Contagem de Objetos

**Objetivo:** Contar objetos variados (pessoas, veículos, paletes, etc.) com duas modalidades: contagem por zona (ocupação) e contagem por linha (cruzamento).

**Arquitetura recomendada:** Ultralytics `ObjectCounter` + `RegionCounter`

**Por quê Ultralytics nativo:**
- Já integrado ao pipeline YOLO (mesmo modelo detect + track + count)
- `ObjectCounter`: contagem por linha (IN/OUT)
- `RegionCounter`: contagem por polígono (ocupação)
- Suporte a contagem por classe (`classwise_count`)
- Output estruturado: `SolutionResults(in_count, out_count, classwise_count)`

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ YOLO11n detect() + ByteTrack track()
    ↓ RegionCounter ou ObjectCounter:
    ├─→ Para cada track: verificar se bbox intersecta zona
    ├─→ classwise_count: {"person": 5, "car": 2, "truck": 1}
    ├─→ Se ObjectCounter: in_count=3, out_count=1
    └─→ Se RegionCounter: zone_occupancy={"entrance": 5, "loading": 2}
    ↓ ProcessingResult(type='count', result_data={class, count, zone, bboxes})
```

**Referências open-source:**

| Repositório | Stars | O que adotar |
|---|---|---|
| `ultralytics/ultralytics` | 60.693 | ObjectCounter, RegionCounter (built-in) |
| `facebookresearch/sam3` | 10.600+ | Contagem zero-shot via SAM3 |
| `Mengqi-Lei/count-anything` | 534 | Contagem por texto ("count people") |
| `TencentYoutuResearch/CrowdCounting-P2PNet` | 534 | Contagem por pontos (densidade) |
| `jerpelhan/GeCo` | Novo | Few-shot counting (exemplar boxes) |

---

### 4.6 Defeitos em Tecidos

**Objetivo:** Detectar defeitos em tecidos: buracos, manchas, fios soltos, nós, falhas de trama.

**Arquitetura recomendada:** YOLOv8m-seg (instance segmentation) + classical CV fallback

**Por quê YOLOv8m-seg:**
- DarkForest-727 conseguiu mAP50 = 0.9164 com esta arquitetura
- 4 classes padrão: `hole`, `stain`, `line`, `knot`
- Instance segmentation dá máscara pixel-level (não só bbox)
- Para edge: usar YOLOv8n-seg (nano) com treinamento adequado

**Fluxo de processamento:**
```
Frame 1920x1080
    ↓ Pre-processing:
    ├─→ CLAHE (Contrast Limited Adaptive Histogram Equalization)
    ├─→ Gabor filter (detecção de textura)
    └─→ FFT (detecção de padrões periódicos)
    ↓ YOLOv8n-seg inference:
    ├─→ Detect: hole, stain, line, knot
    ├─→ Instance masks (pixel-level)
    └─→ Confidence per detection
    ↓ Post-processing:
    ├─→ Calcular área de cada defeito (pixels da máscara)
    ├─→ Classificar severidade: low (<100px), medium (100-500px), high (>500px)
    └─→ Se defeito > threshold → alerta
    ↓ ProcessingResult(type='fabric_defect', result_data={defect_type, severity, bbox, area_px})
```

**Fallback clássico (sem deep learning):**
- GLCM (Gray-Level Co-occurrence Matrix) → textura
- FFT (Fast Fourier Transform) → padrões periódicos
- Gabor filters → detecção de bordas/textura
- Useful quando não há dataset de treino disponível

**Referências open-source:**

| Repositório | Stars | O que adotar |
|---|---|---|
| `DarkForest-727/Automated-Fabric-Defect-Detection-and-Localization` | Novo | YOLOv8m-seg, mAP50=0.9164, FastAPI+React |
| `jraad/fabric_defect_detection` | Baixo | Hybrid: CNN classifier → UNet segmentation |
| `emreefeyuksel/Textile-Surface-Defect-Detection` | Baixo | DIP (CLAHE, Gabor, FFT) + CNN + Autoencoder |
| `czu-zhang/Light-FDD` | Baixo | FasterNet backbone, edge-optimized |
| `Awais-Asghar/Real-Time-Fabric-Defect-Detection-on-Jetson-Nano` | 4 | Zero deep learning, puro OpenCV |

**Datasets:**

| Dataset | Imagens | Classes | Fonte |
|---|---|---|---|
| MVTec AD (textile) | 245 | hole, stain, color, thread | MVTec |
| TILDA | 896 | 4 classes defeito | Universidade |
| Roboflow Fabric Defect | Variável | hole, stain, line, knot | Roboflow |

**Modelo base:** `yolov8m-seg.pt` (pré-treinado COCO) → fine-tune no dataset de tecido.

---

## 5. Pesquisa de Repositórios

### 5.1 Repositórios com Mais Estrelas por Categoria

| Categoria | Repositório | Stars | Link |
|-----------|------------|-------|------|
| Framework geral | `ultralytics/ultralytics` | 40.000+ | https://github.com/ultralytics/ultralytics |
| Fissuras | `arthurflor23/surface-crack-detection` | 163 | https://github.com/arthurflor23/surface-crack-detection |
| EPI | `njvisionpower/Safety-Helmet-Wearing-Dataset` | 1.700 | https://github.com/njvisionpower/Safety-Helmet-Wearing-Dataset |
| EPI (dataset completo) | `ahmadmughees/SH17dataset` | 133 | https://github.com/ahmadmughees/sh17dataset |
| ReID/Rastreamento | `mikel-brostrom/yolo_tracking` | 5.800+ | https://github.com/mikel-brostrom/yolo_tracking |
| ALPR | `openalpr/openalpr` | 11.440 | https://github.com/openalpr/openalpr |
| ALPR (MIT) | `ankandrew/fast-alpr` | 737 | https://github.com/ankandrew/fast-alpr |
| Contagem | `ultralytics/ultralytics` (ObjectCounter) | 40.000+ | https://github.com/ultralytics/ultralytics |
| Tecidos | `DarkForest-727/Automated-Fabric-Defect-Detection-and-Localization` | Novo | https://github.com/DarkForest-727/Automated-Fabric-Defect-Detection-and-Localization |

### 5.2 Padrões de Código Adotados

| Padrão | Fonte | Aplicação |
|--------|-------|-----------|
| YAML dataset config | Ultralytics | Configuração de datasets de treino |
| 3-line Python API | Ultralytics | `model = YOLO("yolo11n-seg.pt"); results = model("image.jpg")` |
| Sliding window 640x640 | priya-dwivedi | Processar frames 1920x1080 em patches |
| Albumentations augmentation | Concrete_Crack_Segmentation | Augmentação para datasets pequenos |
| HMAC-SHA256 plate hash | anpr-pipeline | Privacidade de placas |
| Polygon zone check | HugoLi0213 | EPI enforcement por zona |
| Compliance state machine | pictor-ppe | W/WH/WV/WHV compliance check |
| Classical CV fallback | Light-FDD | GLCM+Gabor+FFT quando sem dataset |
| ONNX Runtime inference | fast-alpr | Edge deployment sem PyTorch |

---

## 6. Decisões de Arquitetura

### 6.1 Framework Unificado: Ultralytics

**Decisão:** Todos os módulos de visão usarão Ultralytics YOLO como base.

**Justificativa:**
- Uma única dependência cobre detecção, segmentação, contagem, tracking
- Exporta para ONNX → roda no Orange Pi via ONNX Runtime
- Dataset oficial para fissuras (Crack-Seg)
- Treinamento com CLI: `yolo train data=fissure.yaml model=yolo11n-seg.pt epochs=100`
- Inferência com 3 linhas de Python
- Comunidade massiva (40K+ stars)

### 6.2 Edge-First

**Decisão:** Processamento roda no Orange Pi (local), não no servidor central.

**Justificativa:**
- Reduz latência (não precisa enviar imagem à central para processar)
- Funciona offline (resultados ficam na fila até ter internet)
- Economiza bandwidth (só envia metadados, não imagens)
- Padrão edge computing recomendado para IoT

### 6.3 ONNX Runtime (não PyTorch)

**Decisão:** Inferência com ONNX Runtime, não PyTorch.

**Justificativa:**
- ONNX Runtime é ~3x mais leve que PyTorch
- Funciona em CPU sem GPU
- Ultralytics exporta nativamente para ONNX
- Compatível com Orange Pi (ARM)

### 6.4 Pipeline Modular

**Decisão:** Cada tarefa é um módulo independente (plugin).

**Justificativa:**
- Permite habilitar/desabilitar módulos por device
- Facilita testes unitários
- Novos módulos podem ser adicionados sem alterar o core
- Cada módulo tem seu próprio modelo e config

### 6.5 Schema JSON Flexível

**Decisão:** `result_data` é JSON, não colunas rigidamente tipadas.

**Justificativa:**
- Cada tipo de resultado tem estrutura diferente
- Evita 50 colunas nullable
- Facilita evolução (adicionar campos sem migration)
- JSON é nativo do PostgreSQL
- Facilita serialização para a Central

---

## 7. Próximos Passos

### 7.1 Implementação Imediata (Fase 1)

| # | Tarefa | Arquivo | Depende de |
|---|--------|---------|-----------|
| 1 | Criar migration `004_processing_results` | `database/migrations/versions/004_processing_results.py` | Nenhuma |
| 2 | Criar migration `005_tracking_sessions` | `database/migrations/versions/005_tracking_sessions.py` | Nenhuma |
| 3 | Criar migration `006_zone_configs` | `database/migrations/versions/006_zone_configs.py` | Nenhuma |
| 4 | Adicionar `processing_status` à tabela observations | `database/migrations/versions/007_observation_processing_status.py` | Nenhuma |
| 5 | Criar ORM models: `ProcessingResult`, `TrackingSession`, `ZoneConfig` | `src/storage/models.py` | Migrations 1-3 |
| 6 | Criar base class `BaseDetector` | `src/vision/base.py` | Models |
| 7 | Criar `FissureDetector` | `src/vision/fissure_detector.py` | BaseDetector |
| 8 | Criar `PersonDetector` | `src/vision/person_detector.py` | BaseDetector |
| 9 | Criar `PPEDetector` | `src/vision/ppe_detector.py` | PersonDetector |
| 10 | Criar `PlateDetector` | `src/vision/plate_detector.py` | BaseDetector |
| 11 | Criar `ObjectCounter` | `src/vision/object_counter.py` | PersonDetector |
| 12 | Criar `FabricDefectDetector` | `src/vision/fabric_defect_detector.py` | BaseDetector |
| 13 | Criar `VisionPipeline` | `src/vision/pipeline.py` | Todos os detectores |
| 14 | Criar `_processing_loop()` background task | `src/main.py` | Pipeline |
| 15 | Atualizar delivery_queue para incluir processing_results | `src/storage/delivery_queue.py` | Models |
| 16 | Criar endpoints de resultados | `src/api/routes.py` | Models |
| 17 | Dashboard: página de resultados de processamento | `src/templates/processing.html` | Routes |
| 18 | Dashboard: configuração de zonas | `src/templates/zones.html` | Routes |
| 19 | Testes para cada módulo | `tests/test_vision_*.py` | Cada detector |
| 20 | Benchmark: FPS no Orange Pi | `scripts/benchmark.py` | Pipeline |

### 7.2 Treinamento de Modelos (Fase 2)

| # | Modelo | Dataset | Ferramenta | Target |
|---|--------|---------|-----------|--------|
| 1 | FissureDetector | Crack-Seg + imagens próprias | `yolo train` | YOLO11n-seg → ONNX |
| 2 | PPEDetector | SH17 ou Construction-Safety | `yolo train` | YOLO11n → ONNX |
| 3 | PlateDetector | fast-alpr weights | Download | YOLOv9-t → ONNX |
| 4 | FabricDefectDetector | MVTec AD textile + TILDA | `yolo train` | YOLOv8n-seg → ONNX |
| 5 | PersonReID | Market-1501 | boxmot | OSNet → ONNX |

### 7.3 Deploy e Validação (Fase 3)

| # | Tarefa | Ambiente |
|---|--------|---------|
| 1 | Instalar ONNX Runtime no Orange Pi | Orange Pi |
| 2 | Copiar modelos ONNX para Orange Pi | Orange Pi |
| 3 | Testar cada detector individualmente | Orange Pi |
| 4 | Benchmark: FPS com todos os módulos | Orange Pi |
| 5 | Testar pipeline completo: captura → processamento → fila → central | End-to-end |
| 6 | Validar: pessoa sem EPI gera alerta | Orange Pi + câmera |
| 7 | Validar: fissura detectada no gabarito | Orange Pi + gabarito |

---

## Referências

- [vision_platform_integrada.md](./vision_platform_integrada.md) — Proposta arquitetural completa
- [vision-platform-roadmap.md](./vision-platform-roadmap.md) — Roadmap de implementação
- [architecture.md](./architecture.md) — Arquitetura técnica do GeoFissura
- [Ultralytics Docs](https://docs.ultralytics.com/) — Documentação oficial YOLO
- [fast-alpr](https://github.com/ankandrew/fast-alpr) — ALPR MIT
- [BoxMOT](https://github.com/mikel-brostrom/yolo_tracking) — Tracking + ReID
- [SH17 Dataset](https://github.com/ahmadmughees/sh17dataset) — 17 classes EPI
