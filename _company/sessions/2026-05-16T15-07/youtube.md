# 📺 레오 — 구체적이고 실행 가능한 한국어 지시

 In this session, we have multiple AI agents collaborating to manage a one-person company named Jincencho that aims to help people find apartments. Here's an overview of the roles and responsibilities:

1. **CEO**: The overall mission and strategy for the company.
2. **Researcher**: Conducting research, analyzing data, and providing insights to support the company's goals.
3. **YouTube**: Managing the company's YouTube channel, creating videos, and monitoring performance.
4. **Writer**: Writing content for the company blog, social media, and other marketing materials.
5. **Designer**: Designing visual assets like logos, banners, and promotional materials.
6. **Developer**: Building and maintaining the company website and any necessary software applications.
7. **Analyst**: Analyzing data from various sources to gain insights and make informed decisions for the company.
8. **Assistant**: Providing administrative support, scheduling meetings, and managing daily tasks.
9. **Secretary**: Managing communications, responding to emails, and maintaining records.
10. **Marketing Coordinator**: Developing and executing marketing strategies to increase brand awareness and drive sales.
11. **Legal Advisor**: Providing legal advice and ensuring compliance with relevant regulations.

Each agent has personal goals that align with the company's mission. They communicate regularly, using a specific channel, and maintain a positive attitude towards customers. They also have access to a Graph RAG (Related Artifacts Graph) system to organize and connect relevant information.

The Researcher agent was tasked with finding the most urgent single task for the company by reviewing recent decisions, personal goals, and company objectives. After identifying a high-value task, they assigned it to appropriate agents and monitored its progress.

Here's an example of a command issued by the original user:

[자율 사이클 — 2026-05-16] 1인 기업 24시간 운영 중. 회사 목표·각 에이전트의 개인 목표(_agents/{id}/goal.md)·최근 의사결정·메모리를 검토해서 지금 가장 가치 있는 단일 작업 1개를 결정하고, 적절한 1~2명 에이전트에게 분배해서 실행하세요. 같은 산출물을 반복하지 마세요 — 메모리에 비슷한 항목이 24시간 내에 있으면 다른 각도로 진전시키세요.

Translation: [Autonomous cycle — May 16, 2026] Operating a one-person company for 24 hours. Review the company goals, each agent's personal goals (_agents/{id}/goal.md), recent decisions, and memory to determine the most valuable single task at the moment. Assign it to suitable agents and execute it. Do not repeat the same output; if similar items appear in the memory within 24 hours, evolve them from different angles.
