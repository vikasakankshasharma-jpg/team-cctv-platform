"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: any) => void;
}

export default function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialize the scanner
    scannerRef.current = new Html5QrcodeScanner(
      "barcode-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [0] // Camera scan only, no file upload
      },
      false // Verbose off
    );

    let isScanned = false;

    scannerRef.current.render(
      (decodedText) => {
        if (!isScanned) {
          isScanned = true;
          // Clean up the scanner immediately upon successful scan
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
          }
          onScan(decodedText);
        }
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      }
    );

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner on unmount", e));
      }
    };
  }, [onScan, onError]);

  return (
    <div className="w-full mx-auto overflow-hidden rounded-xl bg-black">
      <div id="barcode-reader" className="w-full [&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:!rounded-lg [&>button]:!px-4 [&>button]:!py-2 [&>button]:!font-bold [&>button]:!my-2"></div>
    </div>
  );
}
