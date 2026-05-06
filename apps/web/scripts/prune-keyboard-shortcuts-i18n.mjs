/**
 * Syncs keyboardShortcuts namespace (real shortcuts only), adds search_extra metadata keys,
 * removes redundant nav_extra.shortcuts. Run from apps/web:
 *   node scripts/prune-keyboard-shortcuts-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const messagesDir = path.join(import.meta.dirname, "..", "messages");

/** @type {Record<string, Record<string, string>>} */
const KEYBOARD = {
  en: {
    dialogTitle: "Keyboard shortcuts",
    dialogDescription: "Reference of keyboard shortcuts available in the app.",
    escape: "Close dialogs or go back",
    showThisDialog: "Show this list of shortcuts",
    focusSearch: "Focus search bar",
    goHomeFeed: "Go to Home feed",
    goMessages: "Go to Messages",
    goNotifications: "Go to notifications",
    goProfile: "Go to Profile",
    keyEsc: "Esc",
  },
  es: {
    dialogTitle: "Atajos de teclado",
    dialogDescription: "Referencia de atajos de teclado disponibles en la app.",
    escape: "Cerrar cuadros o volver atrás",
    showThisDialog: "Mostrar esta lista de atajos",
    focusSearch: "Ir a la barra de búsqueda",
    goHomeFeed: "Ir al inicio",
    goMessages: "Ir a Mensajes",
    goNotifications: "Ir a Notificaciones",
    goProfile: "Ir al perfil",
    keyEsc: "Esc",
  },
  fr: {
    dialogTitle: "Raccourcis clavier",
    dialogDescription: "Liste des raccourcis disponibles dans l’application.",
    escape: "Fermer les fenêtres ou revenir en arrière",
    showThisDialog: "Afficher cette liste de raccourcis",
    focusSearch: "Aller à la recherche",
    goHomeFeed: "Aller au fil d’accueil",
    goMessages: "Aller aux messages",
    goNotifications: "Aller aux notifications",
    goProfile: "Aller au profil",
    keyEsc: "Esc",
  },
  de: {
    dialogTitle: "Tastenkürzel",
    dialogDescription: "Übersicht der verfügbaren Tastenkürzel.",
    escape: "Dialoge schließen oder zurück",
    showThisDialog: "Diese Liste anzeigen",
    focusSearch: "Suchleiste fokussieren",
    goHomeFeed: "Zum Feed",
    goMessages: "Zu Nachrichten",
    goNotifications: "Zu Benachrichtigungen",
    goProfile: "Zum Profil",
    keyEsc: "Esc",
  },
  pt: {
    dialogTitle: "Atalhos de teclado",
    dialogDescription: "Referência dos atalhos disponíveis no app.",
    escape: "Fechar diálogos ou voltar",
    showThisDialog: "Mostrar esta lista de atalhos",
    focusSearch: "Focar a barra de pesquisa",
    goHomeFeed: "Ir para o feed inicial",
    goMessages: "Ir para Mensagens",
    goNotifications: "Ir para Notificações",
    goProfile: "Ir para o perfil",
    keyEsc: "Esc",
  },
  it: {
    dialogTitle: "Scorciatoie da tastiera",
    dialogDescription: "Elenco delle scorciatoie disponibili nell’app.",
    escape: "Chiudi le finestre o torna indietro",
    showThisDialog: "Mostra questo elenco di scorciatoie",
    focusSearch: "Vai alla barra di ricerca",
    goHomeFeed: "Vai al feed Home",
    goMessages: "Vai a Messaggi",
    goNotifications: "Vai a Notifiche",
    goProfile: "Vai al profilo",
    keyEsc: "Esc",
  },
  nl: {
    dialogTitle: "Toetsenbord snelkoppelingen",
    dialogDescription: "Overzicht van beschikbare snelkoppelingen.",
    escape: "Dialoogvensters sluiten of terug",
    showThisDialog: "Deze lijst tonen",
    focusSearch: "Zoekbalk focussen",
    goHomeFeed: "Naar startfeed",
    goMessages: "Naar Berichten",
    goNotifications: "Naar Meldingen",
    goProfile: "Naar profiel",
    keyEsc: "Esc",
  },
  pl: {
    dialogTitle: "Skróty klawiszowe",
    dialogDescription: "Lista dostępnych skrótów w aplikacji.",
    escape: "Zamknij okna lub wróć",
    showThisDialog: "Pokaż tę listę skrótów",
    focusSearch: "Skup się na pasku wyszukiwania",
    goHomeFeed: "Przejdź do strony głównej",
    goMessages: "Przejdź do Wiadomości",
    goNotifications: "Przejdź do Powiadomień",
    goProfile: "Przejdź do profilu",
    keyEsc: "Esc",
  },
  ru: {
    dialogTitle: "Сочетания клавиш",
    dialogDescription: "Справочник доступных сочетаний в приложении.",
    escape: "Закрыть окна или назад",
    showThisDialog: "Показать этот список сочетаний",
    focusSearch: "Фокус в строке поиска",
    goHomeFeed: "На ленту",
    goMessages: "В сообщения",
    goNotifications: "В уведомления",
    goProfile: "В профиль",
    keyEsc: "Esc",
  },
  tr: {
    dialogTitle: "Klavye kısayolları",
    dialogDescription: "Uygulamada kullanılabilen kısayolların listesi.",
    escape: "Pencereleri kapat veya geri git",
    showThisDialog: "Bu listeyi göster",
    focusSearch: "Arama çubuğuna odaklan",
    goHomeFeed: "Ana akışa git",
    goMessages: "Mesajlar’a git",
    goNotifications: "Bildirimler’e git",
    goProfile: "Profile git",
    keyEsc: "Esc",
  },
  ja: {
    dialogTitle: "キーボードショートカット",
    dialogDescription: "利用できるショートカットの一覧です。",
    escape: "ダイアログを閉じる／戻る",
    showThisDialog: "この一覧を表示",
    focusSearch: "検索バーにフォーカス",
    goHomeFeed: "ホームフィードへ",
    goMessages: "メッセージへ",
    goNotifications: "通知へ",
    goProfile: "プロフィールへ",
    keyEsc: "Esc",
  },
  ko: {
    dialogTitle: "키보드 단축키",
    dialogDescription: "앱에서 사용할 수 있는 단축키 안내입니다.",
    escape: "대화 상자 닫기 또는 뒤로",
    showThisDialog: "이 목록 표시",
    focusSearch: "검색창에 포커스",
    goHomeFeed: "홈 피드로",
    goMessages: "메시지로",
    goNotifications: "알림으로",
    goProfile: "프로필로",
    keyEsc: "Esc",
  },
  zh: {
    dialogTitle: "键盘快捷键",
    dialogDescription: "应用中可用的快捷键说明。",
    escape: "关闭对话框或返回",
    showThisDialog: "显示此快捷键列表",
    focusSearch: "聚焦搜索栏",
    goHomeFeed: "前往动态首页",
    goMessages: "前往消息",
    goNotifications: "前往通知",
    goProfile: "前往个人主页",
    keyEsc: "Esc",
  },
  ar: {
    dialogTitle: "اختصارات لوحة المفاتيح",
    dialogDescription: "مرجع لاختصارات لوحة المفاتيح المتاحة في التطبيق.",
    escape: "إغلاق النوافذ أو الرجوع",
    showThisDialog: "عرض هذه القائمة",
    focusSearch: "التركيز على شريط البحث",
    goHomeFeed: "الانتقال إلى الصفحة الرئيسية",
    goMessages: "الانتقال إلى الرسائل",
    goNotifications: "الانتقال إلى الإشعارات",
    goProfile: "الانتقال إلى الملف الشخصي",
    keyEsc: "Esc",
  },
  fa: {
    dialogTitle: "میان‌برهای صفحه‌کلید",
    dialogDescription: "مرجع میان‌برهای موجود در برنامه.",
    escape: "بستن پنجره‌ها یا بازگشت",
    showThisDialog: "نمایش این فهرست",
    focusSearch: "تمرکز روی نوار جستجو",
    goHomeFeed: "رفتن به فید خانه",
    goMessages: "رفتن به پیام‌ها",
    goNotifications: "رفتن به اعلان‌ها",
    goProfile: "رفتن به پروفایل",
    keyEsc: "Esc",
  },
  hi: {
    dialogTitle: "कीबोर्ड शॉर्टकट",
    dialogDescription: "ऐप में उपलब्ध शॉर्टकट की सूची।",
    escape: "संवाद बंद करें या पीछे जाएँ",
    showThisDialog: "यह सूची दिखाएँ",
    focusSearch: "खोज पट्टी पर फ़ोकस",
    goHomeFeed: "होम फ़ीड पर जाएँ",
    goMessages: "संदेशों पर जाएँ",
    goNotifications: "सूचनाओं पर जाएँ",
    goProfile: "प्रोफ़ाइल पर जाएँ",
    keyEsc: "Esc",
  },
  id: {
    dialogTitle: "Pintasan keyboard",
    dialogDescription: "Daftar pintasan yang tersedia di aplikasi.",
    escape: "Tutup dialog atau kembali",
    showThisDialog: "Tampilkan daftar ini",
    focusSearch: "Fokus bilah pencarian",
    goHomeFeed: "Ke feed Beranda",
    goMessages: "Ke Pesan",
    goNotifications: "Ke Notifikasi",
    goProfile: "Ke profil",
    keyEsc: "Esc",
  },
};

/** @type {Record<string, string>} */
const SEARCH_EXTRA_LINKEDIN = {
  en: "Professional search",
  es: "Búsqueda profesional",
  fr: "Recherche professionnelle",
  de: "Professionelle Suche",
  pt: "Pesquisa profissional",
  it: "Ricerca professionale",
  nl: "Professioneel zoeken",
  pl: "Wyszukiwanie profesjonalne",
  ru: "Профессиональный поиск",
  tr: "Profesyonel arama",
  ja: "プロフェッショナル検索",
  ko: "전문 검색",
  zh: "职业搜索",
  ar: "بحث احترافي",
  fa: "جستجوی حرفه‌ای",
  hi: "पेशेवर खोज",
  id: "Pencarian profesional",
};

for (const file of fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"))) {
  const code = file.replace(".json", "");
  const kb = KEYBOARD[code];
  const linkedin = SEARCH_EXTRA_LINKEDIN[code];
  if (!kb || !linkedin) {
    console.error("missing locale data:", code);
    process.exit(1);
  }
  const p = path.join(messagesDir, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.keyboardShortcuts = kb;
  if (j.nav_extra && "shortcuts" in j.nav_extra) {
    delete j.nav_extra.shortcuts;
  }
  if (!j.search_extra) j.search_extra = {};
  j.search_extra.professionalSearchLayoutTitle = linkedin;

  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`, "utf8");
  console.log("updated:", file);
}
console.log("done.");
