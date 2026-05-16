import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// --- STYLES FOR OMR SCANNER ---
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, position: 'relative' },

    // 🎯 FIDUCIAL MARKERS (The 4 corners for the camera)
    // Must be solid black, perfectly square, and high contrast.
    fiducialTL: { position: 'absolute', top: 30, left: 30, width: 25, height: 25, backgroundColor: 'black' },
    fiducialTR: { position: 'absolute', top: 30, right: 30, width: 25, height: 25, backgroundColor: 'black' },
    fiducialBL: { position: 'absolute', bottom: 30, left: 30, width: 25, height: 25, backgroundColor: 'black' },
    fiducialBR: { position: 'absolute', bottom: 30, right: 30, width: 25, height: 25, backgroundColor: 'black' },

    // Header
    header: { textAlign: 'center', marginBottom: 20, marginTop: 10 },
    title: { fontSize: 16, fontWeight: 'extrabold', textTransform: 'uppercase' },
    subtitle: { fontSize: 10, color: '#475569', marginTop: 4 },

    // Student Info Box (Read by teacher, not scanner)
    infoBox: { borderWidth: 2, borderColor: '#000', padding: 10, marginBottom: 30, borderRadius: 5 },
    infoRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
    label: { fontWeight: 'bold', marginRight: 5, fontSize: 11 },
    line: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#000' },

    // The Bubble Grid
    grid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    column: { width: '45%' },

    // Individual Question Row
    qRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    qNum: { width: 25, fontWeight: 'bold', fontSize: 11, textAlign: 'right', marginRight: 10 },

    // The Bubbles
    bubbleGroup: { flexDirection: 'row', gap: 10 },
    bubble: {
        width: 20,
        height: 20,
        borderRadius: 10, // Makes it a perfect circle
        borderWidth: 1.5,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
    },
    bubbleText: { fontSize: 8, color: '#94a3b8' } // Light gray so it doesn't confuse the scanner!
});

interface Props {
    assessmentId: string;
    title: string;
    totalItems?: number;
}

export const BubbleSheetDocument = ({ assessmentId, title, totalItems = 20 }: Props) => {
    // Generate an array of question numbers [1, 2, 3 ... 20]
    const questions = Array.from({ length: totalItems }, (_, i) => i + 1);

    // Split into two columns for A4 paper
    const midPoint = Math.ceil(questions.length / 2);
    const col1 = questions.slice(0, midPoint);
    const col2 = questions.slice(midPoint);

    const choices = ['A', 'B', 'C', 'D'];

    // Reusable Bubble Row Component
    const QuestionRow = ({ num }: { num: number }) => (
        <View style={styles.qRow}>
            <Text style={styles.qNum}>{num}.</Text>
            <View style={styles.bubbleGroup}>
                {choices.map(choice => (
                    <View key={choice} style={styles.bubble}>
                        <Text style={styles.bubbleText}>{choice}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* 1. THE CAMERA ANCHORS (Do not remove these!) */}
                <View style={styles.fiducialTL} />
                <View style={styles.fiducialTR} />
                <View style={styles.fiducialBL} />
                <View style={styles.fiducialBR} />

                {/* 2. HEADER */}
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Assessment ID: {assessmentId} (Shade completely)</Text>
                </View>

                {/* 3. STUDENT INFO */}
                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name:</Text>
                        <View style={styles.line} />
                        <Text style={styles.label}> Section:</Text>
                        <View style={{ ...styles.line, flex: 0.5 }} />
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Subject:</Text>
                        <View style={styles.line} />
                        <Text style={styles.label}> Date:</Text>
                        <View style={{ ...styles.line, flex: 0.5 }} />
                    </View>
                </View>

                {/* 4. THE BUBBLES (2 Columns) */}
                <View style={styles.grid}>
                    <View style={styles.column}>
                        {col1.map(num => <QuestionRow key={num} num={num} />)}
                    </View>
                    <View style={styles.column}>
                        {col2.map(num => <QuestionRow key={num} num={num} />)}
                    </View>
                </View>

            </Page>
        </Document>
    );
};