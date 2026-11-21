export type UiLang = "ru" | "hy" | "en" | "es";

export interface UiStrings {
  nav: {
    today: string;
    calendar: string;
    simulator: string;
    menu: string;
    routes: string;
    analytics: string;
    teamHitl: string;
    account: string;
    aiFlow: string;
  };
  hero: {
    todayPill: string;
    calendarPill: string;
    days7: string;
    month: string;
    newOrder: string;
    dayMeta: (count: number) => string;
    earningsLabel: (isMonth: boolean) => string;
    nextVisitLabel: string;
    whatToDoNow: string;
    allDoneMsg: string;
    savedLeads: string;
    quoteAccuracy: string;
    osrmSavings: string;
    hiddenBeforeLlm: string;
    todayOrders: (count: number) => string;
    tapCardHint: string;
    funnelTitle: string;
    langsTitle: string;
    geoCsatTitle: string;
    back: string;
    save: string;
  };
  account: {
    profile: string;
    hours: string;
    languages: string;
    aiGdpr: string;
  };
}

const STRINGS: Record<UiLang, UiStrings> = {
  ru: {
    nav: {
      today: "Сегодня",
      calendar: "Календарь",
      simulator: "AI Симулятор",
      menu: "Меню услуг",
      routes: "Маршруты",
      analytics: "Аналитика",
      teamHitl: "Команда и HITL",
      account: "Кабинет",
      aiFlow: "AI Флоу",
    },
    hero: {
      todayPill: "Сегодня",
      calendarPill: "Календарь",
      days7: "7д",
      month: "Месяц",
      newOrder: "Новый заказ",
      dayMeta: (n) => `Вторник · ${n} заказа на сегодня`,
      earningsLabel: (m) => (m ? "Заработок (Апрель)" : "Заработок (7 дней)"),
      nextVisitLabel: "Ближайший выезд · 6 мин по OSRM",
      whatToDoNow: "Что делать сейчас",
      allDoneMsg: "Все заявки оценены! Следующий выезд в 11:30 на ул. Туманяна 15.",
      savedLeads: "Спасённые лиды",
      quoteAccuracy: "Точность AI vs Факт",
      osrmSavings: "Экономия OSRM",
      hiddenBeforeLlm: "скрыто до LLM",
      todayOrders: (n) => `Заказы сегодня (${n})`,
      tapCardHint: "Нажмите на карточку — откроется фото с Vision AI, справочник модели, чат и инвойс",
      funnelTitle: "Воронка конверсии",
      langsTitle: "Языки & Форматы",
      geoCsatTitle: "Ереван · CSAT",
      back: "Назад",
      save: "Сохранить",
    },
    account: {
      profile: "Профиль",
      hours: "Время работы",
      languages: "Языки",
      aiGdpr: "AI, Зоны & GDPR",
    },
  },
  hy: {
    nav: {
      today: "Այսօր",
      calendar: "Օրացույց",
      simulator: "AI Սիմուլյատոր",
      menu: "Ծառայություններ",
      routes: "Երթուղիներ",
      analytics: "Վերլուծություն",
      teamHitl: "Թիմ և HITL",
      account: "Կաբինետ",
      aiFlow: "AI Ֆլոու",
    },
    hero: {
      todayPill: "Այսօր",
      calendarPill: "Օրացույց",
      days7: "7օր",
      month: "Ամիս",
      newOrder: "Նոր պատվեր",
      dayMeta: (n) => `Երեքշաբթի · ${n} պատվեր այսօր`,
      earningsLabel: (m) => (m ? "Եկամուտ (Ապրիլ)" : "Եկամուտ (7 օր)"),
      nextVisitLabel: "Հաջորդ այցը · 6 րոպե OSRM-ով",
      whatToDoNow: "Ինչ անել հիմա",
      allDoneMsg: "Բոլոր հայտերը գնահատված են։ Հաջորդ այցը 11:30՝ Թումանյան 15։",
      savedLeads: "Փրկված հայտեր",
      quoteAccuracy: "AI ճշգրտություն",
      osrmSavings: "OSRM խնայողություն",
      hiddenBeforeLlm: "թաքցված LLM-ից",
      todayOrders: (n) => `Այսօրվա պատվերները (${n})`,
      tapCardHint: "Սեղմեք քարտի վրա՝ տեսնելու Vision AI լուսանկարը, մոդելը, չատը և հաշիվը",
      funnelTitle: "Կոնվերսիայի ձագար",
      langsTitle: "Լեզուներ և ձևաչափ",
      geoCsatTitle: "Երևան · CSAT",
      back: "Հետ",
      save: "Պահպանել",
    },
    account: {
      profile: "Պրոֆիլ",
      hours: "Աշխատաժամեր",
      languages: "Լեզուներ",
      aiGdpr: "AI, Գոտիներ և GDPR",
    },
  },
  en: {
    nav: {
      today: "Today",
      calendar: "Calendar",
      simulator: "AI Simulator",
      menu: "Service Menu",
      routes: "Geo Routes",
      analytics: "Analytics",
      teamHitl: "Team & HITL",
      account: "Account",
      aiFlow: "AI Flow",
    },
    hero: {
      todayPill: "Today",
      calendarPill: "Calendar",
      days7: "7d",
      month: "Month",
      newOrder: "New Order",
      dayMeta: (n) => `Tuesday · ${n} jobs today`,
      earningsLabel: (m) => (m ? "Earnings (April)" : "Earnings (7 days)"),
      nextVisitLabel: "Next visit · 6 min via OSRM",
      whatToDoNow: "What to do now",
      allDoneMsg: "All leads priced! Next visit at 11:30 on Tumanyan 15.",
      savedLeads: "Saved Leads",
      quoteAccuracy: "AI vs Actual",
      osrmSavings: "OSRM Savings",
      hiddenBeforeLlm: "masked pre-LLM",
      todayOrders: (n) => `Today's Jobs (${n})`,
      tapCardHint: "Tap any card to open Vision AI photo, model specs, live chat & invoice",
      funnelTitle: "Conversion Funnel",
      langsTitle: "Languages & Media",
      geoCsatTitle: "Yerevan · CSAT",
      back: "Back",
      save: "Save",
    },
    account: {
      profile: "Profile",
      hours: "Working Hours",
      languages: "Languages",
      aiGdpr: "AI, Zones & GDPR",
    },
  },
  es: {
    nav: {
      today: "Hoy",
      calendar: "Calendario",
      simulator: "Simulador AI",
      menu: "Menú servicios",
      routes: "Rutas Geo",
      analytics: "Analítica",
      teamHitl: "Equipo y HITL",
      account: "Cuenta",
      aiFlow: "Flujo AI",
    },
    hero: {
      todayPill: "Hoy",
      calendarPill: "Calendario",
      days7: "7d",
      month: "Mes",
      newOrder: "Nuevo pedido",
      dayMeta: (n) => `Martes · ${n} servicios hoy`,
      earningsLabel: (m) => (m ? "Ingresos (Abril)" : "Ingresos (7 días)"),
      nextVisitLabel: "Próxima visita · 6 min OSRM",
      whatToDoNow: "Qué hacer ahora",
      allDoneMsg: "¡Todo presupuestado! Próxima visita 11:30 en Tumanyan 15.",
      savedLeads: "Leads salvados",
      quoteAccuracy: "Precisión AI",
      osrmSavings: "Ahorro OSRM",
      hiddenBeforeLlm: "ocultos pre-LLM",
      todayOrders: (n) => `Pedidos hoy (${n})`,
      tapCardHint: "Pulsa una tarjeta para ver foto Vision AI, modelo, chat y factura",
      funnelTitle: "Embudo de conversión",
      langsTitle: "Idiomas y formatos",
      geoCsatTitle: "Ereván · CSAT",
      back: "Atrás",
      save: "Guardar",
    },
    account: {
      profile: "Perfil",
      hours: "Horario",
      languages: "Idiomas",
      aiGdpr: "AI, Zonas y GDPR",
    },
  },
};

export function getUiStrings(lang: UiLang): UiStrings {
  return STRINGS[lang] ?? STRINGS.ru;
}
