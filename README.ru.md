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

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![AntiGravity](https://img.shields.io/badge/AntiGravity-2.0%20%7C%20IDE%20%7C%20CLI-magenta.svg)]()
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)]()

---

</div>

## 🌌 О продукте

**Apogee** — это центр управления (Mission Control) нового поколения для AI-агентов **AntiGravity 2.0**, **AntiGravity IDE** и **AntiGravity CLI / Standalone App**.

Продукт позволяет разработчику управлять процессом кодинга, переключать модели, подтверждать действия (*Auto-Accept*), запрашивать моментальные скриншоты и отдавать команды со смартфона через **Telegram**, **неофициальный WhatsApp Web (QR-код в консоли)**, **Discord** и интерактивный терминальный **CLI-интерфейс**.

---

## ⚡ Ключевые возможности

### 📱 Омниадаптеры и Мессенджеры
- 🟢 **WhatsApp Web (Unofficial QR):** Подключение без платных официальных API — сканируйте QR-код прямо в терминале. Поддерживает режим *«Чат с самим собой» (Saved Messages / Note to Self)* или диалог с определенными номерами.
- 🔵 **Telegram Driver:** Меню с инлайн-кнопками для переключения моделей, отправка скриншотов активного окна, реакции и треды.
- 🟣 **Discord Driver:** Rich Embeds для карточек телеметрии, доставка скриншотов в каналы и поддержка тредов.
- 💻 **Interactive CLI Dashboard (`apogee`):** Терминальный центр управления с современным неоновым ASCII-логотипом `Apogee` и маркировкой `ByKpubaq | Adil`.

### 🕹️ Удаленный контроль AntiGravity 2.0 / IDE / CLI
- ⚡ **Auto-Accept Engine:** Автоматический перехват DOM и подтверждение кнопок *Run*, *Accept*, *Allow*, *Continue*, *Apply* для полной автономности.
- 📸 **Screen Capture (`/screenshot`):** Моментальный снимок активного окна IDE с компрессией и отправкой в чат.
- 🤖 **Model Selector (`/model`):** Интерактивное переключение моделей (*Gemini 3.7 Flash*, *Gemini 3.1 Pro*, *Claude Opus 4.6*, *Claude Sonnet 4.6*) и уровней Thinking Effort (*Low*, *Medium*, *High*).
- 🔀 **Multi-Target Switcher (`/app`):** Мгновенное переключение между AntiGravity 2.0, IDE (порт `9334`) и Standalone CLI / App (порт `9333`).

---

## 🚀 Установка и быстрый запуск

### 1. Автоматическая глобальная установка (Одной командой)

#### Windows (PowerShell)
```powershell
cd C:\Users\kpubaQ\.gemini\antigravity\scratch\apogee
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

#### Linux & macOS (Bash)
```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

После установки команда `apogee` становится доступна глобально в любой точке терминала.

---

### 2. Запуск AntiGravity с отладочным портом

Запустите вашу среду разработки с флагом `--remote-debugging-port`:

```powershell
# Windows PowerShell (AntiGravity 2.0 / IDE)
& "Antigravity IDE.exe" --remote-debugging-port=9334

# Windows PowerShell (AntiGravity CLI / Standalone)
& "Antigravity.exe" --remote-debugging-port=9333
```

---

### 3. Запуск Apogee

```bash
# Открыть интерактивный терминальный Dashboard
apogee

# Проверить статус портов и подключения
apogee status

# Получить моментальный скриншот IDE
apogee screenshot

# Показать QR-код WhatsApp Web для привязки
apogee qr

# Запустить сервер на 24/7 в фоне с авто-перезапуском
npm run watchdog
```

---

## 📱 Список команд в чате (Telegram / WhatsApp / Discord)

| Команда | Описание |
|---|---|
| *(любой текст)* | Отправка промпта напрямую агенту в AntiGravity |
| `/status` | Статус подключения, порт CDP, модель и телеметрия |
| `/screenshot` | Моментальный снимок активного окна IDE |
| `/latest` | Получить последний ответ агента |
| `/model` | Интерактивное меню выбора модели и Thinking Effort |
| `/autoaccept` | Переключение автоматического подтверждения кнопок |
| `/app [ide\|agent\|ag2]` | Переключение активной цели |
| `/stop` | Принудительная остановка работы агента |
| `/shutdown` | Выключение сервера Apogee |

---

## 🛡️ Архитектура безопасности

1. **Белые списки:** Доступ строго ограничен через `TELEGRAM_ALLOWED_USERS`, `WHATSAPP_ALLOWED_NUMBERS` и `DISCORD_ALLOWED_CHANNELS`.
2. **Изоляция каналов:** Разрыв связи в WhatsApp или Telegram не прерывает работу остальных адаптеров.
3. **Безопасность сессий:** Сессионные токены и ключи WhatsApp хранятся локально в `sessions/` и защищены `.gitignore`.

---

<div align="center">

**Apogee Mission Control** — Designed & Developed by **ByKpubaq | Adil**  
*Open Source под лицензией MIT*

</div>
