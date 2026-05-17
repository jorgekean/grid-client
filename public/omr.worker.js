// public/omr.worker.js
/* eslint-disable no-restricted-globals */

// Import OpenCV.js. Because this file is in the public folder, 
// the relative path will work on both localhost and deployed environments.
self.importScripts('./opencv.js');

self.onmessage = function (e) {
    const { imageData, action } = e.data;
    const cv = self.cv;

    // Health check from React
    if (action === 'PING') {
        self.postMessage({ status: 'READY' });
        return;
    }

    if (!cv || !cv.Mat) {
        self.postMessage({ error: "OpenCV engine is not initialized yet." });
        return;
    }

    // STRICT MEMORY MANAGEMENT: Declare all matrices up top
    let src, gray, blurred, thresh, contours, hierarchy;
    let rectCorners, dstCorners, transformMatrix, warpedGray, warpedThresh;
    let laplacian, mean, stddev, clahe;

    try {
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();

        // 1. Convert incoming RGBA image to Grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // ==========================================
        // 🚀 PHASE 1: BLUR DETECTION (Laplacian Variance)
        // ==========================================
        laplacian = new cv.Mat();
        mean = new cv.Mat();
        stddev = new cv.Mat();

        // The Laplacian filter highlights sharp edges
        cv.Laplacian(gray, laplacian, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
        cv.meanStdDev(laplacian, mean, stddev);

        let stdDevVal = stddev.data64F[0];
        let variance = stdDevVal * stdDevVal; // Variance is StdDev squared

        // Clean up blur-detection memory immediately
        laplacian.delete(); mean.delete(); stddev.delete();

        // 150 is the threshold for documents. If it's blurry, abort the scan.
        if (variance < 150) {
            throw new Error("Camera is out of focus. Please hold still.");
        }

        // ==========================================
        // 🚀 PHASE 1.5: ILLUMINATION NORMALIZATION
        // ==========================================
        // The standard opencv.js build does not include CLAHE to save file size.
        // Instead, we use Standard Histogram Equalization.
        // This spreads out the most frequent intensity values, increasing global contrast
        // and severely reducing the impact of shadows or glare.

        // cv.equalizeHist(gray, gray);

        // ==========================================
        // 🚀 PHASE 2: PRE-PROCESSING & CORNER DETECTION
        // ==========================================
        blurred = new cv.Mat();
        thresh = new cv.Mat();

        // Blur slightly to remove paper texture noise, then threshold to pure black/white
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 51, 10);

        // Find all distinct shapes (contours) on the page
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let validSquares = [];

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);

            // Filter 1: Must be a reasonable size (Ignores specks of dust and the whole page)
            if (area > 100 && area < 15000) {
                let rect = cv.boundingRect(cnt);
                let aspectRatio = rect.width / rect.height;
                let extent = area / (rect.width * rect.height);

                // Filter 2: Must be roughly square (ratio ~1) and solid black (extent ~1)
                if (aspectRatio > 0.6 && aspectRatio < 1.4 && extent > 0.6) {
                    validSquares.push({
                        area: area,
                        x: rect.x + (rect.width / 2), // We extract the exact CENTER of the block
                        y: rect.y + (rect.height / 2)
                    });
                }
            }
            cnt.delete();
        }

        // Grab the 4 largest valid squares we found
        validSquares.sort((a, b) => b.area - a.area);
        let markers = validSquares.slice(0, 4);

        if (markers.length < 4) {
            throw new Error("Cannot see all 4 corner blocks. Align the paper inside the box.");
        }

        // Sort the 4 markers mathematically: Top-Left, Top-Right, Bottom-Right, Bottom-Left
        markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        let tl = markers[0];
        let br = markers[3];

        let remaining = [markers[1], markers[2]];
        remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
        let bl = remaining[0];
        let tr = remaining[1];

        // ==========================================
        // 🚀 PHASE 3: PERSPECTIVE WARP
        // ==========================================
        const flatWidth = 800;
        const flatHeight = 1000;

        rectCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
        ]);

        // Map the detected physical centers to our PDF template's exact pixel centers
        dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            50, 50, 750, 50, 750, 950, 50, 950
        ]);

        transformMatrix = cv.getPerspectiveTransform(rectCorners, dstCorners);
        let dsize = new cv.Size(flatWidth, flatHeight);

        warpedGray = new cv.Mat();
        warpedThresh = new cv.Mat();

        // Warp the clean grayscale image FIRST, then threshold the perfectly flat result
        cv.warpPerspective(gray, warpedGray, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        cv.adaptiveThreshold(warpedGray, warpedThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 51, 10);

        // ==========================================
        // 🚀 PHASE 4: EVALUATE BUBBLES
        // ==========================================
        const numQuestions = 20;
        const numChoices = 4;
        const choicesMap = ['A', 'B', 'C', 'D'];

        // Grid Constants (Must perfectly match the React-PDF template)
        const startX = 120;
        const startY = 180;
        const rowHeight = 35;
        const bubbleWidth = 30;
        const bubbleSpacing = 45;

        // Confidence Logic
        const BLANK_THRESHOLD = 80;   // Minimum dark pixels to count as shaded
        const CONFIDENCE_MARGIN = 40; // Pixel gap required between 1st and 2nd darkest bubble

        let studentAnswers = {};

        for (let q = 0; q < numQuestions; q++) {
            let bubbleStats = [];

            for (let c = 0; c < numChoices; c++) {
                // Shrink the checking area by 6px to ignore the printed gray outline of the bubble
                let roiMargin = 6;
                let x = startX + (c * bubbleSpacing) + roiMargin;
                let y = startY + (q * rowHeight) + roiMargin;
                let rect = new cv.Rect(x, y, bubbleWidth - (roiMargin * 2), bubbleWidth - (roiMargin * 2));

                let bubbleROI = warpedThresh.roi(rect);
                let filledPixels = cv.countNonZero(bubbleROI);

                bubbleStats.push({ letter: choicesMap[c], pixels: filledPixels });
                bubbleROI.delete();
            }

            // Sort from Darkest to Lightest
            bubbleStats.sort((a, b) => b.pixels - a.pixels);

            let firstChoice = bubbleStats[0];
            let secondChoice = bubbleStats[1];

            if (firstChoice.pixels < BLANK_THRESHOLD) {
                studentAnswers[(q + 1).toString()] = "BLANK";
            }
            else if ((firstChoice.pixels - secondChoice.pixels) < CONFIDENCE_MARGIN) {
                // Triggers the React UI to ask the teacher for help resolving a messy erasure
                studentAnswers[(q + 1).toString()] = "REVIEW";
            }
            else {
                studentAnswers[(q + 1).toString()] = firstChoice.letter;
            }
        }

        // Send successful results back to React
        self.postMessage({ success: true, answers: studentAnswers });

    } catch (err) {
        // Send handled errors (Blur, Missing Corners) to the UI warning banner
        self.postMessage({ error: err.message || "An error occurred during processing." });
    } finally {
        // ==========================================
        // 🚀 PHASE 5: GUARANTEED MEMORY CLEANUP
        // ==========================================
        // WebAssembly does not auto-garbage collect. This runs even if an error is thrown!
        if (src && !src.isDeleted()) src.delete();
        if (gray && !gray.isDeleted()) gray.delete();
        if (blurred && !blurred.isDeleted()) blurred.delete();
        if (thresh && !thresh.isDeleted()) thresh.delete();
        if (contours && !contours.isDeleted()) contours.delete();
        if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
        if (rectCorners && !rectCorners.isDeleted()) rectCorners.delete();
        if (dstCorners && !dstCorners.isDeleted()) dstCorners.delete();
        if (transformMatrix && !transformMatrix.isDeleted()) transformMatrix.delete();
        if (warpedGray && !warpedGray.isDeleted()) warpedGray.delete();
        if (warpedThresh && !warpedThresh.isDeleted()) warpedThresh.delete();
    }
};