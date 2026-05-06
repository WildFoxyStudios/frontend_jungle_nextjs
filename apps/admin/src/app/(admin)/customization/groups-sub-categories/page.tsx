import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SubCategoriesPanel } from "@/components/admin/SubCategoriesPanel";

export default function GroupsSubCategoriesPage() {
  return (
    <AdminPageShell title="Groups Sub-Categories">
      <SubCategoriesPanel categoryType="group" subType="group" />
    </AdminPageShell>
  );
}
