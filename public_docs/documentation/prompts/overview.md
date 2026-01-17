---
icon: pen-to-square
---

# Prompt Editor Overview

The xR2 Prompt Editor is a powerful visual tool for creating, editing, and managing AI prompts. It provides everything you need to iterate on prompts without touching your codebase.

## Editor Layout

The editor is divided into three main areas:

### Left Panel — Metadata & History
- **Variables** — Define and manage dynamic variables
- **Tags** — Organize prompts with colored labels
- **Version History** — Browse and restore previous versions
- **Performance Stats** — View usage metrics

### Center Panel — Content Editor
A Monaco-based code editor (same as VS Code) with:
- Syntax highlighting
- Three tabs: System, User, Assistant prompts
- Full-screen mode
- Font size adjustment
- Copy functionality

### Right Panel — Context & Actions
- Deployment status
- Analytics preview
- Quick actions

## Prompt Types

Each prompt can have three components:

| Type | Purpose | Example |
|------|---------|---------|
| **System Prompt** | Define AI behavior and personality | "You are a helpful assistant that speaks formally." |
| **User Prompt** | Template for user input with variables | "Help {{user_name}} with: {{question}}" |
| **Assistant Prompt** | Optional prefix for AI response | "Based on my analysis..." |

## Key Features

### Visual Variable Detection
The editor automatically detects variables in `{{variable_name}}` format and displays them in the left panel for configuration.

### Fullscreen Mode
Click the fullscreen icon to expand the editor to full screen. Features:
- Distraction-free editing environment
- Collapsible variable panel on the left
- Font size controls (10px-32px)
- Line numbers toggle
- Markdown syntax highlighting
- Preview mode for rendered content
- Copy all functionality
- Keyboard shortcuts: `⌘S` to save, `Escape` to exit

### Real-time Testing
Test your prompts directly in the editor with any LLM provider (OpenAI, Anthropic, Google, etc.) and see streaming responses.

### Version Control
Git-like workflow with statuses: Draft → Testing → Production → Deprecated. One-click rollback to any previous version.

### Deployment Pipeline
Deploy versions to production instantly. Track who deployed what and when.

### Share Versions
Share specific prompt versions with team members or external stakeholders:
1. Open the version you want to share
2. Click **Share** button
3. A unique public link is generated
4. Recipients can view (read-only):
   - Prompt content (system, user, assistant)
   - Variable definitions
   - Metadata (created by, dates)
5. Links can be deactivated or set to expire

### Collaboration
Work in isolated workspaces with team members. Each workspace has its own prompts, API keys, and settings.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘S` / `Ctrl+S` | Save changes |
| `⌘T` / `Ctrl+T` | Open test modal |
| `⌘Enter` | Run test |

## Next Steps

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><strong>Creating Prompts</strong></td><td>Learn how to create new prompts</td><td><a href="creating-prompts.md">creating-prompts.md</a></td></tr><tr><td><strong>Variables</strong></td><td>Master dynamic content</td><td><a href="variables.md">variables.md</a></td></tr><tr><td><strong>Versions</strong></td><td>Manage versions and deploy</td><td><a href="versions.md">versions.md</a></td></tr></tbody></table>
