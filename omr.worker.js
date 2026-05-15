// public/omr.worker.js
/* eslint-disable no-restricted-globals */

// Import OpenCV.js (Ensure this path is correct based on your deployment)
self.importScripts('./opencv.js');

// Helper function to order the 4 corners for the perspective warp
function orderPoints(pts, cv) {
    const rect = new cv.Mat(4, 1, cv.CV_32FC2);
    let sums = [], diffs = [];

    for (let i = 0; i < 4; i++) {
        let x = pts[i * 2];
        let y = pts[i * 2 + 1];
        sums.push({ val: x + y, idx: i, x: x, y: y });
        diffs.push({ val: y - x, idx: i, x: x, y: y });
    }

    sums.sort((a, b) => a.val - b.val);
    diffs.sort((a, b) => a.val - b.val);

    // Top-Left, Top-Right, Bottom-Right, Bottom-Left
    rect.data32F[0] = sums[0].x; rect.data32F[1] = sums[0].y;
    rect.data32F[2] = diffs[0].x; rect.data32F[3] = diffs[0].y;
    rect.data32F[4] = sums[3].x; rect.data32F[5] = sums[3].y;
    rect.data32F[6] = diffs[3].x; rect.data32F[7] = diffs[3].y;

    return rect;
}

self.onmessage = function (e) {
    const { imageData, action } = e.data;
    const cv = self.cv;

    if (action === 'PING') {
        self.postMessage({ status: 'READY' });
        return;
    }

    if (!cv || !cv.Mat) {
        self.postMessage({ error: "OpenCV engine is not initialized yet." });
        return;
    }

    // STRICT MEMORY MANAGEMENT: Initialize all pointers outside the try block
    let src, gray, blurred, thresh, contours, hierarchy, docContour;
    let rectCorners, dstCorners, transformMatrix, warped;

    try {
        // 1. Read Image Data directly from the canvas payload
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();
        blurred = new cv.Mat();
        thresh = new cv.Mat();

        // 2. Pre-processing
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

        // 3. Find the Document Boundaries
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let maxContourIndex = -1;
        docContour = new cv.Mat();

        // Look for the largest contour that looks like a quadrilateral
        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            if (area > maxArea) {
                let peri = cv.arcLength(cnt, true);
                cv.approxPolyDP(cnt, docContour, 0.02 * peri, true);

                // If it has 4 corners, it's our paper
                if (docContour.rows === 4) {
                    maxArea = area;
                    maxContourIndex = i;
                }
            }
            cnt.delete();
        }

        if (maxContourIndex === -1) {
            throw new Error("Could not detect the 4 corners of the document. Please align it properly.");
        }

        // 4. PERSPECTIVE WARP (Flattening the image)
        const flatWidth = 800; // Target dimensions for your template
        const flatHeight = 1000;

        rectCorners = orderPoints(docContour.data32S, cv);
        dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            flatWidth, 0,
            flatWidth, flatHeight,
            0, flatHeight
        ]);

        transformMatrix = cv.getPerspectiveTransform(rectCorners, dstCorners);
        warped = new cv.Mat();
        let dsize = new cv.Size(flatWidth, flatHeight);

        // Apply the warp on the thresholded image so we just evaluate black/white bubbles
        cv.warpPerspective(thresh, warped, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // 5. EVALUATE BUBBLES (Using the standardized flatWidth/flatHeight coordinates)
        const numQuestions = 20;
        const numChoices = 4;
        const choicesMap = ['A', 'B', 'C', 'D'];

        // Now you can safely use static coordinates because the image is perfectly 800x1000
        const startX = 100; const startY = 200;
        const rowHeight = 40; const bubbleWidth = 30; const bubbleSpacing = 40;

        let studentAnswers = {};

        for (let q = 0; q < numQuestions; q++) {
            let bestChoice = -1;
            let maxPixels = 0;

            for (let c = 0; c < numChoices; c++) {
                let x = startX + (c * bubbleSpacing);
                let y = startY + (q * rowHeight);
                let rect = new cv.Rect(x, y, bubbleWidth, bubbleWidth);

                let bubbleROI = warped.roi(rect);
                let filledPixels = cv.countNonZero(bubbleROI);

                if (filledPixels > maxPixels) {
                    maxPixels = filledPixels;
                    bestChoice = c;
                }
                bubbleROI.delete();
            }

            studentAnswers[(q + 1).toString()] = (maxPixels > 300) ? choicesMap[bestChoice] : "BLANK";
        }

        // Send results back to React Main Thread
        self.postMessage({ success: true, answers: studentAnswers, maxArea });

    } catch (err) {
        self.postMessage({ error: err.message || "An error occurred during processing." });
    } finally {
        // 6. GUARANTEED MEMORY CLEANUP
        // This runs even if an error is thrown, preventing WebAssembly memory leaks
        if (src) src.delete();
        if (gray) gray.delete();
        if (blurred) blurred.delete();
        if (thresh) thresh.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
        if (docContour && !docContour.isDeleted()) docContour.delete();
        if (rectCorners) rectCorners.delete();
        if (dstCorners) dstCorners.delete();
        if (transformMatrix) transformMatrix.delete();
        if (warped) warped.delete();
    }
};