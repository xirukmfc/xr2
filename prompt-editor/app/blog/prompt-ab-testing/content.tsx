"use client"

import { Article } from "../article"
import { useLocale } from "@/contexts/locale-context"

export function PromptAbTestingContent() {
  const { locale } = useLocale()
  const en = locale === 'en'

  return (
    <Article
      title={en ? "A/B Test AI Prompts with Revenue Tracking" : "A/B тестирование промптов с трекингом выручки"}
      subtitle={en
        ? "Stop guessing which prompt works better. Run experiments, track conversions, and let data decide."
        : "Хватит гадать, какой промпт работает лучше. Запускайте эксперименты, отслеживайте конверсии и принимайте решения на основе данных."}
      readTime={en ? "7 min" : "7 мин"}
      slug="prompt-ab-testing"
      relatedLinks={en
        ? [
            { href: "/blog/prompt-versioning", label: "Prompt Version Control" },
            { href: "/blog/n8n-prompt-management", label: "n8n Prompt Management" },
            { href: "/blog/make-prompt-management", label: "Make.com Prompt Management" },
          ]
        : [
            { href: "/blog/prompt-versioning", label: "Версионирование промптов" },
            { href: "/blog/n8n-prompt-management", label: "Промпты в n8n" },
            { href: "/blog/make-prompt-management", label: "Промпты в Make.com" },
          ]}
    >
      <h2>{en ? "The Prompt Blindness Problem" : "Проблема «слепоты» к промптам"}</h2>
      {en ? (
        <>
          <p>
            Your AI-powered workflow generates responses — maybe it writes emails, qualifies leads, or handles customer support. You wrote the prompt, it seems to work, and you move on. But here&apos;s the question you can&apos;t answer: <strong>is this the best prompt you could be using?</strong>
          </p>
          <p>
            This is prompt blindness. Without systematic testing, you have no idea whether a friendlier tone would increase reply rates, whether shorter responses convert better, or whether adding urgency to your sales bot actually drives more purchases.
          </p>
          <p>
            Teams that A/B test their website copy, email subjects, and ad creatives somehow skip the one piece of text that controls their entire AI output: the prompt.
          </p>
        </>
      ) : (
        <>
          <p>
            Ваш AI-воркфлоу генерирует ответы — пишет письма, квалифицирует лидов или обрабатывает обращения в поддержку. Вы написали промпт, он вроде работает, и вы идёте дальше. Но вот вопрос, на который вы не можете ответить: <strong>а это лучший промпт из возможных?</strong>
          </p>
          <p>
            Это и есть «слепота» к промптам. Без систематического тестирования вы не знаете, увеличит ли дружелюбный тон количество ответов, конвертируют ли короткие ответы лучше, и действительно ли добавление срочности в продажного бота ведёт к росту покупок.
          </p>
          <p>
            Команды, которые A/B тестируют тексты на сайте, темы писем и рекламные креативы, почему-то пропускают единственный текст, который управляет всем AI-выводом: промпт.
          </p>
        </>
      )}

      <h2>{en ? "How Prompt A/B Testing Works" : "Как работает A/B тестирование промптов"}</h2>
      {en ? (
        <>
          <p>
            The concept is identical to any A/B test: split your traffic between two (or more) variants, measure the outcome, pick the winner. With xR2, it works like this:
          </p>
          <ol>
            <li><strong>Create two prompt variants</strong> — Write Variant A (your current prompt) and Variant B (the one you want to test). Change only one variable at a time — tone, length, structure, or specific instructions.</li>
            <li><strong>xR2 splits traffic automatically</strong> — When your workflow calls the API, xR2 randomly assigns the request to Variant A or B (50/50 by default). The response includes a <code>trace_id</code> that identifies which variant was served.</li>
            <li><strong>Track conversion events</strong> — When a downstream action happens (user replies to the email, lead books a call, customer makes a purchase), send a conversion event to xR2 with the <code>trace_id</code>.</li>
            <li><strong>Analyze results</strong> — xR2&apos;s analytics dashboard shows conversion rates for each variant, with statistical significance calculation. No spreadsheets needed.</li>
          </ol>
        </>
      ) : (
        <>
          <p>
            Концепция идентична любому A/B тесту: разделите трафик между двумя (или более) вариантами, измерьте результат, выберите победителя. В xR2 это работает так:
          </p>
          <ol>
            <li><strong>Создайте два варианта промпта</strong> — напишите Вариант A (текущий промпт) и Вариант B (тот, который хотите протестировать). Меняйте только одну переменную за раз — тон, длину, структуру или конкретные инструкции.</li>
            <li><strong>xR2 автоматически распределяет трафик</strong> — когда воркфлоу вызывает API, xR2 случайным образом назначает запрос Варианту A или B (по умолчанию 50/50). Ответ содержит <code>trace_id</code>, который идентифицирует, какой вариант был обслужен.</li>
            <li><strong>Отслеживайте события конверсии</strong> — когда происходит целевое действие (пользователь отвечает на письмо, лид записывается на звонок, клиент совершает покупку), отправьте событие конверсии в xR2 с <code>trace_id</code>.</li>
            <li><strong>Анализируйте результаты</strong> — аналитический дашборд xR2 показывает конверсию для каждого варианта с расчётом статистической значимости. Никаких таблиц.</li>
          </ol>
        </>
      )}

      <h2>{en ? "What Makes This Different from Manual Testing" : "Чем это отличается от ручного тестирования"}</h2>
      {en ? (
        <>
          <p>
            You could technically A/B test prompts by alternating them manually — use prompt A on Monday, prompt B on Tuesday, and compare. But this introduces time-based bias, seasonal effects, and no statistical rigor.
          </p>
          <p>
            Proper A/B testing requires:
          </p>
          <ul>
            <li><strong>Randomized assignment</strong> — Each request is randomly assigned to a variant, eliminating bias</li>
            <li><strong>Concurrent testing</strong> — Both variants run at the same time, so external factors affect them equally</li>
            <li><strong>Statistical significance</strong> — You need enough data to confirm the difference isn&apos;t just noise</li>
            <li><strong>Proper attribution</strong> — The conversion must be linked back to the specific prompt variant that generated the response</li>
          </ul>
          <p>
            xR2 handles all of this automatically.
          </p>
        </>
      ) : (
        <>
          <p>
            Технически вы можете A/B тестировать промпты вручную — использовать промпт A в понедельник, промпт B во вторник и сравнить. Но это вносит временной перекос, сезонные эффекты и лишено статистической строгости.
          </p>
          <p>
            Корректное A/B тестирование требует:
          </p>
          <ul>
            <li><strong>Случайное назначение</strong> — каждый запрос случайно назначается варианту, исключая предвзятость</li>
            <li><strong>Одновременное тестирование</strong> — оба варианта работают одновременно, поэтому внешние факторы влияют на них одинаково</li>
            <li><strong>Статистическая значимость</strong> — нужно достаточно данных, чтобы подтвердить, что разница — не просто шум</li>
            <li><strong>Корректная атрибуция</strong> — конверсия должна быть привязана к конкретному варианту промпта, который сгенерировал ответ</li>
          </ul>
          <p>
            xR2 делает всё это автоматически.
          </p>
        </>
      )}

      <h2>{en ? "Revenue Tracking, Not Just Click Rates" : "Трекинг выручки, а не просто кликов"}</h2>
      {en ? (
        <>
          <p>
            Most prompt testing tools (if they exist at all) focus on technical metrics: response latency, token count, or model confidence. These are useful for developers but don&apos;t answer the business question: <strong>which prompt makes more money?</strong>
          </p>
          <p>
            xR2&apos;s conversion tracking lets you attach a monetary value to events:
          </p>
        </>
      ) : (
        <>
          <p>
            Большинство инструментов для тестирования промптов (если они вообще существуют) фокусируются на технических метриках: задержка ответа, количество токенов или уверенность модели. Это полезно для разработчиков, но не отвечает на бизнес-вопрос: <strong>какой промпт приносит больше денег?</strong>
          </p>
          <p>
            Трекинг конверсий в xR2 позволяет привязать денежную ценность к событиям:
          </p>
        </>
      )}
      <pre><code>{`// Track a conversion event with revenue
client.trackEvent({
  traceId: prompt.trace_id,
  eventName: "purchase_completed",
  userId: "user_123",
  value: 99.99,
  currency: "USD",
});`}</code></pre>
      {en ? (
        <p>
          The analytics dashboard then shows revenue per variant, not just conversion counts. You can see that Variant B has a 12% higher conversion rate <em>and</em> generates $2,400 more revenue per week.
        </p>
      ) : (
        <p>
          Аналитический дашборд показывает выручку по каждому варианту, а не просто количество конверсий. Вы видите, что Вариант B имеет на 12% выше конверсию <em>и</em> генерирует на $2 400 больше выручки в неделю.
        </p>
      )}

      <h2>{en ? "What to A/B Test" : "Что тестировать"}</h2>
      {en ? (
        <>
          <p>
            Not sure what to test? Here are the most impactful variables:
          </p>
          <ul>
            <li><strong>Tone</strong> — Friendly vs. formal. Conversational vs. professional. Adding humor vs. staying serious.</li>
            <li><strong>Length</strong> — Short, punchy responses vs. detailed explanations. Bullet points vs. paragraphs.</li>
            <li><strong>Structure</strong> — Leading with a question vs. a statement. Including a CTA vs. not.</li>
            <li><strong>Specific instructions</strong> — &quot;Always mention the discount&quot; vs. no mention. &quot;Add urgency&quot; vs. neutral tone.</li>
            <li><strong>Persona</strong> — &quot;You are a helpful assistant&quot; vs. &quot;You are an expert consultant&quot; vs. &quot;You are a friendly advisor.&quot;</li>
          </ul>
          <p>
            The key rule: <strong>change one variable per test.</strong> If you change tone and length simultaneously, you won&apos;t know which change caused the improvement.
          </p>
        </>
      ) : (
        <>
          <p>
            Не знаете, что тестировать? Вот самые значимые переменные:
          </p>
          <ul>
            <li><strong>Тон</strong> — дружелюбный vs. формальный. Разговорный vs. профессиональный. С юмором vs. серьёзный.</li>
            <li><strong>Длина</strong> — короткие, ёмкие ответы vs. подробные объяснения. Буллеты vs. абзацы.</li>
            <li><strong>Структура</strong> — начинать с вопроса vs. с утверждения. С CTA vs. без.</li>
            <li><strong>Конкретные инструкции</strong> — «Всегда упоминай скидку» vs. без упоминания. «Добавь срочность» vs. нейтральный тон.</li>
            <li><strong>Персона</strong> — «Ты полезный ассистент» vs. «Ты эксперт-консультант» vs. «Ты дружелюбный советник».</li>
          </ul>
          <p>
            Ключевое правило: <strong>меняйте одну переменную за тест.</strong> Если изменить тон и длину одновременно, вы не узнаете, что именно привело к улучшению.
          </p>
        </>
      )}

      <h2>{en ? "Common Mistakes" : "Типичные ошибки"}</h2>
      {en ? (
        <ul>
          <li><strong>Stopping too early.</strong> You need at least 100 requests per variant to detect meaningful differences. For smaller effect sizes, you need more.</li>
          <li><strong>Testing too many things at once.</strong> Two variants, one change. Keep it clean.</li>
          <li><strong>Optimizing the wrong metric.</strong> More replies doesn&apos;t mean more revenue. Track what matters to the business.</li>
          <li><strong>Ignoring statistical significance.</strong> A 55% vs 45% split with 20 samples means nothing. Wait for significance before declaring a winner.</li>
        </ul>
      ) : (
        <ul>
          <li><strong>Остановка слишком рано.</strong> Нужно минимум 100 запросов на вариант, чтобы обнаружить значимые различия. Для небольших эффектов — ещё больше.</li>
          <li><strong>Тестирование слишком многого сразу.</strong> Два варианта, одно изменение. Держите тест чистым.</li>
          <li><strong>Оптимизация не той метрики.</strong> Больше ответов не значит больше выручки. Отслеживайте то, что важно для бизнеса.</li>
          <li><strong>Игнорирование статистической значимости.</strong> Разделение 55% vs 45% при 20 запросах ничего не значит. Дождитесь значимости, прежде чем объявлять победителя.</li>
        </ul>
      )}

      <h2>{en ? "Works with Any Automation Platform" : "Работает с любой платформой автоматизации"}</h2>
      {en ? (
        <p>
          A/B testing in xR2 works the same whether you&apos;re using n8n, Make.com, Zapier, or a custom integration. Your workflow calls the xR2 API, gets a prompt variant, and later reports conversion events. The testing logic lives in xR2 — your workflow doesn&apos;t need to know about the test.
        </p>
      ) : (
        <p>
          A/B тестирование в xR2 работает одинаково, используете ли вы n8n, Make.com, Zapier или собственную интеграцию. Ваш воркфлоу вызывает API xR2, получает вариант промпта и затем отправляет события конверсии. Логика тестирования живёт в xR2 — ваш воркфлоу не обязан знать о тесте.
        </p>
      )}

      <h2>{en ? "Getting Started" : "Начало работы"}</h2>
      {en ? (
        <>
          <ol>
            <li>Sign up at <a href="https://xr2.uk">xr2.uk</a> and create a prompt</li>
            <li>Write two variants with one specific difference</li>
            <li>Enable A/B testing on the prompt — xR2 starts splitting traffic</li>
            <li>Add conversion event tracking to your workflow (one API call when a conversion happens)</li>
            <li>Wait for statistical significance, then promote the winner</li>
          </ol>
          <p>
            Free plan includes A/B testing. Start measuring instead of guessing.
          </p>
        </>
      ) : (
        <>
          <ol>
            <li>Зарегистрируйтесь на <a href="https://xr2.site">xr2.site</a> и создайте промпт</li>
            <li>Напишите два варианта с одним конкретным отличием</li>
            <li>Включите A/B тестирование для промпта — xR2 начнёт распределять трафик</li>
            <li>Добавьте трекинг событий конверсии в воркфлоу (один API-вызов при конверсии)</li>
            <li>Дождитесь статистической значимости и продвиньте победителя</li>
          </ol>
          <p>
            Бесплатный тариф включает A/B тестирование. Начните измерять вместо того, чтобы гадать.
          </p>
        </>
      )}
    </Article>
  )
}
