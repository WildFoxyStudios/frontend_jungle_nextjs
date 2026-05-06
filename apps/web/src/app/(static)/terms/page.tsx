import { contentApi } from "@jungle/api-client";
import { sanitizeHtml } from "@jungle/utils/sanitize";

export const revalidate = 3600; // revalidate every hour

export default async function TermsPage() {
 let content = "";
 let title = "Terms of Service";

 try {
 const page = await contentApi.getCustomPage("terms");
 if (page) {
 title = page.title ?? title;
 content = page.content ?? "";
 }
 } catch {
 // fallback to empty if not configured
 }

 return (
 <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
 <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
 {content ? (
 <div
 className="prose prose-sm max-w-none dark:prose-invert"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
 />
 ) : (
 <div className="p-6 text-[15px] font-semibold text-muted-foreground">
 Terms of service have not been configured yet. Please contact the site administrator.
 </div>
 )}
 </div>
 );
}
