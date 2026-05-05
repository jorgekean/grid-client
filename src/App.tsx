
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

function App() {
  useEffect(() => {
    // Run the seed on initial app mount
    seedDatabase();
  }, []);

  return (
    <ThemeProvider defaultTheme="system">
      {/* 2. Wrap the app with ConfirmProvider */}
      <ConfirmProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors theme="system" />

          <Routes>
            {/* <Route path="/login" element={<Login />} /> */}
            <Route path="/" element={<AppLayout />}>
              <Route path="terms" element={<AcademicTerms />} />
              <Route path="subjects" element={<Subjects />} />
              {/* <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetRegistry />} />
              <Route path="/assets/:id" element={<AssetDetails />} />
              <Route path="departments" element={<Departments />} />
              <Route path="employees" element={<Employees />} />
              <Route path="assetcategories" element={<AssetCategories />} /> */}
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </ThemeProvider>
  )
}

export default App
