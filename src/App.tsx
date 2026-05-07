
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'sonner'
import { AppLayout } from './components/layout/AppLayout'
import { AcademicTerms } from './pages/academicterms'
import { Subjects } from './pages/subjects/inidex'
import { useEffect } from 'react'
import { seedDatabase } from './services/seedData'
import { NotFound } from './components/layout/NotFound'
import { Students } from './pages/students'
import { Assessments } from './pages/assessments'
import { Gradebook } from './pages/gradebook'
import { StudentProfile } from './pages/studentprofile'
import { PrintSF9 } from './pages/grading/PrintSF9'
import { Dashboard } from './pages/dashboard'

function App() {

  return (
    <ThemeProvider defaultTheme="system">
      {/* 2. Wrap the app with ConfirmProvider */}
      <ConfirmProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors theme="system" />

          <Routes>
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/print/sf9/:studentId" element={<PrintSF9 />} /> */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="terms" element={<AcademicTerms />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:studentId" element={<StudentProfile />} />
              <Route path="assessments" element={<Assessments />} />
              <Route path="gradebook" element={<Gradebook />} />

              {/* <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetRegistry />} />
              <Route path="/assets/:id" element={<AssetDetails />} />
              <Route path="departments" element={<Departments />} />
              <Route path="employees" element={<Employees />} />
              <Route path="assetcategories" element={<AssetCategories />} /> */}

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ThemeProvider>
  )
}

export default App
