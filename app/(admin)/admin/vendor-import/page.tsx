import VendorImportClient from "./VendorImportClient";
import { CatalogSubNav } from "@/components/admin/navigation/AdminSubNav";

export default function VendorImportPage() {
  return (
    <div className="space-y-6">
      <CatalogSubNav />
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex-1 overflow-y-auto">
          <VendorImportClient />
        </div>
      </div>
    </div>
  );
}
