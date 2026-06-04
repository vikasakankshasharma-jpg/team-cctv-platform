import VendorImportClient from "./VendorImportClient";

export default function VendorImportPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto">
        <VendorImportClient />
      </div>
    </div>
  );
}
