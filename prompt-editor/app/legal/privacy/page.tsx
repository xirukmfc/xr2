"use client"

import { useLocale } from "@/contexts/locale-context"
import Link from "next/link"

const content = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title: "1. Introduction",
        content: `This Privacy Policy explains how xR2 ("we," "our," or "us") collects, uses, discloses, and protects your personal data when you use our website xr2.uk and related services ("Services").

We are committed to protecting your privacy and processing your personal data in accordance with applicable data protection laws, including:
- The EU General Data Protection Regulation (GDPR) 2016/679
- The UK General Data Protection Regulation and Data Protection Act 2018
- Federal Law No. 152-FZ of the Russian Federation "On Personal Data"

By using our Services, you acknowledge that you have read and understood this Privacy Policy.`
      },
      {
        title: "2. Data Controller",
        content: `xR2 is the data controller responsible for the processing of your personal data collected through the Services.

For inquiries regarding data protection, please contact us at: hello@xr2.uk`
      },
      {
        title: "3. Personal Data We Collect",
        content: `We collect personal data in the following categories:

**Data You Provide Directly**
- Account registration data: email address, name, password
- Profile information: company name, job title
- User-generated content: prompts, configurations, and workspace settings you create
- Communications: correspondence when you contact our support team

**Data Collected Automatically**
- Technical data: IP address, browser type and version, operating system, device identifiers
- Usage data: pages visited, features used, timestamps, API interactions
- Cookies and similar technologies: as described in our [Cookie Policy](/legal/cookies)

**Data from Third Parties**
- Authentication data: when you sign in using a third-party provider (e.g., Google, GitHub)
- Payment confirmation: transaction status from payment processors (we do not receive or store your payment card details)`
      },
      {
        title: "4. Purposes of Processing",
        content: `We process your personal data for the following purposes:

**Service Delivery**
- To create and manage your account
- To provide access to the Services and their features
- To process and respond to your support requests
- To personalize your experience based on your preferences

**Service Improvement**
- To analyze usage patterns and optimize the Services
- To develop new features and functionality
- To conduct internal research and analytics

**Legal and Security**
- To comply with applicable laws and regulatory requirements
- To enforce our Terms of Service
- To protect the security and integrity of the Services
- To detect, prevent, and respond to fraud or unauthorized access

**Communication**
- To send service-related notifications (e.g., account updates, security alerts)
- To inform you of material changes to our policies or Services`
      },
      {
        title: "5. Legal Basis for Processing",
        content: `Under the GDPR and UK GDPR, we process your personal data on the following legal bases:

**Performance of Contract (Article 6(1)(b))**
Processing necessary to provide the Services to you, including account management and service delivery.

**Legitimate Interests (Article 6(1)(f))**
Processing necessary for our legitimate business interests, including service improvement, security, and fraud prevention. We balance these interests against your rights and freedoms.

**Legal Obligation (Article 6(1)(c))**
Processing necessary to comply with applicable laws and regulations.

**Consent (Article 6(1)(a))**
Where we rely on consent (e.g., for marketing communications or non-essential cookies), you may withdraw your consent at any time.

Under Federal Law 152-FZ of the Russian Federation, we process personal data based on your consent or other lawful grounds established by law.`
      },
      {
        title: "6. Data Sharing and Disclosure",
        content: `We may share your personal data with the following categories of recipients:

**Service Providers**
Third-party vendors who process data on our behalf, including:
- Cloud infrastructure providers (hosting and storage)
- Analytics providers (anonymized usage data)
- Payment processors (transaction processing)
- Communication platforms (email delivery)

All service providers are bound by data processing agreements and may only process your data according to our instructions.

**Legal Disclosures**
We may disclose your data when required by law or in response to valid legal process, including court orders and government requests. We may also disclose data to protect our legal rights or the rights of third parties.

**Business Transfers**
In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the successor entity. We will notify you of any such change.`
      },
      {
        title: "7. Data Storage Location",
        content: `In accordance with applicable data protection laws, we store your personal data on servers located in jurisdictions appropriate to your country of residence:

**Users in the Russian Federation**
In compliance with Federal Law No. 152-FZ, personal data of Russian citizens is stored and processed on servers located within the territory of the Russian Federation.

**Users in the European Union and United Kingdom**
Personal data of EU and UK users is stored and processed on servers located in the United Kingdom, ensuring compliance with GDPR and UK GDPR requirements.

**Other Users**
Personal data of users from other jurisdictions is stored on servers located in the United Kingdom.`
      },
      {
        title: "8. International Data Transfers",
        content: `In certain circumstances, your personal data may need to be transferred to countries other than where it is primarily stored. When such transfers occur, we implement appropriate safeguards:

**Transfers from the EU/EEA**
- Standard Contractual Clauses approved by the European Commission
- Transfers only to countries recognized as providing adequate protection

**Transfers from the UK**
- International Data Transfer Agreement (UK SCCs)
- Transfers only to countries recognized by the UK as providing adequate protection

**Transfers from Russia**
- Compliance with cross-border transfer requirements under Federal Law 152-FZ
- Primary storage remains within Russia; transfers abroad only with appropriate legal basis and safeguards`
      },
      {
        title: "9. Data Retention",
        content: `We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected:

**Account Data**
Retained for the duration of your account. Upon account deletion, we will delete or anonymize your data within 30 days, unless retention is required by law.

**Transaction Records**
Retained for the period required by applicable tax and accounting regulations, typically 5-7 years.

**Log and Analytics Data**
Personal identifiers are removed or anonymized within 26 months. Aggregated, non-identifiable analytics data may be retained indefinitely.

**Legal Holds**
Data may be retained beyond standard periods when necessary to comply with legal obligations or to establish, exercise, or defend legal claims.`
      },
      {
        title: "10. Your Rights",
        content: `Subject to applicable law, you have the following rights regarding your personal data:

**Right of Access**
You may request confirmation of whether we process your personal data and obtain a copy of such data.

**Right to Rectification**
You may request correction of inaccurate or incomplete personal data.

**Right to Erasure**
You may request deletion of your personal data in certain circumstances, such as when the data is no longer necessary for the original purpose.

**Right to Restriction**
You may request that we restrict processing of your personal data in certain circumstances.

**Right to Data Portability**
You may request to receive your personal data in a structured, commonly used, machine-readable format.

**Right to Object**
You may object to processing based on legitimate interests. You may also object to processing for direct marketing purposes at any time.

**Right to Withdraw Consent**
Where processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.

To exercise your rights, please contact us at hello@xr2.uk. We will respond within the timeframes required by applicable law (generally 30 days under GDPR).`
      },
      {
        title: "11. Data Security",
        content: `We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:

- Encryption of data in transit using TLS
- Encryption of data at rest
- Access controls and authentication mechanisms
- Regular security assessments and monitoring
- Incident response procedures

While we take reasonable precautions, no method of electronic transmission or storage is completely secure. We cannot guarantee absolute security of your data.`
      },
      {
        title: "12. Children's Privacy",
        content: `The Services are not directed at children under the age of 16 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal data from children.

If you believe that a child has provided personal data to us, please contact us at hello@xr2.uk. We will take steps to delete such data.`
      },
      {
        title: "13. Supervisory Authorities",
        content: `If you have concerns about our data processing practices, we encourage you to contact us first at hello@xr2.uk.

You also have the right to lodge a complaint with a supervisory authority:

**EU Residents**
Contact the data protection authority in your EU Member State.

**UK Residents**
Information Commissioner's Office (ICO): https://ico.org.uk

**Russian Federation Residents**
Federal Service for Supervision of Communications, Information Technology and Mass Media (Roskomnadzor): https://rkn.gov.ru`
      },
      {
        title: "14. Changes to This Policy",
        content: `We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. When we make material changes, we will notify you by posting a notice on the Services or by other appropriate means.

The "Last updated" date at the top indicates when this policy was last revised. We encourage you to review this policy regularly.`
      },
      {
        title: "15. Contact Information",
        content: `If you have questions about this Privacy Policy or our data practices, please contact us:

Email: hello@xr2.uk
Website: https://xr2.uk`
      }
    ]
  },
  ru: {
    title: "Политика конфиденциальности",
    lastUpdated: "Последнее обновление: январь 2025 г.",
    sections: [
      {
        title: "1. Введение",
        content: `Настоящая Политика конфиденциальности разъясняет, как xR2 («мы», «наш» или «нас») собирает, использует, раскрывает и защищает ваши персональные данные при использовании вами веб-сайта xr2.uk и связанных услуг («Услуги»).

Мы обязуемся защищать вашу конфиденциальность и обрабатывать ваши персональные данные в соответствии с применимым законодательством о защите данных, включая:
- Общий регламент по защите данных ЕС (GDPR) 2016/679
- UK GDPR и Закон о защите данных Великобритании 2018 года
- Федеральный закон Российской Федерации № 152-ФЗ «О персональных данных»

Используя наши Услуги, вы подтверждаете, что ознакомились с настоящей Политикой конфиденциальности и поняли её содержание.`
      },
      {
        title: "2. Оператор персональных данных",
        content: `xR2 является оператором персональных данных, ответственным за обработку ваших персональных данных, собираемых посредством Услуг.

По вопросам защиты данных обращайтесь по адресу: hello@xr2.uk`
      },
      {
        title: "3. Персональные данные, которые мы собираем",
        content: `Мы собираем персональные данные следующих категорий:

**Данные, предоставляемые вами напрямую**
- Регистрационные данные: адрес электронной почты, имя, пароль
- Информация профиля: название компании, должность
- Пользовательский контент: создаваемые вами промпты, конфигурации и настройки рабочего пространства
- Коммуникации: переписка при обращении в службу поддержки

**Данные, собираемые автоматически**
- Технические данные: IP-адрес, тип и версия браузера, операционная система, идентификаторы устройства
- Данные об использовании: посещённые страницы, используемые функции, временные метки, взаимодействия с API
- Файлы cookie и аналогичные технологии: как описано в нашей [Политике в отношении файлов cookie](/legal/cookies)

**Данные от третьих сторон**
- Данные аутентификации: при входе через сторонний сервис (например, Google, GitHub)
- Подтверждение платежа: статус транзакции от платёжных систем (мы не получаем и не храним данные вашей платёжной карты)`
      },
      {
        title: "4. Цели обработки",
        content: `Мы обрабатываем ваши персональные данные в следующих целях:

**Предоставление Услуг**
- Создание и управление вашей учётной записью
- Обеспечение доступа к Услугам и их функциям
- Обработка и ответ на ваши обращения в службу поддержки
- Персонализация вашего опыта на основе ваших предпочтений

**Улучшение Услуг**
- Анализ моделей использования и оптимизация Услуг
- Разработка новых функций и возможностей
- Проведение внутренних исследований и аналитики

**Правовые и охранные цели**
- Соблюдение применимого законодательства и нормативных требований
- Обеспечение соблюдения наших Правил использования
- Защита безопасности и целостности Услуг
- Выявление, предотвращение и реагирование на мошенничество или несанкционированный доступ

**Коммуникация**
- Отправка уведомлений, связанных с Услугами (например, обновления учётной записи, предупреждения о безопасности)
- Информирование о существенных изменениях в наших политиках или Услугах`
      },
      {
        title: "5. Правовые основания обработки",
        content: `В соответствии с GDPR и UK GDPR мы обрабатываем ваши персональные данные на следующих правовых основаниях:

**Исполнение договора (статья 6(1)(b))**
Обработка, необходимая для предоставления вам Услуг, включая управление учётной записью и оказание услуг.

**Законные интересы (статья 6(1)(f))**
Обработка, необходимая для реализации наших законных деловых интересов, включая улучшение услуг, безопасность и предотвращение мошенничества. Мы соблюдаем баланс между этими интересами и вашими правами и свободами.

**Юридическое обязательство (статья 6(1)(c))**
Обработка, необходимая для соблюдения применимого законодательства и нормативных актов.

**Согласие (статья 6(1)(a))**
В случаях, когда мы полагаемся на согласие (например, для маркетинговых сообщений или необязательных файлов cookie), вы можете отозвать своё согласие в любое время.

В соответствии с Федеральным законом № 152-ФЗ Российской Федерации мы обрабатываем персональные данные на основании вашего согласия или иных законных оснований, установленных законодательством.`
      },
      {
        title: "6. Передача и раскрытие данных",
        content: `Мы можем передавать ваши персональные данные следующим категориям получателей:

**Поставщики услуг**
Сторонние поставщики, обрабатывающие данные от нашего имени:
- Поставщики облачной инфраструктуры (хостинг и хранение)
- Поставщики аналитических услуг (анонимизированные данные об использовании)
- Платёжные системы (обработка транзакций)
- Коммуникационные платформы (доставка электронной почты)

Все поставщики услуг связаны соглашениями об обработке данных и могут обрабатывать ваши данные только в соответствии с нашими инструкциями.

**Раскрытие по требованию закона**
Мы можем раскрывать ваши данные в соответствии с требованиями закона или в ответ на законные правовые процессы, включая судебные постановления и запросы государственных органов. Мы также можем раскрывать данные для защиты наших законных прав или прав третьих лиц.

**Передача бизнеса**
В случае слияния, поглощения или продажи активов ваши персональные данные могут быть переданы правопреемнику. Мы уведомим вас о любом таком изменении.`
      },
      {
        title: "7. Место хранения данных",
        content: `В соответствии с применимым законодательством о защите данных мы храним ваши персональные данные на серверах, расположенных в юрисдикциях, соответствующих вашей стране проживания:

**Пользователи в Российской Федерации**
В соответствии с требованиями Федерального закона № 152-ФЗ персональные данные граждан Российской Федерации хранятся и обрабатываются на серверах, расположенных на территории Российской Федерации.

**Пользователи в Европейском союзе и Великобритании**
Персональные данные пользователей из ЕС и Великобритании хранятся и обрабатываются на серверах, расположенных в Великобритании, что обеспечивает соответствие требованиям GDPR и UK GDPR.

**Прочие пользователи**
Персональные данные пользователей из других юрисдикций хранятся на серверах, расположенных в Великобритании.`
      },
      {
        title: "8. Международная передача данных",
        content: `В определённых обстоятельствах ваши персональные данные могут быть переданы в страны, отличные от места их основного хранения. При осуществлении таких передач мы применяем соответствующие меры защиты:

**Передача из ЕС/ЕЭЗ**
- Стандартные договорные положения, одобренные Европейской комиссией
- Передача только в страны, признанные обеспечивающими адекватную защиту

**Передача из Великобритании**
- Международное соглашение о передаче данных (UK SCCs)
- Передача только в страны, признанные Великобританией как обеспечивающие адекватную защиту

**Передача из России**
- Соблюдение требований к трансграничной передаче в соответствии с Федеральным законом № 152-ФЗ
- Основное хранение остаётся на территории России; передача за рубеж только при наличии надлежащего правового основания и мер защиты`
      },
      {
        title: "9. Сроки хранения данных",
        content: `Мы храним ваши персональные данные только в течение срока, необходимого для достижения целей, для которых они были собраны:

**Данные учётной записи**
Хранятся в течение срока действия вашей учётной записи. При удалении учётной записи мы удаляем или анонимизируем ваши данные в течение 30 дней, если только хранение не требуется по закону.

**Записи о транзакциях**
Хранятся в течение срока, предусмотренного применимым налоговым и бухгалтерским законодательством, как правило, 5-7 лет.

**Журналы и аналитические данные**
Персональные идентификаторы удаляются или анонимизируются в течение 26 месяцев. Агрегированные неидентифицируемые аналитические данные могут храниться бессрочно.

**Юридическое удержание**
Данные могут храниться сверх стандартных сроков, когда это необходимо для соблюдения юридических обязательств или для установления, осуществления или защиты правовых требований.`
      },
      {
        title: "10. Ваши права",
        content: `В соответствии с применимым законодательством вы обладаете следующими правами в отношении ваших персональных данных:

**Право на доступ**
Вы можете запросить подтверждение того, обрабатываем ли мы ваши персональные данные, и получить копию таких данных.

**Право на исправление**
Вы можете запросить исправление неточных или неполных персональных данных.

**Право на удаление**
Вы можете запросить удаление ваших персональных данных в определённых обстоятельствах, например, когда данные больше не нужны для первоначальной цели.

**Право на ограничение обработки**
Вы можете запросить ограничение обработки ваших персональных данных в определённых обстоятельствах.

**Право на переносимость данных**
Вы можете запросить получение ваших персональных данных в структурированном, общеупотребимом, машиночитаемом формате.

**Право на возражение**
Вы можете возразить против обработки на основании законных интересов. Вы также можете в любое время возразить против обработки в целях прямого маркетинга.

**Право на отзыв согласия**
В случаях, когда обработка основана на согласии, вы можете отозвать согласие в любое время без ущерба для законности обработки, осуществлявшейся до отзыва.

Для реализации своих прав обращайтесь по адресу hello@xr2.uk. Мы ответим в сроки, установленные применимым законодательством (как правило, 30 дней в соответствии с GDPR).`
      },
      {
        title: "11. Безопасность данных",
        content: `Мы применяем надлежащие технические и организационные меры для защиты ваших персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения. Эти меры включают:

- Шифрование данных при передаче с использованием TLS
- Шифрование данных при хранении
- Механизмы контроля доступа и аутентификации
- Регулярные оценки безопасности и мониторинг
- Процедуры реагирования на инциденты

Несмотря на принимаемые нами разумные меры предосторожности, ни один метод электронной передачи или хранения не является полностью безопасным. Мы не можем гарантировать абсолютную безопасность ваших данных.`
      },
      {
        title: "12. Конфиденциальность детей",
        content: `Услуги не предназначены для детей младше 16 лет (или применимого возраста цифрового согласия в вашей юрисдикции). Мы сознательно не собираем персональные данные детей.

Если вы считаете, что ребёнок предоставил нам персональные данные, свяжитесь с нами по адресу hello@xr2.uk. Мы примем меры по удалению таких данных.`
      },
      {
        title: "13. Надзорные органы",
        content: `При наличии опасений относительно нашей практики обработки данных мы рекомендуем сначала связаться с нами по адресу hello@xr2.uk.

Вы также имеете право подать жалобу в надзорный орган:

**Резиденты ЕС**
Обратитесь в орган по защите данных вашего государства — члена ЕС.

**Резиденты Великобритании**
Управление комиссара по информации (ICO): https://ico.org.uk

**Резиденты Российской Федерации**
Федеральная служба по надзору в сфере связи, информационных технологий и массовых коммуникаций (Роскомнадзор): https://rkn.gov.ru`
      },
      {
        title: "14. Изменения настоящей Политики",
        content: `Мы можем периодически обновлять настоящую Политику конфиденциальности для отражения изменений в нашей практике или применимом законодательстве. При внесении существенных изменений мы уведомим вас путём размещения уведомления в Услугах или иным надлежащим способом.

Дата «Последнее обновление» в начале документа указывает, когда Политика была пересмотрена в последний раз. Рекомендуем регулярно просматривать настоящую Политику.`
      },
      {
        title: "15. Контактная информация",
        content: `Если у вас есть вопросы о настоящей Политике конфиденциальности или нашей практике работы с данными, свяжитесь с нами:

Электронная почта: hello@xr2.uk
Веб-сайт: https://xr2.uk`
      }
    ]
  }
}

export default function PrivacyPolicyPage() {
  const { locale } = useLocale()
  const t = content[locale]

  const renderContent = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g)
    return parts.map((part, i) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/)
      if (linkMatch) {
        return (
          <Link key={i} href={linkMatch[2]} className="text-gray-900 underline hover:text-gray-600">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.lastUpdated}</p>
      </div>

      <div className="space-y-8">
        {t.sections.map((section, index) => (
          <section key={index}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
            <div className="text-gray-600 leading-relaxed space-y-3">
              {section.content.split('\n').map((paragraph, pIndex) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <p key={pIndex} className="font-semibold text-gray-900 mt-4">
                      {paragraph.replace(/\*\*/g, '')}
                    </p>
                  )
                }
                if (paragraph.startsWith('**') && paragraph.includes('**')) {
                  const match = paragraph.match(/\*\*(.+?)\*\*(.*)/)
                  if (match) {
                    return (
                      <p key={pIndex} className="mt-3">
                        <span className="font-semibold text-gray-900">{match[1]}</span>
                        <span className="text-gray-600">{match[2]}</span>
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
