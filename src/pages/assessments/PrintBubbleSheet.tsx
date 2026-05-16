import React from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { BubbleSheetDocument } from '../../components/omr/BubbleSheetDocument';
import { Printer } from 'lucide-react';

export function PrintBubbleSheet() {
    const assessmentData = {
        id: "MATH7-Q1-001",
        title: "1st Quarter Mathematics Assessment",
        totalItems: 20 // Automatically splits into two columns of 20!
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 p-6">
            <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto w-full">
                <div>
                    <h2 className="text-2xl font-bold text-white">Print Bubble Sheets</h2>
                    <p className="text-slate-400 text-sm">Print these out and hand them to your students.</p>
                </div>

                {/* Download Button */}
                <PDFDownloadLink
                    document={<BubbleSheetDocument assessmentId={assessmentData.id} title={assessmentData.title} totalItems={assessmentData.totalItems} />}
                    fileName={`BubbleSheet_${assessmentData.id}.pdf`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                >
                    {/* @ts-ignore */}
                    {({ loading }) => (
                        <>
                            <Printer className="w-5 h-5" />
                            {loading ? 'Generating PDF...' : 'Download PDF to Print'}
                        </>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Live Preview Wrapper */}
            <div className="flex-1 max-w-5xl mx-auto w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 p-2">
                <PDFViewer width="100%" height="100%" className="border-none rounded-xl">
                    <BubbleSheetDocument
                        assessmentId={assessmentData.id}
                        title={assessmentData.title}
                        totalItems={assessmentData.totalItems}
                    />
                </PDFViewer>
            </div>
        </div>
    );
}