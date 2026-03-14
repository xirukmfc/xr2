"use client"

import { Article } from "../article"
import { useLocale } from "@/contexts/locale-context"

export function N8nPromptManagementContent() {
  const { locale } = useLocale()
  const en = locale === 'en'

  return (
    <Article
      title={en ? "Centralized Prompt Management for n8n" : "Управление промптами в n8n"}
      subtitle={en
        ? "Stop hardcoding system prompts in every workflow. Manage them from one place, switch dynamically at runtime."
        : "Хватит зашивать системные промпты в каждый воркфлоу. Управляйте ими из одного места и переключайте динамически."}
      readTime={en ? "6 min" : "6 мин"}
      slug="n8n-prompt-management"
      relatedLinks={en
        ? [
            { href: "/blog/make-prompt-management", label: "Dynamic Prompts in Make.com" },
            { href: "/blog/prompt-versioning", label: "Prompt Version Control" },
            { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
          ]
        : [
            { href: "/blog/make-prompt-management", label: "Промпты в Make.com" },
            { href: "/blog/prompt-versioning", label: "Версионирование промптов" },
            { href: "/blog/prompt-ab-testing", label: "A/B тесты промптов" },
          ]}
    >
      <h2>{en ? "The Problem: Prompts Buried Inside Workflows" : "Проблема: промпты зашиты внутри воркфлоу"}</h2>
      <p>
        {en
          ? <>If you use n8n with OpenAI, Anthropic, or any LLM node, you&apos;ve probably run into this: your system prompt is hardcoded inside the workflow. Need to tweak a word? Open n8n, find the node, edit, save, activate. Multiply that by 10 workflows serving different clients or scenarios — and you have a maintenance problem.</>
          : <>Если вы используете n8n с OpenAI, Anthropic или любой другой LLM-нодой, вы наверняка сталкивались с этим: системный промпт зашит прямо внутри воркфлоу. Нужно поправить формулировку? Открой n8n, найди нужную ноду, отредактируй, сохрани, активируй. Умножьте это на 10 воркфлоу для разных клиентов или сценариев — и получите проблему с поддержкой.</>}
      </p>
      <p>
        {en
          ? <>It gets worse when non-technical team members need to adjust prompts. They can&apos;t touch n8n. So they ask a developer, who makes the change, tests it, and redeploys. A one-word edit becomes a 30-minute task.</>
          : <>Ситуация усугубляется, когда промпты нужно корректировать нетехническим сотрудникам. У них нет доступа к n8n. Приходится просить разработчика, который вносит правку, тестирует и деплоит. Изменение одного слова превращается в 30-минутную задачу.</>}
      </p>

      <h2>{en ? "The Solution: Fetch Prompts at Runtime" : "Решение: загрузка промптов на лету"}</h2>
      <p>
        {en
          ? <>Instead of storing prompts inside n8n, store them in xR2 and fetch them when the workflow runs. Your n8n workflow becomes a generic execution engine — it doesn&apos;t care <em>what</em> the prompt says, it just fetches the latest version and sends it to the LLM.</>
          : <>Вместо хранения промптов внутри n8n, храните их в xR2 и загружайте при запуске воркфлоу. Ваш n8n-воркфлоу становится универсальным движком — ему не важно, <em>что</em> написано в промпте, он просто получает актуальную версию и отправляет её в LLM.</>}
      </p>
      <p>
        {en
          ? <>xR2 provides a <strong>native n8n community node</strong> that you can install directly from n8n&apos;s settings. No HTTP module configuration needed.</>
          : <>xR2 предоставляет <strong>нативную ноду для n8n</strong>, которую можно установить прямо из настроек n8n. Никакой настройки HTTP-модулей не требуется.</>}
      </p>

      <h3>{en ? "How It Works" : "Как это работает"}</h3>
      <ol>
        <li>
          {en
            ? <><strong>Install the xR2 node</strong> — Go to Settings → Community Nodes in your n8n instance and install <code>n8n-nodes-xr2</code>.</>
            : <><strong>Установите ноду xR2</strong> — Перейдите в Settings → Community Nodes в вашем n8n и установите <code>n8n-nodes-xr2</code>.</>}
        </li>
        <li>
          {en
            ? <><strong>Create your prompts in xR2</strong> — Write your system prompts in xR2&apos;s editor. Assign each one a unique slug like <code>support-acme</code> or <code>sales-qualifier</code>.</>
            : <><strong>Создайте промпты в xR2</strong> — Напишите системные промпты в редакторе xR2. Присвойте каждому уникальный слаг, например <code>support-acme</code> или <code>sales-qualifier</code>.</>}
        </li>
        <li>
          {en
            ? <><strong>Add the xR2 node to your workflow</strong> — Place it before your LLM node. It fetches the prompt by slug and outputs the system prompt text.</>
            : <><strong>Добавьте ноду xR2 в воркфлоу</strong> — Поставьте её перед LLM-нодой. Она загружает промпт по слагу и возвращает текст системного промпта.</>}
        </li>
        <li>
          {en
            ? <><strong>Connect to your AI node</strong> — Pass the fetched prompt as the system message to OpenAI, Anthropic, or any LLM node.</>
            : <><strong>Подключите к AI-ноде</strong> — Передайте загруженный промпт как системное сообщение в ноду OpenAI, Anthropic или любого другого LLM.</>}
        </li>
      </ol>

      <h2>{en ? "One Workflow, Multiple Prompts" : "Один воркфлоу — несколько промптов"}</h2>
      <p>
        {en
          ? <>This is where it gets powerful. Instead of duplicating workflows for different clients or scenarios, you can use a single workflow that receives a <code>prompt_slug</code> parameter and dynamically loads the right prompt.</>
          : <>Здесь начинается самое интересное. Вместо дублирования воркфлоу для разных клиентов или сценариев, вы используете один воркфлоу, который принимает параметр <code>prompt_slug</code> и динамически загружает нужный промпт.</>}
      </p>
      <p>
        {en
          ? "For example, a single customer support workflow can serve:"
          : "Например, один воркфлоу для поддержки клиентов может обслуживать:"}
      </p>
      <ul>
        <li><code>support-acme</code> — {en ? "a friendly, casual tone for ACME Corp" : "дружелюбный, неформальный тон для ACME Corp"}</li>
        <li><code>support-globex</code> — {en ? "a formal, professional tone for Globex Industries" : "формальный, деловой тон для Globex Industries"}</li>
        <li><code>sales-bot</code> — {en ? "a sales qualification prompt for inbound leads" : "промпт для квалификации входящих лидов"}</li>
      </ul>
      <p>
        {en
          ? <>The workflow stays the same. Only the prompt changes — and it&apos;s controlled from xR2&apos;s dashboard, not inside n8n.</>
          : <>Воркфлоу остаётся прежним. Меняется только промпт — и управляется он из дашборда xR2, а не внутри n8n.</>}
      </p>

      <h3>{en ? "Triggering with Different Slugs" : "Запуск с разными слагами"}</h3>
      <p>
        {en
          ? <>Use a webhook trigger that accepts a JSON body with <code>prompt_slug</code> and <code>message</code> fields. The xR2 node reads <code>prompt_slug</code> from the incoming data, fetches the corresponding prompt, and passes it to the LLM. This means your API callers or chatbot frontend can control which prompt gets used — without touching the workflow.</>
          : <>Используйте webhook-триггер, принимающий JSON с полями <code>prompt_slug</code> и <code>message</code>. Нода xR2 считывает <code>prompt_slug</code> из входящих данных, загружает соответствующий промпт и передаёт его в LLM. Это значит, что ваши API-клиенты или фронтенд чат-бота могут управлять выбором промпта — без изменения воркфлоу.</>}
      </p>

      <h2>{en ? "Edit Prompts Without Touching n8n" : "Редактируйте промпты без доступа к n8n"}</h2>
      <p>
        {en
          ? <>Once your workflow fetches prompts from xR2, your team can iterate on prompt wording directly in the xR2 editor. No n8n access required. No workflow restarts. Changes take effect on the next API call.</>
          : <>Когда воркфлоу загружает промпты из xR2, ваша команда может работать над формулировками прямо в редакторе xR2. Без доступа к n8n. Без перезапуска воркфлоу. Изменения вступают в силу при следующем API-вызове.</>}
      </p>
      <p>
        {en
          ? "This is especially useful for:"
          : "Это особенно полезно для:"}
      </p>
      <ul>
        <li>
          {en
            ? <><strong>Product managers</strong> who want to tweak AI behavior without developer involvement</>
            : <><strong>Продакт-менеджеров</strong>, которые хотят настраивать поведение AI без привлечения разработчиков</>}
        </li>
        <li>
          {en
            ? <><strong>Support teams</strong> adjusting tone or adding new FAQ coverage</>
            : <><strong>Команд поддержки</strong>, корректирующих тон ответов или добавляющих новые сценарии FAQ</>}
        </li>
        <li>
          {en
            ? <><strong>Agencies</strong> managing prompts for multiple clients from one dashboard</>
            : <><strong>Агентств</strong>, управляющих промптами для нескольких клиентов из одного дашборда</>}
        </li>
      </ul>

      <h2>{en ? "Prompt Variables" : "Переменные в промптах"}</h2>
      <p>
        {en
          ? <>xR2 prompts support <strong>dynamic variables</strong> using <code>{"{{variable_name}}"}</code> syntax. Define placeholders in your prompt like <code>{"{{company_name}}"}</code> or <code>{"{{product_list}}"}</code>, then pass values at runtime. The xR2 node resolves them before sending to the LLM.</>
          : <>Промпты xR2 поддерживают <strong>динамические переменные</strong> с синтаксисом <code>{"{{variable_name}}"}</code>. Определите плейсхолдеры в промпте, например <code>{"{{company_name}}"}</code> или <code>{"{{product_list}}"}</code>, и передавайте значения при вызове. Нода xR2 подставит их перед отправкой в LLM.</>}
      </p>
      <p>
        {en
          ? <>This separates <em>prompt logic</em> (the template) from <em>runtime data</em> (the variables) — keeping your prompts clean and reusable.</>
          : <>Это разделяет <em>логику промпта</em> (шаблон) и <em>данные времени выполнения</em> (переменные) — промпты остаются чистыми и переиспользуемыми.</>}
      </p>

      <h2>{en ? "Version Control Built In" : "Встроенное версионирование"}</h2>
      <p>
        {en
          ? <>Every prompt in xR2 goes through a lifecycle: <strong>Draft → Testing → Production</strong>. You can have a production version serving live traffic while editing a new draft. When ready, promote it to production with one click. If something breaks, roll back instantly.</>
          : <>Каждый промпт в xR2 проходит через жизненный цикл: <strong>Черновик → Тестирование → Продакшен</strong>. Вы можете редактировать новый черновик, пока продакшен-версия обслуживает живой трафик. Когда всё готово — продвиньте в продакшен одним кликом. Если что-то пошло не так — мгновенный откат.</>}
      </p>
      <p>
        {en
          ? <>Your n8n workflow always fetches the production version by default — so draft edits never affect live workflows until you explicitly promote them.</>
          : <>Ваш n8n-воркфлоу по умолчанию всегда получает продакшен-версию — черновые правки не влияют на боевые воркфлоу, пока вы явно не продвинете их.</>}
      </p>

      <h2>{en ? "Getting Started" : "Начало работы"}</h2>
      <ol>
        <li>
          {en
            ? <>Sign up at <a href="https://xr2.uk">xr2.uk</a> (free plan: 10 prompts, 100 API calls/month)</>
            : <>Зарегистрируйтесь на <a href="https://xr2.uk">xr2.uk</a> (бесплатный тариф: 10 промптов, 100 API-вызовов/мес)</>}
        </li>
        <li>
          {en
            ? <>Install <code>n8n-nodes-xr2</code> from n8n Community Nodes</>
            : <>Установите <code>n8n-nodes-xr2</code> из Community Nodes в n8n</>}
        </li>
        <li>
          {en
            ? "Create your first prompt and set a slug"
            : "Создайте первый промпт и задайте ему слаг"}
        </li>
        <li>
          {en
            ? "Add the xR2 node to your workflow, enter your API key"
            : "Добавьте ноду xR2 в воркфлоу и укажите API-ключ"}
        </li>
        <li>
          {en
            ? "Connect the output to your AI node — done"
            : "Подключите выход к AI-ноде — готово"}
        </li>
      </ol>
      <p>
        {en
          ? "The entire setup takes under 5 minutes. Your prompts are now managed externally, versioned, and ready for A/B testing when you need it."
          : "Вся настройка занимает меньше 5 минут. Ваши промпты теперь управляются централизованно, версионируются и готовы к A/B тестированию, когда это понадобится."}
      </p>
    </Article>
  )
}
