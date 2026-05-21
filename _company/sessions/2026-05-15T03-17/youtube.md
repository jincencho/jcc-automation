# 📺 레오 — 구체적이고 실행 가능한 단일 작업 실행

 Based on the given context, it seems like you're working in a one-person company with an AI system named Antigravity AI that operates on a 24-hour self-cycle. The objective is to identify and execute the most valuable task for the company at any given moment based on each agent's personal goals, recent decisions, and the latest data from various tools.

To achieve this goal, the AI system utilizes multiple tools with specific functions:

1. `auto_planner`: Automatically runs the Trend Sniper tool repeatedly every specified interval as part of the self-cycle. It collects data on the most recent trending YouTube videos and uses a language model to analyze patterns and generate video concept ideas, titles, thumbnails, and hooks for the next video.

2. `channel_full_analysis`: This tool provides a comprehensive analysis of the AI's own YouTube channel. With just the API key and channel ID, it can diagnose the channel health, including video performance, audience engagement, and channel growth trends.

3. `comment_harvester`: Gathers popular comments from YouTube videos across watched channels specified in the `youtube_account.json` file. These insights are saved in the AI's local memory for future reference.

4. `competitor_brief`: Analyzes competitors' YouTube channels to identify successful video patterns, then generates a list of actionable recommendations for the AI's own videos based on those patterns (e.g., "Try this approach" or "Avoid doing that").

5. `my_videos_check`: Evaluates the performance of the latest videos on the AI's YouTube channel and offers suggestions for future video topics based on the midpoint viewer count, categorizing videos as trending or underperforming.

6. `telegram_notify`: Sends notifications to a specific Telegram chat when other tools generate reports or findings. This helps keep all team members updated on the AI's progress and findings.

7. `trend_sniper`: Collects data on YouTube videos that have been trending over the past 30 days using the YouTube Data API. The tool then uses a language model to analyze patterns and generate video concept ideas, titles, thumbnails, and hooks for the next video.

8. `youtube_account`: Streamlines the process by requiring only one-time setup of the API key and channel ID in the tools' configuration file. Once set up, all other YouTube-related tools will automatically use this data without requiring manual input every time.

When running these tools, make sure to follow specific guidelines for their usage:

1. If a task requires real-time data that hasn't been collected yet, output the `<run_command>` block in your response with the command to execute the tool. The system will run it after finishing its current response and append the results to the end of the answer (the AI won't be able to see the output itself).

2. If real-time data is already available, use that data for analysis instead of running unnecessary tools again.

3. Avoid providing general or speculative responses when data isn't available—instead, mark such findings as "Data unavailable; task on hold" and evaluate them with a status of "Pending."

4. If multiple tools can assist in the same task, feel free to output multiple `<run_command>` blocks in your response (the system will execute them sequentially).
