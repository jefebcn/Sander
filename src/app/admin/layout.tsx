import { AdminNav } from "@/components/admin/AdminNav"

/**
 * On a phone admin is part of the app. On a computer it opens as a desktop
 * dashboard: side menu, full width, no bottom tab bar (see globals.css).
 * Each page still checks the admin itself.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell lg:flex lg:min-h-dvh">
      <AdminNav />
      <div className="min-w-0 flex-1 lg:px-6 lg:py-4">
        <div className="mx-auto w-full max-w-[1240px]">{children}</div>
      </div>
    </div>
  )
}
