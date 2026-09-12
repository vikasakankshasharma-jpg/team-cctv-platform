import { AlertTriangle, Info } from "lucide-react";

interface RevisionBannerProps {
  version: number;
  revisionNotes?: string;
  isRevision?: boolean;
}

export function RevisionBanner({ version, revisionNotes, isRevision }: RevisionBannerProps) {
  if (!isRevision || version <= 1) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-amber-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Revised Quotation (Version {version})
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              This quotation has been updated following your site visit to ensure a perfect installation.
            </p>
            {revisionNotes && (
              <div className="mt-3 bg-amber-100/50 p-3 rounded border border-amber-200">
                <span className="font-semibold block mb-1">Updates made:</span>
                <span className="italic">{revisionNotes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
