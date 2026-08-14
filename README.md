<div align="center">

```
    ___    ____  ____  ______ ______ ______
   /   |  / __ \/ __ \/ ____// ____// ____/
  / /| | / /_/ / / / / / __ / __/  / __/   
 / ___ |/ ____/ /_/ / /_/ // /___ / /___   
/_/  |_/_/    \____/\____//_____//_____/   
```

### 🛰️ Universal Mission Control for AntiGravity 2.0 / IDE / CLI
**Created by ByKpubaq | Adil**

🌍 **Languages:** [English](README.md) | [Русский](README.ru.md)

[![License: Apogee Non-Commercial](https://img.shields.io/badge/License-Apogee_Non--Commercial-blueviolet.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()
[![AntiGravity](https://img.shields.io/badge/AntiGravity-2.0%20%7C%20IDE%20%7C%20CLI-magenta.svg)]()
[![Version](https://img.shields.io/badge/Version-2.0.0-orange.svg)]()

---

</div>

## 🌌 Overview

**Apogee** is a next-generation autonomous Mission Control suite designed for **AntiGravity 2.0**, **AntiGravity IDE**, and **AntiGravity CLI / Standalone App**.

It allows developers to remotely pilot their coding agent, switch AI models, confirm actions (*Auto-Accept*), request instant IDE screenshots, and dispatch tasks from their smartphone via **Telegram**, **Unofficial WhatsApp Web (terminal QR-code)**, **Discord**, and an interactive terminal **CLI Dashboard**.

---

## ⚡ Key Features

### 📱 Omnichannel Adapters
- 🟢 **WhatsApp Web (Unofficial QR Terminal):** Connect without paid official APIs by simply scanning the QR code in your console. Supports *Self-Chat (Note to Self / Saved Messages)* or specific whitelisted phone numbers.
- 🔵 **Telegram Driver:** Inline keyboard buttons for model selection, instant IDE screenshots, generation progress reactions, and threads.
- 🟣 **Discord Driver:** Rich Embed cards with real-time telemetry, channel streaming, and screenshot delivery.
- 💻 **Interactive CLI Dashboard (`apogee`):** Rich terminal control center featuring neon ASCII branding with `ByKpubaq | Adil`.

### 🕹️ Full Remote Control for AntiGravity 2.0 / IDE / CLI
- ⚡ **Auto-Accept Engine:** Automated DOM observer that clicks *Run*, *Accept*, *Allow*, *Continue*, and *Apply* buttons for seamless autonomous loops.
- 📸 **Screen Capture (`/screenshot`):** Instant IDE viewport capture compressed and delivered directly to your chat.
- 🤖 **Model Selector (`/model`):** Live model and Thinking Effort tier switching (*Gemini 3.7 Flash*, *Gemini 3.1 Pro*, *Claude Opus 4.6*, *Claude Sonnet 4.6*).
- 🔀 **Multi-Target Switcher (`/app`):** Real-time hot-switching between AntiGravity 2.0 / IDE (port `9334`) and Standalone CLI / App (port `9333`).

---

## 🚀 Installation & Quick Start

### 1. Global Installation (One-Command Setup)

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

After installation, the `apogee` CLI command is registered globally on your system.

---

### 2. Launch AntiGravity with Debugging Port

Launch your target environment with `--remote-debugging-port`:

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

### 3. Launching Apogee

```bash
# Open interactive terminal Dashboard
apogee

# Check CDP ports and connection status
apogee status

# Capture an instant IDE screenshot
apogee screenshot

# Display terminal WhatsApp Web pairing QR code
apogee qr

# Run 24/7 background supervisor with auto-restart
npm run watchdog
```

---

## 📱 Chat Commands (Telegram / WhatsApp / Discord)

| Command | Description |
|---|---|
| *(any text)* | Dispatch prompt directly to the AntiGravity agent |
| `/status` | Connection telemetry, active target port, and model status |
| `/screenshot` | Capture and receive a screenshot of the active IDE window |
| `/latest` | Retrieve the latest response from the agent |
| `/model` | Interactive menu for model & thinking effort selection |
| `/autoaccept` | Toggle automatic button confirmation on/off |
| `/app [ide\|agent\|ag2]` | Switch active target between 2.0, IDE, and CLI |
| `/stop` | Abort current agent generation |
| `/shutdown` | Gracefully shut down Apogee server |

---

## 🛡️ Security Architecture

1. **Whitelisting:** Access is strictly controlled via `TELEGRAM_ALLOWED_USERS`, `WHATSAPP_ALLOWED_NUMBERS`, and `DISCORD_ALLOWED_CHANNELS`.
2. **Channel Isolation:** Network hiccups on WhatsApp or Telegram do not disrupt the other active channels.
3. **Session Privacy:** WhatsApp auth credentials and secrets remain local in `sessions/` and are guarded by `.gitignore`.

---

## ⚠️ Disclaimer & Limitation of Liability

> [!WARNING]
> **Unofficial API & Third-Party Terms of Service Notice:**
> - **Apogee** is an independent, open-source tool and is **NOT** affiliated, associated, authorized, endorsed by, or in any way officially connected with **Meta Platforms, Inc.**, **WhatsApp**, **Telegram FZ-LLC**, **Discord Inc.**, or **Google LLC**.
> - The WhatsApp integration utilizes reverse-engineered / unofficial web automation protocols. Using automated tools or bots with personal or business WhatsApp accounts may violate WhatsApp's Terms of Service and can result in account limitations, temporary suspensions, or **permanent phone number bans** by Meta.
> - **User Bears 100% Responsibility:** The author (**ByKpubaq | Adil**) and contributors bear **NO responsibility or liability** for any account bans, suspensions, data loss, or service terminations resulting from your use of this software. You use this software strictly at your own discretion and risk.

---

## 📄 License & Attribution

This project is licensed under the **Apogee Non-Commercial License (Version 1.0)**.

- **You are free to:** Share, copy, redistribute, remix, transform, and build upon this software for personal, research, and non-commercial open-source use.
- **Under the following terms:**
  - **Attribution Required:** You must prominently retain copyright notices and give clear attribution to the original author (**ByKpubaq | Adil**) with a direct link to the [Apogee repository](https://github.com/Kpubaq/apogee).
  - **Non-Commercial Only:** You may **not** use the software or derivative works for commercial purposes, monetization, paid SaaS services, or proprietary distribution without prior explicit written permission from the copyright holder.

---

<div align="center">

**Apogee Mission Control** — Designed & Developed by **ByKpubaq | Adil**  
*Licensed under Apogee Non-Commercial License 1.0*

</div>
