
import React, { useState } from 'react';
import Header from './components/Header';
import UploadBox from './components/UploadBox';
import Camera from './components/Camera';
import Loading from './components/Loading';
import Result from './components/Result';
import { AlertCircle } from 'lucide-react';

const API_BASE_URL = 'https://weldvision-backend.onrender.com';

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [inspectionResult, setInspectionResult] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleImageSelected = (imageObj) => {
    setSelectedImage(imageObj);
    setErrorMessage(null);

    if (!imageObj) {
      setStatus('idle');
      setInspectionResult(null);
    }
  };

  const startInspection = async () => {
    if (!selectedImage || !selectedImage.file) return;

    setStatus('analyzing');
    setErrorMessage(null);
    setInspectionResult(null);

    const formData = new FormData();
    formData.append('file', selectedImage.file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/inspect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Inspection failed (${response.status}). Please try again.`
        );
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid inspection response from backend.');
      }

      setTimeout(() => {
        setInspectionResult(data);
        setStatus('result');
      }, 1200);

    } catch (err) {
      console.error('Inspection request error:', err);
      setErrorMessage(
        err.message || 'Failed to connect to WeldVision backend inspection server.'
      );
      setStatus('error');
    }
  };

  const handleDownloadPdf = async (resultData) => {
    const payload = resultData || inspectionResult;
    if (!payload) return;

    setIsDownloadingPdf(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || 'Failed to generate PDF report.'
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `WeldVision_Inspection_Report_${Date.now()}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('PDF download error:', err);
      alert(err.message || 'Error downloading PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {status === 'idle' && (
          <UploadBox
            onImageSelected={handleImageSelected}
            onStartInspection={startInspection}
            onOpenCamera={() => setIsCameraOpen(true)}
            selectedImage={selectedImage}
          />
        )}

        {status === 'analyzing' && <Loading />}

        {status === 'result' && inspectionResult && (
          <Result
            result={inspectionResult}
            onDownloadPdf={handleDownloadPdf}
            isDownloadingPdf={isDownloadingPdf}
            onReset={() => {
              setSelectedImage(null);
              setInspectionResult(null);
              setStatus('idle');
              setErrorMessage(null);
            }}
          />
        )}

        {status === 'error' && (
          <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h2 className="mb-2 text-lg font-semibold text-red-700">
              Inspection Failed
            </h2>
            <p className="mb-4 text-sm text-red-600">{errorMessage}</p>
            <button
              onClick={startInspection}
              className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      {isCameraOpen && (
        <Camera
          onImageCaptured={(imageObj) => {
            handleImageSelected(imageObj);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
