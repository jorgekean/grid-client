import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// --- THE SYNCHRONIZED STYLESHEET ---
const styles = StyleSheet.create({
    page: {
        backgroundColor: '#FFFFFF',
        position: 'relative',
        padding: 0, // Critical: Removes default margins
    },
    // The 4 Corner Registration Blocks (40x40 pixels)
    markerTopLeft: { position: 'absolute', top: 30, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerTopRight: { position: 'absolute', top: 30, left: 730, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomLeft: { position: 'absolute', top: 930, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomRight: { position: 'absolute', top: 930, left: 730, width: 40, height: 40, backgroundColor: '#000000' },

    title: { position: 'absolute', top: 60, width: '100%', textAlign: 'center', fontSize: 24, fontFamily: 'Helvetica-Bold' },
    headerText: { position: 'absolute', fontSize: 14, fontFamily: 'Helvetica' },
    questionNumber: { position: 'absolute', fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#000000' },

    // Bubble Formatting (Dropout Ink)
    bubble: {
        position: 'absolute', width: 30, height: 30, borderRadius: 15,
        borderWidth: 1.5, borderColor: '#B4B4B4', // Light Gray
        justifyContent: 'center', alignItems: 'center',
    },
    bubbleText: { fontSize: 12, fontFamily: 'Helvetica', color: '#B4B4B4' }
});

const OMRDocument = () => {
    const numQuestions = 20;
    const choicesMap = ['A', 'B', 'C', 'D'];

    // NEW GRID CONSTANTS (Shifted up to fit nicely)
    const startX = 120;
    const startY = 180;
    const rowHeight = 35;
    const bubbleSpacing = 45;

    return (
        <Document>
            <Page size={[800, 1000]} style={styles.page}>

                {/* 1. The 4 Corner Blocks */}
                <View style={styles.markerTopLeft} />
                <View style={styles.markerTopRight} />
                <View style={styles.markerBottomLeft} />
                <View style={styles.markerBottomRight} />

                {/* 2. Header Info */}
                <Text style={styles.title}>Standard Answer Sheet</Text>
                <Text style={[styles.headerText, { top: 110, left: 100 }]}>Name: _________________________________</Text>
                <Text style={[styles.headerText, { top: 110, left: 500 }]}>Date: _______________</Text>
                <Text style={[styles.headerText, { top: 140, left: 100 }]}>Grade/Section: _______________</Text>

                {/* 3. Bubble Grid */}
                {Array.from({ length: numQuestions }).map((_, qIndex) => (
                    <React.Fragment key={`q-${qIndex}`}>
                        <Text style={[styles.questionNumber, { top: startY + (qIndex * rowHeight) + 8, left: startX - 30 }]}>
                            {qIndex + 1}.
                        </Text>

                        {choicesMap.map((letter, cIndex) => {
                            const xPos = startX + (cIndex * bubbleSpacing);
                            const yPos = startY + (qIndex * rowHeight);

                            return (
                                <View key={`q${qIndex}-${letter}`} style={[styles.bubble, { top: yPos, left: xPos }]}>
                                    <Text style={styles.bubbleText}>{letter}</Text>
                                </View>
                            );
                        })}
                    </React.Fragment>
                ))}
            </Page>
        </Document>
    );
};

export function OMRTemplateGenerator() {
    return (
        <div className="p-8 text-center border rounded-xl bg-slate-50 mt-8">
            <h3 className="text-xl font-bold mb-2">React-PDF Answer Sheets</h3>
            <PDFDownloadLink
                document={<OMRDocument />}
                fileName="OMR_Answer_Sheet.pdf"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-block"
            >
                {({ loading }) => (loading ? 'Generating PDF...' : 'Download PDF Template')}
            </PDFDownloadLink>
        </div>
    );
}