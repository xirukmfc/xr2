"use client"

import { Article } from "../article"
import { useLocale } from "@/contexts/locale-context"

export function PromptVersioningContent() {
  const { locale } = useLocale()
  const en = locale === 'en'

  return (
    <Article
      title={en ? "Version Control for AI Prompts" : "Версионирование промптов для LLM"}
      subtitle={en
        ? "Draft, test, and promote prompts through a structured lifecycle. Roll back instantly when something breaks."
        : "Черновик, тестирование, продакшн — структурированный жизненный цикл промптов. Мгновенный откат при проблемах."}
      readTime={en ? "5 min" : "5 мин"}
      slug="prompt-versioning"
      relatedLinks={en
        ? [
            { href: "/blog/prompt-ab-testing", label: "A/B Test AI Prompts" },
            { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
            { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse & Alternatives" },
          ]
        : [
            { href: "/blog/prompt-ab-testing", label: "A/B тесты промптов" },
            { href: "/blog/n8n-prompt-management", label: "Промпты в n8n" },
            { href: "/blog/langfuse-alternative", label: "xR2 vs Langfuse" },
          ]}
    >
      <h2>{en ? "Why Prompts Need Version Control" : "Зачем промптам нужен контроль версий"}</h2>
      <p>
        {en
          ? <>Code has Git. Designs have Figma history. Database schemas have migrations. But AI prompts? Most teams store them as hardcoded strings with no history, no rollback, and no safe way to test changes.</>
          : <>У кода есть Git. У дизайна — история в Figma. У схем базы данных — миграции. А промпты? Большинство команд хранят их как захардкоженные строки без истории, без отката и без безопасного способа тестировать изменения.</>}
      </p>
      <p>
        {en
          ? <>This matters because a prompt <em>is</em> a product feature. When your AI assistant suddenly gives weird responses, the first question is: &quot;Did someone change the prompt?&quot; Without version control, answering that question requires digging through commit logs — if the change was even committed at all.</>
          : <>Это важно, потому что промпт — <em>это</em> часть продукта. Когда AI-ассистент вдруг начинает давать странные ответы, первый вопрос: «Кто-то менял промпт?» Без контроля версий для ответа приходится копаться в коммитах — если изменение вообще было закоммичено.</>}
      </p>

      <h2>{en ? <>The Problem with &quot;Just Use Git&quot;</> : <>Проблема с подходом «просто используй Git»</>}</h2>
      <p>
        {en
          ? "You could store prompts in your codebase and version them with Git. But this creates several issues:"
          : "Можно хранить промпты в кодовой базе и версионировать через Git. Но это создаёт ряд проблем:"}
      </p>
      <ul>
        <li>
          {en
            ? <><strong>Changing a prompt requires a deploy.</strong> Even a one-word tweak goes through commit → CI/CD → deployment. For a string that might need daily adjustments, this is too slow.</>
            : <><strong>Изменение промпта требует деплоя.</strong> Даже правка одного слова проходит через commit → CI/CD → deployment. Для строки, которую нужно менять ежедневно, это слишком медленно.</>}
        </li>
        <li>
          {en
            ? <><strong>Non-developers can&apos;t edit.</strong> Product managers and support leads — the people who often know best what the AI should say — can&apos;t push to Git.</>
            : <><strong>Не-разработчики не могут редактировать.</strong> Продакт-менеджеры и руководители поддержки — люди, которые лучше всех знают, что должен говорить AI, — не умеют пушить в Git.</>}
        </li>
        <li>
          {en
            ? <><strong>No safe testing path.</strong> You either test in production (risky) or maintain separate staging prompts that may drift from production.</>
            : <><strong>Нет безопасного пути тестирования.</strong> Либо тестируете в продакшне (рискованно), либо поддерживаете отдельные staging-промпты, которые расходятся с продакшном.</>}
        </li>
        <li>
          {en
            ? <><strong>No connection to outcomes.</strong> Git tells you <em>what</em> changed, but not whether the change improved conversion rates or user satisfaction.</>
            : <><strong>Нет связи с результатами.</strong> Git показывает, <em>что</em> изменилось, но не показывает, улучшило ли изменение конверсию или удовлетворённость пользователей.</>}
        </li>
      </ul>

      <h2>{en ? "How xR2 Handles Prompt Versions" : "Как xR2 управляет версиями промптов"}</h2>
      <p>
        {en
          ? <>Every prompt in xR2 has a <strong>status lifecycle</strong>:</>
          : <>Каждый промпт в xR2 имеет <strong>жизненный цикл статусов</strong>:</>}
      </p>
      <ul>
        <li>
          {en
            ? <><strong>Draft</strong> — Work in progress. Not served via API. Edit freely without affecting anything.</>
            : <><strong>Draft</strong> — Черновик. Не отдаётся через API. Редактируйте свободно, ничего не затрагивая.</>}
        </li>
        <li>
          {en
            ? <><strong>Testing</strong> — Available via API with an explicit <code>status: &quot;testing&quot;</code> parameter. Use this for QA, staging environments, or A/B tests.</>
            : <><strong>Testing</strong> — Доступен через API с явным параметром <code>status: &quot;testing&quot;</code>. Используйте для QA, staging-окружений или A/B тестов.</>}
        </li>
        <li>
          {en
            ? <><strong>Production</strong> — The default version served by the API. This is what your live workflows and apps receive.</>
            : <><strong>Production</strong> — Версия по умолчанию, которую отдаёт API. Именно её получают ваши рабочие процессы и приложения.</>}
        </li>
      </ul>

      <h3>{en ? "The Workflow" : "Рабочий процесс"}</h3>
      <ol>
        <li>
          {en
            ? <><strong>Write a new version</strong> — Create or edit a prompt in Draft status. The current Production version continues serving live traffic.</>
            : <><strong>Напишите новую версию</strong> — Создайте или отредактируйте промпт в статусе Draft. Текущая Production-версия продолжает обслуживать живой трафик.</>}
        </li>
        <li>
          {en
            ? <><strong>Promote to Testing</strong> — When ready, move the draft to Testing. Your staging environment or QA flows can now fetch it explicitly.</>
            : <><strong>Переведите в Testing</strong> — Когда готово, переместите черновик в Testing. Ваше staging-окружение или QA-процессы теперь могут запрашивать его явно.</>}
        </li>
        <li>
          {en
            ? <><strong>Validate</strong> — Run test scenarios, check outputs, verify edge cases. The Production version is still untouched.</>
            : <><strong>Проверьте</strong> — Прогоните тестовые сценарии, проверьте выходные данные, убедитесь в корректности краевых случаев. Production-версия остаётся нетронутой.</>}
        </li>
        <li>
          {en
            ? <><strong>Promote to Production</strong> — One click. The new version is now live. The old version is stored in history.</>
            : <><strong>Переведите в Production</strong> — Один клик. Новая версия теперь в продакшне. Старая сохраняется в истории.</>}
        </li>
        <li>
          {en
            ? <><strong>Roll back if needed</strong> — If the new version causes issues, revert to the previous production version instantly. No deploy, no Git revert, no downtime.</>
            : <><strong>Откатите при необходимости</strong> — Если новая версия вызывает проблемы, мгновенно вернитесь к предыдущей production-версии. Без деплоя, без Git revert, без даунтайма.</>}
        </li>
      </ol>

      <h2>{en ? "Version History" : "История версий"}</h2>
      <p>
        {en
          ? "xR2 keeps a full history of every prompt version. You can see:"
          : "xR2 хранит полную историю каждой версии промпта. Вы можете увидеть:"}
      </p>
      <ul>
        <li>{en ? "What the prompt text was at each version" : "Текст промпта в каждой версии"}</li>
        <li>{en ? "When it was promoted to production" : "Когда версия была переведена в production"}</li>
        <li>{en ? "Who made the change" : "Кто внёс изменение"}</li>
        <li>{en ? "The diff between any two versions" : "Разницу между любыми двумя версиями"}</li>
      </ul>
      <p>
        {en
          ? <>This gives you the audit trail that hardcoded prompts lack. When someone asks &quot;why did our AI start responding differently last Tuesday?&quot; — you have the answer in seconds.</>
          : <>Это даёт вам аудиторский след, которого нет у захардкоженных промптов. Когда кто-то спрашивает «почему наш AI стал отвечать по-другому во вторник?» — у вас есть ответ за секунды.</>}
      </p>

      <h2>{en ? "Safe Editing for Non-Developers" : "Безопасное редактирование для не-разработчиков"}</h2>
      <p>
        {en
          ? "Because xR2 separates prompt editing from code deployment, product managers, marketers, and support leads can safely modify prompts:"
          : "Поскольку xR2 отделяет редактирование промптов от деплоя кода, продакт-менеджеры, маркетологи и руководители поддержки могут безопасно изменять промпты:"}
      </p>
      <ul>
        <li>{en
          ? "They edit in a visual editor — no code, no Git"
          : "Они редактируют в визуальном редакторе — без кода, без Git"}</li>
        <li>{en
          ? "Changes start as Drafts — nothing goes live until explicitly promoted"
          : "Изменения начинаются как черновики — ничего не попадает в продакшн, пока явно не будет переведено"}</li>
        <li>{en
          ? <>The Production version acts as a safety net — it&apos;s always there to fall back to</>
          : "Production-версия — это страховка, к которой всегда можно вернуться"}</li>
      </ul>
      <p>
        {en
          ? <><strong>A prompt is a product feature, not a line of code.</strong> The people closest to the product should be able to iterate on it without a deploy cycle.</>
          : <><strong>Промпт — это часть продукта, а не строка кода.</strong> Люди, ближе всего стоящие к продукту, должны иметь возможность итерировать над ним без цикла деплоя.</>}
      </p>

      <h2>{en ? "Integrates with Your Workflow" : "Интеграция с вашими процессами"}</h2>
      <p>
        {en
          ? "Version control in xR2 works seamlessly with automation platforms. Your n8n workflow or Make.com scenario always fetches the Production version by default. When you promote a new version, the next API call automatically gets the updated prompt — no workflow changes needed."
          : "Контроль версий в xR2 бесшовно работает с платформами автоматизации. Ваш n8n workflow или Make.com сценарий всегда получает Production-версию по умолчанию. Когда вы переводите новую версию в продакшн, следующий API-запрос автоматически получает обновлённый промпт — без изменений в workflow."}
      </p>
      <p>
        {en
          ? <>For testing environments, pass <code>status: &quot;testing&quot;</code> in your API call to fetch the testing version explicitly. This lets you run parallel environments with different prompt versions.</>
          : <>Для тестовых окружений передайте <code>status: &quot;testing&quot;</code> в API-запросе, чтобы явно получить тестовую версию. Это позволяет запускать параллельные окружения с разными версиями промптов.</>}
      </p>

      <h2>{en ? "Getting Started" : "Начало работы"}</h2>
      <ol>
        <li>{en
          ? <>Sign up at <a href="https://xr2.uk">xr2.uk</a> and create your first prompt</>
          : <>Зарегистрируйтесь на <a href={`https://${locale === 'ru' ? 'xr2.site' : 'xr2.uk'}`}>{locale === 'ru' ? 'xr2.site' : 'xr2.uk'}</a> и создайте свой первый промпт</>}</li>
        <li>{en
          ? "Write your initial version and promote it to Production"
          : "Напишите первую версию и переведите её в Production"}</li>
        <li>{en
          ? "When you need a change, edit the prompt — it starts as a Draft automatically"
          : "Когда нужно изменение — отредактируйте промпт, он автоматически станет черновиком"}</li>
        <li>{en
          ? "Test, validate, and promote when ready"
          : "Протестируйте, проверьте и переведите в продакшн, когда будете готовы"}</li>
      </ol>
      <p>
        {en
          ? "Free plan includes 10 prompts with full version history. No credit card required."
          : "Бесплатный тариф включает 10 промптов с полной историей версий. Карта не требуется."}
      </p>
    </Article>
  )
}
