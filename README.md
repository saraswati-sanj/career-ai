# CareerAI — Intelligent AI Job Assistant 🤖

<div align="center">

![CareerAI Banner](https://img.shields.io/badge/CareerAI-v1.0-7c3aed?style=for-the-badge&logo=robot&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**An AI-powered career companion that helps you land your dream job.**  
*Resume writing • Interview prep • Salary negotiation • Career growth*

[🚀 Live Demo](https://career-ai-virid-six.vercel.app) • [📖 Features](#features) • [⚡ Quick Start](#quick-start) • [🤖 AI Setup](#connecting-open-source-ai)

</div>

---

## ✨ Overview

**CareerAI** is a fully client-side, open-source AI job assistant that runs entirely in your browser. It provides intelligent, actionable career guidance powered by:

- 🧠 **Built-in intelligent Q&A engine** — works instantly with zero configuration, covering **40+ job topics**
- ⚡ **Open-source AI mode** — optionally connect a free [HuggingFace](https://huggingface.co) token to use real LLMs like **Mistral-7B**, **Zephyr-7B**, **Llama 3**, or **Phi-3**

---

## 🎯 Features

| Feature | Description |
|---|---|
| 💬 **Chat Interface** | Real-time chat with animated typing indicator |
| 🧠 **Built-in Engine** | 40+ job Q&A covering all career topics — no API key needed |
| 🤖 **Open-Source AI** | Connect Mistral-7B, Zephyr-7B, Llama 3, or Phi-3 via HuggingFace (free) |
| 📄 **Resume Help** | ATS optimization, resume mistakes, structure advice |
| 🎯 **Interview Prep** | STAR method, common questions, body language tips |
| 💰 **Salary Guide** | Negotiation scripts, market research, total comp strategy |
| 🔗 **LinkedIn Tips** | Profile optimization, recruiter attraction, engagement |
| ✉️ **Cover Letters** | Structure, hooks, personalization strategies |
| 🔄 **Career Switch** | Transferable skills, transition roadmap, bridge roles |
| 🚀 **Career Growth** | Promotion strategies, visibility, mentoring |
| 📋 **Copy Responses** | One-click copy any AI response to clipboard |
| 💾 **Export Chat** | Download full conversation as a text file |
| 📱 **Responsive** | Works beautifully on mobile, tablet & desktop |
| 🌙 **Dark Mode UI** | Premium glassmorphism dark design |

---

## 🖥️ Screenshots

> *Premium dark glassmorphism interface with animated chat, sidebar navigation, and quick-prompt cards.*

---

## ⚡ Quick Start

### Option 1: Open Directly (No Install)

```bash
# Clone the repo
git clone https://github.com/saraswati-sanj/career-ai.git
cd career-ai

# Open in browser
open index.html       # macOS
start index.html      # Windows
xdg-open index.html   # Linux
```

### Option 2: Live Demo

Visit the deployed version: **[career-ai-virid-six.vercel.app](https://career-ai-virid-six.vercel.app)**

---

## 🤖 Connecting Open-Source AI

By default, CareerAI uses its built-in intelligent engine and requires **no API key**.  
To unlock full LLM responses using open-source models:

### Step 1 — Get a Free HuggingFace Token
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a **New Token** → Select **Read** access → Copy the token (`hf_xxxxx...`)

### Step 2 — Connect in the App
1. Click **"⚡ Connect AI"** in the app header (or sidebar)
2. Paste your HuggingFace token
3. Select your preferred model
4. Click **"Save & Connect"**

> ✅ Your token is stored locally in `localStorage` — never sent anywhere except HuggingFace's API.

### Available Open-Source Models

| Model | Provider | Best For |
|---|---|---|
| **Mistral-7B-Instruct-v0.2** ⭐ | Mistral AI | Best overall quality |
| Zephyr-7B-Beta | HuggingFace H4 | Conversational responses |
| Llama 3.2 3B Instruct | Meta | Faster, lightweight |
| Phi-3 Mini 4K Instruct | Microsoft | Efficient & compact |

---

## 📂 Project Structure

```
career-ai/
├── index.html       # Main application shell (semantic HTML5)
├── style.css        # Dark glassmorphism design system
├── app.js           # AI engine, HuggingFace API, fallback Q&A
├── vercel.json      # Vercel deployment configuration
└── README.md        # Project documentation
```

---

## 🧠 Built-in Q&A Topics

The built-in engine handles 40+ job-related question categories — no internet required:

<details>
<summary>Click to expand all topics</summary>

- ✅ Resume writing & structure
- ✅ ATS optimization tips
- ✅ Top resume mistakes to avoid
- ✅ Common interview questions
- ✅ STAR method explained
- ✅ Interview tips & body language
- ✅ Salary negotiation scripts
- ✅ How to answer "salary expectations"
- ✅ LinkedIn profile optimization
- ✅ Cover letter structure & hooks
- ✅ Career switching strategies
- ✅ Transferable skills
- ✅ Job search strategy
- ✅ Networking tips
- ✅ Career growth & promotions
- ✅ Remote job search
- ✅ Freelancing guide
- ✅ First job / fresher advice
- ✅ Top in-demand skills (2025)
- ✅ CV vs Resume difference
- ✅ Handling job rejection
- ✅ Soft skills employers want
- ✅ Informational interviews
- ✅ Personal branding

</details>

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

**Option A — Vercel Dashboard (Easiest)**
1. Fork this repository
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your forked GitHub repo
4. Click **Deploy** — done! ✅

**Option B — Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Option C — GitHub Auto-Deploy**  
Connect your GitHub repo to Vercel → every push to `main` auto-deploys.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **HTML5** | Semantic app structure |
| **CSS3** | Glassmorphism, animations, responsive layout |
| **Vanilla JavaScript** | Chat engine, API calls, fallback Q&A |
| **HuggingFace Inference API** | Open-source LLM integration |
| **Vercel** | Static site hosting & CDN |

> **No frameworks, no build step, no dependencies.** Pure web standards.

---

## 🔒 Privacy & Security

- ✅ **No data stored on servers** — everything runs client-side
- ✅ **API token stored in `localStorage`** — stays in your browser
- ✅ **No tracking or analytics** by default
- ✅ **Open-source** — inspect every line of code

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/career-ai.git
cd career-ai

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add .
git commit -m "feat: add your feature"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

### Ideas for Contributions
- Add more Q&A topics to the built-in engine
- Add voice input support
- Add resume builder tool
- Add job description analyzer
- Integrate more AI models

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.  
Free to use, modify, and distribute.

---

## 👤 Author

**Sanjana Saraswathi**  
📧 sanjanasaraswathir@gmail.com  
🔗 [GitHub](https://github.com/saraswati-sanj)

---

<div align="center">

Made with ❤️ to help job seekers worldwide  
⭐ Star this repo if it helped you!

</div>
