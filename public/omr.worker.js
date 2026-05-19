// public/omr.worker.js
/* eslint-disable no-restricted-globals */

self.importScripts('./opencv.js');

self.onmessage = function (e) {
    const { imageData, action, examType = '20' } = e.data;
    const cv = self.cv;

    if (action === 'PING') {
        self.postMessage({ status: 'READY' });
        return;
    }

    if (!cv || !cv.Mat) {
        self.postMessage({ error: "OpenCV engine is not initialized yet." });
        return;
    }

    // STRICT MEMORY MANAGEMENT
    let src, gray, blurred, thresh, contours, hierarchy;
    let rectCorners, dstCorners, transformMatrix, warpedGray, warpedThresh;
    let laplacian, mean, stddev;

    try {
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // ==========================================
        // 🚀 PHASE 1: BLUR DETECTION
        // ==========================================
        laplacian = new cv.Mat();
        mean = new cv.Mat();
        stddev = new cv.Mat();

        cv.Laplacian(gray, laplacian, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
        cv.meanStdDev(laplacian, mean, stddev);

        let stdDevVal = stddev.data64F[0];
        let variance = stdDevVal * stdDevVal;

        laplacian.delete(); mean.delete(); stddev.delete();

        if (variance < 80) {
            throw new Error("Camera is out of focus. Please hold still.");
        }

        // ==========================================
        // 🚀 PHASE 2: FAST 4-CORNER DETECTION
        // ==========================================
        blurred = new cv.Mat();
        thresh = new cv.Mat();

        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        // Using 75, 15 to resist desk shadows and gradients
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 75, 15);

        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let validSquares = [];

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            if (area > 100 && area < 15000) {
                let rect = cv.boundingRect(cnt);
                let aspectRatio = rect.width / rect.height;
                let extent = area / (rect.width * rect.height);
                if (aspectRatio > 0.6 && aspectRatio < 1.4 && extent > 0.6) {
                    validSquares.push({ area, x: rect.x + (rect.width / 2), y: rect.y + (rect.height / 2) });
                }
            }
            cnt.delete();
        }

        // Sort by area and grab the 4 largest valid squares
        validSquares.sort((a, b) => b.area - a.area);
        let markers = validSquares.slice(0, 4);

        if (markers.length < 4) {
            throw new Error("Cannot see all 4 corners. Align the paper inside the box.");
        }

        markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        let tl = markers[0];
        let br = markers[3];

        let remaining = [markers[1], markers[2]];
        remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
        let bl = remaining[0];
        let tr = remaining[1];

        // ==========================================
        // 🚀 PHASE 3: UNIFIED 800x1000 WARP
        // ==========================================
        const flatWidth = 800;
        const flatHeight = 1000;

        rectCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);

        // Exact same target coordinates for both 20-item and 50-item sheets
        dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [50, 50, 750, 50, 750, 950, 50, 950]);

        transformMatrix = cv.getPerspectiveTransform(rectCorners, dstCorners);
        let dsize = new cv.Size(flatWidth, flatHeight);

        warpedGray = new cv.Mat();
        warpedThresh = new cv.Mat();

        cv.warpPerspective(gray, warpedGray, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        cv.adaptiveThreshold(warpedGray, warpedThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 75, 15);

        // ==========================================
        // 🚀 PHASE 4: DYNAMIC BUBBLE EVALUATION
        // ==========================================
        let numQuestions, colStarts, startY, rowHeight, bubbleSpacing, bubbleSize;

        // Apply mathematical grid based on the UI Toggle
        if (examType === '20') {
            numQuestions = 20;
            colStarts = [120]; // 1 Column
            startY = 180; rowHeight = 35; bubbleSpacing = 45; bubbleSize = 30;
        } else {
            numQuestions = 50;
            colStarts = [100, 450]; // 2 Columns
            startY = 160; rowHeight = 28; bubbleSpacing = 35; bubbleSize = 24;
        }

        const choicesMap = ['A', 'B', 'C', 'D']; // Standardized to 4 choices
        const numChoices = 4;

        // Lower threshold for 50-item test because the bubbles are physically smaller
        const BLANK_THRESHOLD = examType === '20' ? 80 : 50;
        const CONFIDENCE_MARGIN = examType === '20' ? 40 : 25;

        let studentAnswers = {};

        for (let q = 0; q < numQuestions; q++) {
            let bubbleStats = [];

            // Calculate column logic dynamically
            let itemsPerCol = examType === '20' ? 20 : 25;
            let isCol2 = q >= itemsPerCol;
            let colX = isCol2 ? colStarts[1] : colStarts[0];
            let rowY = startY + ((q % itemsPerCol) * rowHeight);

            for (let c = 0; c < numChoices; c++) {
                let roiMargin = examType === '20' ? 6 : 4;
                let x = colX + (c * bubbleSpacing) + roiMargin;
                let y = rowY + roiMargin;
                let rect = new cv.Rect(x, y, bubbleSize - (roiMargin * 2), bubbleSize - (roiMargin * 2));

                let bubbleROI = warpedThresh.roi(rect);
                let filledPixels = cv.countNonZero(bubbleROI);

                bubbleStats.push({ letter: choicesMap[c], pixels: filledPixels });
                bubbleROI.delete();
            }

            bubbleStats.sort((a, b) => b.pixels - a.pixels);

            if (bubbleStats[0].pixels < BLANK_THRESHOLD) {
                studentAnswers[(q + 1).toString()] = "BLANK";
            }
            else if ((bubbleStats[0].pixels - bubbleStats[1].pixels) < CONFIDENCE_MARGIN) {
                studentAnswers[(q + 1).toString()] = "REVIEW"; // Triggers React fallback UI
            }
            else {
                studentAnswers[(q + 1).toString()] = bubbleStats[0].letter;
            }
        }

        self.postMessage({ success: true, answers: studentAnswers });

    } catch (err) {
        self.postMessage({ error: err.message || "An error occurred during processing." });
    } finally {
        // GUARANTEED MEMORY CLEANUP
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