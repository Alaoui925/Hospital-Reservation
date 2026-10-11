import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import AppRouter from './routes/AppRouter.jsx'
import ToastStack from './components/common/ToastStack.jsx'

/**
 * Application root.
 * Wires the two global providers (auth + notifications) around the router.
 * No routing logic lives here — see /routes/AppRouter.jsx.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <ToastStack />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}