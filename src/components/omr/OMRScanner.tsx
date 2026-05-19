import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

export function OMRScanner() {
    const webcamRef = useRef<Webcam>(null);
    const workerRef = useRef<Worker | null>(null);

    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // NEW: The UI Toggle State
    const [examType, setExamType] = useState<'20' | '50'>('20');

    const [reviewQueue, setReviewQueue] = useState<string[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL;
        const workerPath = `${baseUrl}omr.worker.js`;

        workerRef.current = new Worker(workerPath);

        workerRef.current.onerror = (err: ErrorEvent) => {
            setError("Worker failed to load.");
        };

        workerRef.current.onmessage = (e) => {
            if (e.data.status === 'READY') {
                setIsWorkerReady(true);
            } else if (e.data.error) {
                setError(e.data.error);
                setIsProcessing(false);
            } else if (e.data.success) {
                const extractedAnswers = e.data.answers;
                alert(JSON.stringify(extractedAnswers))
                const needsReview = Object.keys(extractedAnswers).filter(
                    q => extractedAnswers[q] === "REVIEW"
                );

                setPendingAnswers(extractedAnswers);

                if (needsReview.length > 0) {
                    setReviewQueue(needsReview);
                    setIsProcessing(false);
                } else {
                    finalizeGrading(extractedAnswers);
                }
            }
        };

        const pingInterval = setInterval(() => {
            if (!isWorkerReady) workerRef.current?.postMessage({ action: 'PING' });
        }, 1000);

        return () => {
            clearInterval(pingInterval);
            workerRef.current?.terminate();
        };
    }, [isWorkerReady]);

    const finalizeGrading = (finalAnswers: Record<string, string>) => {
        // Generating a dynamic dummy answer key for testing based on test size
        const totalItems = examType === '20' ? 20 : 50;
        const dummyAnswerKey: Record<string, string> = {};
        const options = ['A', 'B', 'C', 'D'];
        for (let i = 1; i <= totalItems; i++) {
            dummyAnswerKey[i.toString()] = options[i % 4];
        }

        let score = 0;
        Object.keys(finalAnswers).forEach(q => {
            if (finalAnswers[q] === dummyAnswerKey[q]) score++;
        });

        setScanResult({
            studentId: "Auto-Detected ID",
            score: score,
            total: totalItems,
            answers: finalAnswers
        });
        setIsProcessing(false);
    };

    const handleReviewDecision = (decision: string) => {
        const currentQ = reviewQueue[0];
        const updatedAnswers = { ...pendingAnswers, [currentQ]: decision };

        setPendingAnswers(updatedAnswers);

        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);

        if (newQueue.length === 0) {
            finalizeGrading(updatedAnswers);
        }
    };

    const captureAndScan = useCallback(() => {
        if (!webcamRef.current) return;
        const videoElement = webcamRef.current.video;
        if (!videoElement) return;

        setIsProcessing(true);
        setError(null);

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // Pass the explicit UI toggle state to the worker!
            workerRef.current?.postMessage({ imageData, examType }, [imageData.data.buffer]);
        }
    }, [webcamRef, examType]);

    if (!isWorkerReady) {
        return <div className="p-10 text-center font-bold text-slate-500 flex flex-col items-center justify-center h-screen bg-black">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            Initializing Computer Vision Engine...
        </div>;
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10 shadow-md">
                <h2 className="font-bold tracking-wide">GRID Auto-Scanner</h2>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center">

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

                        (
                            <>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />

                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                                    <div className="w-full max-w-md aspect-[1/1.4] border-4 border-dashed border-blue-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                        <p className="text-white text-center font-bold mt-12 bg-blue-600/90 backdrop-blur-sm mx-8 py-2 rounded-full shadow-lg text-sm">
                                            Align all 4 corners inside this box
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="absolute top-6 left-4 right-4 bg-red-500 text-white p-4 rounded-xl flex gap-3 items-center font-medium z-50 shadow-xl border border-red-400">
                                        <AlertTriangle className="w-6 h-6 shrink-0" />
                                        <p className="text-sm leading-tight">{error}</p>
                                    </div>
                                )}
                            </>
                        )}
            </div>

            {/* BOTTOM CONTROLS */}
            {!scanResult && reviewQueue.length === 0 && (
                <div className="p-6 bg-slate-900 pb-safe z-10 flex flex-col items-center">

                    {/* EXAM TYPE UI TOGGLE */}
                    <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setExamType('20')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${examType === '20' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            20 Items
                        </button>
                        <button
                            onClick={() => setExamType('50')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${examType === '50' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                        >
                            50 Items
                        </button>
                    </div>

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