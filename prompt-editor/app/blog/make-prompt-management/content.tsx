"use client"

import { Article } from "../article"
import { useLocale } from "@/contexts/locale-context"

export function MakePromptManagementContent() {
  const { locale } = useLocale()
  const en = locale === 'en'

  return (
    <Article
      title={en ? "Dynamic AI Prompts in Make.com Scenarios" : "Динамические AI-промпты в сценариях Make.com"}
      subtitle={en
        ? "Fetch prompts at runtime via HTTP. No more editing modules every time you tweak a word."
        : "Загружайте промпты через HTTP во время выполнения. Больше не нужно редактировать модули при каждом изменении."}
      readTime={en ? "5 min" : "5 мин"}
      slug="make-prompt-management"
      relatedLinks={en
        ? [
            { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
            { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
            { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse & Alternatives" },
          ]
        : [
            { href: "/blog/n8n-prompt-management", label: "Промпты в n8n" },
            { href: "/blog/prompt-ab-testing", label: "A/B тесты промптов" },
            { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse" },
          ]}
    >
      <h2>{en ? "The Make.com Prompt Problem" : "Проблема с промптами в Make.com"}</h2>
      <p>
        {en
          ? "Make.com (formerly Integromat) is one of the most popular no-code automation platforms. When you add an OpenAI or ChatGPT module to a scenario, the system prompt lives inside that module's configuration."
          : "Make.com (ранее Integromat) — одна из самых популярных no-code платформ для автоматизации. Когда вы добавляете модуль OpenAI или ChatGPT в сценарий, системный промпт хранится внутри настроек этого модуля."}
      </p>
      <p>
        {en
          ? "This works fine for simple setups. But once you have multiple scenarios using AI — customer support, content generation, lead qualification — managing prompts becomes painful:"
          : "Для простых задач этого достаточно. Но когда у вас несколько сценариев с AI — поддержка клиентов, генерация контента, квалификация лидов — управление промптами становится головной болью:"}
      </p>
      <ul>
        <li>{en ? "Each scenario has its own copy of the prompt" : "В каждом сценарии своя копия промпта"}</li>
        <li>{en ? "Changing a prompt requires opening the scenario, finding the module, editing, and saving" : "Изменение промпта требует открытия сценария, поиска модуля, редактирования и сохранения"}</li>
        <li>{en ? "There's no way to version or roll back changes" : "Нет возможности версионировать или откатить изменения"}</li>
        <li>{en ? "Non-technical team members can't edit prompts without Make.com access" : "Нетехнические сотрудники не могут редактировать промпты без доступа к Make.com"}</li>
        <li>{en ? "You can't test two prompt versions against each other" : "Невозможно протестировать две версии промпта друг против друга"}</li>
      </ul>

      <h2>{en ? "The Solution: Fetch Prompts via HTTP" : "Решение: загрузка промптов через HTTP"}</h2>
      <p>
        {en
          ? <>xR2 exposes a simple REST API. In Make.com, you use a standard <strong>HTTP module</strong> to fetch the prompt before passing it to your AI module. The prompt content is managed entirely in xR2 — your Make.com scenario just consumes it.</>
          : <>xR2 предоставляет простой REST API. В Make.com вы используете стандартный <strong>HTTP-модуль</strong> для загрузки промпта перед передачей его в AI-модуль. Содержимое промпта полностью управляется в xR2 — ваш сценарий Make.com просто потребляет его.</>}
      </p>

      <h3>{en ? "Setup in 3 Steps" : "Настройка за 3 шага"}</h3>
      <ol>
        <li>
          <strong>{en ? "Create your prompt in xR2" : "Создайте промпт в xR2"}</strong> — {en
            ? <>Write the prompt in xR2&apos;s editor, assign a slug like <code>email-writer</code>, and promote it to Production status.</>
            : <>Напишите промпт в редакторе xR2, назначьте slug, например <code>email-writer</code>, и переведите его в статус Production.</>}
        </li>
        <li>
          <strong>{en ? "Add an HTTP module" : "Добавьте HTTP-модуль"}</strong> — {en
            ? <>In your Make.com scenario, add an HTTP &quot;Make a request&quot; module before your AI module:</>
            : <>В вашем сценарии Make.com добавьте HTTP-модуль &quot;Make a request&quot; перед AI-модулем:</>}
          <pre><code>{`POST https://xr2.uk/api/v1/get-prompt
Headers:
  Authorization: Bearer xr2_prod_your_key
  Content-Type: application/json
Body:
  { "slug": "email-writer" }`}</code></pre>
        </li>
        <li>
          <strong>{en ? "Map the response to your AI module" : "Подключите ответ к AI-модулю"}</strong> — {en
            ? <>The HTTP module returns the prompt text. Map <code>system_prompt</code> from the response to your OpenAI module&apos;s system message field.</>
            : <>HTTP-модуль возвращает текст промпта. Подключите <code>system_prompt</code> из ответа к полю системного сообщения вашего OpenAI-модуля.</>}
        </li>
      </ol>

      <h2>{en ? "Dynamic Prompt Switching" : "Динамическое переключение промптов"}</h2>
      <p>
        {en
          ? "Just like with n8n, you can use a single Make.com scenario to handle multiple prompt variants. Pass the slug as a variable — from a webhook, a router, or a data store lookup — and the same scenario serves different AI behaviors."
          : "Как и в n8n, вы можете использовать один сценарий Make.com для работы с несколькими вариантами промптов. Передавайте slug как переменную — из вебхука, роутера или data store — и один сценарий обеспечивает разное поведение AI."}
      </p>
      <p>
        {en
          ? "Example: a customer support scenario that routes tickets based on department:"
          : "Пример: сценарий поддержки клиентов, который маршрутизирует тикеты по отделам:"}
      </p>
      <ul>
        <li>{en ? <>Billing questions → fetch <code>support-billing</code> prompt</> : <>Вопросы по оплате → загрузка промпта <code>support-billing</code></>}</li>
        <li>{en ? <>Technical issues → fetch <code>support-technical</code> prompt</> : <>Технические вопросы → загрузка промпта <code>support-technical</code></>}</li>
        <li>{en ? <>Sales inquiries → fetch <code>support-sales</code> prompt</> : <>Вопросы по продажам → загрузка промпта <code>support-sales</code></>}</li>
      </ul>
      <p>
        {en
          ? "One scenario, three completely different AI behaviors — all controlled from xR2's dashboard."
          : "Один сценарий, три совершенно разных поведения AI — всё управляется из панели xR2."}
      </p>

      <h2>{en ? "Variables in Prompts" : "Переменные в промптах"}</h2>
      <p>
        {en
          ? <>xR2 prompts support <code>{"{{variable}}"}</code> placeholders. You can pass variable values in the API request body, and xR2 renders the final prompt with those values filled in. This keeps your prompts generic and reusable across different Make.com scenarios.</>
          : <>Промпты xR2 поддерживают плейсхолдеры <code>{"{{variable}}"}</code>. Вы можете передавать значения переменных в теле API-запроса, и xR2 подставит их в финальный промпт. Это делает ваши промпты универсальными и переиспользуемыми в разных сценариях Make.com.</>}
      </p>
      <pre><code>{`{
  "slug": "email-writer",
  "variables": {
    "customer_name": "Alice",
    "product": "Pro Plan"
  }
}`}</code></pre>

      <h2>{en ? "Benefits for Make.com Users" : "Преимущества для пользователей Make.com"}</h2>
      <ul>
        <li><strong>{en ? "No more module editing" : "Без редактирования модулей"}</strong> — {en ? "Change prompt wording in xR2, it takes effect immediately on the next scenario run" : "Измените текст промпта в xR2 — изменения вступят в силу при следующем запуске сценария"}</li>
        <li><strong>{en ? "Team collaboration" : "Командная работа"}</strong> — {en ? "Marketing and support teams can edit prompts without Make.com access" : "Маркетинг и поддержка могут редактировать промпты без доступа к Make.com"}</li>
        <li><strong>{en ? "Version history" : "История версий"}</strong> — {en ? "Every change is tracked. Roll back to a previous version if needed" : "Каждое изменение отслеживается. При необходимости можно откатиться к предыдущей версии"}</li>
        <li><strong>{en ? "A/B testing" : "A/B тестирование"}</strong> — {en ? "Test two prompt variants and measure which one converts better" : "Тестируйте два варианта промпта и измеряйте, какой из них конвертирует лучше"}</li>
        <li><strong>{en ? "Analytics" : "Аналитика"}</strong> — {en ? "See how often each prompt is called, track conversion events tied to specific prompts" : "Отслеживайте частоту вызовов каждого промпта и конверсии, привязанные к конкретным промптам"}</li>
      </ul>

      <h2>{en ? "Works with Any AI Module" : "Работает с любым AI-модулем"}</h2>
      <p>
        {en
          ? "Since xR2 delivers the prompt as plain text via HTTP, it works with any AI module in Make.com: OpenAI, Anthropic Claude, Google Gemini, or even custom API calls. The prompt source is decoupled from the AI provider."
          : "Поскольку xR2 доставляет промпт как обычный текст через HTTP, он работает с любым AI-модулем в Make.com: OpenAI, Anthropic Claude, Google Gemini или даже пользовательскими API-вызовами. Источник промпта не зависит от провайдера AI."}
      </p>

      <h2>{en ? "Getting Started" : "Начало работы"}</h2>
      <ol>
        <li>{en ? <>Sign up at <a href="https://xr2.uk">xr2.uk</a> — free plan includes 10 prompts and 100 API calls/month</> : <>Зарегистрируйтесь на <a href="https://xr2.uk">xr2.uk</a> — бесплатный тариф включает 10 промптов и 100 API-запросов в месяц</>}</li>
        <li>{en ? "Create a prompt with a slug" : "Создайте промпт со slug-идентификатором"}</li>
        <li>{en ? "Add an HTTP module to your Make.com scenario pointing to xR2's API" : "Добавьте HTTP-модуль в ваш сценарий Make.com с указанием API xR2"}</li>
        <li>{en ? "Map the response to your AI module" : "Подключите ответ к вашему AI-модулю"}</li>
      </ol>
      <p>
        {en
          ? "Setup takes about 5 minutes. From that point, your prompts live outside Make.com and can be managed by anyone on your team."
          : "Настройка занимает около 5 минут. После этого ваши промпты живут вне Make.com и могут управляться любым членом команды."}
      </p>
    </Article>
  )
}
