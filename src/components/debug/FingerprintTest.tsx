import { useEffect, useState } from "react";
import { generateBrowserFingerprint } from "../../lib/browserFingerprint";
import type { BrowserFingerprint } from "../../lib/browserFingerprint";
import { logError, ErrorFactory } from "../../lib/error-handling";

export function FingerprintTest() {
  const [fingerprint, setFingerprint] = useState<BrowserFingerprint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFingerprint = async () => {
      try {
        const fp = await generateBrowserFingerprint();
        setFingerprint(fp);
        console.log("Fingerprint:", fp.fingerprint);
        console.log("Confidence:", fp.metadata.confidence);
        console.log("Components:", fp.components);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        logError(
          ErrorFactory.storage(
            "Failed to generate fingerprint",
            "Erreur lors de la génération de l'empreinte",
          ),
          { component: "FingerprintTest" },
        );
      }
    };

    testFingerprint();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h2 className="text-lg font-bold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!fingerprint) {
    return <div className="p-4">Generating fingerprint...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <h2 className="text-lg font-bold text-blue-700 mb-2">Browser Fingerprint</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Fingerprint:</strong>
            <code className="ml-2 bg-white px-2 py-1 rounded">{fingerprint.fingerprint}</code>
          </div>
          <div>
            <strong>Confidence:</strong> {fingerprint.metadata.confidence}
          </div>
          <div>
            <strong>Timestamp:</strong> {new Date(fingerprint.metadata.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-bold mb-2">Components</h3>
        <div className="space-y-1 text-sm font-mono">
          {Object.entries(fingerprint.components).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="text-gray-600">{key}:</span>
              <span className="text-gray-900">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
