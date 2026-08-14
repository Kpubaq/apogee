<div align="center">

```
    ___    ____  ____  ______ ______ ______
   /   |  / __ \/ __ \/ ____// ____// ____/
  / /| | / /_/ / / / / / __ / __/  / __/   
 / ___ |/ ____/ /_/ / /_/ // /___ / /___   
/_/  |_/_/    \____/\____//_____//_____/   
```

### 🛰️ Универсальный центр управления (Mission Control) для AntiGravity 2.0 / IDE / CLI
**Автор: ByKpubaq | Adil**

🌍 **Языки:** [English](README.md) | [Русский](README.ru.md)

[![License: Apogee Non-Commercial](https://img.shields.io/badge/License-Apogee_Non--Commercial-blueviolet.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![AntiGravity](https://img.shields.io/badge/AntiGravity-2.0%20%7C%20IDE%20%7C%20CLI-magenta.svg)]()
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)]()

---

</div>

## 🌌 О продукте

**Apogee** — это центр управления (Mission Control) нового поколения для AI-агентов **AntiGravity 2.0**, **AntiGravity IDE** и **AntiGravity CLI / Standalone App**.

Продукт позволяет разработчику удаленно управлять процессом кодинга, переключать модели, подтверждать действия (*Auto-Accept*), запрашивать моментальные скриншоты и отдавать команды со смартфона через **Telegram**, **Discord** и интерактивный терминальный **CLI-интерфейс**.

---

## ⚡ Ключевые возможности

### 📱 Омниадаптеры и Мессенджеры
- 🔵 **Telegram Driver:** Меню с инлайн-кнопками для переключения моделей, отправка скриншотов активного окна, реакции и треды.
- 🟣 **Discord Driver:** Rich Embeds для карточек телеметрии, доставка скриншотов в каналы и поддержка тредов.
- 💻 **Interactive CLI Dashboard (`apogee`):** Терминальный центр управления 2026 года с неоновым ASCII-логотипом `Apogee` и маркировкой `ByKpubaq | Adil`.

### 🕹️ Удаленный контроль AntiGravity 2.0 / IDE / CLI
- ⚡ **Auto-Accept Engine:** Автоматический перехват DOM и подтверждение кнопок *Run*, *Accept*, *Allow*, *Continue*, *Apply* для полной автономности.
- 📸 **Screen Capture (`/screenshot`):** Моментальный снимок активного окна IDE с компрессией и отправкой в чат.
- 🤖 **Model Selector (`/model`):** Интерактивное переключение моделей (*Gemini 3.7 Flash*, *Gemini 3.1 Pro*, *Claude Opus 4.6*, *Claude Sonnet 4.6*) и уровней Thinking Effort.
- 📂 **Управление проектами (`/create`, `/open`, `/projects`):** Создание и инициализация новых проектов или переключение воркспейса прямо из чата или CLI.
- 🔀 **Multi-Target Switcher (`/app`):** Мгновенное переключение между AntiGravity 2.0, IDE (порт `9334`) и Standalone CLI / App (порт `9333`).

---

## 🚀 Установка в одну команду (Без скачивания репозитория)

Вам **не нужно** вручную скачивать или клонировать репозиторий. Достаточно вставить одну команду в терминал:

### 🪟 Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/Kpubaq/apogee/main/scripts/install.ps1 | iex
```

### 🍎 macOS / 🐧 Linux (Терминал)
```bash
curl -fsSL https://raw.githubusercontent.com/Kpubaq/apogee/main/scripts/install.sh | bash
```

### 📦 Через NPM (Глобально)
```bash
npm install -g github:Kpubaq/apogee
```

*(Требуется установленный [Node.js](https://nodejs.org) v18+)*

---

### Альтернатива: Мгновенный запуск через NPX (Без установки)

```bash
npx github:Kpubaq/apogee
```

---

## 🕹️ Запуск AntiGravity с отладочным портом

Запустите вашу среду разработки с флагом `--remote-debugging-port`:

```powershell
# Windows PowerShell (AntiGravity 2.0 / IDE)
& "Antigravity IDE.exe" --remote-debugging-port=9334

# Windows PowerShell (AntiGravity CLI / Standalone)
& "Antigravity.exe" --remote-debugging-port=9333
```

```bash
# macOS
open -a "Antigravity IDE" --args --remote-debugging-port=9334

# Linux
antigravity-ide --remote-debugging-port=9334
```

---

## 💻 Команды CLI

После установки команда `apogee` доступна глобально в любом терминале:

```bash
# Открыть интерактивный терминальный Dashboard (меню проектов, статуса, скриншотов)
apogee

# Создать новый проект в AntiGravity и открыть его
apogee create my_awesome_app

# Открыть существующую папку/проект в AntiGravity
apogee open C:\Projects\my_existing_app

# Список проектов в ~/AntiGravityProjects
apogee projects

# Проверить статус портов и подключения
apogee status

# Получить моментальный скриншот IDE
apogee screenshot

# Запустить сервер на 24/7 в фоне с авто-перезапуском
npm run watchdog
```

---

## 📱 Список команд в чате (Telegram / Discord)

| Команда | Описание |
|---|---|
| *(любой текст)* | Отправка промпта напрямую агенту в AntiGravity |
| `/create <имя>` | Создать новый проект в AntiGravity и открыть его |
| `/open <путь>` | Открыть существующий воркспейс/папку в AntiGravity |
| `/projects` | Список проектов в рабочей директории проектов |
| `/status` | Статус подключения, порт CDP, модель и телеметрия |
| `/screenshot` | Моментальный снимок активного окна IDE |
| `/latest` | Получить последний ответ агента |
| `/model` | Интерактивное меню выбора модели и Thinking Effort |
| `/autoaccept` | Переключение автоматического подтверждения кнопок |
| `/app [ide\|agent\|ag2]` | Переключение активной цели |
| `/stop` | Принудительная остановка работы агента |
| `/shutdown` | Выключение сервера Apogee |

---

## 📄 Лицензия и условия использования

Проект распространяется на условиях лицензии **Apogee Non-Commercial License (Версия 1.0)**:

- **Разрешено:** Свободно использовать, изучать, модифицировать и распространять код проекта для личных, образовательных, исследовательских и некоммерческих целей.
- **Обязательные условия:**
  - **Указание авторства (Attribution Required):** Вы обязаны сохранять уведомления об авторских правах и явно указывать оригинального автора (**ByKpubaq | Adil**) с прямой ссылкой на репозиторий [Apogee](https://github.com/Kpubaq/apogee).
  - **Только некоммерческое использование (Non-Commercial Only):** Запрещено любое коммерческое использование, монетизация, интеграция в платные SaaS-сервисы или продажа без предварительного письменного разрешения правообладателя.

---

<div align="center">

**Apogee Mission Control** — Разработано **ByKpubaq | Adil**  
*Лицензия: Apogee Non-Commercial License 1.0*

</div>
