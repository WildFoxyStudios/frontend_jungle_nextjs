import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SubCategoriesPanel } from "@/components/admin/SubCategoriesPanel";

export default function PagesSubCategoriesPage() {
  return (
    <AdminPageShell title="Pages Sub-Categories">
      <SubCategoriesPanel categoryType="page" subType="page" />
    </AdminPageShell>
  );
}
