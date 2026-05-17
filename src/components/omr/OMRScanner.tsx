// src/components/OMRScanner.tsx
import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

export function OMRScanner() {
    const webcamRef = useRef<Webcam>(null);
    const workerRef = useRef<Worker | null>(null);

    // Application States
    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Human-in-the-Loop Review States
    const [reviewQueue, setReviewQueue] = useState<string[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});

    // Initialize the Web Worker on Mount
    useEffect(() => {
        // Vite-safe dynamic base URL resolution
        const baseUrl = import.meta.env.BASE_URL;
        const workerPath = `${baseUrl}omr.worker.js`;

        workerRef.current = new Worker(workerPath);

        workerRef.current.onerror = (err: ErrorEvent) => {
            console.error("Worker Error:", err);
            setError("Worker failed to load.");
        };

        workerRef.current.onmessage = (e) => {
            if (e.data.status === 'READY') {
                setIsWorkerReady(true);
            } else if (e.data.error) {
                // Displays Blur or Corner missing warnings
                setError(e.data.error);
                setIsProcessing(false);
            } else if (e.data.success) {
                const extractedAnswers = e.data.answers;
                alert(JSON.stringify(extractedAnswers))
                // Check if the Worker flagged any ambiguous erasures for human review
                const needsReview = Object.keys(extractedAnswers).filter(
                    q => extractedAnswers[q] === "REVIEW"
                );

                setPendingAnswers(extractedAnswers);

                if (needsReview.length > 0) {
                    // Pause grading and show the Teacher UI
                    setReviewQueue(needsReview);
                    setIsProcessing(false);
                } else {
                    // Perfect scan, grade immediately
                    finalizeGrading(extractedAnswers);
                }
            }
        };

        // Ping the worker to check if the large OpenCV WASM file has finished downloading
        const pingInterval = setInterval(() => {
            if (!isWorkerReady) workerRef.current?.postMessage({ action: 'PING' });
        }, 1000);

        return () => {
            clearInterval(pingInterval);
            workerRef.current?.terminate();
        };
    }, [isWorkerReady]);

    // Grades the paper against the Answer Key
    const finalizeGrading = (finalAnswers: Record<string, string>) => {
        // TODO: Replace with DB fetch logic later
        const dummyAnswerKey: Record<string, string> = {
            "1": "A", "2": "C", "3": "D", "4": "B", "5": "A",
            "6": "D", "7": "C", "8": "C", "9": "B", "10": "A",
            "11": "A", "12": "C", "13": "D", "14": "B", "15": "A",
            "16": "D", "17": "C", "18": "C", "19": "B", "20": "A"
        };

        let score = 0;
        Object.keys(finalAnswers).forEach(q => {
            if (finalAnswers[q] === dummyAnswerKey[q]) score++;
        });

        setScanResult({
            studentId: "Auto-Detected ID",
            score: score,
            total: Object.keys(finalAnswers).length,
            answers: finalAnswers
        });
        setIsProcessing(false);
    };

    // Handles the Teacher's manual override of an ambiguous bubble
    const handleReviewDecision = (decision: string) => {
        const currentQ = reviewQueue[0];
        const updatedAnswers = { ...pendingAnswers, [currentQ]: decision };

        setPendingAnswers(updatedAnswers);

        // Remove the resolved question from the queue
        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);

        // If the queue is empty, calculate the final grade
        if (newQueue.length === 0) {
            finalizeGrading(updatedAnswers);
        }
    };

    // Extracts a frame from the webcam and sends it to the Worker
    const captureAndScan = useCallback(() => {
        if (!webcamRef.current) return;
        const videoElement = webcamRef.current.video;
        if (!videoElement) return;

        setIsProcessing(true);
        setError(null); // Clear previous warnings

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Transfer memory directly to worker to save main thread performance
            workerRef.current?.postMessage({ imageData }, [imageData.data.buffer]);
        }
    }, [webcamRef]);

    if (!isWorkerReady) {
        return <div className="p-10 text-center font-bold text-slate-500 flex flex-col items-center justify-center h-screen bg-black">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            Initializing Computer Vision Engine...
        </div>;
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* TOP NAVBAR */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10 shadow-md">
                <h2 className="font-bold tracking-wide">GRID Auto-Scanner</h2>
            </div>

            {/* MAIN VIEWPORT */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">

                {/* UI STATE 1: FINAL SCORE CARD */}
                {scanResult && reviewQueue.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full mx-4 absolute z-50 shadow-2xl">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h3 className="text-5xl font-black text-slate-900 mb-2">{scanResult.score} <span className="text-2xl text-slate-400">/ {scanResult.total}</span></h3>
                        <p className="text-slate-500 font-medium mb-8 bg-slate-100 py-2 rounded-lg">{scanResult.studentId}</p>
                        <button
                            onClick={() => setScanResult(null)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold rounded-xl text-lg"
                        >
                            Scan Next Paper
                        </button>
                    </div>
                ) :

                    /* UI STATE 2: HUMAN-IN-THE-LOOP REVIEW PROMPT */
                    reviewQueue.length > 0 ? (
                        <div className="bg-amber-50 p-6 rounded-3xl text-center max-w-sm w-full mx-4 absolute z-50 shadow-2xl border-4 border-amber-200">
                            <HelpCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Ambiguous Answer</h3>
                            <p className="text-slate-600 mb-6">
                                Check the physical paper. What did the student intend for
                                <span className="font-black text-xl text-indigo-600 block mt-2">Question {reviewQueue[0]}?</span>
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {['A', 'B', 'C', 'D'].map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => handleReviewDecision(letter)}
                                        className="py-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-xl hover:border-indigo-500 hover:text-indigo-600 active:bg-indigo-50 transition-all shadow-sm"
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handleReviewDecision("BLANK")}
                                className="w-full py-4 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                            >
                                Mark as Blank / Invalid
                            </button>
                        </div>
                    ) :

                        /* UI STATE 3: LIVE CAMERA VIEW */
                        (
                            <>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                {/* 4-Corner Targeting Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                                    <div className="w-full max-w-md aspect-[1/1.4] border-4 border-dashed border-blue-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                        <p className="text-white text-center font-bold mt-12 bg-blue-600/90 backdrop-blur-sm mx-8 py-2 rounded-full shadow-lg text-sm">
                                            Align all 4 corners inside this box
                                        </p>
                                    </div>
                                </div>

                                {/* Floating Error/Warning Banner */}
                                {error && (
                                    <div className="absolute top-6 left-4 right-4 bg-red-500 text-white p-4 rounded-xl flex gap-3 items-center font-medium z-50 shadow-xl border border-red-400 animate-in slide-in-from-top-4">
                                        <AlertTriangle className="w-6 h-6 shrink-0" />
                                        <p className="text-sm leading-tight">{error}</p>
                                    </div>
                                )}
                            </>
                        )}
            </div>

            {/* BOTTOM CAPTURE CONTROLS */}
            {!scanResult && reviewQueue.length === 0 && (
                <div className="p-8 bg-slate-900 pb-safe z-10 flex justify-center">
                    <button
                        onClick={captureAndScan}
                        disabled={isProcessing}
                        className="w-20 h-20 rounded-full border-4 border-slate-500 p-1 active:scale-95 transition-transform"
                    >
                        <div className={`w-full h-full rounded-full flex items-center justify-center transition-colors ${isProcessing ? 'bg-slate-700' : 'bg-white'}`}>
                            {isProcessing ? <RefreshCw className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-slate-900" />}
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}