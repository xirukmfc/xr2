"use client"

import { Article } from "../article"
import { useLocale } from "@/contexts/locale-context"

export function LangfuseAlternativeContent() {
  const { locale } = useLocale()
  const en = locale === 'en'

  return (
    <Article
      title={en ? "xR2 vs Langfuse, PromptLayer & Alternatives" : "xR2 vs Langfuse, PromptLayer и альтернативы"}
      subtitle={en
        ? "Different tools solve different problems. Here's where xR2 fits — and where it doesn't."
        : "Разные инструменты решают разные задачи. Вот где место xR2 — и где его нет."}
      readTime={en ? "6 min" : "6 мин"}
      slug="langfuse-alternative"
      relatedLinks={en
        ? [
            { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
            { href: "/blog/prompt-versioning", label: "Prompt Version Control" },
            { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
          ]
        : [
            { href: "/blog/prompt-ab-testing", label: "A/B тесты промптов" },
            { href: "/blog/prompt-versioning", label: "Версионирование промптов" },
            { href: "/blog/n8n-prompt-management", label: "Промпты в n8n" },
          ]}
    >
      <h2>{en ? "The LLM Tooling Landscape" : "Ландшафт инструментов для LLM"}</h2>
      <p>
        {en
          ? <>If you&apos;ve searched for &quot;prompt management&quot; you&apos;ve probably found tools like Langfuse, PromptLayer, Helicone, and others. They&apos;re all in the LLM tooling space, but they solve fundamentally different problems. Let&apos;s break down what each does and where xR2 fits.</>
          : <>Если вы искали «управление промптами», то наверняка находили инструменты вроде Langfuse, PromptLayer, Helicone и другие. Все они работают в сфере LLM-инструментов, но решают принципиально разные задачи. Разберём, что делает каждый из них и где место xR2.</>}
      </p>

      <h2>{en ? "Langfuse: LLM Observability Platform" : "Langfuse: платформа обсервабилити для LLM"}</h2>
      <p>
        <strong>{en ? "What it does:" : "Что делает:"}</strong>{" "}
        {en
          ? "Langfuse is an open-source LLM observability platform. It traces LLM calls, logs inputs/outputs, tracks latency, token usage, and costs. It also includes a prompt management feature."
          : "Langfuse — это open-source платформа обсервабилити для LLM. Она отслеживает вызовы LLM, логирует входы/выходы, мониторит задержки, использование токенов и расходы. Также включает функцию управления промптами."}
      </p>
      <p>
        <strong>{en ? "Built for:" : "Создан для:"}</strong>{" "}
        {en
          ? "Developers building custom LLM applications who need detailed tracing and debugging."
          : "Разработчиков, создающих кастомные LLM-приложения, которым нужна детальная трассировка и отладка."}
      </p>
      <p>
        <strong>{en ? "Key difference from xR2:" : "Ключевое отличие от xR2:"}</strong>{" "}
        {en
          ? <>Langfuse is developer-first. It requires code instrumentation — you wrap your LLM calls with Langfuse&apos;s SDK to collect traces. It&apos;s powerful for debugging complex LLM chains, but it assumes you&apos;re writing code.</>
          : <>Langfuse ориентирован на разработчиков. Он требует инструментирования кода — вы оборачиваете вызовы LLM в SDK Langfuse для сбора трейсов. Это мощный инструмент для отладки сложных цепочек LLM, но он подразумевает, что вы пишете код.</>}
      </p>
      <p>
        {en
          ? <>If your team uses n8n, Make.com, or other no-code platforms, Langfuse doesn&apos;t integrate natively. There&apos;s no n8n node, no Make.com module, no Zapier action.</>
          : <>Если ваша команда использует n8n, Make.com или другие no-code платформы, Langfuse не интегрируется нативно. Нет ноды для n8n, нет модуля для Make.com, нет действия для Zapier.</>}
      </p>

      <h2>{en ? "PromptLayer: Prompt Logging & Versioning" : "PromptLayer: логирование и версионирование промптов"}</h2>
      <p>
        <strong>{en ? "What it does:" : "Что делает:"}</strong>{" "}
        {en
          ? "PromptLayer acts as a middleware between your app and the LLM API. It logs every prompt request and response, provides versioning, and lets you manage prompts in a dashboard."
          : "PromptLayer выступает прослойкой между вашим приложением и API LLM. Он логирует каждый запрос и ответ, предоставляет версионирование и позволяет управлять промптами через дашборд."}
      </p>
      <p>
        <strong>{en ? "Built for:" : "Создан для:"}</strong>{" "}
        {en
          ? "Developers who want a lightweight layer on top of their OpenAI calls."
          : "Разработчиков, которым нужна лёгкая прослойка поверх вызовов OpenAI."}
      </p>
      <p>
        <strong>{en ? "Key difference from xR2:" : "Ключевое отличие от xR2:"}</strong>{" "}
        {en
          ? <>PromptLayer focuses on logging — seeing what was sent to the LLM and what came back. xR2 focuses on the <em>lifecycle</em> of prompts (draft → test → production) and measuring business outcomes (conversions, revenue), not just technical metrics.</>
          : <>PromptLayer фокусируется на логировании — что было отправлено в LLM и что вернулось. xR2 фокусируется на <em>жизненном цикле</em> промптов (черновик → тест → продакшн) и измерении бизнес-результатов (конверсии, выручка), а не только технических метрик.</>}
      </p>

      <h2>{en ? "Helicone: LLM Gateway & Analytics" : "Helicone: LLM-шлюз и аналитика"}</h2>
      <p>
        <strong>{en ? "What it does:" : "Что делает:"}</strong>{" "}
        {en
          ? "Helicone is a proxy that sits between your app and LLM providers. It provides cost tracking, rate limiting, caching, and request analytics."
          : "Helicone — это прокси между вашим приложением и провайдерами LLM. Он предоставляет отслеживание расходов, ограничение частоты запросов, кэширование и аналитику запросов."}
      </p>
      <p>
        <strong>{en ? "Built for:" : "Создан для:"}</strong>{" "}
        {en
          ? "Teams that need to control LLM costs and monitor usage at scale."
          : "Команд, которым нужно контролировать расходы на LLM и мониторить использование в масштабе."}
      </p>
      <p>
        <strong>{en ? "Key difference from xR2:" : "Ключевое отличие от xR2:"}</strong>{" "}
        {en
          ? <>Helicone is about infrastructure — controlling costs, caching responses, managing rate limits. It doesn&apos;t focus on prompt content management or business outcome tracking.</>
          : <>Helicone — это про инфраструктуру: контроль расходов, кэширование ответов, управление лимитами запросов. Он не фокусируется на управлении контентом промптов или отслеживании бизнес-результатов.</>}
      </p>

      <h2>{en ? "Where xR2 Fits" : "Где место xR2"}</h2>
      <p>
        {en
          ? <>xR2 answers a different question than these tools. They ask: <strong>&quot;How is my LLM performing technically?&quot;</strong> xR2 asks: <strong>&quot;Which prompt is making me more money?&quot;</strong></>
          : <>xR2 отвечает на другой вопрос, нежели эти инструменты. Они спрашивают: <strong>«Как мой LLM работает технически?»</strong> xR2 спрашивает: <strong>«Какой промпт приносит больше денег?»</strong></>}
      </p>

      <h3>{en ? "xR2 is built for:" : "xR2 создан для:"}</h3>
      <ul>
        <li>
          <strong>{en ? "Product teams" : "Продуктовых команд"}</strong>{" "}
          {en
            ? "who treat prompts as product features, not code artifacts"
            : "— которые относятся к промптам как к продуктовым фичам, а не артефактам кода"}
        </li>
        <li>
          <strong>{en ? "No-code/low-code users" : "No-code/low-code пользователей"}</strong>{" "}
          {en
            ? "who build on n8n, Make.com, or Zapier and need native integrations"
            : "— которые работают в n8n, Make.com или Zapier и нуждаются в нативных интеграциях"}
        </li>
        <li>
          <strong>{en ? "Business-outcome tracking" : "Отслеживания бизнес-результатов"}</strong>{" "}
          {en
            ? "— conversion rates and revenue per prompt variant, not just token counts"
            : "— конверсии и выручка по варианту промпта, а не просто количество токенов"}
        </li>
        <li>
          <strong>{en ? "Non-technical editors" : "Нетехнических редакторов"}</strong>{" "}
          {en
            ? "— product managers and marketers who need to edit prompts without deploying code"
            : "— продакт-менеджеров и маркетологов, которым нужно редактировать промпты без деплоя кода"}
        </li>
      </ul>

      <h3>{en ? "xR2 is NOT built for:" : "xR2 НЕ создан для:"}</h3>
      <ul>
        <li>{en ? "Deep LLM chain tracing (use Langfuse)" : "Глубокой трассировки цепочек LLM (используйте Langfuse)"}</li>
        <li>{en ? "LLM cost optimization and caching (use Helicone)" : "Оптимизации расходов на LLM и кэширования (используйте Helicone)"}</li>
        <li>{en ? "Low-level prompt logging of every API call (use PromptLayer)" : "Низкоуровневого логирования каждого API-вызова (используйте PromptLayer)"}</li>
      </ul>

      <h2>{en ? "Feature Comparison" : "Сравнение функций"}</h2>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>{en ? "Feature" : "Функция"}</th>
              <th>xR2</th>
              <th>Langfuse</th>
              <th>PromptLayer</th>
              <th>Helicone</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{en ? "Prompt editor" : "Редактор промптов"}</td>
              <td>{en ? "Visual editor with variables" : "Визуальный редактор с переменными"}</td>
              <td>{en ? "Basic" : "Базовый"}</td>
              <td>{en ? "Basic" : "Базовый"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "Version lifecycle" : "Жизненный цикл версий"}</td>
              <td>{en ? "Draft → Testing → Production" : "Черновик → Тест → Продакшн"}</td>
              <td>{en ? "Version numbers" : "Номера версий"}</td>
              <td>{en ? "Version numbers" : "Номера версий"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "A/B testing" : "A/B тестирование"}</td>
              <td>{en ? "Built-in with auto traffic split" : "Встроенное с авторазделением трафика"}</td>
              <td>{en ? "Manual" : "Вручную"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "Revenue tracking" : "Отслеживание выручки"}</td>
              <td>{en ? "Yes (conversion events with value)" : "Да (события конверсий со значением)"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "n8n integration" : "Интеграция с n8n"}</td>
              <td>{en ? "Native community node" : "Нативная community-нода"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "Make.com integration" : "Интеграция с Make.com"}</td>
              <td>{en ? "Via HTTP module (REST API)" : "Через HTTP-модуль (REST API)"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "No" : "Нет"}</td>
            </tr>
            <tr>
              <td>{en ? "LLM tracing" : "Трассировка LLM"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "Comprehensive" : "Комплексная"}</td>
              <td>{en ? "Request logging" : "Логирование запросов"}</td>
              <td>{en ? "Request logging" : "Логирование запросов"}</td>
            </tr>
            <tr>
              <td>{en ? "Cost tracking" : "Отслеживание расходов"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "Yes" : "Да"}</td>
              <td>{en ? "Yes" : "Да"}</td>
              <td>{en ? "Yes (detailed)" : "Да (детально)"}</td>
            </tr>
            <tr>
              <td>{en ? "Self-hosted option" : "Self-hosted вариант"}</td>
              <td>{en ? "No (cloud only)" : "Нет (только облако)"}</td>
              <td>{en ? "Yes (open source)" : "Да (open source)"}</td>
              <td>{en ? "No" : "Нет"}</td>
              <td>{en ? "Yes (open source)" : "Да (open source)"}</td>
            </tr>
            <tr>
              <td>{en ? "Primary audience" : "Основная аудитория"}</td>
              <td>{en ? "Product teams, no-code builders" : "Продуктовые команды, no-code разработчики"}</td>
              <td>{en ? "Developers" : "Разработчики"}</td>
              <td>{en ? "Developers" : "Разработчики"}</td>
              <td>{en ? "DevOps / Platform teams" : "DevOps / Platform-команды"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>{en ? "Can You Use Them Together?" : "Можно ли использовать вместе?"}</h2>
      <p>
        {en
          ? <>Yes. These tools aren&apos;t mutually exclusive. A common stack:</>
          : <>Да. Эти инструменты не исключают друг друга. Типичный стек:</>}
      </p>
      <ul>
        <li>
          <strong>xR2</strong>{" "}
          {en
            ? "for prompt management, versioning, and A/B testing"
            : "для управления промптами, версионирования и A/B тестирования"}
        </li>
        <li>
          <strong>Langfuse</strong> {en ? "or" : "или"} <strong>Helicone</strong>{" "}
          {en
            ? "for LLM observability and cost monitoring"
            : "для обсервабилити LLM и мониторинга расходов"}
        </li>
      </ul>
      <p>
        {en
          ? <>xR2 manages <em>what</em> the prompt says. Langfuse/Helicone monitors <em>how</em> the LLM processes it. Different layers, complementary insights.</>
          : <>xR2 управляет тем, <em>что</em> говорит промпт. Langfuse/Helicone мониторит, <em>как</em> LLM его обрабатывает. Разные уровни, взаимодополняющие инсайты.</>}
      </p>

      <h2>{en ? "When to Choose xR2" : "Когда выбирать xR2"}</h2>
      <p>
        {en ? "Choose xR2 if:" : "Выбирайте xR2, если:"}
      </p>
      <ul>
        <li>{en ? "You use n8n, Make.com, or Zapier for AI automation" : "Вы используете n8n, Make.com или Zapier для AI-автоматизации"}</li>
        <li>{en ? "Non-developers need to edit prompts" : "Промпты должны редактировать не-разработчики"}</li>
        <li>{en ? "You want to A/B test prompts and measure business outcomes" : "Вы хотите A/B-тестировать промпты и измерять бизнес-результаты"}</li>
        <li>{en ? "You need a structured prompt lifecycle (not just version numbers)" : "Вам нужен структурированный жизненный цикл промптов (а не просто номера версий)"}</li>
        <li>{en ? "You want to know which prompt variant generates more revenue" : "Вы хотите знать, какой вариант промпта приносит больше выручки"}</li>
      </ul>
      <p>
        {en
          ? <>Start free at <a href="https://xr2.uk">xr2.uk</a> — 10 prompts, 100 API calls/month, full A/B testing included.</>
          : <>Начните бесплатно на <a href="https://xr2.uk">xr2.uk</a> — 10 промптов, 100 API-запросов в месяц, полноценное A/B тестирование включено.</>}
      </p>
    </Article>
  )
}
