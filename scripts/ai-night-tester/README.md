# 🌙 AI Night Tester

Autonomous testing agent powered by **Gemma** (via Ollama) that tests DooDates overnight and generates detailed reports.

## Quick Start

### Prerequisites

1. **Ollama** installed and running:
   ```bash
   # Install: https://ollama.com/download
   ollama serve
   ```

2. **Gemma model** downloaded:
   ```bash
   ollama pull gemma2:7b-instruct
   ```

3. **DooDates app** running locally:
   ```bash
   npm run dev
   ```

### Run

```bash
# Full night test (8 hours)
npx ts-node scripts/ai-night-tester/run-night-test.ts

# Quick test (5 minutes)
npx ts-node scripts/ai-night-tester/run-night-test.ts --debug

# Custom duration
npx ts-node scripts/ai-night-tester/run-night-test.ts --duration 30m
npx ts-node scripts/ai-night-tester/run-night-test.ts --duration 2h
```

### Stop

Press `Ctrl+C` to stop gracefully - the report will still be generated.

## Reports

Reports are saved to: `scripts/ai-night-tester/reports/`

Each report includes:
- 📊 Summary statistics (pages visited, actions taken, issues found)
- 🐛 Detailed issues with screenshots
- 📍 Reproduction steps for each issue
- 🤖 AI analysis and suggestions

## Configuration

Edit `ai-night-tester.config.ts` to customize:
- Ollama model
- Test duration
- Priority routes
- Behavior settings

## Architecture

```
┌─────────────────────────────────────────────┐
│               Orchestrator                  │
│     (main loop, error recovery)            │
├───────────────┬─────────────┬──────────────┤
│  Gemma Brain  │  Browser    │   Report     │
│   (Ollama)    │  Controller │  Generator   │
│   decisions   │  (Playwright)│   (.md)     │
└───────────────┴─────────────┴──────────────┘
```
