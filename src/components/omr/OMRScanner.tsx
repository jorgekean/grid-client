import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
// import OMRWorker from './omr.worker.ts?worker';

export function OMRScanner() {
    const webcamRef = useRef<Webcam>(null);
    const workerRef = useRef<Worker | null>(null);

    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize Web Worker
    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL;

        // Result: "/omr.worker.js" (or "/grid-client/omr.worker.js")
        const workerPath = `omr.worker.js`;

        workerRef.current = new Worker(workerPath);

        workerRef.current.onerror = (err: ErrorEvent) => {
            console.error("Worker Error:", err);
            setError("Worker failed to load.");
        };

        workerRef.current.onmessage = (e) => {
            if (e.data.status === 'READY') {
                setIsWorkerReady(true);
            } else if (e.data.error) {
                setError(e.data.error);
                setIsProcessing(false);
            } else if (e.data.success) {
                // Grade the answers returned from the worker
                const dummyAnswerKey: Record<string, string> = {
                    "1": "A", "2": "C", "3": "D", "4": "B", "5": "A",
                    // ... rest of key
                };

                let score = 0;
                Object.keys(e.data.answers).forEach(q => {
                    if (e.data.answers[q] === dummyAnswerKey[q]) score++;
                });
                alert(JSON.stringify(e.data.answers));
                setScanResult({
                    studentId: "Auto-Detected ID",
                    score: score,
                    total: Object.keys(e.data.answers).length,
                    answers: e.data.answers
                });
                setIsProcessing(false);
            }
        };

        // Ping the worker to check if OpenCV is loaded
        const pingInterval = setInterval(() => {
            if (!isWorkerReady) workerRef.current?.postMessage({ action: 'PING' });
        }, 1000);

        return () => {
            clearInterval(pingInterval);
            workerRef.current?.terminate();
        };
    }, [isWorkerReady]);

    const captureAndScan = useCallback(() => {
        if (!webcamRef.current) return;

        const videoElement = webcamRef.current.video;
        if (!videoElement) return;

        setIsProcessing(true);
        setError(null);

        // Extract raw ImageData via an off-screen canvas
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Offload the heavy lifting to the Worker Thread
            workerRef.current?.postMessage({ imageData }, [imageData.data.buffer]);
        }
    }, [webcamRef]);

    if (!isWorkerReady) {
        return <div className="p-10 text-center font-bold text-slate-500">Initializing Computer Vision Engine...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* HEADER */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10">
                <h2 className="font-bold">GRID Auto-Scanner</h2>
            </div>

            {/* CAMERA VIEWPORT */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                {scanResult ? (
                    <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full mx-4 absolute z-50">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{scanResult.score} / {scanResult.total}</h3>
                        <button
                            onClick={() => setScanResult(null)}
                            className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                        >
                            Scan Next Paper
                        </button>
                    </div>
                ) : (
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* OMR Targeting Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                            <div className="w-full max-w-md aspect-[1/1.4] border-4 border-dashed border-blue-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                <p className="text-white text-center font-bold mt-10 bg-black/50 mx-4 py-1 rounded">
                                    Align all 4 corners inside this box
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="absolute top-10 left-4 right-4 bg-red-500 text-white p-3 rounded-lg flex gap-2 font-medium z-50 shadow-lg">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* BOTTOM CONTROLS */}
            {!scanResult && (
                <div className="p-8 bg-slate-900 pb-safe z-10 flex justify-center">
                    <button
                        onClick={captureAndScan}
                        disabled={isProcessing}
                        className="w-20 h-20 rounded-full border-4 border-slate-400 p-1 active:scale-95 transition-transform"
                    >
                        <div className={`w-full h-full rounded-full flex items-center justify-center ${isProcessing ? 'bg-slate-500' : 'bg-white'}`}>
                            {isProcessing ? <RefreshCw className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-slate-900" />}
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}