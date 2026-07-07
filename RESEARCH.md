# Исследование: наработки экосистемы AI-инженерии на GitHub

> Дата: 2026-07-07. Метод: поиск по GitHub (gh CLI) по темам Claude Code / системные промпты / MCP / spec-driven / сабагенты / память + чтение README и исходников ключевых репозиториев. Цель — понять, что уже построено, что забрать в наш сет и где наши пробелы.

---

## 1. Карта экосистемы

### Фреймворки процесса (прямые «конкуренты» нашего сета)

| Репозиторий | ★ | Суть |
|---|---|---|
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | 226k | «Операционная система харнесса»: скиллы, «инстинкты» (микро-правила из опыта), оптимизация памяти и токенов, security-сканер AgentShield, research-first. Кросс-харнесс: Claude Code, Codex, OpenCode, Cursor. Победитель хакатона Anthropic. |
| [garrytan/gstack](https://github.com/garrytan/gstack) | 120k | Сет Гарри Тана (президент YC): 23 «специалиста» как слэш-команды — /plan-ceo-review, /review, /qa (реальный браузер), /cso (OWASP+STRIDE аудит), /retro, /investigate, /ship. «Виртуальная инженерная команда». |
| [github/spec-kit](https://github.com/github/spec-kit) | 118k | Spec-Driven Development от самого GitHub: /speckit.constitution → specify → plan → tasks → implement. «Спецификации становятся исполняемыми». |
| [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core) (ex get-shit-done) | 64k | Мета-промптинг + контекст-инжиниринг + SDD; агенты работают автономно часами, не теряя большую картину. |
| [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) | 59k | Лёгкая альтернатива spec-kit для SDD. |
| [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) | 50k | «Agile для AI»: 12+ агентов-ролей (PM, Architect, Dev, UX), scale-adaptive планирование (от багфикса до энтерпрайза), 34+ воркфлоу. |
| [obra/superpowers](https://github.com/obra/superpowers) | — | Методология на композитных скиллах: brainstorm → спека кусками «которые реально прочитаешь» → план «для джуна без вкуса и контекста» → subagent-driven development с红/зелёным TDD, YAGNI, DRY. Автотриггер скиллов. |
| [SuperClaude-Org/SuperClaude_Framework](https://github.com/SuperClaude-Org/SuperClaude_Framework) | 23k | 30 команд, 20 агентов, 7 «когнитивных персон», 8 MCP. Максималистский подход. |
| [shanraisshan/claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | 62k | «From vibe coding to agentic engineering». Живой каталог ВСЕХ фич Claude Code с лучшими практиками (worktrees, agent teams, ultrareview, воркфлоу оркестрации Command→Agent→Skill). |

### Правила поведения агента (CLAUDE.md-слой)

| Репозиторий | ★ | Суть |
|---|---|---|
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | 188k | Один CLAUDE.md из наблюдений Карпатьи о провалах LLM. 4 принципа: **Think Before Coding** (не предполагай молча — спрашивай), **Simplicity First** (минимум кода, «сказал бы сеньор, что переусложнено?»), **Surgical Changes** (не трогай соседний код, каждая строка дифа трассируется к запросу), **Goal-Driven Execution** (задача → проверяемый критерий: «почини баг» → «напиши воспроизводящий тест и сделай зелёным»). |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) | 86k | Скилл-мем: −65% токенов «разговором как пещерный человек». Сигнал: экономия токенов — реальная боль. |

### Системные промпты (что «зашито» в чужие агенты)

| Репозиторий | ★ | Суть |
|---|---|---|
| [x1xhlol/system-prompts-and-models-of-ai-tools](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools) | 141k | Полные промпты Cursor, Devin, Windsurf, v0, Claude Code, Manus и десятков других. |
| [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | 52k | Извлечённые промпты Anthropic/OpenAI/Google, обновляется регулярно. |
| [anomalyco/opencode](https://github.com/anomalyco/opencode) | 183k | Открытый агент — промпты лежат в `packages/opencode/src/session/prompt/*.txt` (по одному на модель: anthropic, gpt, gemini, plan-mode...). |

**Разбор промпта opencode (anthropic.txt)** — что они считают важным зашить намертво:
- **Professional objectivity**: «точность важнее подтверждения убеждений пользователя; несогласие ценнее фальшивого согласия» — целая секция;
- тотальная **todo-дисциплина** (планируй списком, закрывай по одному, не батчами);
- **параллельные вызовы** независимых инструментов — всегда;
- ссылки на код строго `file_path:line_number`;
- «НИКОГДА не создавай файл, если можно править существующий» (в т.ч. markdown);
- никаких эмодзи без запроса; краткость — вывод идёт в терминал.

### MCP-экосистема

| Репозиторий | ★ | Суть |
|---|---|---|
| [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | 90k | Главный каталог MCP-серверов. |
| [rohitg00/awesome-devops-mcp-servers](https://github.com/rohitg00/awesome-devops-mcp-servers) | 1k | DevOps-подборка. |
| [Pimzino/spec-workflow-mcp](https://github.com/Pimzino/spec-workflow-mcp) | 4.2k | SDD-воркфлоу как MCP-сервер с веб-дашбордом прогресса. |

Консенсус всех топ-сетов: **MCP подключать скупо, неиспользуемые отключать** — контекст дороже удобства. (У нас это уже принцип №5 в GUIDE.md ✓)

### Память и знание кодовой базы

| Репозиторий | ★ | Суть |
|---|---|---|
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | 86k | Автозахват всего, что агент делал в сессии, AI-компрессия, инъекция релевантного в будущие сессии. |
| [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | 79k | Кодовая база → запрашиваемый граф знаний (код + SQL + доки). |
| [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) | 58k | Пре-индексированный граф кода, автосинк: «меньше токенов, меньше tool-calls, 100% локально». |

### Каталоги-агрегаторы

- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) (49k) — главный awesome-список;
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) (23k) — 100+ готовых сабагентов;
- [trailofbits/skills](https://github.com/trailofbits/skills) (6k) — скиллы для security-аудита от Trail of Bits;
- [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) (42k) — 1800+ скиллов с инсталлером.

---

## 2. Сквозные паттерны (что сходится у всех успешных)

1. **Спецификация — центр тяжести.** spec-kit, GSD, OpenSpec, superpowers, BMAD — все ставят спеку до кода. Наш `/spec` в тренде, но у лидеров спека **исполняемая**: constitution → specify → plan → нумерованные tasks → implement, с валидацией на каждом переходе.
2. **Роли, а не один агент.** gstack (23 специалиста), BMAD (12 ролей), SuperClaude (20 агентов). Ревьюер ≠ архитектор ≠ QA — у каждого свой промпт, свои инструменты, свой чистый контекст.
3. **Выученные правила как система.** «Инстинкты» ECC = наш `/postmortem`, но у них это непрерывный конвейер: наблюдение → микро-правило → автоприменение. Плюс модульная папка `rules/` вместо монолитного CLAUDE.md (security.md, testing.md, git-workflow.md...).
4. **Токен-экономика — отдельная дисциплина.** Codemaps/графы кода вместо «прочитай всё», компрессия памяти, отключение MCP, дешёвые модели на рутину.
5. **Реальная верификация.** gstack `/qa` открывает настоящий браузер; superpowers гоняет красно-зелёный TDD; ECC ставит evals. «Тесты зелёные» никому не аргумент.
6. **Безопасность въезжает в мейнстрим.** AgentShield (ECC), `/cso` (gstack), trailofbits/skills. Аудит агентного кода — уже не экзотика.
7. **Кросс-харнесс.** Все крупные сеты работают на Claude Code + Codex + OpenCode + Cursor одновременно: методология отделена от инструмента.

---

## 3. Что забираем в vibe-engineer-kit (приоритизировано)

### P1 — маленькие изменения, большой эффект ✅ внедрено 2026-07-07
1. **Карпатиевские 4 принципа → в шаблон CLAUDE.md** (секция «Поведение агента»): не предполагай молча / минимум кода / хирургические правки / задача → проверяемый критерий. Это лучший «поведенческий слой» на рынке (188k ★ за один файл) и он идеально дополняет наш процессный слой.
2. **Professional objectivity из opencode → в шаблон CLAUDE.md**: «несогласие ценнее поддакивания; при неуверенности — сначала проверь, потом соглашайся».
3. **В GUIDE.md, раздел «Арсенал»**: явное правило токен-экономики — на рутину haiku, MCP-гигиена, «не читай файл целиком ради одной функции».

### P2 — новые элементы сета ✅ внедрено 2026-07-07 (п. 4-6 — скиллы /retro, /investigate и фаза задач в /spec; п. 7 — как правило в GUIDE, разбивка по факту роста)
4. **Скилл `/retro`** (идея gstack): еженедельная ретроспектива — что чинилось повторно, какие правила CLAUDE.md сработали/не сработали, что автоматизировать. Замыкает петлю Learn на уровне недели, а не одного бага.
5. **Скилл `/investigate`** (gstack): методология root-cause отладки до внесения правок — парная к нашему `/postmortem` (тот после фикса, этот до).
6. **Эволюция `/spec` в сторону spec-kit**: спека → нумерованный чек-лист задач с критерием проверки у каждой (наш «журнал решений» уже есть, добавить фазу tasks).
7. **Разбивка CLAUDE.md на `.claude/rules/*.md`** при росте: security.md, testing.md, git-workflow.md — паттерн ECC, читается выборочно, не раздувает каждый промпт.

### P3 — на вырост
8. **Память**: попробовать [claude-mem](https://github.com/thedotmack/claude-mem) (автокомпрессия сессий) — согласуется с нашим memory-seed.md.
9. **Security-скилл** на базе [trailofbits/skills](https://github.com/trailofbits/skills) или идей `/cso` из gstack.
10. **Кросс-харнесс**: держать скиллы в формате, портируемом на Codex/OpenCode (superpowers и ECC показывают как) — страховка от привязки к одному инструменту.
11. **Граф кода** (codegraph/graphify) для больших репозиториев — когда разведка scout'ом станет дорогой.

### Где мы уже на уровне (не трогать)
- Петля Spec→…→Learn — соответствует консенсусу лидеров;
- critic со свежим контекстом — ровно то, что делают gstack `/review` и superpowers;
- анти-reward-hacking в ship/test-smith — у большинства сетов этого нет явно, мы впереди;
- принцип MCP-гигиены — совпадает с ECC дословно;
- `/vibe-check` — аналогов не нашёл, наша уникальная фича.

---

## 4. Честный вывод

Ниша «процессный сет для AI-инженера» — самая горячая область на GitHub прямо сейчас (5 репозиториев >100k ★). Наш комплект концептуально совпадает с лидерами (спека до кода, роли, выученные правила, верификация), но лидеры ушли вперёд в **автоматизации петли** (автотриггеры скиллов, инсталлеры, evals) и **токен-экономике** (графы кода, компрессия памяти). «Впереди планеты» нас делают не 24-й скилл, а: (1) карпатиевский поведенческий слой + наша процессная петля в одном комплекте, (2) анти-reward-hacking по умолчанию, (3) русскоязычность — в этой нише конкурентов нет вообще.
