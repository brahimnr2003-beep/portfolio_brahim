/* Textos de la web en español (por defecto) e inglés.
   En index.html, data-i18n="clave" pone el texto; data-i18n-html permite etiquetas;
   data-i18n-attr="atributo:clave" traduce un atributo. */
export const STR = {
  es: {
    'meta.title': 'Brahim Nouni Ros · Datos e IA',
    'meta.desc': 'Portfolio de Brahim Nouni Ros: IA generativa, automatización y análisis de datos.',
    'canvas.label': 'Retrato hecho de partículas que se transforma en una red de neuronas con ramificaciones eléctricas al hacer scroll',
    'top.linkedin': 'LinkedIn de Brahim Nouni Ros',
    'lang.label': 'Idioma',
    'hero.sub': 'Datos · IA',
    'hint': 'Desliza para entrar',
    'end': 'Sigue bajando',
    'fail': 'Tu navegador no puede mostrar WebGL, necesario para esta web.',
    'phase.enter': 'Entrada', 'phase.net': 'Red neuronal', 'phase.exit': 'Salida', 'phase.contact': 'Contacto',
    'link.demo': 'Ver proyecto', 'link.code': 'Ver código',
    'contact.kicker': 'Contacto',
    'contact.title': 'Hablemos.',
    'contact.lead': 'Soy Brahim Nouni Ros, desarrollo soluciones tecnológicas combinando IA generativa, automatización y análisis de datos. Me apasiona transformar problemas reales en soluciones innovadoras, conectando tecnología, creatividad y negocio.',
    'cv.main.lab': 'CV', 'cv.main.val': 'Currículum en español',
    'cv.alt.lab': 'CV · EN', 'cv.alt.val': 'Resume in English',
    'edu.title': 'Formación',
    'edu.1': 'Grado en Gestión de Información y Contenidos Digitales',
    'edu.2': 'Máster en Big Data, Data Science e IA · UCM, online',
    'focus.title': 'Foco',
    'focus.text': 'IA generativa, automatización y análisis de datos aplicados a problemas reales de negocio.',
    'tools.title': 'Herramientas',
    'avail.title': 'Disponibilidad',
    'avail.text': 'Abierto a oportunidades en remoto o presencial en el sector de datos e IA.',
    'foot.made': 'Hecho con Three.js'
  },
  en: {
    'meta.title': 'Brahim Nouni Ros · Data & AI',
    'meta.desc': 'Portfolio of Brahim Nouni Ros: generative AI, automation and data analysis.',
    'canvas.label': 'A portrait made of particles that turns into a network of neurons with electric branches as you scroll',
    'top.linkedin': 'Brahim Nouni Ros on LinkedIn',
    'lang.label': 'Language',
    'hero.sub': 'Data · AI',
    'hint': 'Scroll to enter',
    'end': 'Keep scrolling',
    'fail': 'Your browser can’t display WebGL, which this site needs.',
    'phase.enter': 'Entering', 'phase.net': 'Neural network', 'phase.exit': 'Exit', 'phase.contact': 'Contact',
    'link.demo': 'View project', 'link.code': 'View code',
    'contact.kicker': 'Contact',
    'contact.title': 'Let’s talk.',
    'contact.lead': 'I’m Brahim Nouni Ros. I build technology solutions that combine generative AI, automation and data analysis. I love turning real problems into innovative solutions, connecting technology, creativity and business.',
    'cv.main.lab': 'Resume', 'cv.main.val': 'Resume in English',
    'cv.alt.lab': 'CV · ES', 'cv.alt.val': 'Currículum en español',
    'edu.title': 'Education',
    'edu.1': 'Bachelor’s in Information and Digital Content Management',
    'edu.2': 'MSc in Big Data, Data Science & AI · UCM, online',
    'focus.title': 'Focus',
    'focus.text': 'Generative AI, automation and data analysis applied to real business problems.',
    'tools.title': 'Tools',
    'avail.title': 'Availability',
    'avail.text': 'Open to remote or on-site opportunities in data and AI.',
    'foot.made': 'Built with Three.js'
  }
};

/* El CV principal es el del idioma activo; el otro queda como alternativa */
export const CV = {
  es: { main: 'cv/Brahim_Nouni_Ros_CV_ES.pdf', alt: 'cv/Brahim_Nouni_Ros_CV_EN.pdf', altLang: 'en' },
  en: { main: 'cv/Brahim_Nouni_Ros_CV_EN.pdf', alt: 'cv/Brahim_Nouni_Ros_CV_ES.pdf', altLang: 'es' }
};

const KEY = 'portfolio-lang';
let lang = 'es';
try { const saved = localStorage.getItem(KEY); if (saved === 'es' || saved === 'en') lang = saved; } catch (e) { /* sin almacenamiento: español */ }
const listeners = [];

export function getLang() { return lang; }
export function t(key) { return (STR[lang] && STR[lang][key]) || STR.es[key] || key; }
export function onLang(fn) { listeners.push(fn); }

function applyDom() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', t('meta.desc'));
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => { const [attr, key] = pair.split(':'); el.setAttribute(attr.trim(), t(key.trim())); });
  });
  const cvMain = document.getElementById('cv-main'), cvAlt = document.getElementById('cv-alt');
  if (cvMain) cvMain.href = CV[lang].main;
  if (cvAlt) { cvAlt.href = CV[lang].alt; cvAlt.hreflang = CV[lang].altLang; }
  document.querySelectorAll('.lang button').forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

export function setLang(next) {
  if (next !== 'es' && next !== 'en') return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch (e) { /* sin almacenamiento: no se recuerda */ }
  applyDom();
  listeners.forEach((fn) => fn(lang));
}

export function initLang() {
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  applyDom();
}
