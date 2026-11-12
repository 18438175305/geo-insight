import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import Audit from './pages/Audit'
import Questions from './pages/Questions'
import Answers from './pages/Answers'
import Pipeline from './pages/Pipeline'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'audit', element: <Audit /> },
      { path: 'questions/:brand?', element: <Questions /> },
      { path: 'answers/:brand?', element: <Answers /> },
      { path: 'pipeline', element: <Pipeline /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
