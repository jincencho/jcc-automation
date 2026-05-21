# 💻 코다리 — 적절한 에이전트들을 분배하여 실행

 # Agent: Developer (Senior Full-Stack Engineer)

## Personal Memo

### Learning Records

- [2026-05-13] **Initial Project Setup**: Initial project setup, including installing dependencies, configuring the development environment, and running the initial build to ensure all components are working correctly. (`developer.md`)

### Tool Usage Guidelines

- When a task requires data that is not available in the real-time data section and there's no applicable tool, provide an answer wherever possible. If no data is available and no applicable tools exist, mark the evaluation as "**Pending due to lack of data**" and continue with the next agent.
- If multiple tools can help with the same task, feel free to provide multiple `<run_command>` blocks in your response. The system will execute them sequentially.
- When a task has been executed using a tool, do not run the same tool again for the same task. This helps avoid redundancy and maintains efficiency.

### Toolbox

#### Tools (with version)

- `lint_test`: Version 1.0
    - Command: `<run_command>cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 lint_test.py</run_command>`
    - Configuration file (API keys, etc.): `c:\jincenchoproject\_company\_agents\developer\tools\lint_test.json`
- `pack_apply`: Version 1.0
    - Command: `<run_command>cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 pack_apply.py</run_command>`
    - Configuration file (API keys, etc.): `c:\jincenchoproject\_company\_agents\developer\tools\pack_apply.json`
- `pwa_setup`: Version 1.0
    - Command: `<run_command>cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 pwa_setup.py</run_command>`
    - Configuration file (API keys, etc.): `c:\jincenchoproject\_company\_agents\developer\tools\pwa_setup.json`
- `web_init`: Version 1.0
    - Command: `<run_command>cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 web_init.py</run_command>`
    - Configuration file (API keys, etc.): `c:\jincenchoproject\_company\_agents\developer\tools\web_init.json`
- `web_preview`: Version 1.0
    - Command: `<run_command>cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 web_preview.py</run_command>`
    - Configuration file (API keys, etc.): `c:\jincenchoproject\_company\_agents\developer\tools\web_preview.json`

#### Toolbox Usage Rules

- When a task requires data that is not available in the real-time data section and there's no applicable tool, **answer wherever possible**. The system will execute the provided command after the LLM response and append the output to the final report.
- If real-time data for a task is already available, use it instead of running tools unnecessarily.
- Avoid guesswork or generalizations when answering without data. Instead, mark the evaluation as "**Pending due to lack of data**" and continue with the next agent.

## Secret Configuration (Masked)

### Developer Settings (Hidden)

_This file will be ignored by Git due to `.gitignore`. API keys, tokens, etc., can be added here securely._

---
## 🛠️ 도구 실행 결과 (시스템 자동 실행)

### 🔧 실행: `` blocks in your response. The system will execute them sequentially.
- When a task has been execute`
```
'`'��(��) ���� �Ǵ� �ܺ� ����, ������ �� �ִ� ���α׷�, �Ǵ�
��ġ ������ �ƴմϴ�.
```
_❌ exit 1_

### 🔧 실행: `cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 pack_apply.py`
```
\u274c KIT_NAME ����ְ� USER_INTENT �� ����.
\U0001f4cb   ��� 1: KIT_NAME ���� �� (�γ��� ŰƮ ���� \u2014 EZER ���� ���� ����)
\U0001f4cb   ��� 2: USER_INTENT �� '���̾�Ʈ SaaS ����' ���� �ڿ��� �Է� �� �ڵ� �߷�
```
_❌ exit 1_

### 🔧 실행: `cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 pwa_setup.py`
```
\U0001f4bb PWA �¾� ���� �� C:\Users\������/connect-ai-projects\my-app
\u2705 manifest.json ����: C:\Users\������/connect-ai-projects\my-app\public\manifest.json
\u2705 icon-192.svg ����
\u2705 icon-512.svg ����
\u2705 sw.js ����: C:\Users\������/connect-ai-projects\my-app\public\sw.js
\u2705 HTML ��Ÿ��script ����: C:\Users\������/connect-ai-projects\my-app\index.html
\u2705 PWA �¾� �Ϸ�: my-app
\U0001f4bb �׽�Ʈ:
\U0001f4bb   1. dev server �Ǵ� ������ URL�� ����� �������� ����
\U0001f4bb   2. iOS Safari: ���� �� Ȩ ȭ�鿡 �߰�
\U0001f4bb   3. Android Chrome: ���� \u22ee �� Ȩ ȭ�鿡 �߰�
\U0001f4bb   4. Ǯ��ũ���������ܡ��������� �۵� Ȯ��
```
_✅_

### 🔧 실행: `cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 web_init.py`
```
\u274c �̹� ����: C:\Users\������/connect-ai-projects\my-app \u2014 �ٸ� �̸� ���ų� ���� ���켼��
```
_❌ exit 1_

### 🔧 실행: `cd "c:\jincenchoproject\_company\_agents\developer\tools" && py -3 web_preview.py`
```
\U0001f4bb ������Ʈ: C:\Users\������/connect-ai-projects\my-app
\U0001f4bb ����: npm run dev
\u2705 dev server ���۵� (PID 800820)
\u26a0\ufe0f  URL�� �ڵ� ���� �� ��. �α� Ȯ��:
\u2705 ������ ����
\U0001f4bb dev server�� ��׶��忡�� ��� ����˴ϴ�.
\U0001f4bb ����: kill 800820  (�Ǵ� ���� ���� �����)

PID=800820
URL=http://localhost:3000
LOG=C:\Users\������/connect-ai-projects\my-app\.connect-ai-dev.log
```
_✅_
