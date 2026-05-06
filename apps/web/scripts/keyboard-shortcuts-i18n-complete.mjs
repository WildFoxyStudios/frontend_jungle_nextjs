/**
 * One-shot: replace keyboardShortcuts.* new keys with proper locale strings (17 files).
 * Run: node scripts/keyboard-shortcuts-i18n-complete.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

/** @type {Record<string, Partial<Record<string, string>>>} */
const PATCH = {
  es: {
    dialogDescription:
      "Navegación global, fila del feed de inicio (enfoca primero una publicación), búsqueda y publicar desde el compositor.",
    feedNextPost: "Siguiente publicación (Inicio)",
    feedPrevPost: "Publicación anterior (Inicio)",
    feedReact: "Dar o quitar me gusta en la publicación enfocada (Inicio)",
    feedCommentToggle: "Abrir o cerrar comentarios en la publicación enfocada (Inicio)",
    feedShareDialog: "Abrir ventana de compartir para la publicación enfocada (Inicio)",
    composerSubmitPost: "Publicar desde el compositor",
  },
  fr: {
    dialogDescription:
      "Navigation globale, ligne du fil d’accueil (focaliser d’abord une publication), recherche et publier depuis le compositeur.",
    feedNextPost: "Publication suivante (Accueil)",
    feedPrevPost: "Publication précédente (Accueil)",
    feedReact: "Réagir ou retirer le j’aime sur la publication ciblée (Accueil)",
    feedCommentToggle: "Afficher ou masquer les commentaires de la publication ciblée (Accueil)",
    feedShareDialog: "Ouvrir le partage pour la publication ciblée (Accueil)",
    composerSubmitPost: "Publier depuis le compositeur",
  },
  de: {
    dialogDescription:
      "Globale Navigation, Start-Feed-Zeile (zuerst einen Beitrag fokussieren), Suche und aus dem Composer posten.",
    feedNextPost: "Nächster Beitrag (Start)",
    feedPrevPost: "Vorheriger Beitrag (Start)",
    feedReact: "Like am fokussierten Beitrag umschalten (Start)",
    feedCommentToggle: "Kommentare am fokussierten Beitrag ein-/ausblenden (Start)",
    feedShareDialog: "Teilen-Dialog für fokussierten Beitrag (Start)",
    composerSubmitPost: "Beitrag aus dem Composer veröffentlichen",
  },
  pt: {
    dialogDescription:
      "Navegação global, linha do feed inicial (foque primeiro uma publicação), pesquisar e publicar no compositor.",
    feedNextPost: "Próxima publicação (Início)",
    feedPrevPost: "Publicação anterior (Início)",
    feedReact: "Curtir ou descurtir na publicação em foco (Início)",
    feedCommentToggle: "Alternar comentários da publicação em foco (Início)",
    feedShareDialog: "Abrir partilhar para a publicação em foco (Início)",
    composerSubmitPost: "Publicar a partir do compositor",
  },
  it: {
    dialogDescription:
      "Navigazione globale, riga feed di Home (metti prima a fuoco un post), ricerca e pubblica dal compositor.",
    feedNextPost: "Post successivo (Home)",
    feedPrevPost: "Post precedente (Home)",
    feedReact: "Attiva/disattiva mi piace sul post a fuoco (Home)",
    feedCommentToggle: "Mostra/nascondi commenti sul post a fuoco (Home)",
    feedShareDialog: "Apri condivisione per il post a fuoco (Home)",
    composerSubmitPost: "Pubblica dal compositor",
  },
  nl: {
    dialogDescription:
      "Globaal, startfeedrij (focus eerst een bericht), zoeken en publiceren vanuit de composer.",
    feedNextPost: "Volgend bericht (Start)",
    feedPrevPost: "Vorig bericht (Start)",
    feedReact: "Vind-ik-leuk aan/uit op gefocuste post (Start)",
    feedCommentToggle: "Reacties tonen/verbergen op gefocuste post (Start)",
    feedShareDialog: "Deeldialoog openen voor gefocuste post (Start)",
    composerSubmitPost: "Publiceren vanuit de composer",
  },
  pl: {
    dialogDescription:
      "Nawigacja globalna, wiersz kanału głównego (najpierw skup się na wpisie), wyszukiwanie i publikacja z edytora.",
    feedNextPost: "Następny wpis (Strona główna)",
    feedPrevPost: "Poprzedni wpis (Strona główna)",
    feedReact: "Polub lub cofnij polubienie na wybranym wpisie (Strona główna)",
    feedCommentToggle: "Pokaż/ukryj komentarze przy wybranym wpisie (Strona główna)",
    feedShareDialog: "Udostępnianie dla wybranego wpisu (Strona główna)",
    composerSubmitPost: "Opublikuj z edytora",
  },
  ru: {
    dialogDescription:
      "Глобальная навигация, строка главной ленты (сначала выберите пост), поиск и публикация из редактора.",
    feedNextPost: "Следующая запись (Главная)",
    feedPrevPost: "Предыдущая запись (Главная)",
    feedReact: "Лайк на активной записи (Главная)",
    feedCommentToggle: "Показать/скрыть комментарии к активной записи (Главная)",
    feedShareDialog: "Открыть «Поделиться» для активной записи (Главная)",
    composerSubmitPost: "Опубликовать из редактора",
  },
  zh: {
    dialogDescription:
      "全局导航、主页动态行（请先聚焦帖子）、搜索以及从发布框发布。",
    feedNextPost: "下一条帖子（主页）",
    feedPrevPost: "上一条帖子（主页）",
    feedReact: "对当前聚焦帖子点赞或取消点赞（主页）",
    feedCommentToggle: "打开或关闭当前帖子的评论（主页）",
    feedShareDialog: "打开当前帖子的分享对话框（主页）",
    composerSubmitPost: "从发布框发布",
  },
  ja: {
    dialogDescription:
      "グローバル移動・ホームの投稿行（先に投稿にフォーカス）・検索・投稿ボックスからの投稿。",
    feedNextPost: "次の投稿（ホーム）",
    feedPrevPost: "前の投稿（ホーム）",
    feedReact: "フォーカス中の投稿にいいね切替（ホーム）",
    feedCommentToggle: "フォーカス中の投稿のコメント開閉（ホーム）",
    feedShareDialog: "フォーカス中の投稿の共有ダイアログ（ホーム）",
    composerSubmitPost: "投稿ボックスから投稿",
  },
  ko: {
    dialogDescription:
      "전역 이동, 홈 피드 줄(먼저 게시물 초점), 검색 및 작성 창에서 게시합니다.",
    feedNextPost: "다음 게시물 (홈)",
    feedPrevPost: "이전 게시물 (홈)",
    feedReact: "초점 게시물에 좋아요 토글 (홈)",
    feedCommentToggle: "초점 게시물 댓글 열기/닫기 (홈)",
    feedShareDialog: "초점 게시물 공유 대화상자 (홈)",
    composerSubmitPost: "작성 창에서 게시",
  },
  ar: {
    dialogDescription:
      "تنقل عام، صف المواضيع في الصفحة الرئيسية (ركّز على منشور أولًا)، بحث والنشر من صندوق التأليف.",
    feedNextPost: "المنشور التالي (الرئيسية)",
    feedPrevPost: "المنشور السابق (الرئيسية)",
    feedReact: "تبديل الإعجاب على المنشور المُركّز (الرئيسية)",
    feedCommentToggle: "إظهار/إخفاء التعليقات للمنشور المُركّز (الرئيسية)",
    feedShareDialog: "فتح مشاركة للمنشور المُركّز (الرئيسية)",
    composerSubmitPost: "النشر من صندوق التأليف",
  },
  hi: {
    dialogDescription:
      "वैश्विक नेविगेशन, होम फ़ीड पंक्ति (पहले किसी पोस्ट पर फ़ोकस करें), खोज और कम्पोज़र से पोस्ट।",
    feedNextPost: "अगली पोस्ट (होम)",
    feedPrevPost: "पिछली पोस्ट (होम)",
    feedReact: "फ़ोकस्ड पोस्ट पर लाइक टॉगल करें (होम)",
    feedCommentToggle: "फ़ोकस्ड पोस्ट पर टिप्पणियाँ दिखाएँ/छिपाएँ (होम)",
    feedShareDialog: "फ़ोकस्ड पोस्ट का शेयर संवाद खोलें (होम)",
    composerSubmitPost: "कम्पोज़र से पोस्ट करें",
  },
  id: {
    dialogDescription:
      "Navigasi global, barisan feed beranda (fokus ke posting dulu), pencarian, dan posting dari komposer.",
    feedNextPost: "Posting berikutnya (Beranda)",
    feedPrevPost: "Posting sebelumnya (Beranda)",
    feedReact: "Suka atau batal suka pada posting terfokus (Beranda)",
    feedCommentToggle: "Toggle komentar posting terfokus (Beranda)",
    feedShareDialog: "Buka bagikan untuk posting terfokus (Beranda)",
    composerSubmitPost: "Posting dari komposer",
  },
  fa: {
    dialogDescription:
      "ناوبری عمومی، ردیف فید صفحهٔ اصلی (ابتدا روی یک پست تمرکز کنید)، جستجو و انتشار از ویرایشگر.",
    feedNextPost: "پست بعدی (صفحهٔ اصلی)",
    feedPrevPost: "پست قبلی (صفحهٔ اصلی)",
    feedReact: "لایک/برداشتن از پست در فوکوس (صفحهٔ اصلی)",
    feedCommentToggle: "باز/بستن نظرات پست در فوکوس (صفحهٔ اصلی)",
    feedShareDialog: "بازکردن اشتراک‌گذاری برای پست در فوکوس (صفحهٔ اصلی)",
    composerSubmitPost: "انتشار از ویرایشگر",
  },
  tr: {
    dialogDescription:
      "Genel gezinme, ana sayfa akış sırası (önce gönderiye odaklan), arama ve düzenleyiciden yayınla.",
    feedNextPost: "Sonraki gönderi (Ana sayfa)",
    feedPrevPost: "Önceki gönderi (Ana sayfa)",
    feedReact: "Odaktaki gönderide beğeniyi aç/kapat (Ana sayfa)",
    feedCommentToggle: "Odaktaki gönderide yorumları aç/kapat (Ana sayfa)",
    feedShareDialog: "Odaktaki gönderide paylaş penceresi (Ana sayfa)",
    composerSubmitPost: "Düzenleyiciden yayınla",
  },
};

for (const file of fs.readdirSync(messagesDir)) {
  if (!file.endsWith(".json")) continue;
  const lc = path.basename(file, ".json");
  if (lc === "en") continue;

  const p = path.join(messagesDir, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const patch = PATCH[lc];
  if (!patch) {
    console.warn("No patch template for locale:", lc);
    continue;
  }
  j.keyboardShortcuts = { ...j.keyboardShortcuts, ...patch };
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("updated", file);
}
