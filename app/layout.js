import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'ISKCON Yatra Registration',
  description: 'Register for ISKCON Yatras - spiritual pilgrimages',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-amber-50">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
