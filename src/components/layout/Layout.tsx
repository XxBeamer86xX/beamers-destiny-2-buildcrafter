import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ManifestLoader } from '../shared/ManifestLoader'
import { ZoneLootPane } from '../zone/ZoneLootPane'

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-destiny-bg text-white overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <ManifestLoader />
          <Outlet />
        </main>
        <ZoneLootPane />
      </div>
    </div>
  )
}
