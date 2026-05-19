import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { backgroundColor: '#FFFFFF', position: 'relative', padding: 0 },

    // Universal 4 Corner Registration Blocks (40x40 pixels)
    // Centers exactly at (50,50), (750,50), (50,950), and (750,950)
    markerTopLeft: { position: 'absolute', top: 30, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerTopRight: { position: 'absolute', top: 30, left: 730, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomLeft: { position: 'absolute', top: 930, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomRight: { position: 'absolute', top: 930, left: 730, width: 40, height: 40, backgroundColor: '#000000' },

    title: { position: 'absolute', width: '100%', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
    headerText: { position: 'absolute', fontFamily: 'Helvetica' },
    questionNumber: { position: 'absolute', fontFamily: 'Helvetica-Bold', color: '#000000' },

    bubble: { position: 'absolute', borderRadius: 15, borderWidth: 1.5, borderColor: '#B4B4B4', justifyContent: 'center', alignItems: 'center' },
    bubbleText: { fontFamily: 'Helvetica', color: '#B4B4B4' }
});

const SheetBase = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <Document>
        <Page size={[800, 1000]} style={styles.page}>
            <View style={styles.markerTopLeft} />
            <View style={styles.markerTopRight} />
            <View style={styles.markerBottomLeft} />
            <View style={styles.markerBottomRight} />

            <Text style={[styles.title, { top: 60, fontSize: 24 }]}>{title}</Text>
            <Text style={[styles.headerText, { top: 110, left: 100, fontSize: 14 }]}>Name: _________________________________</Text>
            <Text style={[styles.headerText, { top: 110, left: 500, fontSize: 14 }]}>Score: _______________</Text>

            {children}
        </Page>
    </Document>
);

const Document20Item = () => {
    const choicesMap = ['A', 'B', 'C', 'D'];
    const startX = 120; const startY = 180;
    const rowHeight = 35; const bubbleSpacing = 45; const bubbleSize = 30;

    return (
        <SheetBase title="20-Item Answer Sheet">
            {Array.from({ length: 20 }).map((_, qIndex) => (
                <React.Fragment key={`q-${qIndex}`}>
                    <Text style={[styles.questionNumber, { top: startY + (qIndex * rowHeight) + 8, left: startX - 30, fontSize: 12 }]}>
                        {qIndex + 1}.
                    </Text>
                    {choicesMap.map((letter, cIndex) => (
                        <View key={`q${qIndex}-${letter}`} style={[styles.bubble, { top: startY + (qIndex * rowHeight), left: startX + (cIndex * bubbleSpacing), width: bubbleSize, height: bubbleSize }]}>
                            <Text style={[styles.bubbleText, { fontSize: 12 }]}>{letter}</Text>
                        </View>
                    ))}
                </React.Fragment>
            ))}
        </SheetBase>
    );
};

const Document50Item = () => {
    const choicesMap = ['A', 'B', 'C', 'D'];
    const colStarts = [100, 450]; const startY = 160;
    const rowHeight = 28; const bubbleSpacing = 35; const bubbleSize = 24;

    return (
        <SheetBase title="50-Item Answer Sheet">
            {Array.from({ length: 50 }).map((_, qIndex) => {
                const isCol2 = qIndex >= 25;
                const colX = isCol2 ? colStarts[1] : colStarts[0];
                const rowY = startY + ((qIndex % 25) * rowHeight);

                return (
                    <React.Fragment key={`q-${qIndex}`}>
                        <Text style={[styles.questionNumber, { top: rowY + 6, left: colX - 30, fontSize: 11 }]}>
                            {qIndex + 1}.
                        </Text>
                        {choicesMap.map((letter, cIndex) => (
                            <View key={`q${qIndex}-${letter}`} style={[styles.bubble, { top: rowY, left: colX + (cIndex * bubbleSpacing), width: bubbleSize, height: bubbleSize }]}>
                                <Text style={[styles.bubbleText, { fontSize: 10 }]}>{letter}</Text>
                            </View>
                        ))}
                    </React.Fragment>
                );
            })}
        </SheetBase>
    );
};

export function OMRTemplateGenerator() {
    return (
        <div className="p-8 border rounded-xl bg-slate-50 mt-8 flex flex-col gap-4 max-w-md mx-auto text-center">
            <h3 className="text-xl font-bold">Download Answer Sheets</h3>
            <p className="text-slate-500 text-sm mb-4">Print on standard A4 or Letter paper. Do not scale.</p>

            <PDFDownloadLink document={<Document20Item />} fileName="20_Item_Sheet.pdf" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {({ loading }) => (loading ? 'Generating...' : 'Download 20-Item Sheet')}
            </PDFDownloadLink>

            <PDFDownloadLink document={<Document50Item />} fileName="50_Item_Sheet.pdf" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                {({ loading }) => (loading ? 'Generating...' : 'Download 50-Item Sheet')}
            </PDFDownloadLink>
        </div>
    );
}