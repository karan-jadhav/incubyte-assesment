import { BarChart3, UsersRound } from 'lucide-react'
import { Link, Outlet } from '@tanstack/react-router'

const navItems = [
  {
    to: '/employees',
    label: 'Employees',
    icon: UsersRound,
  },
  {
    to: '/insights',
    label: 'Insights',
    icon: BarChart3,
  },
] as const

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f7f3ec] text-[#231f20]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#d8d0c2] bg-[#fffaf1] lg:block">
          <div className="flex h-full flex-col">
            <Link
              to="/"
              className="block border-b border-[#d8d0c2] px-6 py-5 transition hover:bg-[#f4eee5] focus:ring-2 focus:ring-[#1f5e67]/30 focus:outline-none"
              aria-label="Go to dashboard"
            >
              <p className="text-xs font-semibold tracking-[0.22em] text-[#806941] uppercase">
                ACME
              </p>
              <h1 className="mt-2 text-xl font-semibold">Salary Desk</h1>
            </Link>

            <nav
              className="flex-1 space-y-1 px-3 py-4"
              aria-label="Main navigation"
            >
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#5c554b] transition hover:bg-[#efe7d9] hover:text-[#231f20]"
                    activeProps={{
                      className:
                        'bg-[#1f5e67] text-white hover:bg-[#1f5e67] hover:text-white',
                    }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#d8d0c2] bg-[#fffaf1]/95 px-4 backdrop-blur lg:hidden">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
              <Link
                to="/"
                className="rounded-md px-2 py-1 transition hover:bg-[#f4eee5] focus:ring-2 focus:ring-[#1f5e67]/30 focus:outline-none"
                aria-label="Go to dashboard"
              >
                <p className="text-xs font-semibold tracking-[0.2em] text-[#806941] uppercase">
                  ACME
                </p>
                <p className="text-base font-semibold">Salary Desk</p>
              </Link>

              <nav
                className="flex rounded-md border border-[#d8d0c2] bg-white p-1"
                aria-label="Main navigation"
              >
                {navItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex h-9 w-10 items-center justify-center rounded text-[#5c554b] transition hover:bg-[#efe7d9] hover:text-[#231f20]"
                      activeProps={{
                        className:
                          'bg-[#1f5e67] text-white hover:bg-[#1f5e67] hover:text-white',
                      }}
                      title={item.label}
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )
                })}
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
