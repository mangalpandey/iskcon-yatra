import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import * as XLSX from 'xlsx'
import { getDb } from '@/lib/db'
import {
  signToken,
  hashPassword,
  comparePassword,
  getUserFromRequest,
  ensureAdminSeeded,
} from '@/lib/auth'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

function json(data, status = 200) {
  return cors(NextResponse.json(data, { status }))
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = '/' + path.join('/')
  const method = request.method

  try {
    await ensureAdminSeeded()
    const db = await getDb()

    // ============ AUTH ============
    if (route === '/auth/send-otp' && method === 'POST') {
      const { mobile } = await request.json()
      if (!mobile || mobile.length < 10) return json({ error: 'Invalid mobile' }, 400)
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      await db.collection('otps').updateOne(
        { mobile },
        { $set: { mobile, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) } },
        { upsert: true }
      )
      // Demo mode: return OTP in response
      return json({ success: true, otp, message: 'OTP sent (demo mode - shown here)' })
    }

    if (route === '/auth/verify-otp' && method === 'POST') {
      const { mobile, otp, name, email } = await request.json()
      const record = await db.collection('otps').findOne({ mobile })
      if (!record || record.otp !== otp) return json({ error: 'Invalid OTP' }, 400)
      if (record.expiresAt < new Date()) return json({ error: 'OTP expired' }, 400)

      let user = await db.collection('users').findOne({ mobile })
      if (!user) {
        if (!name) return json({ error: 'Name required for new user' }, 400)
        user = {
          id: uuidv4(),
          name,
          email: email || '',
          mobile,
          role: 'yatri',
          createdAt: new Date(),
        }
        await db.collection('users').insertOne(user)
      }
      await db.collection('otps').deleteOne({ mobile })
      const token = signToken({ userId: user.id })
      delete user._id
      delete user.password
      return json({ token, user })
    }

    if (route === '/auth/register-email' && method === 'POST') {
      const { name, email, password, mobile } = await request.json()
      if (!name || !email || !password) return json({ error: 'Missing fields' }, 400)
      const exists = await db.collection('users').findOne({ email })
      if (exists) return json({ error: 'Email already registered' }, 400)
      const user = {
        id: uuidv4(),
        name,
        email,
        mobile: mobile || '',
        password: await hashPassword(password),
        role: 'yatri',
        createdAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken({ userId: user.id })
      delete user._id
      delete user.password
      return json({ token, user })
    }

    if (route === '/auth/login-email' && method === 'POST') {
      const { email, password } = await request.json()
      const user = await db.collection('users').findOne({ email })
      if (!user || !user.password) return json({ error: 'Invalid credentials' }, 400)
      const ok = await comparePassword(password, user.password)
      if (!ok) return json({ error: 'Invalid credentials' }, 400)
      const token = signToken({ userId: user.id })
      delete user._id
      delete user.password
      return json({ token, user })
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      return json({ user })
    }

    // ============ YATRAS ============
    if (route === '/yatras' && method === 'GET') {
      const yatras = await db.collection('yatras').find({}).sort({ createdAt: -1 }).toArray()
      return json(yatras.map(({ _id, ...rest }) => rest))
    }

    if (route.startsWith('/yatras/') && method === 'GET') {
      const id = path[1]
      const yatra = await db.collection('yatras').findOne({ id })
      if (!yatra) return json({ error: 'Not found' }, 404)
      delete yatra._id
      return json(yatra)
    }

    if (route === '/yatras' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user || user.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const body = await request.json()
      const yatra = {
        id: uuidv4(),
        name: body.name,
        description: body.description || '',
        type: body.type || 'one_day', // one_day | multi_day
        startDate: body.startDate,
        endDate: body.endDate,
        location: body.location || '',
        image: body.image || '',
        gallery: body.gallery || [],
        boardingPoints: body.boardingPoints || [],
        counsellors: body.counsellors || [],
        facilitators: body.facilitators || [],
        basePrice: Number(body.basePrice) || 0,
        rooms: body.rooms || [],
        whatsappLink: body.whatsappLink || '',
        requiredFields: body.requiredFields || [
          'name','mobile','dob','gender','address','counsellor','facilitator','boardingPoint'
        ],
        active: body.active !== false,
        createdAt: new Date(),
      }
      await db.collection('yatras').insertOne(yatra)
      delete yatra._id
      return json(yatra)
    }

    if (route.startsWith('/yatras/') && method === 'PUT') {
      const user = await getUserFromRequest(request)
      if (!user || user.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const id = path[1]
      const body = await request.json()
      delete body._id
      delete body.id
      await db.collection('yatras').updateOne({ id }, { $set: body })
      const updated = await db.collection('yatras').findOne({ id })
      delete updated._id
      return json(updated)
    }

    if (route.startsWith('/yatras/') && method === 'DELETE') {
      const user = await getUserFromRequest(request)
      if (!user || user.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const id = path[1]
      await db.collection('yatras').deleteOne({ id })
      return json({ success: true })
    }

    // ============ REGISTRATIONS ============
    if (route === '/registrations' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const body = await request.json()
      const yatra = await db.collection('yatras').findOne({ id: body.yatraId })
      if (!yatra) return json({ error: 'Yatra not found' }, 404)

      // Calculate total
      const numYatris = 1 + (body.additionalYatris?.length || 0)
      let total = yatra.basePrice * numYatris
      if (yatra.type === 'multi_day' && body.roomType) {
        const room = yatra.rooms.find((r) => r.type === body.roomType)
        if (room) total += Number(room.price) * numYatris
      }

      const amountPaise = Math.round(total * 100)
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: `reg_${Date.now()}`,
        notes: { yatraId: yatra.id, userId: user.id },
      })

      const registration = {
        id: uuidv4(),
        yatraId: yatra.id,
        yatraName: yatra.name,
        userId: user.id,
        primaryYatri: body.primaryYatri,
        additionalYatris: body.additionalYatris || [],
        roomType: body.roomType || null,
        totalAmount: total,
        razorpayOrderId: order.id,
        razorpayPaymentId: null,
        paymentStatus: 'pending',
        createdAt: new Date(),
      }
      await db.collection('registrations').insertOne(registration)
      delete registration._id

      return json({
        registration,
        razorpayOrderId: order.id,
        amount: amountPaise,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      })
    }

    if (route === '/registrations/verify-payment' && method === 'POST') {
      const user = await getUserFromRequest(request)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const { registrationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        await request.json()

      const generated = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex')

      if (generated !== razorpaySignature) {
        await db.collection('registrations').updateOne(
          { id: registrationId },
          { $set: { paymentStatus: 'failed', failureReason: 'Signature mismatch' } }
        )
        return json({ error: 'Invalid signature' }, 400)
      }

      await db.collection('registrations').updateOne(
        { id: registrationId },
        {
          $set: {
            paymentStatus: 'completed',
            razorpayPaymentId,
            razorpaySignature,
            completedAt: new Date(),
          },
        }
      )
      const reg = await db.collection('registrations').findOne({ id: registrationId })
      const yatra = await db.collection('yatras').findOne({ id: reg.yatraId })
      delete reg._id
      return json({ success: true, registration: reg, whatsappLink: yatra?.whatsappLink || '' })
    }

    if (route === '/registrations' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user) return json({ error: 'Unauthorized' }, 401)
      const url = new URL(request.url)
      const all = url.searchParams.get('all') === 'true'
      const yatraId = url.searchParams.get('yatraId')
      let query = {}
      if (all && user.role === 'admin') {
        if (yatraId) query.yatraId = yatraId
      } else {
        query.userId = user.id
      }
      const regs = await db
        .collection('registrations')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()
      return json(regs.map(({ _id, ...rest }) => rest))
    }

    // ============ ADMIN ============
    if (route === '/admin/stats' && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user || user.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const totalYatras = await db.collection('yatras').countDocuments()
      const totalUsers = await db.collection('users').countDocuments({ role: 'yatri' })
      const totalRegs = await db.collection('registrations').countDocuments()
      const paidRegs = await db
        .collection('registrations')
        .countDocuments({ paymentStatus: 'completed' })
      const revenueAgg = await db
        .collection('registrations')
        .aggregate([
          { $match: { paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ])
        .toArray()
      const revenue = revenueAgg[0]?.total || 0
      return json({ totalYatras, totalUsers, totalRegs, paidRegs, revenue })
    }

    if (route.startsWith('/admin/export') && method === 'GET') {
      const user = await getUserFromRequest(request)
      if (!user || user.role !== 'admin') return json({ error: 'Admin only' }, 403)
      const url = new URL(request.url)
      const yatraId = url.searchParams.get('yatraId')
      const query = yatraId ? { yatraId } : {}
      const regs = await db.collection('registrations').find(query).toArray()

      const rows = []
      for (const r of regs) {
        const p = r.primaryYatri || {}
        const base = {
          'Registration ID': r.id,
          'Yatra Name': r.yatraName,
          'Status': r.paymentStatus,
          'Total Amount': r.totalAmount,
          'Payment ID': r.razorpayPaymentId || '',
          'Created': r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
          'Primary Name': p.name,
          'Mobile': p.mobile,
          'DOB': p.dob,
          'Age': p.age,
          'Gender': p.gender,
          'Address': p.address,
          'Counsellor': p.counsellor,
          'Facilitator': p.facilitator,
          'Boarding Point': p.boardingPoint,
          'Number of Yatris': p.numberOfYatris || 1,
          'Room Type': r.roomType || '',
          'Additional Yatris': (r.additionalYatris || [])
            .map((a) => `${a.name} (${a.relation}, age ${a.age})`)
            .join('; '),
        }
        rows.push(base)
      }

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Registrations')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="registrations_${Date.now()}.xlsx"`,
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (e) {
    console.error('API Error:', e)
    return json({ error: e.message || 'Internal server error' }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
