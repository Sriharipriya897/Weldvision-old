
import { useState } from "react";

const API_BASE_URL = "https://weldvision-backend.onrender.com";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  // Image Upload
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  // AI Weld Inspection
  const handleInspect = async () => {
    if (!file) {
      setError("Please upload a weld image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/inspect`,
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || `Inspection failed: ${response.status}`
        );
      }

      if (!responseText) {
        throw new Error("Backend returned an empty response.");
      }

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Backend returned invalid JSON.");
      }

      setResult(data);

    } catch (err) {
      console.error("Inspection request error:", err);
      setError(err.message || "Inspection failed. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  // PDF Report Download
  const handleDownloadPDF = async () => {
    if (!result) {
      setError("Please complete an inspection first.");
      return;
    }

    setPdfLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/download-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result),
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "PDF generation failed.");
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Generated PDF is empty.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "WeldVision_Inspection_Report.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("PDF download error:", err);
      setError(err.message || "PDF download failed.");

    } finally {
      setPdfLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-5">
        <h1 className="text-3xl font-bold">
          WeldVision
          <span className="text-orange-500">.AI</span>
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          AI-Powered Industrial Welding Inspection and Weld Defect Analysis Platform
        </p>

        <p className="mt-3 text-sm text-emerald-400">
          ● Weld Quality Engine Active
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">

        {/* Upload Section */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">

          <h2 className="mb-2 text-2xl font-bold">
            Upload Weld Image
          </h2>

          <p className="mb-6 text-sm text-slate-400">
            Upload a welding image to detect defects using YOLO AI.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm"
          />

          {preview && (
            <div className="mt-6">

              <img
                src={preview}
                alt="Uploaded weld"
                className="max-h-96 rounded-xl border border-slate-700 object-contain"
              />

              <p className="mt-2 text-sm text-slate-400">
                {file?.name}
              </p>

            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">

            <button
              onClick={handleInspect}
              disabled={!file || loading}
              className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Inspecting..." : "Inspect Weld"}
            </button>

            <button
              onClick={handleReset}
              className="rounded-lg border border-slate-600 px-6 py-3 hover:bg-slate-800"
            >
              Reset
            </button>

          </div>

          {loading && (
            <p className="mt-5 text-sm text-orange-400">
              AI model is analyzing your weld image. Please wait...
            </p>
          )}

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </section>

        {/* Inspection Results */}
        {result && (
          <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">

            <h2 className="mb-5 text-2xl font-bold">
              Inspection Results
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Quality Score
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-400">
                  {result.quality_assessment?.quality_score ??
                    result.quality_score ??
                    "N/A"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Overall Status
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-400">
                  {result.quality_assessment?.overall_status ??
                    result.quality_status ??
                    result.inspection_status ??
                    "Complete"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Total Defects
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.summary?.total_defects ??
                    result.total_defects ??
                    "N/A"}
                </p>
              </div>

            </div>

            {/* Annotated Image */}
            {(result.annotated_image || result.summary?.annotated_image) && (
              <div className="mt-7">
                <h3 className="mb-3 text-lg font-semibold">
                  Annotated Inspection Image
                </h3>

                <img
                  src={`data:image/jpeg;base64,${
                    result.annotated_image || result.summary?.annotated_image
                  }`}
                  alt="AI annotated inspection"
                  className="max-h-96 rounded-xl border border-slate-700 object-contain"
                />
              </div>
            )}

            <h3 className="mb-3 mt-7 text-lg font-semibold">
              Complete Inspection Data
            </h3>

            <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-green-300">
              {JSON.stringify(result, null, 2)}
            </pre>

            {/* PDF Download */}
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {pdfLoading
                ? "Generating PDF..."
                : "Download PDF Report"}
            </button>

          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 px-5 py-6 text-center text-sm text-slate-400">
        WeldVision AI © 2026 — Industrial Welding Inspection System
      </footer>

    </div>
  );
}
