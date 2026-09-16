export interface EditableStructureField { key: string; copyId: string; uk: string; ru: string; en: string; }
export interface EditableStructureItem { id: string; label: string; fields: EditableStructureField[]; }
export interface EditableStructureCatalogEntry { id: string; page: string; source: string; line: number; label: string; items: EditableStructureItem[]; }

export const EDITABLE_STRUCTURE_CATALOG: EditableStructureCatalogEntry[] = [
  {
    "id": "structure:ujqc28",
    "source": "src/components/home/HowWeWork.tsx",
    "line": 206,
    "page": "home",
    "label": "home: 01",
    "items": [
      {
        "id": "item:oohtax",
        "label": "01",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:v1q0df",
            "uk": "01",
            "ru": "01",
            "en": "01"
          },
          {
            "key": "title",
            "copyId": "copy:189uss4",
            "uk": "Бриф та технічний аудит",
            "ru": "Бриф и технический аудит",
            "en": "Brief & technical audit"
          },
          {
            "key": "subtitle",
            "copyId": "copy:1i4cr8e",
            "uk": "Занурення в завдання бізнесу та аудит локації",
            "ru": "Погружение в задачи бизнеса и аудит локации",
            "en": "Business objectives and venue audit"
          },
          {
            "key": "duration",
            "copyId": "copy:oo92lk",
            "uk": "1–2 дні",
            "ru": "1–2 дня",
            "en": "1–2 days"
          },
          {
            "key": "description",
            "copyId": "copy:1wd4w06",
            "uk": "Ми не просто рахуємо кількість камер. Ми аналізуємо цілі проєкту: залучення спонсорів, продаж квитків, залучення глядачів або звітність перед інвесторами.",
            "ru": "Мы не просто считаем количество камер. Мы анализируем цели проекта: привлечение спонсоров, продажа билетов, вовлечение зрителей или отчетность перед инвесторами.",
            "en": "We do more than count cameras. We analyze the business goals: sponsor acquisition, ticket sales, audience engagement or investor reporting."
          }
        ]
      },
      {
        "id": "item:1gzooj9",
        "label": "02",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:1god5fp",
            "uk": "02",
            "ru": "02",
            "en": "02"
          },
          {
            "key": "title",
            "copyId": "copy:1macnem",
            "uk": "Підготовка та передпродакшн",
            "ru": "Подготовка и предпродакшн",
            "en": "Preparation & pre-production"
          },
          {
            "key": "subtitle",
            "copyId": "copy:a6165w",
            "uk": "Сценарій, таймінг та технічний райдер",
            "ru": "Сценарий, тайминг и технический райдер",
            "en": "Script, timing and technical rider"
          },
          {
            "key": "duration",
            "copyId": "copy:k38mcj",
            "uk": "3–7 днів",
            "ru": "3–7 дней",
            "en": "3–7 days"
          },
          {
            "key": "description",
            "copyId": "copy:6bsexe",
            "uk": "Прямий ефір та складні зйомки готуються заздалегідь. На цьому етапі опрацьовуються всі форс-мажорні сценарії та логістика знімальної групи.",
            "ru": "Прямой эфир и сложные съемки готовятся заранее. На этом этапе прорабатываются все форс-мажорные сценарии и логистика съемочной группы.",
            "en": "Live broadcasts and complex shoots are prepared in advance. At this stage we work through contingencies and crew logistics."
          }
        ]
      },
      {
        "id": "item:1ex71qx",
        "label": "03",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:1nvg967",
            "uk": "03",
            "ru": "03",
            "en": "03"
          },
          {
            "key": "title",
            "copyId": "copy:26nwzh",
            "uk": "Сетап та резервування",
            "ru": "Сетап и резервирование",
            "en": "Setup & redundancy"
          },
          {
            "key": "subtitle",
            "copyId": "copy:9u5igo",
            "uk": "Розгортання ПТС та нульова відмова",
            "ru": "Развертывание ПТС и нулевой отказ",
            "en": "OB setup and zero-failure readiness"
          },
          {
            "key": "duration",
            "copyId": "copy:1uauwes",
            "uk": "За 4–6 годин до старту",
            "ru": "За 4–6 часов до старта",
            "en": "4–6 hours before start"
          },
          {
            "key": "description",
            "copyId": "copy:sy2ds3",
            "uk": "Команда прибуває на майданчик задовго до приходу гостей. Ми розгортаємо контрольну кімнату режисера, підключаємо камери та дублюючі канали.",
            "ru": "Команда прибывает на площадку задолго до прихода гостей. Мы разворачиваем контрольную комнату режиссера, подключаем камеры и дублирующие каналы.",
            "en": "The crew arrives well before guests. We deploy the director's control room, connect cameras and bring backup paths online."
          }
        ]
      },
      {
        "id": "item:nq1h2z",
        "label": "04",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:dmqpyt",
            "uk": "04",
            "ru": "04",
            "en": "04"
          },
          {
            "key": "title",
            "copyId": "copy:176a17f",
            "uk": "Ефір або знімальний процес",
            "ru": "Эфир или съемочный процесс",
            "en": "Live broadcast / production"
          },
          {
            "key": "subtitle",
            "copyId": "copy:liusno",
            "uk": "Злагоджена робота команди без права на помилку",
            "ru": "Слаженная работа команды без права на ошибку",
            "en": "Coordinated production with no margin for error"
          },
          {
            "key": "duration",
            "copyId": "copy:4ariul",
            "uk": "У режимі реального часу",
            "ru": "В режиме реального времени",
            "en": "Real time"
          },
          {
            "key": "description",
            "copyId": "copy:1tk6vor",
            "uk": "Режисер ефіру, оператори на радіостанціях та звукорежисер працюють як єдиний механізм за чітким Zero Failure протоколом.",
            "ru": "Режиссер эфира, операторы на радиостанциях и звукорежиссер работают как единый механизм по четкому Zero Failure протоколу.",
            "en": "The director, camera operators and audio engineer work as one team under a strict Zero Failure protocol."
          }
        ]
      },
      {
        "id": "item:13q3d5o",
        "label": "05",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:inuoyb",
            "uk": "05",
            "ru": "05",
            "en": "05"
          },
          {
            "key": "title",
            "copyId": "copy:184lfjl",
            "uk": "Постпродакшн та монтаж",
            "ru": "Постпродакшн и монтаж",
            "en": "Post-production & editing"
          },
          {
            "key": "subtitle",
            "copyId": "copy:14044i9",
            "uk": "Кольорокорекція, саунд-дизайн та графіка",
            "ru": "Цветокоррекция, саунд-дизайн и графика",
            "en": "Color grading, sound design and graphics"
          },
          {
            "key": "duration",
            "copyId": "copy:1elxq29",
            "uk": "3–10 робочих днів",
            "ru": "3–10 рабочих дней",
            "en": "3–10 business days"
          },
          {
            "key": "description",
            "copyId": "copy:14ifvxs",
            "uk": "Для відеороликів та звітних матеріалів ми здійснюємо професійний монтаж, відбір кращих дублів та роботу зі звуковим простором.",
            "ru": "Для видеороликов и отчетных материалов мы осуществляем профессиональный монтаж, отбор лучших дублей и работу со звуковым пространством.",
            "en": "For films and report content we provide professional editing, select the strongest takes and build a polished soundscape."
          }
        ]
      },
      {
        "id": "item:1li4nm",
        "label": "06",
        "fields": [
          {
            "key": "number",
            "copyId": "copy:w9zzkt",
            "uk": "06",
            "ru": "06",
            "en": "06"
          },
          {
            "key": "title",
            "copyId": "copy:1gz5f6x",
            "uk": "Здача матеріалів та архів",
            "ru": "Сдача материалов и архив",
            "en": "Delivery & archive"
          },
          {
            "key": "subtitle",
            "copyId": "copy:158208l",
            "uk": "Передача в хмару та адаптація під соцмережі",
            "ru": "Передача в облако и адаптация под соцсети",
            "en": "Cloud delivery and social-media adaptations"
          },
          {
            "key": "duration",
            "copyId": "copy:1bj3xxj",
            "uk": "Протягом 24–48 годин",
            "ru": "В течение 24–48 часов",
            "en": "Within 24–48 hours"
          },
          {
            "key": "description",
            "copyId": "copy:7qhhvn",
            "uk": "Замовник отримує готовий медіапакет у всіх необхідних роздільних здатностях, а також нарізку ключових моментів для максимального охоплення в соцмережах.",
            "ru": "Заказчик получает готовый медиапакет во всех необходимых разрешениях, а также нарезку ключевых моментов для максимального охвата в соцсетях.",
            "en": "The client receives a complete media package in all required resolutions plus key-moment cuts optimized for social reach."
          }
        ]
      }
    ]
  },
  {
    "id": "structure:ya9jxy",
    "source": "src/pages/LiveProduction.tsx",
    "line": 128,
    "page": "live",
    "label": "live: Що відбувається, якщо на майданчику раптово зникає інтернет?",
    "items": [
      {
        "id": "item:1bqnqi0",
        "label": "Що відбувається, якщо на майданчику раптово зникає інтернет?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:twqhj4",
            "uk": "Що відбувається, якщо на майданчику раптово зникає інтернет?",
            "ru": "Что происходит, если на площадке внезапно пропадает интернет?",
            "en": "What happens if the venue suddenly loses internet access?"
          },
          {
            "key": "a",
            "copyId": "copy:199atyx",
            "uk": "Ми використовуємо відмовостійку систему резервування зв'язку на базі супутникового терміналу Starlink та мульти-SIM бондинг-роутерів Peplink/LiveU, які об'єднують одночасно канали 3 національних операторів зв'язку (Kyivstar, Vodafone, Lifecell). При обриві дротового інтернету перемикання відбувається миттєво та абсолютно безшовно для глядачів ефіру.",
            "ru": "Мы используем отказоустойчивую систему резервирования связи на базе спутникового терминала Starlink и мульти-SIM бондинг-роутеров Peplink/LiveU, объединяющих одновременно каналы 3 национальных операторов связи (Kyivstar, Vodafone, Lifecell). При обрыве проводного интернета переключение происходит мгновенно и абсолютно бесшовно для зрителей эфира.",
            "en": "We use a fault-tolerant connectivity stack with Starlink and Peplink/LiveU multi-SIM bonding across Kyivstar, Vodafone and Lifecell. If wired internet fails, traffic switches seamlessly without interrupting the broadcast."
          }
        ]
      },
      {
        "id": "item:1o77pzt",
        "label": "За який час до початку заходу приїжджає знімальна група?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:p1wir1",
            "uk": "За який час до початку заходу приїжджає знімальна група?",
            "ru": "За какое время до начала мероприятия приезжает съемочная группа?",
            "en": "How early does the production crew arrive before an event?"
          },
          {
            "key": "a",
            "copyId": "copy:7rxrsu",
            "uk": "Стандартний регламент технічної групи: прибуття за 3-5 годин до старту для монтажу комутації, розстановки камер, калібрування звукового тракту та тестового прогону. Для великих багатокамерних форумів і спортивних трансляцій монтаж сетапу та генеральне тестування проводяться напередодні (Day-1).",
            "ru": "Стандартный регламент технической группы: прибытие за 3-5 часов до старта для монтажа коммутации, расстановки камер, калибровки звукового тракта и тестового прогона. Для крупных многокамерных форумов и спортивных трансляций монтаж сетапа и генеральное тестирование производятся накануне (Day-1).",
            "en": "The standard crew call is 3–5 hours before start for signal routing, camera placement, audio calibration and a full test. Large multicamera forums and sports broadcasts are normally installed and rehearsed the day before (Day-1)."
          }
        ]
      },
      {
        "id": "item:o98dqm",
        "label": "На які платформи можна вести трансляцію?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:1l4me44",
            "uk": "На які платформи можна вести трансляцію?",
            "ru": "На какие платформы можно вести трансляцию?",
            "en": "Which platforms can you stream to?"
          },
          {
            "key": "a",
            "copyId": "copy:85bihz",
            "uk": "Ми підтримуємо одночасний стрімінг (мультистрім) на будь-які платформи: YouTube, Facebook, Twitch, LinkedIn, а також виведення в закриті корпоративні плеєри, Zoom/Microsoft Teams або безпосередньо на ваш корпоративний сайт із захистом паролем і обмеженням за геолокацією.",
            "ru": "Мы поддерживаем одновременный стриминг (мультистрим) на любые платформы: YouTube, Facebook, Twitch, LinkedIn, а также вывод в закрытые корпоративные плееры, Zoom/Microsoft Teams или напрямую на ваш корпоративный сайт с защитой паролем и ограничением по геолокации.",
            "en": "We support simultaneous multistreaming to YouTube, Facebook, Twitch and LinkedIn, as well as private corporate players, Zoom/Microsoft Teams and password-protected corporate websites."
          }
        ]
      },
      {
        "id": "item:159ej6b",
        "label": "Чи надаєте ви запис трансляції і коли він буде готовий?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:h7ym59",
            "uk": "Чи надаєте ви запис трансляції і коли він буде готовий?",
            "ru": "Предоставляете ли вы запись трансляции и когда она будет готова?",
            "en": "Do you provide a recording, and when is it available?"
          },
          {
            "key": "a",
            "copyId": "copy:1ep3h06",
            "uk": "Майстер-запис трансляції ведеться у нестиснутій якості з резервуванням на два незалежні накопичувачі. Повний архів ефіру в роздільній здатності Full HD або 4K передається вам одразу після закінчення заходу на жорсткому диску або завантажується на захищене хмарне сховище протягом кількох годин.",
            "ru": "Мастер-запись трансляции ведется в несжатом качестве с резервированием на два независимых накопителя. Полный архив эфира в разрешении Full HD или 4K передается вам сразу по окончании мероприятия на жестком диске или загружается на защищенное облачное хранилище в течение нескольких часов.",
            "en": "The master is recorded at high quality to two independent storage devices. The complete Full HD or 4K archive can be handed over immediately after the event or uploaded to secure cloud storage within a few hours."
          }
        ]
      },
      {
        "id": "item:y5m0du",
        "label": "Як ви забезпечуєте чистий звук без відлуння та шумів із зали?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:19cpy80",
            "uk": "Як ви забезпечуєте чистий звук без відлуння та шумів із зали?",
            "ru": "Как вы обеспечиваете чистый звук без эха и шумов из зала?",
            "en": "How do you keep broadcast audio clean and free of venue echo?"
          },
          {
            "key": "a",
            "copyId": "copy:b85jud",
            "uk": "Ми привозимо власний цифровий аудіомікшерний пульт (Midas/Behringer X32) та комплект радіомікрофонів Sennheiser зі спрямованими антенними системами. Звук від спікерів, ведучих, відеороликів та інтершуму зали зводиться звукорежисером в ізольований ефірний мікс, незалежний від колонок у залі.",
            "ru": "Мы привозим собственный цифровой аудиомикшерный пульт (Midas/Behringer X32) и комплект радиомикрофонов Sennheiser с направленными антенными системами. Звук от спикеров, ведущих, видеороликов и интершума зала сводится звукорежиссером в изолированный эфирный микс, независимый от колонок в зале.",
            "en": "We bring our own Midas/Behringer X32 digital console and Sennheiser wireless systems with directional antennas. Speakers, presenters, playback and room ambience are mixed into an isolated broadcast feed independent of the venue PA."
          }
        ]
      },
      {
        "id": "item:x0k62u",
        "label": "Чи можливе додавання фірмової графіки, титрів та рахунку матчу?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:vw4wx6",
            "uk": "Чи можливе додавання фірмової графіки, титрів та рахунку матчу?",
            "ru": "Возможно ли добавление фирменной графики, титров и счета матча?",
            "en": "Can you add branded graphics, lower thirds and a match scoreboard?"
          },
          {
            "key": "a",
            "copyId": "copy:xzexv8",
            "uk": "Так, наша графічна станція дозволяє виводити анімовані плашки спікерів, логотипи, таймери зворотного відліку, інфографіку, презентації «картинка-в-картинці» (PiP), а також повноцінний спортивний скорборд з автоматичною або ручною фіксацією очок і складів команд.",
            "ru": "Да, наша графическая станция позволяет выводить анимированные плашки спикеров, логотипы, таймеры обратного отсчета, инфографику, презентации \"картинка-в-картинке\" (PiP), а также полноценный спортивный скорборд с автоматической или ручной фиксацией очков и составов команд.",
            "en": "Yes. Our graphics system handles animated speaker lower thirds, logos, countdowns, infographics, picture-in-picture presentations and full sports scoreboards with automatic or manual scoring and lineups."
          }
        ]
      }
    ]
  },
  {
    "id": "structure:1xx4wgn",
    "source": "src/pages/LiveProduction.tsx",
    "line": 515,
    "page": "live",
    "label": "live: sports",
    "items": [
      {
        "id": "item:16olx4t",
        "label": "sports",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:1wgh76z",
            "uk": "sports",
            "ru": "sports",
            "en": "sports"
          },
          {
            "key": "label",
            "copyId": "copy:n5myxx",
            "uk": "Спорт",
            "ru": "Спорт",
            "en": "Sports"
          }
        ]
      },
      {
        "id": "item:d8em8e",
        "label": "conference",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:hxeghp",
            "uk": "conference",
            "ru": "conference",
            "en": "conference"
          },
          {
            "key": "label",
            "copyId": "copy:1qmuqa3",
            "uk": "Конференція",
            "ru": "Конференция",
            "en": "Conference"
          }
        ]
      },
      {
        "id": "item:10xubuz",
        "label": "corporate",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:1qyx1op",
            "uk": "corporate",
            "ru": "corporate",
            "en": "corporate"
          },
          {
            "key": "label",
            "copyId": "copy:6fmrjv",
            "uk": "Корпоратив",
            "ru": "Корпоратив",
            "en": "Corporate event"
          }
        ]
      },
      {
        "id": "item:1tfusdc",
        "label": "concert",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:1617slx",
            "uk": "concert",
            "ru": "concert",
            "en": "concert"
          },
          {
            "key": "label",
            "copyId": "copy:v9xuxx",
            "uk": "Концерт / Шоу",
            "ru": "Концерт / Шоу",
            "en": "Concert / Show"
          }
        ]
      }
    ]
  },
  {
    "id": "structure:c7xm32",
    "source": "src/pages/LiveProduction.tsx",
    "line": 946,
    "page": "live",
    "label": "live: 01",
    "items": [
      {
        "id": "item:1lulknx",
        "label": "01",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:v1q0df",
            "uk": "01",
            "ru": "01",
            "en": "01"
          },
          {
            "key": "title",
            "copyId": "copy:7npjnb",
            "uk": "Бриф та аудит",
            "ru": "Бриф и аудит",
            "en": "Brief & audit"
          },
          {
            "key": "desc",
            "copyId": "copy:slcx7x",
            "uk": "Замір швидкості каналів зв'язку на локації, аудит електрики та акустики зали.",
            "ru": "Замер скорости каналов связи на локации, аудит электричества и акустики зала.",
            "en": "Measure available connectivity and audit venue power and acoustics."
          }
        ]
      },
      {
        "id": "item:mjcus1",
        "label": "02",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:1god5fp",
            "uk": "02",
            "ru": "02",
            "en": "02"
          },
          {
            "key": "title",
            "copyId": "copy:1dl4s7r",
            "uk": "ТЗ та схема",
            "ru": "ТЗ и схема",
            "en": "Technical plan & routing"
          },
          {
            "key": "desc",
            "copyId": "copy:m4p1cs",
            "uk": "Проектування комутації, розрахунок розстановки камер та траєкторій кабелів.",
            "ru": "Проектирование коммутации, расчет расстановки камер и траекторий кабелей.",
            "en": "Design signal routing, camera positions and cable paths."
          }
        ]
      },
      {
        "id": "item:qo6v56",
        "label": "03",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:1nvg967",
            "uk": "03",
            "ru": "03",
            "en": "03"
          },
          {
            "key": "title",
            "copyId": "copy:155p85j",
            "uk": "Графіка",
            "ru": "Графика",
            "en": "Graphics"
          },
          {
            "key": "desc",
            "copyId": "copy:1rukdkc",
            "uk": "Створення фірмових титрів, плашок спікерів, заставок початку та перерв.",
            "ru": "Создание фирменных титров, плашек спикеров, заставок начала и перерывов.",
            "en": "Create branded lower thirds, speaker graphics, openers and break bumpers."
          }
        ]
      },
      {
        "id": "item:1cix255",
        "label": "04",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:dmqpyt",
            "uk": "04",
            "ru": "04",
            "en": "04"
          },
          {
            "key": "title",
            "copyId": "copy:fpaf3e",
            "uk": "Монтаж сетапу",
            "ru": "Монтаж сетапа",
            "en": "Setup deployment"
          },
          {
            "key": "desc",
            "copyId": "copy:1mt5cxf",
            "uk": "Прибуття за 3-5 годин до старту. Розгортання ПТС, калібрування звуку.",
            "ru": "Прибытие за 3-5 часов до старта. Развертывание ПТС, калибровка звука.",
            "en": "Arrive 3–5 hours before start, deploy the production system and calibrate audio."
          }
        ]
      },
      {
        "id": "item:2pv293",
        "label": "05",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:inuoyb",
            "uk": "05",
            "ru": "05",
            "en": "05"
          },
          {
            "key": "title",
            "copyId": "copy:1dovo1h",
            "uk": "Прямий ефір",
            "ru": "Прямой эфир",
            "en": "Live broadcast"
          },
          {
            "key": "desc",
            "copyId": "copy:16uoecv",
            "uk": "Злагоджена робота режисера, операторів та звукоінженера з резервом каналів.",
            "ru": "Слаженная работа режиссера, операторов и звукоинженера с резервом каналов.",
            "en": "Coordinated work by the director, camera operators and audio engineer with redundant signal paths."
          }
        ]
      },
      {
        "id": "item:1nvxn9c",
        "label": "06",
        "fields": [
          {
            "key": "num",
            "copyId": "copy:w9zzkt",
            "uk": "06",
            "ru": "06",
            "en": "06"
          },
          {
            "key": "title",
            "copyId": "copy:vc5k3q",
            "uk": "Майстер-архів",
            "ru": "Мастер-архив",
            "en": "Master archive"
          },
          {
            "key": "desc",
            "copyId": "copy:1llc2w",
            "uk": "Передача запису у 4K та нарізка ключових моментів протягом першої доби.",
            "ru": "Передача записи в 4K и нарезка ключевых моментов в течение первых суток.",
            "en": "Deliver the 4K master and key highlights within the first 24 hours."
          }
        ]
      }
    ]
  },
  {
    "id": "structure:1vd83fg",
    "source": "src/pages/MediaCenter.tsx",
    "line": 69,
    "page": "media-center",
    "label": "media-center: tr-1",
    "items": [
      {
        "id": "item:1hczqho",
        "label": "tr-1",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:10erm75",
            "uk": "tr-1",
            "ru": "tr-1",
            "en": "tr-1"
          },
          {
            "key": "category",
            "copyId": "copy:sl3m0g",
            "uk": "ПТС & Відеосервери",
            "ru": "ПТС & Видеосерверы",
            "en": "ПТС & Відеосервери"
          },
          {
            "key": "title",
            "copyId": "copy:1l1kn6w",
            "uk": "Мобільна ПТС vMix 4K Station (8 каналів)",
            "ru": "Мобильная ПТС vMix 4K Station (8 каналов)",
            "en": "Мобільна ПТС vMix 4K Station (8 каналів)"
          },
          {
            "key": "description",
            "copyId": "copy:r2flgg",
            "uk": "Центральний режисерський сервер на базі Intel Core i9 / RTX 4080 із картами захоплення Blackmagic DeckLink 8K Pro. Підтримка до 8 фізичних джерел SDI/HDMI + необмежено NDI/SRT.",
            "ru": "Центральный режиссерский сервер на базе Intel Core i9 / RTX 4080 с картами захвата Blackmagic DeckLink 8K Pro. Поддержка до 8 физических источников SDI/HDMI + неограниченно NDI/SRT.",
            "en": "Центральний режисерський сервер на базі Intel Core i9 / RTX 4080 із картами захоплення Blackmagic DeckLink 8K Pro. Підтримка до 8 фізичних джерел SDI/HDMI + необмежено NDI/SRT."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:1i38n51",
            "uk": "Radio",
            "ru": "Radio",
            "en": "Radio"
          }
        ]
      },
      {
        "id": "item:6tx9ar",
        "label": "tr-2",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:uqwxt3",
            "uk": "tr-2",
            "ru": "tr-2",
            "en": "tr-2"
          },
          {
            "key": "category",
            "copyId": "copy:19w4b8m",
            "uk": "Кінокамери & Оптика",
            "ru": "Кинокамеры & Оптика",
            "en": "Кінокамери & Оптика"
          },
          {
            "key": "title",
            "copyId": "copy:12jzcgc",
            "uk": "Камерний парк Sony Cinema Line (FX6 & FX3)",
            "ru": "Камерный парк Sony Cinema Line (FX6 & FX3)",
            "en": "Камерний парк Sony Cinema Line (FX6 & FX3)"
          },
          {
            "key": "description",
            "copyId": "copy:1kkyf16",
            "uk": "Повнокадрові кінокамери з подвійним базовим ISO (800 / 12800), електронним варіативним ND-фільтром та динамічним діапазоном 15+ стопів. Лінійка оптики Sony G-Master від 16mm до 200mm f/2.8.",
            "ru": "Полнокадровые кинокамеры с двойным базовым ISO (800 / 12800), электронным вариативным ND-фильтром и динамическим диапазоном 15+ стопов. Линейка оптики Sony G-Master от 16mm до 200mm f/2.8.",
            "en": "Повнокадрові кінокамери з подвійним базовим ISO (800 / 12800), електронним варіативним ND-фільтром та динамічним діапазоном 15+ стопів. Лінійка оптики Sony G-Master від 16mm до 200mm f/2.8."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:zcrjbh",
            "uk": "Video",
            "ru": "Video",
            "en": "Video"
          }
        ]
      },
      {
        "id": "item:1gh17xc",
        "label": "tr-3",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:12qc55h",
            "uk": "tr-3",
            "ru": "tr-3",
            "en": "tr-3"
          },
          {
            "key": "category",
            "copyId": "copy:tdqlp9",
            "uk": "Зв'язок & Польовий інтернет",
            "ru": "Связь & Полевой интернет",
            "en": "Зв'язок & Польовий інтернет"
          },
          {
            "key": "title",
            "copyId": "copy:ioz9ch",
            "uk": "Супутниковий комплекс Starlink v2 + LTE Bonding",
            "ru": "Спутниковый комплекс Starlink v2 + LTE Bonding",
            "en": "Супутниковий комплекс Starlink v2 + LTE Bonding"
          },
          {
            "key": "description",
            "copyId": "copy:1anq22s",
            "uk": "Автономний кейс супутникового зв'язку Starlink з агрегатором каналів Speedify / Peplink та 3 модемами Quectel Cat.20 з виносними антенами. Забезпечує стабільний Upload 40–90 Мбіт/с у будь-якій точці.",
            "ru": "Автономный кейс спутниковой связи Starlink с агрегатором каналов Speedify / Peplink и 3 модемами Quectel Cat.20 с выносными антеннами. Обеспечивает стабильный Upload 40–90 Мбит/с в любой точке.",
            "en": "Автономний кейс супутникового зв'язку Starlink з агрегатором каналів Speedify / Peplink та 3 модемами Quectel Cat.20 з виносними антенами. Забезпечує стабільний Upload 40–90 Мбіт/с у будь-якій точці."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:6adspr",
            "uk": "Wifi",
            "ru": "Wifi",
            "en": "Wifi"
          }
        ]
      },
      {
        "id": "item:hfyfec",
        "label": "tr-4",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:9v85xj",
            "uk": "tr-4",
            "ru": "tr-4",
            "en": "tr-4"
          },
          {
            "key": "category",
            "copyId": "copy:1gie0b9",
            "uk": "Звуковий тракт",
            "ru": "Звуковой тракт",
            "en": "Звуковий тракт"
          },
          {
            "key": "title",
            "copyId": "copy:153ic7d",
            "uk": "Цифрова звукова станція Behringer X32 + Sennheiser G4",
            "ru": "Цифровая звуковая станция Behringer X32 + Sennheiser G4",
            "en": "Цифрова звукова станція Behringer X32 + Sennheiser G4"
          },
          {
            "key": "description",
            "copyId": "copy:acvwd5",
            "uk": "32-канальний цифровий мікшерний пульт із моторизованими фейдерами та аудіоінтерфейсом. Парк бездротових петличних та ручних мікрофонів Sennheiser ew 100 G4 з кардіоїдними капсулями e935/MKE2.",
            "ru": "32-канальный цифровой микшерный пульт с моторизованными фейдерами и аудиоинтерфейсом. Парк беспроводных петличных и ручных микрофонов Sennheiser ew 100 G4 с кардиоидными капсюлями e935/MKE2.",
            "en": "32-канальний цифровий мікшерний пульт із моторизованими фейдерами та аудіоінтерфейсом. Парк бездротових петличних та ручних мікрофонів Sennheiser ew 100 G4 з кардіоїдними капсулями e935/MKE2."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:irhow1",
            "uk": "Mic",
            "ru": "Mic",
            "en": "Mic"
          }
        ]
      },
      {
        "id": "item:1qpucog",
        "label": "tr-5",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:q34xpl",
            "uk": "tr-5",
            "ru": "tr-5",
            "en": "tr-5"
          },
          {
            "key": "category",
            "copyId": "copy:490nn2",
            "uk": "Аерозйомка & Дрони",
            "ru": "Аэросъемка & Дроны",
            "en": "Аерозйомка & Дрони"
          },
          {
            "key": "title",
            "copyId": "copy:1742i64",
            "uk": "Дрони DJI Mavic 3 Cine & FPV Cinewhoop",
            "ru": "Дроны DJI Mavic 3 Cine & FPV Cinewhoop",
            "en": "Дрони DJI Mavic 3 Cine & FPV Cinewhoop"
          },
          {
            "key": "description",
            "copyId": "copy:s0wugs",
            "uk": "Флагманський дрон із подвійною камерою Hasselblad 4/3 CMOS, підтримкою Apple ProRes 422 HQ та часом польоту до 40 хвилин. Захищений FPV-дрон для динамічних прольотів усередині приміщень та цехів.",
            "ru": "Флагманский дрон с двойной камерой Hasselblad 4/3 CMOS, поддержкой Apple ProRes 422 HQ и временем полета до 40 минут. Защищенный FPV-дрон для динамичных пролетов внутри помещений и цехов.",
            "en": "Флагманський дрон із подвійною камерою Hasselblad 4/3 CMOS, підтримкою Apple ProRes 422 HQ та часом польоту до 40 хвилин. Захищений FPV-дрон для динамічних прольотів усередині приміщень та цехів."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:bf5v5h",
            "uk": "Compass",
            "ru": "Compass",
            "en": "Compass"
          }
        ]
      },
      {
        "id": "item:1bjhi01",
        "label": "tr-6",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:fr8u53",
            "uk": "tr-6",
            "ru": "tr-6",
            "en": "tr-6"
          },
          {
            "key": "category",
            "copyId": "copy:1n7bfzl",
            "uk": "Світло & Спецобладнання",
            "ru": "Свет & Спецоборудование",
            "en": "Світло & Спецобладнання"
          },
          {
            "key": "title",
            "copyId": "copy:1o7tcsy",
            "uk": "Студійне світло Aputure & Profoto + Телесуфлер",
            "ru": "Студийный свет Aputure & Profoto + Телесуфлер",
            "en": "Студійне світло Aputure & Profoto + Телесуфлер"
          },
          {
            "key": "description",
            "copyId": "copy:yt4541",
            "uk": "Потужні джерела постійного світла Aputure 600d Pro / 300x з лінзами Френеля, софтбоксами Lantern та світловими трубками Nanlite Pavotube. 17\" телесуфлер із HDMI передачею для спікерів.",
            "ru": "Мощные источники постоянного света Aputure 600d Pro / 300x с линзами Френеля, софтбоксами Lantern и световыми трубками Nanlite Pavotube. 17\" телесуфлер с HDMI передачей для спикеров.",
            "en": "Потужні джерела постійного світла Aputure 600d Pro / 300x з лінзами Френеля, софтбоксами Lantern та світловими трубками Nanlite Pavotube. 17\" телесуфлер із HDMI передачею для спікерів."
          },
          {
            "key": "status",
            "copyId": "copy:93fqh7",
            "uk": "In Fleet",
            "ru": "In Fleet",
            "en": "In Fleet"
          },
          {
            "key": "icon",
            "copyId": "copy:19uo2nd",
            "uk": "Sun",
            "ru": "Sun",
            "en": "Sun"
          }
        ]
      }
    ]
  },
  {
    "id": "structure:gmyf8c",
    "source": "src/pages/MediaCenter.tsx",
    "line": 70,
    "page": "media-center",
    "label": "media-center: doc-1",
    "items": [
      {
        "id": "item:6kas92",
        "label": "doc-1",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:98tkxx",
            "uk": "doc-1",
            "ru": "doc-1",
            "en": "doc-1"
          },
          {
            "key": "title",
            "copyId": "copy:1ch39im",
            "uk": "Технічний райдер ПТС vMix (Broadcast Rider)",
            "ru": "Технический райдер ПТС vMix (Broadcast Rider)",
            "en": "Технічний райдер ПТС vMix (Broadcast Rider)"
          },
          {
            "key": "format",
            "copyId": "copy:105rl3p",
            "uk": "PDF",
            "ru": "PDF",
            "en": "PDF"
          },
          {
            "key": "fileSize",
            "copyId": "copy:1quei31",
            "uk": "1.8 MB",
            "ru": "1.8 MB",
            "en": "1.8 MB"
          },
          {
            "key": "description",
            "copyId": "copy:1xhd1u1",
            "uk": "Детальні вимоги до живлення, інтернет-каналу, комутації з залом та розміщення режисерського столу.",
            "ru": "Подробные требования к питанию, интернет-каналу, коммутации с залом и размещению режиссерского пультового стола.",
            "en": "Детальні вимоги до живлення, інтернет-каналу, комутації з залом та розміщення режисерського столу."
          },
          {
            "key": "docType",
            "copyId": "copy:xvcpmt",
            "uk": "rider",
            "ru": "rider",
            "en": "rider"
          },
          {
            "key": "downloadName",
            "copyId": "copy:rokxdn",
            "uk": "Dneprfilm_Technical_Rider_PTS_vMix.pdf",
            "ru": "Dneprfilm_Technical_Rider_PTS_vMix.pdf",
            "en": "Dneprfilm_Technical_Rider_PTS_vMix.pdf"
          }
        ]
      },
      {
        "id": "item:8cdgz6",
        "label": "doc-2",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:10ae1m9",
            "uk": "doc-2",
            "ru": "doc-2",
            "en": "doc-2"
          },
          {
            "key": "title",
            "copyId": "copy:1esx64d",
            "uk": "Бриф на відеовиробництво та іміджевий ролик",
            "ru": "Бриф на видеопроизводство и имиджевый ролик",
            "en": "Бриф на відеовиробництво та іміджевий ролик"
          },
          {
            "key": "format",
            "copyId": "copy:l3j4hv",
            "uk": "DOCX / PDF",
            "ru": "DOCX / PDF",
            "en": "DOCX / PDF"
          },
          {
            "key": "fileSize",
            "copyId": "copy:ppgmqj",
            "uk": "420 KB",
            "ru": "420 KB",
            "en": "420 KB"
          },
          {
            "key": "description",
            "copyId": "copy:fuxij",
            "uk": "Опитувальний лист для клієнта: цілі відео, хронометраж, цільова аудиторія, референси та дедлайни для точного розрахунку кошторису.",
            "ru": "Опросный лист для клиента: цели видео, хронометраж, целевая аудитория, референсы и дедлайны для точного расчета сметы.",
            "en": "Опитувальний лист для клієнта: цілі відео, хронометраж, цільова аудиторія, референси та дедлайни для точного розрахунку кошторису."
          },
          {
            "key": "docType",
            "copyId": "copy:p44bqd",
            "uk": "brief",
            "ru": "brief",
            "en": "brief"
          },
          {
            "key": "downloadName",
            "copyId": "copy:kd5mmt",
            "uk": "Dneprfilm_Video_Production_Brief.pdf",
            "ru": "Dneprfilm_Video_Production_Brief.pdf",
            "en": "Dneprfilm_Video_Production_Brief.pdf"
          }
        ]
      },
      {
        "id": "item:1kjxda9",
        "label": "doc-3",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:rfhn7p",
            "uk": "doc-3",
            "ru": "doc-3",
            "en": "doc-3"
          },
          {
            "key": "title",
            "copyId": "copy:wbvyve",
            "uk": "Чек-лист підготовки майданчика до прямої трансляції",
            "ru": "Чек-лист подготовки площадки к прямой трансляции",
            "en": "Чек-лист підготовки майданчика до прямої трансляції"
          },
          {
            "key": "format",
            "copyId": "copy:105rl3p",
            "uk": "PDF",
            "ru": "PDF",
            "en": "PDF"
          },
          {
            "key": "fileSize",
            "copyId": "copy:1bdtm91",
            "uk": "850 KB",
            "ru": "850 KB",
            "en": "850 KB"
          },
          {
            "key": "description",
            "copyId": "copy:374gqi",
            "uk": "Інструкція для івент-менеджерів: світло на сцені, розсадка глядачів, узгодження презентацій спікерів 16:9.",
            "ru": "Инструкция для ивент-менеджеров: свет на сцене, рассадка зрителей, согласование презентаций спикеров 16:9.",
            "en": "Інструкція для івент-менеджерів: світло на сцені, розсадка глядачів, узгодження презентацій спікерів 16:9."
          },
          {
            "key": "docType",
            "copyId": "copy:1acwn91",
            "uk": "checklist",
            "ru": "checklist",
            "en": "checklist"
          },
          {
            "key": "downloadName",
            "copyId": "copy:1m3ov4b",
            "uk": "Dneprfilm_Live_Broadcast_Checklist.pdf",
            "ru": "Dneprfilm_Live_Broadcast_Checklist.pdf",
            "en": "Dneprfilm_Live_Broadcast_Checklist.pdf"
          }
        ]
      },
      {
        "id": "item:1evw9mc",
        "label": "doc-4",
        "fields": [
          {
            "key": "id",
            "copyId": "copy:bkpdwh",
            "uk": "doc-4",
            "ru": "doc-4",
            "en": "doc-4"
          },
          {
            "key": "title",
            "copyId": "copy:1fj0xyd",
            "uk": "Пакет документів для юросіб (Реквізити & Договір)",
            "ru": "Пакет документов для юрлиц (Реквизиты & Договор)",
            "en": "Пакет документів для юросіб (Реквізити & Договір)"
          },
          {
            "key": "format",
            "copyId": "copy:1uyebll",
            "uk": "ZIP",
            "ru": "ZIP",
            "en": "ZIP"
          },
          {
            "key": "fileSize",
            "copyId": "copy:1bb6g2d",
            "uk": "1.2 MB",
            "ru": "1.2 MB",
            "en": "1.2 MB"
          },
          {
            "key": "description",
            "copyId": "copy:1dgcibt",
            "uk": "Шаблони типового договору на надання медіа-послуг, акти виконаних робіт, реквізити ФОП 3 група / ТОВ.",
            "ru": "Шаблоны типового договора на оказание медиа-услуг, акты выполненных работ, реквизиты ФОП 3 группа / ТОВ.",
            "en": "Шаблони типового договору на надання медіа-послуг, акти виконаних робіт, реквізити ФОП 3 група / ТОВ."
          },
          {
            "key": "docType",
            "copyId": "copy:174qe2t",
            "uk": "legal",
            "ru": "legal",
            "en": "legal"
          },
          {
            "key": "downloadName",
            "copyId": "copy:13c4x3t",
            "uk": "Dneprfilm_Legal_Docs_Template.zip",
            "ru": "Dneprfilm_Legal_Docs_Template.zip",
            "en": "Dneprfilm_Legal_Docs_Template.zip"
          }
        ]
      }
    ]
  },
  {
    "id": "structure:1v8tkzw",
    "source": "src/pages/VideoProduction.tsx",
    "line": 143,
    "page": "video",
    "label": "video: Скільки часу займає виробництво рекламного або іміджевого ролика?",
    "items": [
      {
        "id": "item:66q2sz",
        "label": "Скільки часу займає виробництво рекламного або іміджевого ролика?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:9ngdwv",
            "uk": "Скільки часу займає виробництво рекламного або іміджевого ролика?",
            "ru": "Сколько времени занимает производство рекламного или имиджевого ролика?",
            "en": "How long does a commercial or brand film take to produce?"
          },
          {
            "key": "a",
            "copyId": "copy:1ntpk9h",
            "uk": "Стандартний цикл виробництва рекламного ролика або промо заводу займає від 10 до 20 робочих днів. За необхідності термінового продакшну до виставки або заходу ми можемо вкластися у 5–7 днів за рахунок виділення двох паралельних монтажних станцій.",
            "ru": "Стандартный цикл производства рекламного ролика или промо завода занимает от 10 до 20 рабочих дней. При необходимости срочного продакшна к выставке или мероприятию мы можем уложиться в 5–7 дней за счет выделения двух параллельных монтажных станций.",
            "en": "A standard commercial or industrial promo takes 10–20 business days. For an urgent exhibition or event deadline, we can deliver in 5–7 days by running two editing stations in parallel."
          }
        ]
      },
      {
        "id": "item:1r8kwv3",
        "label": "На яку техніку ведеться відеозйомка?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:94dzca",
            "uk": "На яку техніку ведеться відеозйомка?",
            "ru": "На какую технику ведется видеосъемка?",
            "en": "What equipment do you use for video production?"
          },
          {
            "key": "a",
            "copyId": "copy:1byjiab",
            "uk": "Ми працюємо виключно на сертифіковане кіно- та телевізійне обладнання: камери Sony лінійки Cinema Line (FX9, FX6, FX3) з 10-бітною кольоропередачею 4:2:2, світлосильна кінооптика з кінематографічним боке, електронні стабілізатори Ronin, квадрокоптери та FPV-дрони, професійне світло Aputure та радіопетлички Sennheiser/Rode.",
            "ru": "Мы работаем исключительно на сертифицированное кино- и телевизионное оборудование: камеры Sony линейки Cinema Line (FX9, FX6, FX3) с 10-битной цветопередачей 4:2:2, светосильная кинооптика с кинематографичным боке, электронные стабилизаторы Ronin, квадрокоптеры и FPV-дроны, профессиональный свет Aputure и радиопетлички Sennheiser/Rode.",
            "en": "Ми працюємо виключно на сертифіковане кіно- та телевізійне обладнання: камери Sony лінійки Cinema Line (FX9, FX6, FX3) з 10-бітною кольоропередачею 4:2:2, світлосильна кінооптика з кінематографічним боке, електронні стабілізатори Ronin, квадрокоптери та FPV-дрони, професійне світло Aputure та радіопетлички Sennheiser/Rode."
          }
        ]
      },
      {
        "id": "item:srb3j",
        "label": "Чи допомагаєте ви з ідеєю, сценарієм та підбором акторів?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:x9idqd",
            "uk": "Чи допомагаєте ви з ідеєю, сценарієм та підбором акторів?",
            "ru": "Помогаете ли вы с идеей, сценарием и подбором актеров?",
            "en": "Can you help with the idea, script and casting?"
          },
          {
            "key": "a",
            "copyId": "copy:1vpcg6b",
            "uk": "Так, ми беремо на себе повний цикл під ключ. Розробляємо 2–3 різні концепції сценарію під ваше завдання, пишемо дикторський текст, організуємо кастинг професійних акторів чи моделей, знаходимо знімальні локації та отримуємо всі необхідні дозволи.",
            "ru": "Да, мы берем на себя полный цикл под ключ. Разрабатываем 2–3 разных концепции сценария под вашу задачу, пишем дикторский текст, организуем кастинг профессиональных актеров или моделей, находим съемочные локации и получаем все необходимые разрешения.",
            "en": "Yes. We handle the complete production cycle: 2–3 creative concepts, script and voice-over copy, professional casting, location scouting and required production permits."
          }
        ]
      },
      {
        "id": "item:h1lraa",
        "label": "Як ролик адаптується під Instagram Reels, TikTok та YouTube?",
        "fields": [
          {
            "key": "q",
            "copyId": "copy:a350v3",
            "uk": "Як ролик адаптується під Instagram Reels, TikTok та YouTube?",
            "ru": "Как ролик адаптируется под Instagram Reels, TikTok и YouTube?",
            "en": "How is the video adapted for Instagram Reels, TikTok and YouTube?"
          },
          {
            "key": "a",
            "copyId": "copy:10qcmxh",
            "uk": "Під час монтажу ми враховуємо вимоги всіх майданчиків. Ви отримуєте основний горизонтальний майстер 16:9 у 4K для сайту, ТБ і YouTube, а також оптимізовані вертикальні версії 9:16 з великим кадруванням та анімованими субтитрами для соцмереж.",
            "ru": "При монтаже мы учитываем требования всех площадок. Вы получаете основной горизонтальный мастер 16:9 в 4K для сайта, ТВ и YouTube, а также оптимизированные вертикальные версии 9:16 с крупным кадрированием и анимированными субтитрами для соцсетей.",
            "en": "Editing is planned for every platform. You receive a 16:9 4K master for web, TV and YouTube plus optimized 9:16 vertical versions with platform-aware framing and animated captions."
          }
        ]
      }
    ]
  }
];
