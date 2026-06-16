import { ref } from 'vue'

const lang = ref('Ru')

const translations = {
  // Nav
  'nav.intro': { Ru: 'Интро', En: 'Intro' },
  'nav.projects': { Ru: 'Проекты', En: 'Projects' },
  'nav.about': { Ru: 'О нас', En: 'About' },
  'nav.contacts': { Ru: 'Контакты', En: 'Contacts' },

  // Intro center
  'intro.scroll': { Ru: 'Листайте, чтобы узнать больше', En: 'Scroll to discover more' },

  // Arc text
  'arc.line1': {
    Ru: ['ИНДИВИДУАЛЬНЫЕ', 'ДИЗАЙН-ПРОЕКТЫ', 'ДЛЯ', 'ЖИЛЫХ'],
    En: ['CUSTOM', 'DESIGN', 'PROJECTS', 'FOR', 'RESIDENTIAL'],
  },
  'arc.line2': {
    Ru: ['И', 'КОММЕРЧЕСКИХ', 'ПОМЕЩЕНИЙ', 'ПОД', 'КЛЮЧ.'],
    En: ['AND', 'COMMERCIAL', 'SPACES.', 'TURNKEY.'],
  },
  'arc.line3': {
    Ru: ['АВТОРСКИЙ', 'НАДЗОР'],
    En: ['DESIGN', 'SUPERVISION'],
  },

  // Bottom text
  'bottom.recent': { Ru: 'Недавние проекты', En: 'Recent projects' },
  'bottom.philosophy': {
    Ru: 'Создаём не просто дизайн, а\u00a0пространства<br> и\u00a0образы, которые становятся частью<br> жизни наших клиентов',
    En: 'We create not just design, but\u00a0spaces<br> and\u00a0images that become part<br> of our clients\' lives',
  },
  'bottom.choose': { Ru: 'Выберите один', En: 'Choose one' },

  // Project names
  'project.afi': { Ru: 'AFI Park Воронцовский', En: 'AFI Park Vorontsovsky' },
  'project.level': { Ru: 'Level Москва, 48 кв.м', En: 'Level Moscow, 48 sqm' },
  'project.mosfilm': { Ru: 'Мосфильмовский', En: 'Mosfilmovsky' },
  'project.n100': { Ru: 'Настоящее 100 кв.м', En: 'Nastoyashee 100 sqm' },
  'project.n35': { Ru: 'Настоящее 35 кв.м', En: 'Nastoyashee 35 sqm' },
  'project.mntk': { Ru: 'МНТК', En: 'MNTK' },
  'project.sanremo': { Ru: 'Италия. Сан-Ремо', En: 'Italy. Sanremo' },
  'project.afi.title': { Ru: 'AFI Park', En: 'AFI Park' },
  'project.afi.subtitle': { Ru: 'Москва, 135 кв.м', En: 'Moscow 135 sqm' },
  'project.level.title': { Ru: 'Level', En: 'Level Moscow' },
  'project.level.subtitle': { Ru: 'Москва, 48 кв.м', En: '48 sqm' },
  'project.mosfilm.title': { Ru: 'Мосфильмовский', En: 'Mosfilmovsky' },
  'project.mosfilm.subtitle': { Ru: 'Москва, 100 кв.м', En: 'Moscow, 100 sqm' },
  'project.n100.title': { Ru: 'Настоящее', En: 'Nastoyashee' },
  'project.n100.subtitle': { Ru: 'Москва, 100 кв.м', En: 'Moscow, 100 sqm' },
  'project.n35.title': { Ru: 'Настоящее', En: 'Nastoyashee' },
  'project.n35.subtitle': { Ru: 'Москва, 35 кв.м', En: 'Moscow, 35 sqm' },
  'project.mntk.title': { Ru: 'МНТК', En: 'MNTK' },
  'project.mntk.subtitle': { Ru: 'Москва, 212 кв.м', En: 'Moscow, 212 sqm' },
  'project.sanremo.title': { Ru: 'Италия. Сан-Ремо', En: 'Italy. Sanremo' },
  'project.sanremo.subtitle': { Ru: 'Сан-Ремо, Италия', En: 'Sanremo, Italy' },

  // ProjectPage
  'pp.projects': { Ru: 'Проекты', En: 'Projects' },
  'pp.projects.desc': {
    Ru: 'Наши проекты\u00a0\u2014 это\u00a0всегда индивидуальный подход и\u00a0работа без\u00a0шаблонов. Поэтому нас\u00a0выбирают клиенты, которые готовы доверить нам\u00a0своё пространство, стиль и\u00a0время.',
    En: 'Our projects are always a personalized approach and work without templates. That is why clients who are ready to entrust us with their space, style and time choose us.',
  },
  'pp.aesthetics.title': {
    Ru: 'Эстетика и\u00a0безупречный результат',
    En: 'Aesthetics and flawless results',
  },
  'pp.aesthetics.desc': {
    Ru: 'Наша работа\u00a0\u2014 это\u00a0всегда сложная реализация и\u00a0проекты высокого уровня, где\u00a0каждая деталь имеет значение.',
    En: 'Our work always involves complex execution and high-end projects where every detail matters.',
  },
  'pp.mission': { Ru: 'Миссия', En: 'Mission' },
  'pp.mission.quote': {
    Ru: 'Воплощать идеи в\u00a0реальность так, чтобы результат превзошёл ожидания',
    En: 'Bringing ideas to life so that the result exceeds expectations',
  },
  'pp.banner.text': {
    Ru: 'Эксклюзивность, внимание к деталям<br>и\u00a0безупречный сервис.',
    En: 'Exclusivity, attention to detail<br>and\u00a0impeccable service.',
  },
  'pp.footer.copy': { Ru: '\u00a92026. Все права защищены', En: '\u00a92026. All rights reserved' },
  'pp.footer.dev': { Ru: 'Разработка сайта', En: 'Website development' },
}

export function useI18n() {
  function t(key) {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang.value] || entry.Ru
  }

  function setLang(l) {
    lang.value = l
  }

  return { lang, t, setLang }
}
