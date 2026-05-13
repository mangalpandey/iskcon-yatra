'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Flame, LogOut, User, MapPin, Calendar, Users, Home as HomeIcon,
  ShieldCheck, Plus, Trash2, Edit, Download, CheckCircle2, Loader2, IndianRupee, Phone, Mail
} from 'lucide-react'

const HERO_IMG = 'https://images.unsplash.com/photo-1662376107358-21296a9234f1'
const TEMPLE_IMGS = [
  'https://images.unsplash.com/photo-1583134993393-07aa230888f9',
  'https://images.unsplash.com/photo-1707938233687-47e61e5ad7c4',
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220',
  'https://images.unsplash.com/photo-1573352763925-82bd5dfc31d1',
]
const ROOM_IMGS = {
  single: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658',
  double: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
  triple: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
  quad: 'https://images.pexels.com/photos/28962539/pexels-photo-28962539.jpeg',
  sharing: 'https://images.unsplash.com/photo-1723713296730-c0ca274a222a',
}

const ROOM_LABELS = {
  single: 'Single Bed',
  double: 'Double Bed',
  triple: '3 Bedded',
  quad: '4 Bedded',
  sharing: 'Sharing (Dormitory)',
}

// ====================== API HELPER ======================
async function api(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch('/api' + path, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return await res.json()
  return res
}

// ====================== APP ======================
function App() {
  const [view, setView] = useState({ name: 'home' })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    api('/auth/me').then((d) => setUser(d.user)).catch(() => {
      localStorage.removeItem('token')
    }).finally(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setView({ name: 'home' })
    toast.success('Logged out')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  }

  return (
    <div className="min-h-screen">
      <Header user={user} setView={setView} logout={logout} />
      <main>
        {view.name === 'home' && <Home setView={setView} user={user} />}
        {view.name === 'login' && <Login setUser={setUser} setView={setView} />}
        {view.name === 'yatra' && <YatraDetail id={view.id} setView={setView} user={user} />}
        {view.name === 'register' && <RegisterForm yatraId={view.yatraId} user={user} setView={setView} />}
        {view.name === 'success' && <SuccessView reg={view.reg} whatsappLink={view.whatsappLink} setView={setView} />}
        {view.name === 'my-regs' && <MyRegistrations setView={setView} />}
        {view.name === 'admin' && <AdminDashboard setView={setView} />}
        {view.name === 'admin-yatra' && <AdminYatraForm id={view.id} setView={setView} />}
      </main>
      <footer className="border-t bg-orange-50/50 mt-16 py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 ISKCON Yatra Registration · Hare Krishna 🙏</p>
      </footer>
    </div>
  )
}

// ====================== HEADER ======================
function Header({ user, setView, logout }) {
  return (
    <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={() => setView({ name: 'home' })} className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg text-orange-900">ISKCON Yatra</div>
            <div className="text-xs text-muted-foreground -mt-1">Sacred Pilgrimage Registration</div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {user.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                {user.name}
              </Badge>
              {user.role === 'admin' && (
                <Button variant="outline" size="sm" onClick={() => setView({ name: 'admin' })}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Admin
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setView({ name: 'my-regs' })}>
                My Yatras
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => setView({ name: 'login' })} className="bg-orange-600 hover:bg-orange-700">
              Login / Register
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ====================== HOME ======================
function Home({ setView, user }) {
  const [yatras, setYatras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/yatras').then(setYatras).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 via-orange-800/60 to-amber-900/70" />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32 text-white">
          <Badge className="bg-orange-500 hover:bg-orange-500 mb-4">🕉️ Hare Krishna</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-3xl">
            Embark on a Sacred Yatra
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-8 text-orange-50">
            Join ISKCON devotees on transformative spiritual pilgrimages.
            Register online, choose your accommodation, and pay securely.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => {
              document.getElementById('yatra-list')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              Browse Yatras
            </Button>
            {!user && (
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" onClick={() => setView({ name: 'login' })}>
                Login / Register
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'One-Day & Multi-Day', desc: 'Choose pilgrimages that fit your schedule' },
            { icon: HomeIcon, title: 'Accommodation Options', desc: 'Single, double, triple, quad or sharing rooms' },
            { icon: ShieldCheck, title: 'Secure Online Payment', desc: 'Pay safely via Razorpay, no cash registration' },
          ].map((f, i) => (
            <Card key={i} className="border-orange-100">
              <CardContent className="pt-6">
                <f.icon className="h-10 w-10 text-orange-600 mb-3" />
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Yatra List */}
      <section id="yatra-list" className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-orange-900">Upcoming Yatras</h2>
            <p className="text-muted-foreground">Choose your sacred journey</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-600" /></div>
        ) : yatras.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No yatras available yet. Check back soon!</p>
              {user?.role === 'admin' && (
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={() => setView({ name: 'admin-yatra' })}>
                  <Plus className="h-4 w-4 mr-1" /> Create First Yatra
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yatras.filter(y => y.active).map((y, i) => (
              <Card key={y.id} className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setView({ name: 'yatra', id: y.id })}>
                <div className="h-48 overflow-hidden relative">
                  <img src={y.image || TEMPLE_IMGS[i % TEMPLE_IMGS.length]} className="w-full h-full object-cover hover:scale-105 transition-transform" alt={y.name} />
                  <Badge className="absolute top-3 right-3 bg-orange-600">
                    {y.type === 'multi_day' ? 'Multi-Day' : 'One Day'}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-orange-900">{y.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{y.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {y.location || 'TBA'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> {y.startDate} {y.endDate && y.endDate !== y.startDate ? `→ ${y.endDate}` : ''}
                  </div>
                  <div className="flex items-center gap-2 text-orange-700 font-semibold">
                    <IndianRupee className="h-4 w-4" /> {y.basePrice} {y.type === 'multi_day' ? '+ accommodation' : ''}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">View Details & Register</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ====================== LOGIN ======================
function Login({ setUser, setView }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-900">Welcome 🙏</CardTitle>
          <CardDescription>Login or register to book your yatra</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="mobile">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="mobile">Mobile OTP</TabsTrigger>
              <TabsTrigger value="email">Email Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="mobile"><MobileLogin onSuccess={(u) => { setUser(u); setView({ name: 'home' }) }} /></TabsContent>
            <TabsContent value="email"><EmailLogin onSuccess={(u) => { setUser(u); setView({ name: 'home' }) }} /></TabsContent>
            <TabsContent value="signup"><EmailSignup onSuccess={(u) => { setUser(u); setView({ name: 'home' }) }} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Default admin: admin@iskcon.org / admin123
      </p>
    </div>
  )
}

function MobileLogin({ onSuccess }) {
  const [step, setStep] = useState(1)
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [demoOtp, setDemoOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    if (mobile.length < 10) return toast.error('Enter valid 10-digit mobile')
    setLoading(true)
    try {
      const r = await api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ mobile }) })
      setDemoOtp(r.otp)
      setStep(2)
      toast.success('OTP sent! (Demo: ' + r.otp + ')')
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const verify = async () => {
    setLoading(true)
    try {
      const r = await api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ mobile, otp, name, email }) })
      localStorage.setItem('token', r.token)
      toast.success('Welcome ' + r.user.name)
      onSuccess(r.user)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 pt-4">
      {step === 1 ? (
        <>
          <div>
            <Label>Mobile Number</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9999999999" maxLength={10} />
          </div>
          <Button onClick={sendOtp} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send OTP'}
          </Button>
        </>
      ) : (
        <>
          {demoOtp && <div className="text-xs bg-amber-50 border border-amber-200 p-2 rounded">Demo OTP: <b>{demoOtp}</b></div>}
          <div>
            <Label>OTP</Label>
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
          </div>
          <div>
            <Label>Your Name (for new users)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          </div>
          <div>
            <Label>Email (optional)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
          </div>
          <Button onClick={verify} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify & Login'}
          </Button>
          <Button variant="ghost" onClick={() => setStep(1)} className="w-full">Change number</Button>
        </>
      )}
    </div>
  )
}

function EmailLogin({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    setLoading(true)
    try {
      const r = await api('/auth/login-email', { method: 'POST', body: JSON.stringify({ email, password }) })
      localStorage.setItem('token', r.token)
      toast.success('Welcome back!')
      onSuccess(r.user)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-4 pt-4">
      <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
      <div><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
      <Button onClick={submit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Login'}
      </Button>
    </div>
  )
}

function EmailSignup({ onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    if (!name || !email || !password) return toast.error('All fields required')
    setLoading(true)
    try {
      const r = await api('/auth/register-email', { method: 'POST', body: JSON.stringify({ name, email, password, mobile }) })
      localStorage.setItem('token', r.token)
      toast.success('Account created!')
      onSuccess(r.user)
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }
  return (
    <div className="space-y-3 pt-4">
      <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></div>
      <div><Label>Mobile</Label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} /></div>
      <div><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
      <Button onClick={submit} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create Account'}
      </Button>
    </div>
  )
}

// ====================== YATRA DETAIL ======================
function YatraDetail({ id, setView, user }) {
  const [yatra, setYatra] = useState(null)
  useEffect(() => {
    api('/yatras/' + id).then(setYatra)
  }, [id])
  if (!yatra) return <div className="container py-12 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => setView({ name: 'home' })} className="mb-4">← Back</Button>
      <div className="rounded-xl overflow-hidden mb-6 relative">
        <img src={yatra.image || TEMPLE_IMGS[0]} className="w-full h-64 md:h-96 object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          <Badge className="bg-orange-600 mb-2">{yatra.type === 'multi_day' ? 'Multi-Day Yatra' : 'One-Day Yatra'}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold">{yatra.name}</h1>
          <p className="mt-2 text-orange-50">{yatra.location}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>About this Yatra</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-line">{yatra.description}</p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div><b>Start:</b> {yatra.startDate}</div>
                <div><b>End:</b> {yatra.endDate || yatra.startDate}</div>
                <div><b>Boarding Points:</b> {(yatra.boardingPoints || []).join(', ') || 'TBA'}</div>
                <div><b>Type:</b> {yatra.type === 'multi_day' ? 'Multi-Day' : 'One-Day'}</div>
              </div>
            </CardContent>
          </Card>

          {yatra.type === 'multi_day' && yatra.rooms?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Accommodation Options</CardTitle></CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                {yatra.rooms.map((r) => (
                  <div key={r.type} className="border rounded-lg overflow-hidden">
                    <img src={r.image || ROOM_IMGS[r.type]} className="w-full h-32 object-cover" alt="" />
                    <div className="p-3">
                      <div className="font-semibold">{ROOM_LABELS[r.type] || r.type}</div>
                      <div className="text-orange-700 font-bold">₹{r.price} extra</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit sticky top-20">
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>Starts at ₹{yatra.basePrice} per yatri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Secure online payment</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Group registration allowed</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> WhatsApp group access</div>
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => {
              if (!user) return setView({ name: 'login' })
              setView({ name: 'register', yatraId: yatra.id })
            }}>
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ====================== REGISTRATION FORM ======================
function RegisterForm({ yatraId, user, setView }) {
  const [yatra, setYatra] = useState(null)
  const [primary, setPrimary] = useState({
    name: user?.name || '', mobile: user?.mobile || '', dob: '', age: '', gender: '',
    address: '', counsellor: '', facilitator: '', boardingPoint: '', numberOfYatris: 1,
  })
  const [additionalYatris, setAdditionalYatris] = useState([])
  const [roomType, setRoomType] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { api('/yatras/' + yatraId).then(setYatra) }, [yatraId])

  useEffect(() => {
    const n = Math.max(1, Number(primary.numberOfYatris) || 1)
    setAdditionalYatris((prev) => {
      const need = n - 1
      const arr = [...prev]
      while (arr.length < need) arr.push({ name: '', age: '', dob: '', relation: '', mobile: '' })
      return arr.slice(0, need)
    })
  }, [primary.numberOfYatris])

  if (!yatra) return <div className="container py-12 flex justify-center"><Loader2 className="animate-spin text-orange-600" /></div>

  const total = (function () {
    const n = 1 + additionalYatris.length
    let t = yatra.basePrice * n
    if (yatra.type === 'multi_day' && roomType) {
      const r = yatra.rooms.find((x) => x.type === roomType)
      if (r) t += Number(r.price) * n
    }
    return t
  })()

  const submit = async () => {
    if (!primary.name || !primary.mobile) return toast.error('Name and mobile are required')
    if (yatra.type === 'multi_day' && yatra.rooms?.length && !roomType) return toast.error('Please select a room type')

    setSubmitting(true)
    try {
      const created = await api('/registrations', {
        method: 'POST',
        body: JSON.stringify({ yatraId, primaryYatri: primary, additionalYatris, roomType }),
      })

      // Open Razorpay
      const options = {
        key: created.keyId,
        amount: created.amount,
        currency: 'INR',
        name: 'ISKCON Yatra',
        description: yatra.name,
        order_id: created.razorpayOrderId,
        prefill: { name: primary.name, email: user.email || '', contact: primary.mobile },
        theme: { color: '#ea580c' },
        handler: async (response) => {
          try {
            const verified = await api('/registrations/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                registrationId: created.registration.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            toast.success('Payment successful!')
            setView({ name: 'success', reg: verified.registration, whatsappLink: verified.whatsappLink })
          } catch (e) {
            toast.error('Verification failed: ' + e.message)
          }
        },
        modal: {
          ondismiss: () => { setSubmitting(false); toast.info('Payment cancelled') }
        }
      }
      if (!window.Razorpay) return toast.error('Razorpay not loaded. Reload page.')
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => toast.error('Payment failed: ' + resp.error.description))
      rzp.open()
    } catch (e) {
      toast.error(e.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => setView({ name: 'yatra', id: yatraId })} className="mb-4">← Back</Button>
      <h1 className="text-3xl font-bold text-orange-900 mb-2">Register for {yatra.name}</h1>
      <p className="text-muted-foreground mb-6">Fill in details for all yatris and complete payment to confirm.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Primary Yatri (You)</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              <Field label="Full Name *" value={primary.name} onChange={(v) => setPrimary({ ...primary, name: v })} />
              <Field label="Mobile Number *" value={primary.mobile} onChange={(v) => setPrimary({ ...primary, mobile: v })} maxLength={10} />
              <Field label="Date of Birth" type="date" value={primary.dob} onChange={(v) => setPrimary({ ...primary, dob: v })} />
              <Field label="Age" type="number" value={primary.age} onChange={(v) => setPrimary({ ...primary, age: v })} />
              <div>
                <Label>Gender</Label>
                <Select value={primary.gender} onValueChange={(v) => setPrimary({ ...primary, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Counsellor</Label>
                <Select value={primary.counsellor} onValueChange={(v) => setPrimary({ ...primary, counsellor: v })}>
                  <SelectTrigger><SelectValue placeholder="Select counsellor" /></SelectTrigger>
                  <SelectContent>
                    {(yatra.counsellors || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    {(yatra.counsellors || []).length === 0 && <SelectItem value="none">No counsellors listed</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Facilitator</Label>
                <Select value={primary.facilitator} onValueChange={(v) => setPrimary({ ...primary, facilitator: v })}>
                  <SelectTrigger><SelectValue placeholder="Select facilitator" /></SelectTrigger>
                  <SelectContent>
                    {(yatra.facilitators || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    {(yatra.facilitators || []).length === 0 && <SelectItem value="none">No facilitators listed</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Boarding Point</Label>
                <Select value={primary.boardingPoint} onValueChange={(v) => setPrimary({ ...primary, boardingPoint: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(yatra.boardingPoints || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Number of Yatris (including you)" type="number" value={primary.numberOfYatris} onChange={(v) => setPrimary({ ...primary, numberOfYatris: Number(v) })} min={1} />
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea value={primary.address} onChange={(e) => setPrimary({ ...primary, address: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {additionalYatris.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Additional Yatris ({additionalYatris.length})</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {additionalYatris.map((a, i) => (
                  <div key={i} className="grid sm:grid-cols-2 gap-3 p-3 border rounded-lg">
                    <div className="sm:col-span-2 font-semibold text-orange-800">Yatri #{i + 2}</div>
                    <Field label="Name" value={a.name} onChange={(v) => updateAdd(i, 'name', v)} />
                    <Field label="Mobile" value={a.mobile} onChange={(v) => updateAdd(i, 'mobile', v)} maxLength={10} />
                    <Field label="Age" type="number" value={a.age} onChange={(v) => updateAdd(i, 'age', v)} />
                    <Field label="Date of Birth" type="date" value={a.dob} onChange={(v) => updateAdd(i, 'dob', v)} />
                    <Field label="Relation with you" value={a.relation} onChange={(v) => updateAdd(i, 'relation', v)} placeholder="Spouse, Child, Friend..." />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {yatra.type === 'multi_day' && yatra.rooms?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Choose Room Type *</CardTitle></CardHeader>
              <CardContent>
                <RadioGroup value={roomType} onValueChange={setRoomType} className="grid sm:grid-cols-2 gap-3">
                  {yatra.rooms.map((r) => (
                    <label key={r.type} className={`border rounded-lg overflow-hidden cursor-pointer ${roomType === r.type ? 'ring-2 ring-orange-600' : ''}`}>
                      <img src={r.image || ROOM_IMGS[r.type]} className="w-full h-32 object-cover" alt="" />
                      <div className="p-3 flex items-center gap-2">
                        <RadioGroupItem value={r.type} />
                        <div className="flex-1">
                          <div className="font-semibold">{ROOM_LABELS[r.type] || r.type}</div>
                          <div className="text-sm text-orange-700">₹{r.price} per yatri</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit sticky top-20">
          <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Yatra fee × {1 + additionalYatris.length}</span><span>₹{yatra.basePrice * (1 + additionalYatris.length)}</span></div>
            {yatra.type === 'multi_day' && roomType && (
              <div className="flex justify-between">
                <span>{ROOM_LABELS[roomType]} × {1 + additionalYatris.length}</span>
                <span>₹{(yatra.rooms.find((r) => r.type === roomType)?.price || 0) * (1 + additionalYatris.length)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-orange-900">
              <span>Total</span><span>₹{total}</span>
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full bg-orange-600 hover:bg-orange-700 mt-4">
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : `Pay ₹${total} & Register`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Test mode • No cash registration</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  function updateAdd(i, key, val) {
    setAdditionalYatris((prev) => {
      const next = [...prev]; next[i] = { ...next[i], [key]: val }; return next
    })
  }
}

function Field({ label, value, onChange, type = 'text', maxLength, min, placeholder }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} type={type} maxLength={maxLength} min={min} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

// ====================== SUCCESS VIEW ======================
function SuccessView({ reg, whatsappLink, setView }) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl mt-4">Registration Confirmed! 🙏</CardTitle>
          <CardDescription>Your payment has been received successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-left">
          <div className="bg-orange-50 p-4 rounded-lg space-y-1 text-sm">
            <div><b>Registration ID:</b> {reg?.id}</div>
            <div><b>Yatra:</b> {reg?.yatraName}</div>
            <div><b>Amount Paid:</b> ₹{reg?.totalAmount}</div>
            <div><b>Payment ID:</b> {reg?.razorpayPaymentId}</div>
          </div>
          {whatsappLink && (
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <a href={whatsappLink} target="_blank" rel="noreferrer">Join WhatsApp Group</a>
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => setView({ name: 'my-regs' })}>View My Registrations</Button>
          <Button variant="ghost" className="w-full" onClick={() => setView({ name: 'home' })}>Back to Home</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ====================== MY REGISTRATIONS ======================
function MyRegistrations({ setView }) {
  const [regs, setRegs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api('/registrations').then((d) => { setRegs(d); setLoading(false) }) }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-orange-900 mb-6">My Yatras</h1>
      {loading ? <Loader2 className="animate-spin" /> : regs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No registrations yet. <Button variant="link" onClick={() => setView({ name: 'home' })}>Browse Yatras</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {regs.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{r.yatraName}</div>
                  <div className="text-sm text-muted-foreground">₹{r.totalAmount} · {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <Badge variant={r.paymentStatus === 'completed' ? 'default' : 'secondary'} className={r.paymentStatus === 'completed' ? 'bg-green-600' : ''}>
                  {r.paymentStatus}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ====================== ADMIN DASHBOARD ======================
function AdminDashboard({ setView }) {
  const [stats, setStats] = useState(null)
  const [yatras, setYatras] = useState([])
  const [regs, setRegs] = useState([])
  const [filter, setFilter] = useState('')

  const load = async () => {
    const [s, y, r] = await Promise.all([
      api('/admin/stats'),
      api('/yatras'),
      api('/registrations?all=true'),
    ])
    setStats(s); setYatras(y); setRegs(r)
  }
  useEffect(() => { load() }, [])

  const deleteYatra = async (id) => {
    if (!confirm('Delete this yatra?')) return
    await api('/yatras/' + id, { method: 'DELETE' })
    toast.success('Deleted')
    load()
  }

  const downloadExport = async (yatraId) => {
    const token = localStorage.getItem('token')
    const url = '/api/admin/export' + (yatraId ? '?yatraId=' + yatraId : '')
    const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } })
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `registrations_${Date.now()}.xlsx`
    a.click()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-orange-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => downloadExport(filter)} variant="outline"><Download className="h-4 w-4 mr-1" /> Export Excel</Button>
          <Button onClick={() => setView({ name: 'admin-yatra' })} className="bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4 mr-1" /> Create Yatra</Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="Yatras" value={stats.totalYatras} />
          <Stat label="Users" value={stats.totalUsers} />
          <Stat label="Registrations" value={stats.totalRegs} />
          <Stat label="Paid" value={stats.paidRegs} />
          <Stat label="Revenue" value={'₹' + stats.revenue} />
        </div>
      )}

      <Tabs defaultValue="yatras">
        <TabsList>
          <TabsTrigger value="yatras">Yatras ({yatras.length})</TabsTrigger>
          <TabsTrigger value="regs">Registrations ({regs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="yatras" className="space-y-3 pt-4">
          {yatras.map((y) => (
            <Card key={y.id}>
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={y.image || TEMPLE_IMGS[0]} className="h-16 w-16 object-cover rounded" alt="" />
                  <div>
                    <div className="font-semibold">{y.name}</div>
                    <div className="text-sm text-muted-foreground">{y.startDate} · ₹{y.basePrice} · {y.type}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setView({ name: 'admin-yatra', id: y.id })}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => deleteYatra(y.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="regs" className="space-y-3 pt-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="max-w-xs"><SelectValue placeholder="Filter by yatra..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Yatras</SelectItem>
              {yatras.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {regs.filter((r) => !filter || r.yatraId === filter).map((r) => (
            <Card key={r.id}>
              <CardContent className="py-3 text-sm grid md:grid-cols-5 gap-2">
                <div><b>{r.primaryYatri?.name}</b><br /><span className="text-muted-foreground">{r.primaryYatri?.mobile}</span></div>
                <div>{r.yatraName}</div>
                <div>{r.primaryYatri?.numberOfYatris || 1} yatri(s)<br />{r.roomType ? ROOM_LABELS[r.roomType] : '-'}</div>
                <div>₹{r.totalAmount}</div>
                <div>
                  <Badge className={r.paymentStatus === 'completed' ? 'bg-green-600' : ''}>{r.paymentStatus}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <Card><CardContent className="py-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-orange-900">{value}</div>
    </CardContent></Card>
  )
}

// ====================== ADMIN YATRA FORM ======================
function AdminYatraForm({ id, setView }) {
  const [y, setY] = useState({
    name: '', description: '', type: 'one_day', startDate: '', endDate: '',
    location: '', image: '', basePrice: 0,
    boardingPoints: [], counsellors: [], facilitators: [],
    rooms: [], whatsappLink: 'https://chat.whatsapp.com/sample', active: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) api('/yatras/' + id).then(setY)
  }, [id])

  const save = async () => {
    if (!y.name || !y.startDate) return toast.error('Name and start date required')
    setLoading(true)
    try {
      if (id) {
        await api('/yatras/' + id, { method: 'PUT', body: JSON.stringify(y) })
        toast.success('Updated!')
      } else {
        await api('/yatras', { method: 'POST', body: JSON.stringify(y) })
        toast.success('Yatra created!')
      }
      setView({ name: 'admin' })
    } catch (e) { toast.error(e.message) } finally { setLoading(false) }
  }

  const addRoom = () => setY({ ...y, rooms: [...y.rooms, { type: 'single', price: 0, image: '' }] })
  const updateRoom = (i, key, val) => {
    const rooms = [...y.rooms]; rooms[i] = { ...rooms[i], [key]: val }; setY({ ...y, rooms })
  }
  const removeRoom = (i) => setY({ ...y, rooms: y.rooms.filter((_, idx) => idx !== i) })

  const csvField = (key, label, placeholder) => (
    <div>
      <Label>{label}</Label>
      <Input
        value={(y[key] || []).join(', ')}
        onChange={(e) => setY({ ...y, [key]: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={() => setView({ name: 'admin' })} className="mb-4">← Back</Button>
      <h1 className="text-3xl font-bold text-orange-900 mb-6">{id ? 'Edit' : 'Create'} Yatra</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><Label>Name *</Label><Input value={y.name} onChange={(e) => setY({ ...y, name: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} value={y.description} onChange={(e) => setY({ ...y, description: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={y.type} onValueChange={(v) => setY({ ...y, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_day">One Day</SelectItem>
                  <SelectItem value="multi_day">Multi Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Location</Label><Input value={y.location} onChange={(e) => setY({ ...y, location: e.target.value })} /></div>
            <div><Label>Start Date *</Label><Input type="date" value={y.startDate} onChange={(e) => setY({ ...y, startDate: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={y.endDate} onChange={(e) => setY({ ...y, endDate: e.target.value })} /></div>
            <div><Label>Base Price (₹ per yatri)</Label><Input type="number" value={y.basePrice} onChange={(e) => setY({ ...y, basePrice: Number(e.target.value) })} /></div>
            <div><Label>Cover Image URL</Label><Input value={y.image} onChange={(e) => setY({ ...y, image: e.target.value })} placeholder="https://..." /></div>
            <div className="md:col-span-2"><Label>WhatsApp Group Link</Label><Input value={y.whatsappLink} onChange={(e) => setY({ ...y, whatsappLink: e.target.value })} placeholder="https://chat.whatsapp.com/..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dropdown Options (for registration form)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            {csvField('boardingPoints', 'Boarding Points', 'Mumbai, Pune, Nashik')}
            {csvField('counsellors', 'Counsellors', 'HG Ramananda Das, HG Govind Das')}
            {csvField('facilitators', 'Facilitators', 'HG Krishna Das, HG Radha Devi')}
          </CardContent>
        </Card>

        {y.type === 'multi_day' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Room Types & Pricing</CardTitle>
              <Button size="sm" onClick={addRoom}><Plus className="h-4 w-4 mr-1" /> Add Room</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {y.rooms.map((r, i) => (
                <div key={i} className="grid sm:grid-cols-4 gap-2 items-end border p-3 rounded-lg">
                  <div>
                    <Label>Type</Label>
                    <Select value={r.type} onValueChange={(v) => updateRoom(i, 'type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROOM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Extra Price (₹)</Label><Input type="number" value={r.price} onChange={(e) => updateRoom(i, 'price', Number(e.target.value))} /></div>
                  <div><Label>Image URL</Label><Input value={r.image} onChange={(e) => updateRoom(i, 'image', e.target.value)} placeholder="optional" /></div>
                  <Button variant="outline" onClick={() => removeRoom(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              ))}
              {y.rooms.length === 0 && <p className="text-sm text-muted-foreground">No rooms added. Click "Add Room" above.</p>}
            </CardContent>
          </Card>
        )}

        <Button onClick={save} disabled={loading} size="lg" className="bg-orange-600 hover:bg-orange-700">
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (id ? 'Update Yatra' : 'Create Yatra')}
        </Button>
      </div>
    </div>
  )
}

export default App
