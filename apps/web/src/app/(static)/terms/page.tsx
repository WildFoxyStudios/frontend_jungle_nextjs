import { contentApi } from "@jungle/api-client";

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
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {content ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-muted-foreground">
          Terms of service have not been configured yet. Please contact the site administrator.
        </p>
      )}
    </div>
  );
}
