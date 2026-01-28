## 🤖 Dokumentace tvorby projektu s AI

Tento projekt byl vytvořen s využitím generativní umělé inteligence v roli "Pair Programmer". Níže uvádím postup, použité nástroje a zhodnocení výsledku.

### 1. Postup a Metodika
Byla zvolena strategie **"Architect & Builder"**, kde jedna AI sloužila k návrhu architektury a druhá k samotnému psaní kódu.
* **Strategie:** Místo ad-hoc dotazů jsem používal strukturované, sekvenční prompty (Chain of Thought). Nejdříve byla vygenerována kostra projektu (scaffolding), následně databázové modely, a nakonec frontend s logikou.
* **Workflow:**
    1.  Specifikace zadání a generování "Master Promptů" v externím LLM.
    2.  Vložení promptů do VS Code agenta pro vygenerování souborů.
    3.  Iterativní ladění chyb (debugging) a úprava vzhledu pomocí kontextových dotazů (např. oprava nefunkčního Bootstrapu a routing chyb).

### 2. Použité Modely
* **Google Gemini:** Použit jako "Architect" pro analýzu zadání, návrh technologického stacku (Node.js + Express + EJS) a psaní komplexních promptů pro kodéra.
* **Claude 3.5 Sonnet (via GitHub Copilot):** Použit jako "Coder" přímo ve VS Code. Tento model byl vybrán pro jeho aktuálně nejlepší schopnosti v generování kódu a chápání kontextu celého projektu.

### 3. Odhadovaná náročnost (Tokeny & Requesty)
Vzhledem k nutnosti opravovat původní "rozbité" verze UI a nefunkční routy byl proces náročnější než prostý generátor.
* **Počet Requestů:** cca 20 - 25 interakcí (prompty + opravy).
* **Spotřeba Tokenů:** Odhadem ~45 000 input tokenů (kvůli načítání kontextu celého projektu) a ~6 000 output tokenů (generovaný kód).

### 4. Zhodnocení Výsledku
Výsledek splňuje zadání MVP (Minimum Viable Product).
* **Klady:** AI rychle vytvořilo základní strukturu (Express server, Sequelize modely) a po "donucení" dokázalo vygenerovat i modernější UI s Dashboardem.
* **Zápory:** Prvotní výstupy byly vizuálně velmi strohé a obsahovaly chyby v cestách (404 errors). Bylo nutné AI silně navigovat, aby aplikace vypadala k světu. Kód je funkční, ale místy vyžadoval manuální zásah pro správné propojení frontendových šablon s backendem. Celkově hodnotím jako funkční základ, který ale není bez chyb.
