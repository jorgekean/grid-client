// public/omr.worker.js
/* eslint-disable no-restricted-globals */

self.importScripts('./opencv.js');

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

    let src, gray, blurred, thresh, contours, hierarchy;
    let rectCorners, dstCorners, transformMatrix, warpedGray, warpedThresh;

    try {
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();
        blurred = new cv.Mat();
        thresh = new cv.Mat();

        // 1. Pre-processing
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // Use threshold to turn the black printed blocks into solid white shapes
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 51, 10);

        // 2. Find the 4 Corner Blocks
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let validSquares = [];

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);

            // Filter 1: Must be a reasonable size (ignores noise and the whole page)
            if (area > 100 && area < 15000) {
                let rect = cv.boundingRect(cnt);
                let aspectRatio = rect.width / rect.height;
                let extent = area / (rect.width * rect.height);

                // Filter 2: Must be roughly square (aspect ratio ~1) and solid (extent ~1)
                if (aspectRatio > 0.6 && aspectRatio < 1.4 && extent > 0.6) {
                    validSquares.push({
                        area: area,
                        x: rect.x + (rect.width / 2), // We want the CENTER of the square
                        y: rect.y + (rect.height / 2)
                    });
                }
            }
            cnt.delete();
        }

        // Sort by area descending and grab the 4 largest valid squares
        validSquares.sort((a, b) => b.area - a.area);
        let markers = validSquares.slice(0, 4);

        if (markers.length < 4) {
            throw new Error(`Only found ${markers.length} corner blocks. Ensure all 4 corners are visible.`);
        }

        // 3. Sort the 4 markers into Top-Left, Top-Right, Bottom-Right, Bottom-Left
        markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        let tl = markers[0]; // Min sum is Top-Left
        let br = markers[3]; // Max sum is Bottom-Right

        let remaining = [markers[1], markers[2]];
        remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
        let bl = remaining[0]; // Min diff is Bottom-Left
        let tr = remaining[1]; // Max diff is Top-Right

        // 4. PERSPECTIVE WARP (Flattening the image)
        const flatWidth = 800;
        const flatHeight = 1000;

        rectCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            tl.x, tl.y,
            tr.x, tr.y,
            br.x, br.y,
            bl.x, bl.y
        ]);

        // Map the detected centers to the exact PDF pixel centers of our 4 blocks
        dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
            50, 50,    // Top Left Center
            750, 50,   // Top Right Center
            750, 950,  // Bottom Right Center
            50, 950    // Bottom Left Center
        ]);

        transformMatrix = cv.getPerspectiveTransform(rectCorners, dstCorners);
        let dsize = new cv.Size(flatWidth, flatHeight);

        warpedGray = new cv.Mat();
        warpedThresh = new cv.Mat();

        // Warp the clean grayscale image FIRST, then threshold the perfectly flat result
        cv.warpPerspective(gray, warpedGray, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        cv.adaptiveThreshold(warpedGray, warpedThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 51, 10);

        // 5. EVALUATE BUBBLES
        const numQuestions = 20;
        const numChoices = 4;
        const choicesMap = ['A', 'B', 'C', 'D'];

        // Synchronized Grid Constants
        const startX = 120;
        const startY = 180;
        const rowHeight = 35;
        const bubbleWidth = 30;
        const bubbleSpacing = 45;

        let studentAnswers = {};

        for (let q = 0; q < numQuestions; q++) {
            let pixelCounts = [];

            for (let c = 0; c < numChoices; c++) {
                // Shrink the checking area slightly to ignore the printed bubble edges
                let roiMargin = 6;
                let x = startX + (c * bubbleSpacing) + roiMargin;
                let y = startY + (q * rowHeight) + roiMargin;
                let rect = new cv.Rect(x, y, bubbleWidth - (roiMargin * 2), bubbleWidth - (roiMargin * 2));

                let bubbleROI = warpedThresh.roi(rect);
                let filledPixels = cv.countNonZero(bubbleROI);
                pixelCounts.push(filledPixels);

                bubbleROI.delete();
            }

            let maxPixels = Math.max(...pixelCounts);
            let bestChoiceIndex = pixelCounts.indexOf(maxPixels);

            // Relative scoring: if the darkest bubble has enough shading, count it
            if (maxPixels > 80) {
                studentAnswers[(q + 1).toString()] = choicesMap[bestChoiceIndex];
            } else {
                studentAnswers[(q + 1).toString()] = "BLANK";
            }
        }

        self.postMessage({ success: true, answers: studentAnswers });

    } catch (err) {
        self.postMessage({ error: err.message || "An error occurred during processing." });
    } finally {
        // GUARANTEED MEMORY CLEANUP
        if (src) src.delete();
        if (gray) gray.delete();
        if (blurred) blurred.delete();
        if (thresh) thresh.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
        if (rectCorners) rectCorners.delete();
        if (dstCorners) dstCorners.delete();
        if (transformMatrix) transformMatrix.delete();
        if (warpedGray) warpedGray.delete();
        if (warpedThresh) warpedThresh.delete();
    }
};