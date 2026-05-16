import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
// Added HelpCircle for the Review UI
import { Camera, CheckCircle, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

export function OMRScanner() {
    const webcamRef = useRef<Webcam>(null);
    const workerRef = useRef<Worker | null>(null);

    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // NEW: Manual Review States
    const [reviewQueue, setReviewQueue] = useState<string[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});

    // Initialize Web Worker
    useEffect(() => {
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
                setError(e.data.error);
                setIsProcessing(false);
            } else if (e.data.success) {
                const extractedAnswers = e.data.answers;
                alert(JSON.stringify(extractedAnswers))
                // 1. Find all questions flagged for REVIEW by the Web Worker
                const needsReview = Object.keys(extractedAnswers).filter(
                    q => extractedAnswers[q] === "REVIEW"
                );

                setPendingAnswers(extractedAnswers);

                // 2. If there are flagged questions, pause and show Review UI
                if (needsReview.length > 0) {
                    setReviewQueue(needsReview);
                    setIsProcessing(false);
                } else {
                    // 3. Otherwise, grade immediately!
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

    // NEW: The Auto-Grader function
    const finalizeGrading = (finalAnswers: Record<string, string>) => {
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

    // NEW: Resolves one item from the Review Queue
    const handleReviewDecision = (decision: string) => {
        const currentQ = reviewQueue[0];
        const updatedAnswers = { ...pendingAnswers, [currentQ]: decision };

        setPendingAnswers(updatedAnswers);

        // Remove the resolved question from the queue
        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);

        // If the queue is empty, we are done! Grade it.
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

                {/* STATE 1: FINAL SCORE CARD */}
                {scanResult && reviewQueue.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full mx-4 absolute z-50">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{scanResult.score} / {scanResult.total}</h3>
                        <p className="text-slate-500 font-medium mb-6">{scanResult.studentId}</p>
                        <button
                            onClick={() => setScanResult(null)}
                            className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl"
                        >
                            Scan Next Paper
                        </button>
                    </div>
                ) :

                    /* STATE 2: MANUAL REVIEW PROMPT */
                    reviewQueue.length > 0 ? (
                        <div className="bg-amber-50 p-6 rounded-2xl text-center max-w-sm w-full mx-4 absolute z-50 shadow-2xl border-2 border-amber-200">
                            <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Ambiguous Answer</h3>
                            <p className="text-slate-600 text-sm mb-6">
                                Check the physical paper. What did the student intend for
                                <span className="font-black text-lg text-indigo-600 ml-1">Question {reviewQueue[0]}</span>?
                            </p>

                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {['A', 'B', 'C', 'D'].map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => handleReviewDecision(letter)}
                                        className="py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-100 active:bg-slate-200"
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handleReviewDecision("BLANK")}
                                className="w-full py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300"
                            >
                                Mark as Blank / Invalid
                            </button>
                        </div>
                    ) :

                        /* STATE 3: LIVE CAMERA FEED */
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

            {/* BOTTOM CONTROLS (Only visible if not reviewing and not showing score) */}
            {!scanResult && reviewQueue.length === 0 && (
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