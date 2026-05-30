# CLAUDE.md — Angular Project Guidelines

Questo file definisce le regole operative per Claude Code su questo progetto Angular.
Seguire questo documento in ogni sessione di lavoro.

---

## 1. Inizializzazione progetto (solo se vergine)

Se il progetto è appena creato con `ng new` e non ha ancora struttura personalizzata, eseguire obbligatoriamente i passi seguenti **prima di qualsiasi altra operazione**.

### 1.1 Struttura cartelle obbligatoria

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   ├── interceptors/
│   │   ├── guards/
│   │   └── utils/
│   ├── shared/
│   │   ├── components/
│   │   └── directives/
│   ├── store/
│   ├── features/
│   └── environments/          # generati da script, vedi §4
├── public/
│   └── i18n/                  # file di traduzione (es. it.json, en.json)
scripts/                       # script di utilità (es. generate-env.sh)
api/
└── swagger.yaml               # definizione OpenAPI/Swagger delle API
proxy.conf.json
```

Creare le cartelle mancanti con un file `.gitkeep` dove necessario.

### 1.2 File da creare manualmente (non generabili da ng CLI)

| File | Scopo |
|---|---|
| `api/swagger.yaml` | Definizione Swagger/OpenAPI — da popolare con le specifiche API ricevute |
| `proxy.conf.json` | Configurazione proxy per il dev server Angular |
| `scripts/generate-env.sh` | Script per generare i file `environment.*.ts` dagli env |
| `public/i18n/it.json` | Placeholder traduzioni italiano |
| `public/i18n/en.json` | Placeholder traduzioni inglese |

Contenuto minimo `proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Registrare il proxy in `angular.json` sotto `serve.options`:

```json
"proxyConfig": "proxy.conf.json"
```

---

## 2. Generazione codice — regole obbligatorie

**Ogni componente, servizio, guardia, interceptor, direttiva o pipe deve essere generato tramite Angular CLI**, mai creato a mano.

### 2.0 Verifica esistenza prima di creare

Prima di generare qualsiasi componente (o servizio, direttiva, pipe), Claude **deve**:

1. Cercare in `src/app/` se esiste già un elemento con lo stesso nome o scopo equivalente
2. Se esiste → usarlo direttamente, segnalando il path all'utente
3. Se non esiste → chiedere conferma esplicita all'utente prima di generarlo con la CLI

> **Non generare mai senza conferma.** Il messaggio di conferma deve indicare il comando esatto che verrà eseguito.

### Comandi ng CLI da usare

```bash
# Componente (standalone, OnPush)
ng g c features/<feature>/<nome-componente> --standalone --change-detection OnPush

# Servizio
ng g s core/services/<nome-servizio>

# Guardia
ng g guard core/guards/<nome-guard>

# Interceptor
ng g interceptor core/interceptors/<nome-interceptor>

# Direttiva
ng g directive shared/directives/<nome-direttiva>

# Pipe
ng g pipe shared/pipes/<nome-pipe>

# Modello (interface)
# Non esiste comando ng CLI — creare manualmente in core/models/<nome>.model.ts
```

> **Regola:** non modificare i file generati dalla CLI se non strettamente necessario per la logica richiesta.

---

## 3. Standard di codice Angular

### 3.1 Componenti

- **Standalone** obbligatorio (`standalone: true`)
- **Change detection**: sempre `OnPush`
- **State reattivo**: usare `signal()`, `computed()`, `effect()` — non `BehaviorSubject` salvo casi documentati
- **Stili**: usare esclusivamente classi Tailwind nel template — nessun file `.scss`, nessun stile inline, nessun `[ngStyle]`
- Nessun magic number o stringa — usare costanti o enum in `core/utils/`

### 3.2 Tailwind CSS

Tailwind è configurato in fase di inizializzazione del progetto. **Non aggiungere altri sistemi di stile.**

Regole operative:

- Usare solo classi Tailwind nei template HTML
- Per classi condizionali usare `[class]` binding o `ngClass` con oggetto — mai costruire stringhe dinamiche
- Varianti responsive (`sm:`, `md:`, `lg:`) e di stato (`hover:`, `focus:`, `disabled:`) sono ammesse
- Per sequenze di classi ripetute su più componenti, estrarre in una costante in `core/utils/styles.constants.ts`
- **Non generare file `.scss`** quando si crea un componente — usare il flag `--style=none` o rimuovere il file generato:

```bash
ng g c features/<feature>/<nome> --standalone --change-detection OnPush --style=none
```

- Non modificare `tailwind.config.js` senza approvazione esplicita
- Non usare `@apply` salvo casi eccezionali documentati nel codice

### 3.2 TypeScript

- `strict: true` obbligatorio in `tsconfig.json`
- Import raggruppati in ordine: **external → internal → types**
- Path assoluti con alias (configurare `paths` in `tsconfig.json`)

```json
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@features/*": ["src/app/features/*"],
  "@store/*": ["src/app/store/*"],
  "@env/*": ["src/app/environments/*"]
}
```

### 3.3 Modelli

- Un file per modello in `core/models/`
- Solo `interface`, non `class`, salvo necessità di metodi
- Naming: `<Nome>.model.ts`, export named

---

## 4. Environments

Gli environments **non vanno scritti a mano**: sono generati dallo script `scripts/generate-env.sh` a partire da variabili di ambiente o file `.env`.

Schema file generato:

```typescript
// src/app/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: '',
  // altre variabili iniettate dallo script
};
```

> Aggiungere `src/app/environments/` a `.gitignore` se i file contengono segreti.

---

## 5. API e Swagger

Il file `api/swagger.yaml` è la fonte di verità per tutte le chiamate HTTP.

- **Non inventare endpoint** non presenti nello Swagger
- I modelli generati dallo Swagger vanno in `core/models/`
- I servizi che wrappano le chiamate HTTP vanno in `core/services/`
- Usare `HttpClient` con tipi espliciti — mai `any`

---

## 6. Internazionalizzazione (i18n)

Le traduzioni risiedono in `public/i18n/<lang>.json`.

- Chiavi in formato `snake_case` con namespace: `feature.componente.chiave`
- Nessuna stringa hardcodata nei template — usare sempre il meccanismo di traduzione configurato
- Aggiungere la chiave in **tutti** i file lingua contemporaneamente

---

## 7. Git Flow

Seguire questo ordine in ogni task. **Non saltare fasi.**

1. **PLAN** — elencare file coinvolti e motivazione
2. **LOGIC** — implementare servizi, modelli, store, utils
3. **UI** — implementare componenti e template
4. **REVIEW** — riepilogare modifiche e segnalare debito tecnico
5. **CHANGES** — applicare solo le correzioni richieste
6. **TEST** — unit test per la logica, integration test base per UI

**Attendere approvazione esplicita** prima di passare alla fase successiva.

### Messaggio di commit

Al termine di ogni task completato, Claude **deve sempre** produrre il testo del commit pronto da copiare, usando i tag seguenti:

| Tag | Quando usarlo |
|---|---|
| `@new` | nuova funzionalità o implementazione |
| `@fix` | correzione di un bug |
| `@refactoring` | refactoring senza cambi funzionali |
| `@style` | modifiche estetiche/stili senza logica |
| `@chore` | configurazione, dipendenze, script, file non applicativi |
| `@docs` | aggiornamento documentazione |
| `@test` | aggiunta o modifica di test |

Formato:

```
@tag(scope): short description in English

@new(auth): add refresh token interceptor
@fix(dashboard): fix total orders calculation
@refactoring(user-service): remove circular dependency
@chore(env): add environment generation script
```

> **La descrizione è sempre in inglese**, imperativo presente, senza punto finale.

Il testo del commit va riportato **alla fine della fase REVIEW** in un blocco copiabile, prima di attendere approvazione.

---

## 8. Regole generali (non derogabili)

- **Non modificare file fuori dallo scope del task** — chiedere prima
- **Non introdurre nuove dipendenze** senza approvazione esplicita
- **Non refactoring non richiesto** — segnalarlo in REVIEW se necessario
- **Non aggiungere error handling** non richiesto
- **Non commentare codice ovvio**
- Se il task coinvolge più di 3 file, elencarli e attendere conferma prima di procedere
