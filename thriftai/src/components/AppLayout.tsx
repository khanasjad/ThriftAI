import NavBar from './NavBar'
import AppFooter from './AppFooter'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <AppFooter />
    </div>
  )
}
