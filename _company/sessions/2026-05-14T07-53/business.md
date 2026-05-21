# 💼 현빈 — 최근 의사결정 및 목표를 바탕으로 우선순위 높은 단일 작업 찾기

 Here's a summary of the data provided:

1. The system is designed to operate as a collection of autonomous agents, each with its own purpose and tasks. In this case, we have four agents: Researcher, Designer, Marketer, and CEO. Each agent has a specific role and set of tasks to perform in order to achieve the overall goal of the company.

2. The system uses various tools for data collection and analysis. For example, the Researcher agent uses tools for trend analysis and competitor research, while the Designer agent uses tools for design and prototyping. Each agent has its own configuration files (e.g., settings, API keys) that are not shared with other agents or made publicly available.

3. The system generates reports and updates a shared knowledge base with the results of each agent's work. This knowledge base can be used by other agents for reference and further analysis. For example, the CEO agent uses the knowledge base to make informed decisions about prioritizing tasks and assigning them to appropriate agents.

4. The system also includes a personal memory for each agent, where they can store notes, insights, and other information that is specific to their role or work. This memory is not shared with other agents and serves as a private workspace for each agent.

5. The system is designed to operate continuously, with each agent taking turns in performing its tasks based on the overall goal of the company. The system can also handle multiple instances of the same task if necessary, but it's important to ensure that each instance produces unique results and does not simply repeat previous work.

6. The system uses a specific markdown syntax for creating files, which allows agents to easily create, update, and share files within the system. This syntax is also used for generating reports and adding entries to the shared knowledge base.

7. The system includes a mechanism for securely storing sensitive information such as API keys and other configuration details that should not be exposed publicly. These details are stored in separate files (e.g., `.gitignore` on Git) that are excluded from version control and not accessible to other agents or users.

8. The system is designed to run continuously, with each agent taking turns in performing its tasks based on the overall goal of the company. If a tool is needed for a specific task and there isn't any available data yet, the agent should output a `<run_command>` block containing the command to execute the tool, so that the system can run it after generating the LLM response (since the LLM won't have access to the output). If data is already available, the agent should use it instead of running unnecessary tools.

9. The system allows users to provide additional details about each agent, such as their personality traits, preferences, and examples of their work. These details are stored in a separate file and automatically loaded into the LLM's context at runtime.

10. The system includes a mechanism for securely storing sensitive information such as API keys and other configuration details that should not be exposed publicly. These details are stored in separate files (e.g., `.gitignore` on Git) that are excluded from version control and not accessible to other agents or users.

In summary, the system is a collection of autonomous agents that work together to achieve the overall goal of the company. Each agent has its own role, tools, and private workspace, and they collaborate by sharing data and insights through a shared knowledge base. The system is designed to operate continuously, with each agent taking turns in performing its tasks based on the overall goal of the company. Sensitive information is stored securely and not exposed publicly.
