# 🎙️ WhatsApp Voice Translator Bot

An AI-powered WhatsApp bot that transcribes voice notes in any language and translates them interactively — deployed on a cloud server and running 24/7.

---

## 🧠 The Problem

Language barriers make communication difficult — especially over WhatsApp, where voice notes are the primary way people communicate in many regions. There was no easy, in-chat way to understand voice messages sent in a foreign language without leaving the app.

This bot solves that by sitting quietly inside WhatsApp, intercepting voice notes, and returning both a transcription and an interactive translation menu — all within the same chat.

---

## 🚀 Demo

Send a voice note in any language and the bot replies instantly:

```
━━━━━━━━━━━━━━━━━━
🇬🇧 Original (EN)
━━━━━━━━━━━━━━━━━━

Hello, how are you doing today?

🌐 Translate to:
─────────────────
1. 🇬🇧  English
2. 🇩🇪  German
3. 🇫🇷  French
4. 🇸🇦  Arabic
5. 🇺🇦  Ukrainian
─────────────────
Reply with a number to translate
```

Reply with `2` and get:

```
━━━━━━━━━━━━━━━━━━
🇩🇪 German Translation
━━━━━━━━━━━━━━━━━━

Hallo, wie geht es dir heute?
```

---

## ⚙️ How It Works

```
Voice Note → Groq Whisper (transcription) → Claude AI (translation) → WhatsApp Reply
```

1. User sends a voice note in any language
2. Bot downloads and transcribes the audio using **Groq Whisper Large v3**
3. **Claude AI** detects the language automatically
4. Bot replies with the transcription and an interactive language menu
5. User replies with a number to select their target language
6. **Claude AI** translates and replies — user can request multiple translations from the same voice note

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **WhatsApp Integration** | whatsapp-web.js (Puppeteer) |
| **Speech-to-Text** | Groq Whisper Large v3 |
| **Language Detection** | Anthropic Claude (claude-sonnet-4) |
| **Translation** | Anthropic Claude (claude-sonnet-4) |
| **Runtime** | Node.js |
| **Process Management** | PM2 |
| **Cloud Hosting** | DigitalOcean (Ubuntu 24.04) |
| **Secret Management** | dotenv |

---

## 🌍 Supported Languages

- 🇬🇧 English
- 🇩🇪 German
- 🇫🇷 French
- 🇸🇦 Arabic
- 🇺🇦 Ukrainian
- 🌍 Any language for transcription (Whisper auto-detects)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- A Groq API key — [console.groq.com](https://console.groq.com) (free)
- An Anthropic API key — [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/whatsapp-voice-translator
cd whatsapp-voice-translator

# Install dependencies
npm install

# Install Chrome for Puppeteer
node_modules/.bin/puppeteer browsers install chrome

# Create your .env file
cp .env.example .env
# Add your API keys to .env
```

### Environment Variables

Create a `.env` file:

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
GROQ_API_KEY=your_groq_key_here
```

### Run Locally

```bash
node index.js
```

Scan the QR code that appears with WhatsApp → Linked Devices → Link a Device.

### Deploy to Server (24/7)

```bash
# Install PM2
npm install -g pm2

# Start the bot
pm2 start index.js --name wa-translator
pm2 save
pm2 startup
```

---

## 🏗️ Project Structure

```
whatsapp-voice-translator/
├── index.js          # Main bot logic
├── .env              # API keys (never commit this)
├── .env.example      # Example env file
├── package.json
└── README.md
```

---

## 🔑 Key Engineering Decisions

**Why Groq over OpenAI Whisper?**
Groq offers Whisper Large v3 for free with very low latency — ideal for a real-time messaging bot where response speed matters.

**Why Claude over a translation API (e.g. DeepL)?**
Claude handles both language detection and translation in a single model, with the flexibility to handle edge cases, informal speech, and mixed-language messages that rigid translation APIs often struggle with.

**Why whatsapp-web.js?**
It mirrors the official WhatsApp Web interface, requiring no business account or Meta API approval — making it accessible for personal and small-scale use.

---

## ⚠️ Disclaimer

This project uses whatsapp-web.js which automates WhatsApp Web. Use responsibly and in accordance with WhatsApp's Terms of Service. This bot is intended for personal use.

---

## 📄 License

MIT License — feel free to fork and build on this.

---

## 👤 Author

Built by [Your Name] — AI/ML Engineer
