import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useMedplumContext } from '@medplum/react'
import { HomePage } from './pages/HomePage'
import './App.css'

function App() {
  const { loading } = useMedplumContext()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
