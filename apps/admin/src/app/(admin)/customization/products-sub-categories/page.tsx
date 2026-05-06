import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SubCategoriesPanel } from "@/components/admin/SubCategoriesPanel";

export default function ProductsSubCategoriesPage() {
  return (
    <AdminPageShell title="Products Sub-Categories">
      <SubCategoriesPanel categoryType="product" subType="product" />
    </AdminPageShell>
  );
}
