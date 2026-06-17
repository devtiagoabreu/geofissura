# Graph Report - .  (2026-06-15)

## Corpus Check
- 161 files · ~99,249 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 680 nodes · 1354 edges · 51 communities (33 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Web Application Core|Web Application Core]]
- [[_COMMUNITY_Supporting Code|Supporting Code]]
- [[_COMMUNITY_Code Module 2|Code Module 2]]
- [[_COMMUNITY_Code Module 3|Code Module 3]]
- [[_COMMUNITY_Code Module 4|Code Module 4]]
- [[_COMMUNITY_Code Module 5|Code Module 5]]
- [[_COMMUNITY_Code Module 6|Code Module 6]]
- [[_COMMUNITY_Code Module 7|Code Module 7]]
- [[_COMMUNITY_Code Module 8|Code Module 8]]
- [[_COMMUNITY_Code Module 9|Code Module 9]]
- [[_COMMUNITY_Code Module 10|Code Module 10]]
- [[_COMMUNITY_Code Module 11|Code Module 11]]
- [[_COMMUNITY_Code Module 12|Code Module 12]]
- [[_COMMUNITY_Code Module 13|Code Module 13]]
- [[_COMMUNITY_Code Module 14|Code Module 14]]
- [[_COMMUNITY_Code Module 15|Code Module 15]]
- [[_COMMUNITY_Code Module 16|Code Module 16]]
- [[_COMMUNITY_Code Module 17|Code Module 17]]
- [[_COMMUNITY_Code Module 18|Code Module 18]]
- [[_COMMUNITY_Code Module 19|Code Module 19]]
- [[_COMMUNITY_Code Module 20|Code Module 20]]
- [[_COMMUNITY_Code Module 21|Code Module 21]]
- [[_COMMUNITY_Code Module 22|Code Module 22]]
- [[_COMMUNITY_Code Module 23|Code Module 23]]
- [[_COMMUNITY_Code Module 24|Code Module 24]]
- [[_COMMUNITY_Code Module 25|Code Module 25]]
- [[_COMMUNITY_Code Module 26|Code Module 26]]
- [[_COMMUNITY_Code Module 27|Code Module 27]]
- [[_COMMUNITY_Code Module 28|Code Module 28]]
- [[_COMMUNITY_Code Module 29|Code Module 29]]
- [[_COMMUNITY_Code Module 30|Code Module 30]]
- [[_COMMUNITY_Code Module 31|Code Module 31]]
- [[_COMMUNITY_Code Module 32|Code Module 32]]
- [[_COMMUNITY_Code Module 33|Code Module 33]]
- [[_COMMUNITY_Code Module 34|Code Module 34]]
- [[_COMMUNITY_Code Module 36|Code Module 36]]
- [[_COMMUNITY_Code Module 37|Code Module 37]]
- [[_COMMUNITY_Code Module 38|Code Module 38]]
- [[_COMMUNITY_Code Module 39|Code Module 39]]
- [[_COMMUNITY_Code Module 40|Code Module 40]]
- [[_COMMUNITY_Code Module 41|Code Module 41]]
- [[_COMMUNITY_Code Module 42|Code Module 42]]
- [[_COMMUNITY_Documentation 49|Documentation 49]]
- [[_COMMUNITY_Documentation 50|Documentation 50]]

## God Nodes (most connected - your core abstractions)
1. `getSession()` - 90 edges
2. `apiError()` - 83 edges
3. `db` - 50 edges
4. `dependencies` - 38 edges
5. `Button` - 29 edges
6. `GeoFissura` - 22 edges
7. `edificacoes` - 21 edges
8. `clientes` - 20 edges
9. `sensores` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GeoFissura MTO Brand Logo` --conceptually_related_to--> `GeoFissura`  [INFERRED]
  geofissuramto_logo.png → README.md
- `cn()` --calls--> `clsx`  [INFERRED]
  src/lib/utils.ts → package.json
- `GeoFissura Landing Page Screenshot` --conceptually_related_to--> `Landing Page Feature`  [EXTRACTED]
  public/landing-screenshot.png → README.md
- `GeoFissura` --references--> `Seed Database Summary`  [INFERRED]
  README.md → seed-resumo.txt
- `GeoFissura` --references--> `seed-planos-equipamentos.js`  [INFERRED]
  README.md → scripts/tmp/README.md

## Hyperedges (group relationships)
- **Vertical GeoLab Building Portfolio** — SEED_VerticalGeoLab, SEED_TorreCorporate, SEED_ResidencialVistaParque, SEED_GalpaoIndustrial [EXTRACTED 1.00]
- **Geométrica Construtora Building Portfolio** — SEED_GeometricaConstrutora, SEED_EdificioNovaAurora, SEED_CondominioVerdeVale, SEED_CentroLogistico [EXTRACTED 1.00]
- **GeoFissura Technology Stack** — README_NextJS14, README_TypeScript, README_TailwindShadcn, README_PostgreSQLNeon, README_DrizzleORM, README_NextAuth, README_ThreeJS, README_VercelDeploy [EXTRACTED 1.00]
- **Seed and Query Scripts Toolchain** — SCRIPTS_SeedPlanosEquipamentos, SCRIPTS_QueryEdificios, SCRIPTS_CheckPlanosEquipamentos [EXTRACTED 1.00]
- **GeoFissura Core Features** — README_LandingPage, README_MultiTenant, README_CRUDEdificacoes, README_CRUDSensores, README_Leituras, README_PDFReports, README_MQTTWebhook, README_UploadLaudos, README_AdminPanel [EXTRACTED 1.00]

## Communities (51 total, 18 thin omitted)

### Community 0 - "Web Application Core"
Cohesion: 0.0152
Nodes (243): @tanstack/react-table, NotificacoesRegrasPage(), GET(), DeleteButtonProps, sendNotificationEmail(), NewDocumento, Sensor, Props (+235 more)

### Community 1 - "Supporting Code"
Cohesion: 0.0651
Nodes (36): Galpão Industrial LogTech, Sensor Readings (Leituras), Drizzle ORM, MQTT Webhook via EMQX, Vercel Deploy, Multi-cliente Data Isolation, PDF Report Generation, GeoFissura MTO Brand Logo (+28 more)

### Community 2 - "Code Module 2"
Cohesion: 0.1
Nodes (19): jsx, lib, paths, isolatedModules, skipLibCheck, include, noEmit, incremental (+11 more)

### Community 3 - "Code Module 3"
Cohesion: 0.1758
Nodes (13): lines, { resolve }, i, sql, postgres, main(), k, t (+5 more)

### Community 4 - "Code Module 4"
Cohesion: 0.1923
Nodes (12): envPath, { resolve }, lines, v, { readFileSync, existsSync }, rand(), postgres, k (+4 more)

### Community 5 - "Code Module 5"
Cohesion: 0.1538
Nodes (12): { resolve }, postgres, k, lines, t, v, migPath, sql (+4 more)

### Community 6 - "Code Module 6"
Cohesion: 0.1818
Nodes (11): k, { resolve }, { readFileSync, existsSync }, t, postgres, i, bcrypt, lines (+3 more)

### Community 7 - "Code Module 7"
Cohesion: 0.1818
Nodes (11): bcrypt, k, { readFileSync, existsSync, writeFileSync }, t, lines, i, { resolve }, v (+3 more)

### Community 8 - "Code Module 8"
Cohesion: 0.1818
Nodes (11): lines, envPath, t, sql, i, v, k, postgres (+3 more)

### Community 9 - "Code Module 9"
Cohesion: 0.1818
Nodes (11): k, { resolve }, lines, envPath, postgres, v, { readFileSync, existsSync }, i (+3 more)

### Community 10 - "Code Module 10"
Cohesion: 0.1818
Nodes (11): { readFileSync, existsSync }, k, envPath, { resolve }, lines, i, v, t (+3 more)

### Community 11 - "Code Module 11"
Cohesion: 0.1818
Nodes (11): { readFileSync, existsSync }, envPath, postgres, v, t, main(), i, { resolve } (+3 more)

### Community 12 - "Code Module 12"
Cohesion: 0.2
Nodes (10): { readdirSync, readFileSync, existsSync }, postgres, eqIdx, { join, resolve }, envPath, key, migrate(), trimmed (+2 more)

### Community 13 - "Code Module 13"
Cohesion: 0.2
Nodes (10): k, { resolve }, i, v, postgres, { readFileSync, existsSync }, envPath, lines (+2 more)

### Community 14 - "Code Module 14"
Cohesion: 0.2
Nodes (10): envPath, v, t, main(), postgres, { readFileSync, existsSync }, k, { resolve } (+2 more)

### Community 15 - "Code Module 15"
Cohesion: 0.2
Nodes (10): lines, main(), { readFileSync, existsSync }, i, t, k, v, postgres (+2 more)

### Community 16 - "Code Module 16"
Cohesion: 0.5333
Nodes (5): main(), gerar(), sql, rand(), postgres

### Community 17 - "Code Module 17"
Cohesion: 0.7333
Nodes (5): sensores, edificacoes, leituras, usuarios, clientes

### Community 18 - "Code Module 18"
Cohesion: 0.6
Nodes (4): notificacoes_config, notificacoes_regras, notificacoes_regra_destinatarios, notificacoes

### Community 19 - "Code Module 19"
Cohesion: 0.6667
Nodes (3): addUser(), bcrypt, postgres

### Community 20 - "Code Module 20"
Cohesion: 0.6667
Nodes (3): postgres, bcrypt, addUser()

### Community 21 - "Code Module 21"
Cohesion: 0.6667
Nodes (3): postgres, bcrypt, check()

### Community 22 - "Code Module 22"
Cohesion: 0.6667
Nodes (3): bcrypt, postgres, seed()

### Community 23 - "Code Module 23"
Cohesion: 0.6667
Nodes (3): post(), https, main()

### Community 25 - "Code Module 25"
Cohesion: 0.5
Nodes (3): tenants, Tenant, NewTenant

### Community 26 - "Code Module 26"
Cohesion: 0.5
Nodes (3): JWT, User, Session

## Knowledge Gaps
- **320 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web Application Core` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Supporting Code` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Code Module 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._