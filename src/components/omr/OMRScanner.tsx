import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
// import opencvJS from '../../../public/opencv.js'; // Ensure this points to your local copy in the public folder

export function OMRScanner() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isReady, setIsReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Wait for OpenCV to load completely
    useEffect(() => {
        // Prevent loading multiple times if component re-renders
        if (document.getElementById('opencv-script')) {
            return;
        }

        const loadOpenCV = () => {
            const script = document.createElement('script');
            // Pointing to your local public folder so it works OFFLINE!
            script.src = "opencv.js";
            script.id = 'opencv-script';
            script.async = true;

            // 1. Wait for the JS file to download
            script.onload = () => {
                // 2. OpenCV creates a global Promise or Object. We must wait for the WASM engine.
                if (window.cv instanceof Promise) {
                    window.cv.then((target) => {
                        window.cv = target;
                        setIsReady(true);
                    });
                } else if (window.cv && window.cv.Mat) {
                    setIsReady(true);
                } else {
                    // 3. The official OpenCV callback for when WebAssembly is ready
                    window.cv = window.cv || {};
                    window.cv.onRuntimeInitialized = () => {
                        setIsReady(true);
                    };
                }
            };

            script.onerror = () => {
                setError("Failed to load Computer Vision engine. Check if opencv.js is in your public folder.");
            };

            document.body.appendChild(script);
        };

        loadOpenCV();

        // Cleanup: We don't remove the script on unmount because OpenCV is huge
        // and we want to keep it in memory for the next time they open the scanner.
    }, []);

    // Capture the frame and send to OpenCV
    const captureAndScan = useCallback(() => {
        if (!webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);
        setError(null);

        // Create an HTML Image element to load the base64 string
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            try {
                processImage(img);
            } catch (err) {
                console.error(err);
                setError("Failed to read the document. Please ensure all 4 corners are visible and well-lit.");
                setIsProcessing(false);
            }
        };
    }, [webcamRef]);

    // --- THE OPENCV VISION ENGINE ---
    // --- THE OPENCV VISION ENGINE ---
    const processImage = async (imgElement: HTMLImageElement) => {
        const cv = window.cv;

        let src = cv.imread(imgElement);
        let gray = new cv.Mat();
        let blurred = new cv.Mat();
        let thresh = new cv.Mat();

        // 1. PRE-PROCESSING
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        // Invert so dark pencil marks become bright white pixels (value 255)
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

        // 2. FINDING THE PAPER (Perspective Warp)
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        // Find the largest contour (which should be the paper or the boundary of the 4 corner markers)
        let maxArea = 0;
        let maxContourIndex = -1;
        for (let i = 0; i < contours.size(); ++i) {
            let area = cv.contourArea(contours.get(i));
            if (area > maxArea) {
                maxArea = area;
                maxContourIndex = i;
            }
        }

        if (maxContourIndex === -1) {
            setError("Could not detect the document. Please align it within the markers.");
            setIsProcessing(false);
            // Cleanup
            src.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
            return;
        }

        // --- ASSUMPTION --- 
        // For this exact snippet, we assume the image is already flat and perfectly cropped to the bubble grid.
        // In a full production version, you use cv.getPerspectiveTransform here using the 4 corners of maxContourIndex.
        // Let's proceed with reading the bubbles on the flattened 'thresh' image.

        // 3. READING THE BUBBLES
        // You must calibrate these constants based on the exact PDF you generated!
        const numQuestions = 20;
        const numChoices = 4; // A, B, C, D
        const choicesMap = ['A', 'B', 'C', 'D'];

        // Example layout coordinates (You will need to measure your actual PDF pixels)
        // Assume the grid starts at X: 100, Y: 200, each row is 40px tall, each bubble is 30px wide, spaced by 10px.
        const startX = 100;
        const startY = 200;
        const rowHeight = 40;
        const bubbleWidth = 30;
        const bubbleSpacing = 40; // width + gap

        let studentAnswers: Record<string, string> = {};

        for (let q = 0; q < numQuestions; q++) {
            let bestChoice = -1;
            let maxPixels = 0;

            for (let c = 0; c < numChoices; c++) {
                // Define the bounding box for this specific bubble
                let x = startX + (c * bubbleSpacing);
                let y = startY + (q * rowHeight);
                let rect = new cv.Rect(x, y, bubbleWidth, bubbleWidth);

                // Slice out just this bubble from the thresholded image
                let bubbleROI = thresh.roi(rect);

                // Count how many white (shaded) pixels are inside this bubble
                let filledPixels = cv.countNonZero(bubbleROI);

                if (filledPixels > maxPixels) {
                    maxPixels = filledPixels;
                    bestChoice = c;
                }

                bubbleROI.delete(); // Free memory for this slice
            }

            // Check if the darkest bubble actually has enough shading to count (prevents blank answers from guessing A)
            // If a bubble is 30x30 = 900 total pixels, maybe > 300 white pixels means shaded.
            if (maxPixels > 300) {
                studentAnswers[(q + 1).toString()] = choicesMap[bestChoice];
            } else {
                studentAnswers[(q + 1).toString()] = "BLANK";
            }
        }

        // 4. THE AUTO-GRADER
        // In your real app, you fetch this from Dexie: await db.assessments.get(currentAssessmentId)
        const dummyAnswerKey: Record<string, string> = {
            "1": "A", "2": "C", "3": "D", "4": "B", "5": "A",
            "6": "D", "7": "C", "8": "C", "9": "B", "10": "A",
            "11": "A", "12": "C", "13": "D", "14": "B", "15": "A",
            "16": "D", "17": "C", "18": "C", "19": "B", "20": "A"
        };

        let score = 0;
        for (let q = 1; q <= numQuestions; q++) {
            if (studentAnswers[q.toString()] === dummyAnswerKey[q.toString()]) {
                score++;
            }
        }

        // 5. CLEANUP MEMORY (Critical)
        src.delete();
        gray.delete();
        blurred.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();

        // 6. UPDATE UI
        setScanResult({
            studentId: "Pending Auto-Detect",
            score: score,
            total: numQuestions,
            answers: studentAnswers
        });
        setIsProcessing(false);
    };

    if (!isReady) {
        return <div className="p-10 text-center font-bold text-slate-500">Loading Computer Vision Engine...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* HEADER */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10">
                <h2 className="font-bold">GRID Auto-Scanner</h2>
                <button className="text-sm px-3 py-1 bg-slate-800 rounded-lg">Cancel</button>
            </div>

            {/* CAMERA VIEWPORT */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">

                {scanResult ? (
                    // SUCCESS STATE
                    <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full mx-4 absolute z-50">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-slate-900 mb-1">{scanResult.score} / {scanResult.total}</h3>
                        <p className="text-slate-500 font-medium mb-6">{scanResult.studentId}</p>
                        <button
                            onClick={() => setScanResult(null)}
                            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl"
                        >
                            Scan Next Paper
                        </button>
                    </div>
                ) : (
                    // ACTIVE SCANNER STATE
                    <>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }} // Forces rear camera on mobile
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* OMR Targeting Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                            <div className="w-full max-w-md aspect-[1/1.4] border-4 border-dashed border-primary-500 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                {/* Visual Corner Markers for Teacher */}
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white" />
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white" />
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white" />

                                <p className="text-white text-center font-bold mt-10 bg-black/50 mx-4 py-1 rounded">
                                    Align all 4 corner squares inside this box
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