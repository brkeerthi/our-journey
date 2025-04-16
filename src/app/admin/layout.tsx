import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Admin Dashboard | Keerthi & Rakshitha's Echoes",
  description: 'Manage our memories together.',
  robots: {
    index: false,
    follow: false,
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
} 