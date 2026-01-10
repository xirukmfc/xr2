"use client"

import { useLocale } from "@/contexts/locale-context"
import Link from "next/link"

const content = {
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: January 2025",
    sections: [
      {
        title: "1. Agreement to Terms",
        content: `These Terms of Service ("Terms") constitute a legally binding agreement between you ("User" or "you") and xR2 ("Company," "we," "our," or "us") governing your access to and use of the xr2.uk website and all related services, applications, and APIs (collectively, the "Services").

By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Services.

These Terms should be read together with our [Privacy Policy](/legal/privacy) and [Cookie Policy](/legal/cookies), which are incorporated herein by reference.`
      },
      {
        title: "2. Description of Services",
        content: `xR2 provides a prompt management and optimization platform that enables users to:
- Create, edit, and manage AI prompts
- Implement version control for prompt iterations
- Conduct A/B testing to compare prompt performance
- Access analytics and performance metrics
- Integrate with third-party services via API
- Collaborate with team members within workspaces

We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Services.`
      },
      {
        title: "3. Eligibility and Account Registration",
        content: `**Eligibility**
To use the Services, you must be at least 16 years of age (or the age of majority in your jurisdiction, if higher). By using the Services, you represent and warrant that you meet these eligibility requirements.

**Account Registration**
To access certain features of the Services, you must create an account. When registering, you agree to:
- Provide accurate, current, and complete information
- Maintain and promptly update your account information
- Maintain the confidentiality of your login credentials
- Accept responsibility for all activities that occur under your account
- Notify us immediately of any unauthorized access to your account

**Account Security**
You are solely responsible for maintaining the security of your account credentials. We are not liable for any loss or damage arising from your failure to protect your account information.`
      },
      {
        title: "4. Acceptable Use",
        content: `You agree to use the Services only for lawful purposes and in accordance with these Terms. You shall not:

**Prohibited Conduct**
- Violate any applicable laws, regulations, or third-party rights
- Use the Services to generate, store, or transmit content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable
- Attempt to gain unauthorized access to the Services, other accounts, computer systems, or networks
- Interfere with or disrupt the integrity or performance of the Services
- Upload or transmit viruses, malware, or other malicious code
- Use automated systems, bots, or scrapers to access the Services without our express written permission
- Reverse engineer, decompile, or disassemble any aspect of the Services
- Circumvent, disable, or otherwise interfere with security-related features
- Impersonate any person or entity or misrepresent your affiliation

**API Usage**
If you access the Services via API, you must comply with any applicable rate limits, usage guidelines, and documentation. Unauthorized use of the API may result in immediate suspension of access.`
      },
      {
        title: "5. User Content",
        content: `**Ownership**
You retain all ownership rights in the content you create, upload, or submit through the Services ("User Content"), including prompts, configurations, and workspace data.

**License Grant**
By submitting User Content to the Services, you grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and display such content solely for the purpose of providing and improving the Services. This license terminates when you delete your User Content or account, except where retention is required by law.

**Your Responsibilities**
You are solely responsible for your User Content and represent that:
- You own or have the necessary rights to use and authorize use of your User Content
- Your User Content does not infringe any third-party intellectual property or other rights
- Your User Content complies with these Terms and all applicable laws`
      },
      {
        title: "6. Intellectual Property",
        content: `**Our Intellectual Property**
The Services, including all software, text, graphics, logos, icons, images, and other content provided by us (excluding User Content), are owned by or licensed to xR2 and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Services without our prior written consent.

**Limited License**
Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your internal business purposes.

**Feedback**
If you provide us with suggestions, ideas, or other feedback regarding the Services ("Feedback"), you grant us a perpetual, irrevocable, royalty-free license to use, modify, and incorporate such Feedback into the Services without any obligation to you.`
      },
      {
        title: "7. Fees and Payment",
        content: `**Subscription Plans**
Certain features of the Services may require payment of fees. Fee schedules and payment terms are displayed on our website and may be updated from time to time.

**Payment Terms**
All fees are due in advance and are payable in the currency specified at the time of purchase. You authorize us to charge your designated payment method for all applicable fees.

**Taxes**
Fees are exclusive of all applicable taxes, levies, or duties. You are responsible for paying all such taxes, except for taxes based on our income.

**Changes to Fees**
We may modify our fees upon reasonable notice. Fee changes will not apply to the current billing period but will take effect at the next renewal.`
      },
      {
        title: "8. Disclaimer of Warranties",
        content: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

We do not warrant that:
- The Services will meet your specific requirements
- The Services will be uninterrupted, timely, secure, or error-free
- The results obtained from the Services will be accurate or reliable
- Any errors in the Services will be corrected

**AI-Generated Content**
Content generated through the Services using AI models may contain errors, inaccuracies, or inappropriate material. You acknowledge that you are solely responsible for reviewing and validating all AI-generated outputs before any use, and we expressly disclaim any liability for such content.`
      },
      {
        title: "9. Limitation of Liability",
        content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

**Exclusion of Damages**
IN NO EVENT SHALL XR2, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE SERVICES, REGARDLESS OF THE THEORY OF LIABILITY.

**Liability Cap**
OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO US DURING THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS (USD 100), WHICHEVER IS GREATER.

**Essential Purpose**
THE LIMITATIONS IN THIS SECTION APPLY EVEN IF ANY LIMITED REMEDY FAILS OF ITS ESSENTIAL PURPOSE.

Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, our liability shall be limited to the maximum extent permitted by law.`
      },
      {
        title: "10. Indemnification",
        content: `You agree to indemnify, defend, and hold harmless xR2 and its affiliates, officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to:

- Your access to or use of the Services
- Your User Content
- Your violation of these Terms
- Your violation of any third-party rights
- Your violation of any applicable laws or regulations

We reserve the right, at our own expense, to assume the exclusive defense and control of any matter subject to indemnification by you.`
      },
      {
        title: "11. Term and Termination",
        content: `**Term**
These Terms commence when you first access the Services and continue until terminated.

**Termination by You**
You may terminate your account at any time by using the account deletion feature in the Services or by contacting us at hello@xr2.uk.

**Termination by Us**
We may suspend or terminate your access to the Services immediately, without prior notice or liability, if:
- You breach any provision of these Terms
- We are required to do so by law
- We discontinue the Services

**Effect of Termination**
Upon termination:
- Your right to access and use the Services ceases immediately
- We may delete your account and User Content after a reasonable period (typically 30 days)
- Provisions of these Terms that by their nature should survive termination shall survive, including intellectual property, disclaimers, limitations of liability, and indemnification`
      },
      {
        title: "12. Governing Law and Dispute Resolution",
        content: `**Governing Law**
These Terms shall be governed by and construed in accordance with:
- For users in the European Union: the laws of your country of residence, subject to applicable EU regulations
- For users in the United Kingdom: the laws of England and Wales
- For users in the Russian Federation: the laws of the Russian Federation
- For all other users: the laws of England and Wales

**Informal Resolution**
Before initiating any formal dispute proceedings, you agree to contact us at hello@xr2.uk to attempt to resolve the dispute informally. We will endeavor to respond within thirty (30) days.

**Jurisdiction**
Any legal action or proceeding arising out of these Terms shall be brought exclusively in the courts of the applicable jurisdiction as determined above, and you consent to the personal jurisdiction of such courts.

**EU Consumers**
If you are a consumer in the European Union, you may also be entitled to bring proceedings in the courts of your country of residence and may submit disputes to the European Commission's Online Dispute Resolution platform at https://ec.europa.eu/consumers/odr.`
      },
      {
        title: "13. Changes to Terms",
        content: `We reserve the right to modify these Terms at any time. When we make material changes:
- We will update the "Last updated" date at the top of these Terms
- We will notify you by email or through the Services prior to the changes taking effect
- For users in the EU/UK, we will provide at least thirty (30) days' notice before material changes take effect

Your continued use of the Services after the effective date of any changes constitutes your acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Services.`
      },
      {
        title: "14. General Provisions",
        content: `**Entire Agreement**
These Terms, together with the Privacy Policy and Cookie Policy, constitute the entire agreement between you and xR2 regarding the Services and supersede all prior agreements and understandings.

**Severability**
If any provision of these Terms is held to be invalid or unenforceable, such provision shall be modified to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.

**Waiver**
Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.

**Assignment**
You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations without restriction.

**Force Majeure**
We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor disputes, or infrastructure failures.

**No Third-Party Beneficiaries**
These Terms do not confer any rights on any third party.`
      },
      {
        title: "15. Contact Information",
        content: `If you have questions about these Terms of Service, please contact us:

Email: hello@xr2.uk
Website: https://xr2.uk`
      }
    ]
  },
  ru: {
    title: "Правила использования",
    lastUpdated: "Последнее обновление: январь 2025 г.",
    sections: [
      {
        title: "1. Согласие с условиями",
        content: `Настоящие Правила использования («Правила») представляют собой юридически обязывающее соглашение между вами («Пользователь» или «вы») и xR2 («Компания», «мы», «наш» или «нас»), регулирующее ваш доступ к веб-сайту xr2.uk и всем связанным услугам, приложениям и API (совместно именуемым «Услуги») и их использование.

Получая доступ к Услугам или используя их, вы подтверждаете, что прочитали, поняли настоящие Правила и согласны быть связанными ими. Если вы не согласны с настоящими Правилами, вы не должны получать доступ к Услугам или использовать их.

Настоящие Правила следует читать совместно с нашей [Политикой конфиденциальности](/legal/privacy) и [Политикой в отношении файлов cookie](/legal/cookies), которые включены в настоящий документ посредством ссылки.`
      },
      {
        title: "2. Описание Услуг",
        content: `xR2 предоставляет платформу для управления и оптимизации промптов, которая позволяет пользователям:
- Создавать, редактировать и управлять AI-промптами
- Осуществлять контроль версий итераций промптов
- Проводить A/B-тестирование для сравнения эффективности промптов
- Получать доступ к аналитике и метрикам производительности
- Интегрироваться со сторонними сервисами через API
- Сотрудничать с членами команды в рабочих пространствах

Мы оставляем за собой право изменять, приостанавливать или прекращать любой аспект Услуг в любое время с уведомлением или без него. Мы не несём ответственности перед вами или любой третьей стороной за любое изменение, приостановление или прекращение предоставления Услуг.`
      },
      {
        title: "3. Право на использование и регистрация учётной записи",
        content: `**Право на использование**
Для использования Услуг вам должно быть не менее 16 лет (или возраста совершеннолетия в вашей юрисдикции, если он выше). Используя Услуги, вы заявляете и гарантируете, что соответствуете этим требованиям.

**Регистрация учётной записи**
Для доступа к определённым функциям Услуг необходимо создать учётную запись. При регистрации вы соглашаетесь:
- Предоставлять точную, актуальную и полную информацию
- Поддерживать и своевременно обновлять информацию учётной записи
- Сохранять конфиденциальность учётных данных для входа
- Нести ответственность за все действия, совершаемые под вашей учётной записью
- Немедленно уведомлять нас о любом несанкционированном доступе к вашей учётной записи

**Безопасность учётной записи**
Вы несёте единоличную ответственность за поддержание безопасности учётных данных. Мы не несём ответственности за любые убытки или ущерб, возникшие в результате вашей неспособности защитить информацию учётной записи.`
      },
      {
        title: "4. Допустимое использование",
        content: `Вы соглашаетесь использовать Услуги только в законных целях и в соответствии с настоящими Правилами. Вы не должны:

**Запрещённое поведение**
- Нарушать любые применимые законы, правила или права третьих лиц
- Использовать Услуги для создания, хранения или передачи контента, который является незаконным, вредоносным, угрожающим, оскорбительным, клеветническим или иным образом неприемлемым
- Пытаться получить несанкционированный доступ к Услугам, другим учётным записям, компьютерным системам или сетям
- Вмешиваться в работу или нарушать целостность или производительность Услуг
- Загружать или передавать вирусы, вредоносное ПО или иной вредоносный код
- Использовать автоматизированные системы, ботов или скраперы для доступа к Услугам без нашего письменного разрешения
- Проводить обратную разработку, декомпиляцию или дизассемблирование любого аспекта Услуг
- Обходить, отключать или иным образом вмешиваться в функции безопасности
- Выдавать себя за другое лицо или организацию

**Использование API**
При доступе к Услугам через API вы обязаны соблюдать применимые лимиты, рекомендации по использованию и документацию. Несанкционированное использование API может повлечь немедленную приостановку доступа.`
      },
      {
        title: "5. Пользовательский контент",
        content: `**Право собственности**
Вы сохраняете все права собственности на контент, который вы создаёте, загружаете или отправляете через Услуги («Пользовательский контент»), включая промпты, конфигурации и данные рабочего пространства.

**Предоставление лицензии**
Отправляя Пользовательский контент в Услуги, вы предоставляете нам всемирную, неисключительную, безвозмездную лицензию на размещение, хранение, воспроизведение и отображение такого контента исключительно в целях предоставления и улучшения Услуг. Эта лицензия прекращается при удалении вами Пользовательского контента или учётной записи, за исключением случаев, когда хранение требуется по закону.

**Ваша ответственность**
Вы несёте единоличную ответственность за свой Пользовательский контент и заявляете, что:
- Вы владеете или имеете необходимые права на использование и разрешение использования вашего Пользовательского контента
- Ваш Пользовательский контент не нарушает интеллектуальную собственность или иные права третьих лиц
- Ваш Пользовательский контент соответствует настоящим Правилам и всем применимым законам`
      },
      {
        title: "6. Интеллектуальная собственность",
        content: `**Наша интеллектуальная собственность**
Услуги, включая всё программное обеспечение, текст, графику, логотипы, значки, изображения и иной контент, предоставляемый нами (за исключением Пользовательского контента), принадлежат xR2 или лицензированы нами и защищены авторским правом, товарными знаками и иными законами об интеллектуальной собственности. Вы не вправе копировать, изменять, распространять, продавать или сдавать в аренду какую-либо часть наших Услуг без нашего предварительного письменного согласия.

**Ограниченная лицензия**
При условии соблюдения вами настоящих Правил мы предоставляем вам ограниченную, неисключительную, непередаваемую, отзывную лицензию на доступ и использование Услуг для ваших внутренних деловых целей.

**Обратная связь**
Если вы предоставляете нам предложения, идеи или иную обратную связь относительно Услуг («Обратная связь»), вы предоставляете нам бессрочную, безотзывную, безвозмездную лицензию на использование, изменение и включение такой Обратной связи в Услуги без каких-либо обязательств перед вами.`
      },
      {
        title: "7. Тарифы и оплата",
        content: `**Тарифные планы**
Определённые функции Услуг могут требовать оплаты. Расценки и условия оплаты отображаются на нашем веб-сайте и могут время от времени обновляться.

**Условия оплаты**
Все платежи вносятся авансом и подлежат оплате в валюте, указанной на момент покупки. Вы уполномочиваете нас списывать все применимые платежи с указанного вами способа оплаты.

**Налоги**
Тарифы не включают применимые налоги, сборы или пошлины. Вы несёте ответственность за уплату всех таких налогов, за исключением налогов, основанных на нашем доходе.

**Изменение тарифов**
Мы можем изменять наши тарифы с разумным предварительным уведомлением. Изменения тарифов не применяются к текущему расчётному периоду, но вступают в силу при следующем продлении.`
      },
      {
        title: "8. Отказ от гарантий",
        content: `УСЛУГИ ПРЕДОСТАВЛЯЮТСЯ «КАК ЕСТЬ» И «ПО МЕРЕ ДОСТУПНОСТИ» БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, ЯВНЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ, ВКЛЮЧАЯ, ПОМИМО ПРОЧЕГО, ПОДРАЗУМЕВАЕМЫЕ ГАРАНТИИ ТОВАРНОЙ ПРИГОДНОСТИ, ПРИГОДНОСТИ ДЛЯ ОПРЕДЕЛЁННОЙ ЦЕЛИ, ПРАВА СОБСТВЕННОСТИ И ОТСУТСТВИЯ НАРУШЕНИЙ.

Мы не гарантируем, что:
- Услуги будут соответствовать вашим конкретным требованиям
- Услуги будут предоставляться бесперебойно, своевременно, безопасно или без ошибок
- Результаты, полученные от Услуг, будут точными или надёжными
- Любые ошибки в Услугах будут исправлены

**Контент, генерируемый ИИ**
Контент, создаваемый через Услуги с использованием моделей ИИ, может содержать ошибки, неточности или неуместный материал. Вы признаёте, что несёте единоличную ответственность за проверку и валидацию всех результатов работы ИИ перед любым использованием, и мы прямо отказываемся от какой-либо ответственности за такой контент.`
      },
      {
        title: "9. Ограничение ответственности",
        content: `В МАКСИМАЛЬНОЙ СТЕПЕНИ, ДОПУСКАЕМОЙ ПРИМЕНИМЫМ ЗАКОНОДАТЕЛЬСТВОМ:

**Исключение убытков**
НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ XR2, ЕГО АФФИЛИРОВАННЫЕ ЛИЦА, ДОЛЖНОСТНЫЕ ЛИЦА, ДИРЕКТОРА, СОТРУДНИКИ ИЛИ АГЕНТЫ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ЗА КАКИЕ-ЛИБО КОСВЕННЫЕ, СЛУЧАЙНЫЕ, ОСОБЫЕ, ПОСЛЕДУЮЩИЕ ИЛИ ШТРАФНЫЕ УБЫТКИ, ВКЛЮЧАЯ, ПОМИМО ПРОЧЕГО, ПОТЕРЮ ПРИБЫЛИ, ДАННЫХ, ДЕЛОВЫХ ВОЗМОЖНОСТЕЙ ИЛИ ДЕЛОВОЙ РЕПУТАЦИИ, ВОЗНИКАЮЩИЕ ИЗ ИЛИ В СВЯЗИ С НАСТОЯЩИМИ ПРАВИЛАМИ ИЛИ УСЛУГАМИ, НЕЗАВИСИМО ОТ ТЕОРИИ ОТВЕТСТВЕННОСТИ.

**Лимит ответственности**
НАША СОВОКУПНАЯ ОТВЕТСТВЕННОСТЬ ПО ЛЮБЫМ ПРЕТЕНЗИЯМ, ВОЗНИКАЮЩИМ ИЗ НАСТОЯЩИХ ПРАВИЛ ИЛИ УСЛУГ ИЛИ СВЯЗАННЫМ С НИМИ, НЕ ПРЕВЫШАЕТ СУММ, УПЛАЧЕННЫХ ВАМИ НАМ В ТЕЧЕНИЕ ДВЕНАДЦАТИ (12) МЕСЯЦЕВ, ПРЕДШЕСТВУЮЩИХ ПРЕТЕНЗИИ, ИЛИ СТА ДОЛЛАРОВ США (100 USD), В ЗАВИСИМОСТИ ОТ ТОГО, ЧТО БОЛЬШЕ.

**Существенная цель**
ОГРАНИЧЕНИЯ, ИЗЛОЖЕННЫЕ В НАСТОЯЩЕМ РАЗДЕЛЕ, ПРИМЕНЯЮТСЯ ДАЖЕ В СЛУЧАЕ НЕУДАЧИ ЛЮБОГО ОГРАНИЧЕННОГО СРЕДСТВА ПРАВОВОЙ ЗАЩИТЫ В ДОСТИЖЕНИИ ЕГО СУЩЕСТВЕННОЙ ЦЕЛИ.

В некоторых юрисдикциях не допускается исключение или ограничение определённых убытков. В таких юрисдикциях наша ответственность ограничивается в максимальной степени, допускаемой законом.`
      },
      {
        title: "10. Возмещение убытков",
        content: `Вы соглашаетесь освободить от ответственности, защищать и ограждать xR2 и его аффилированные лица, должностных лиц, директоров, сотрудников и агентов от любых претензий, обязательств, убытков, потерь, расходов и издержек (включая разумные судебные расходы), возникающих из или связанных с:

- Вашим доступом к Услугам или их использованием
- Вашим Пользовательским контентом
- Вашим нарушением настоящих Правил
- Вашим нарушением любых прав третьих лиц
- Вашим нарушением любых применимых законов или нормативных актов

Мы оставляем за собой право за свой счёт принять на себя исключительную защиту и контроль над любым вопросом, подлежащим возмещению с вашей стороны.`
      },
      {
        title: "11. Срок действия и прекращение",
        content: `**Срок действия**
Настоящие Правила вступают в силу с момента вашего первого доступа к Услугам и действуют до их прекращения.

**Прекращение с вашей стороны**
Вы можете прекратить действие своей учётной записи в любое время, используя функцию удаления учётной записи в Услугах или связавшись с нами по адресу hello@xr2.uk.

**Прекращение с нашей стороны**
Мы можем приостановить или прекратить ваш доступ к Услугам немедленно, без предварительного уведомления или ответственности, если:
- Вы нарушаете любое положение настоящих Правил
- Мы обязаны сделать это по закону
- Мы прекращаем предоставление Услуг

**Последствия прекращения**
При прекращении:
- Ваше право доступа к Услугам и их использования немедленно прекращается
- Мы можем удалить вашу учётную запись и Пользовательский контент по истечении разумного срока (как правило, 30 дней)
- Положения настоящих Правил, которые по своей природе должны сохраниться после прекращения, продолжают действовать, включая положения об интеллектуальной собственности, отказе от гарантий, ограничении ответственности и возмещении убытков`
      },
      {
        title: "12. Применимое право и разрешение споров",
        content: `**Применимое право**
Настоящие Правила регулируются и толкуются в соответствии с:
- Для пользователей в Европейском союзе: законодательством вашей страны проживания с учётом применимых норм ЕС
- Для пользователей в Великобритании: законодательством Англии и Уэльса
- Для пользователей в Российской Федерации: законодательством Российской Федерации
- Для всех остальных пользователей: законодательством Англии и Уэльса

**Неформальное урегулирование**
Перед началом любых формальных процедур разрешения споров вы соглашаетесь связаться с нами по адресу hello@xr2.uk для попытки неформального урегулирования спора. Мы постараемся ответить в течение тридцати (30) дней.

**Юрисдикция**
Любые судебные действия или разбирательства, возникающие из настоящих Правил, подлежат исключительной юрисдикции судов применимой юрисдикции, определённой выше, и вы соглашаетесь с персональной юрисдикцией таких судов.

**Потребители ЕС**
Если вы являетесь потребителем в Европейском союзе, вы также можете иметь право возбуждать разбирательства в судах вашей страны проживания и подавать споры на платформу онлайн-разрешения споров Европейской комиссии по адресу https://ec.europa.eu/consumers/odr.`
      },
      {
        title: "13. Изменения Правил",
        content: `Мы оставляем за собой право изменять настоящие Правила в любое время. При внесении существенных изменений:
- Мы обновим дату «Последнее обновление» в начале настоящих Правил
- Мы уведомим вас по электронной почте или через Услуги до вступления изменений в силу
- Для пользователей в ЕС/Великобритании мы предоставим уведомление не менее чем за тридцать (30) дней до вступления существенных изменений в силу

Продолжение использования вами Услуг после даты вступления в силу любых изменений означает ваше согласие с изменёнными Правилами. Если вы не согласны с изменёнными Правилами, вы должны прекратить использование Услуг.`
      },
      {
        title: "14. Общие положения",
        content: `**Полное соглашение**
Настоящие Правила вместе с Политикой конфиденциальности и Политикой в отношении файлов cookie составляют полное соглашение между вами и xR2 в отношении Услуг и заменяют все предшествующие соглашения и договорённости.

**Делимость**
Если какое-либо положение настоящих Правил будет признано недействительным или неисполнимым, такое положение подлежит изменению в минимально необходимой степени, а остальные положения продолжают действовать в полной силе.

**Отказ от права**
Наше неосуществление какого-либо права или положения настоящих Правил не является отказом от такого права или положения.

**Уступка**
Вы не вправе уступать или передавать свои права или обязанности по настоящим Правилам без нашего предварительного письменного согласия. Мы можем уступать наши права и обязанности без ограничений.

**Форс-мажор**
Мы не несём ответственности за любое неисполнение или задержку исполнения вследствие обстоятельств, находящихся за пределами нашего разумного контроля, включая, помимо прочего, стихийные бедствия, войны, терроризм, трудовые споры или отказы инфраструктуры.

**Отсутствие третьих лиц — выгодоприобретателей**
Настоящие Правила не предоставляют каких-либо прав третьим лицам.`
      },
      {
        title: "15. Контактная информация",
        content: `Если у вас есть вопросы о настоящих Правилах использования, свяжитесь с нами:

Электронная почта: hello@xr2.uk
Веб-сайт: https://xr2.uk`
      }
    ]
  }
}

export default function TermsOfServicePage() {
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
