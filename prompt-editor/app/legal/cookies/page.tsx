"use client"

import { useLocale } from "@/contexts/locale-context"
import Link from "next/link"

const content = {
  en: {
    title: "Cookie Policy",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title: "1. About This Policy",
        content: `This Cookie Policy describes how xR2 ("we," "our," or "us") uses cookies and similar tracking technologies when you visit our website xr2.uk ("Website").

This policy should be read together with our [Privacy Policy](/legal/privacy), which explains how we process personal data.

We comply with applicable data protection legislation, including the EU General Data Protection Regulation (GDPR), the UK GDPR, the Privacy and Electronic Communications Regulations (PECR), and Federal Law No. 152-FZ of the Russian Federation.`
      },
      {
        title: "2. What Are Cookies",
        content: `Cookies are small text files placed on your device by websites you visit. They serve various purposes: enabling website functionality, remembering your preferences, and collecting analytics data.

**Session cookies** are temporary and deleted when you close your browser.

**Persistent cookies** remain on your device for a predetermined period or until you delete them manually.`
      },
      {
        title: "3. Categories of Cookies We Use",
        content: `**Strictly Necessary Cookies**
These cookies are essential for the Website to function. They enable core features such as user authentication, session management, and security. Without these cookies, the Website cannot operate properly. These cookies do not require your consent under applicable law.

**Performance and Analytics Cookies**
We use Vercel Analytics to collect aggregated, anonymized data about how visitors interact with our Website. This helps us understand usage patterns and improve our services. These cookies are placed only with your consent.

**Functional Cookies**
These cookies remember your preferences, such as language settings and interface customizations, to provide a personalized experience. These cookies are placed only with your consent.`
      },
      {
        title: "4. Third-Party Cookies",
        content: `Our Website may include cookies set by third-party service providers:

**Vercel Analytics** — provides website performance metrics and anonymized usage statistics.

**Authentication Providers** — if you choose to sign in using a third-party service, that provider may set cookies on your device.

We do not control third-party cookies. Please refer to each provider's privacy policy for information about their data practices.`
      },
      {
        title: "5. Your Cookie Choices",
        content: `You can manage your cookie preferences in the following ways:

**Browser Settings**
Most web browsers allow you to control cookies through their settings. You can typically find these options in your browser's "Privacy" or "Security" menu. Common browsers provide controls at:
- Google Chrome: Settings → Privacy and security → Cookies
- Mozilla Firefox: Settings → Privacy & Security
- Apple Safari: Preferences → Privacy
- Microsoft Edge: Settings → Privacy, search, and services

**Consequences of Disabling Cookies**
If you disable strictly necessary cookies, certain features of the Website may not function correctly, including user authentication. Disabling analytics or functional cookies will not affect core Website functionality but may result in a less personalized experience.`
      },
      {
        title: "6. Legal Basis",
        content: `Under the GDPR and UK GDPR, we rely on the following legal bases for placing cookies:

**Strictly necessary cookies:** These are placed under the legitimate interest basis (Article 6(1)(f) GDPR), as they are required for the Website to function.

**Analytics and functional cookies:** These are placed only with your consent (Article 6(1)(a) GDPR). You may withdraw your consent at any time by adjusting your browser settings.`
      },
      {
        title: "7. Your Data Protection Rights",
        content: `You have rights regarding personal data collected through cookies as described in our [Privacy Policy](/legal/privacy). To exercise your rights, contact us at hello@xr2.uk.`
      },
      {
        title: "8. Updates to This Policy",
        content: `We may update this Cookie Policy periodically to reflect changes in our practices or applicable law. The "Last updated" date at the top indicates when this policy was last revised. We encourage you to review this policy regularly.`
      },
      {
        title: "9. Contact Information",
        content: `If you have questions about this Cookie Policy, please contact us:

Email: hello@xr2.uk
Website: https://xr2.uk`
      }
    ]
  },
  ru: {
    title: "Политика в отношении файлов cookie",
    lastUpdated: "Последнее обновление: январь 2025 г.",
    sections: [
      {
        title: "1. О настоящей Политике",
        content: `Настоящая Политика в отношении файлов cookie описывает, как xR2 («мы», «наш» или «нас») использует файлы cookie и аналогичные технологии отслеживания при посещении вами веб-сайта xr2.uk («Веб-сайт»).

Настоящую Политику следует читать совместно с нашей [Политикой конфиденциальности](/legal/privacy), которая разъясняет порядок обработки персональных данных.

Мы соблюдаем применимое законодательство о защите данных, включая Общий регламент по защите данных ЕС (GDPR), UK GDPR, Правила конфиденциальности и электронных коммуникаций (PECR) и Федеральный закон Российской Федерации № 152-ФЗ «О персональных данных».`
      },
      {
        title: "2. Что такое файлы cookie",
        content: `Файлы cookie — это небольшие текстовые файлы, размещаемые на вашем устройстве посещаемыми веб-сайтами. Они выполняют различные функции: обеспечивают работу веб-сайта, сохраняют ваши предпочтения и собирают аналитические данные.

**Сеансовые файлы cookie** являются временными и удаляются при закрытии браузера.

**Постоянные файлы cookie** сохраняются на вашем устройстве в течение установленного срока или до их удаления вами вручную.`
      },
      {
        title: "3. Категории используемых файлов cookie",
        content: `**Строго необходимые файлы cookie**
Эти файлы cookie необходимы для функционирования Веб-сайта. Они обеспечивают основные функции: аутентификацию пользователей, управление сеансами и безопасность. Без этих файлов cookie Веб-сайт не может работать надлежащим образом. Данные файлы cookie не требуют вашего согласия в соответствии с применимым законодательством.

**Аналитические файлы cookie**
Мы используем Vercel Analytics для сбора агрегированных анонимизированных данных о взаимодействии посетителей с Веб-сайтом. Это помогает нам анализировать модели использования и улучшать наши услуги. Эти файлы cookie размещаются только с вашего согласия.

**Функциональные файлы cookie**
Эти файлы cookie сохраняют ваши предпочтения, такие как языковые настройки и параметры интерфейса, для обеспечения персонализированного опыта. Эти файлы cookie размещаются только с вашего согласия.`
      },
      {
        title: "4. Сторонние файлы cookie",
        content: `На нашем Веб-сайте могут размещаться файлы cookie сторонних поставщиков услуг:

**Vercel Analytics** — предоставляет метрики производительности веб-сайта и анонимизированную статистику использования.

**Провайдеры аутентификации** — если вы выбираете вход через сторонний сервис, этот провайдер может размещать файлы cookie на вашем устройстве.

Мы не контролируем сторонние файлы cookie. Для получения информации о практиках обработки данных обратитесь к политике конфиденциальности соответствующего провайдера.`
      },
      {
        title: "5. Управление файлами cookie",
        content: `Вы можете управлять настройками файлов cookie следующими способами:

**Настройки браузера**
Большинство веб-браузеров позволяют управлять файлами cookie через свои настройки. Обычно эти параметры находятся в меню «Конфиденциальность» или «Безопасность» вашего браузера:
- Google Chrome: Настройки → Конфиденциальность и безопасность → Файлы cookie
- Mozilla Firefox: Настройки → Приватность и защита
- Apple Safari: Настройки → Конфиденциальность
- Microsoft Edge: Параметры → Конфиденциальность, поиск и службы

**Последствия отключения файлов cookie**
При отключении строго необходимых файлов cookie отдельные функции Веб-сайта могут работать некорректно, включая аутентификацию пользователей. Отключение аналитических или функциональных файлов cookie не повлияет на основную функциональность Веб-сайта, но может привести к менее персонализированному опыту.`
      },
      {
        title: "6. Правовое основание",
        content: `В соответствии с GDPR и UK GDPR мы используем следующие правовые основания для размещения файлов cookie:

**Строго необходимые файлы cookie:** размещаются на основании законного интереса (статья 6(1)(f) GDPR), поскольку они необходимы для функционирования Веб-сайта.

**Аналитические и функциональные файлы cookie:** размещаются только с вашего согласия (статья 6(1)(a) GDPR). Вы можете отозвать своё согласие в любое время, изменив настройки браузера.`
      },
      {
        title: "7. Ваши права в отношении защиты данных",
        content: `Вы обладаете правами в отношении персональных данных, собираемых посредством файлов cookie, как описано в нашей [Политике конфиденциальности](/legal/privacy). Для реализации своих прав свяжитесь с нами по адресу hello@xr2.uk.`
      },
      {
        title: "8. Изменения настоящей Политики",
        content: `Мы можем периодически обновлять настоящую Политику в отношении файлов cookie для отражения изменений в нашей практике или применимом законодательстве. Дата «Последнее обновление» в начале документа указывает, когда Политика была пересмотрена в последний раз. Рекомендуем регулярно просматривать настоящую Политику.`
      },
      {
        title: "9. Контактная информация",
        content: `Если у вас есть вопросы о настоящей Политике в отношении файлов cookie, свяжитесь с нами:

Электронная почта: hello@xr2.uk
Веб-сайт: https://xr2.uk`
      }
    ]
  }
}

export default function CookiePolicyPage() {
  const { locale } = useLocale()
  const t = content[locale]

  const renderContent = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g)
    return parts.map((part, i) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
      if (linkMatch) {
        return (
          <Link key={i} href={linkMatch[2]} className="text-foreground underline hover:text-muted-foreground">
            {linkMatch[1]}
          </Link>
        )
      }
      return part
    })
  }

  return (
    <article className="max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        {t.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-semibold text-foreground mb-4">{section.title}</h2>
            <div className="text-muted-foreground leading-relaxed space-y-3">
              {section.content.split('\n').map((paragraph, pIndex) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <p key={pIndex} className="font-semibold text-foreground mt-4">
                      {paragraph.replace(/\*\*/g, '')}
                    </p>
                  )
                }
                if (paragraph.startsWith('**') && paragraph.includes('**')) {
                  const match = paragraph.match(/\*\*(.+?)\*\*(.*)/)
                  if (match) {
                    return (
                      <p key={pIndex} className="mt-3">
                        <span className="font-semibold text-foreground">{match[1]}</span>
                        <span className="text-muted-foreground">{match[2]}</span>
                      </p>
                    )
                  }
                }
                if (paragraph.startsWith('- ')) {
                  return (
                    <p key={pIndex} className="ml-4">{paragraph}</p>
                  )
                }
                if (paragraph.trim()) {
                  return <p key={pIndex}>{renderContent(paragraph)}</p>
                }
                return null
              })}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
