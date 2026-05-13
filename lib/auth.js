import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './db'

const SECRET = process.env.JWT_SECRET || 'fallback_secret'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch (e) {
    return null
  }
}

export async function hashPassword(pwd) {
  return await bcrypt.hash(pwd, 10)
}

export async function comparePassword(pwd, hash) {
  return await bcrypt.compare(pwd, hash)
}

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null
  const decoded = verifyToken(token)
  if (!decoded) return null
  const db = await getDb()
  const user = await db.collection('users').findOne({ id: decoded.userId })
  if (!user) return null
  delete user.password
  delete user._id
  return user
}

export async function ensureAdminSeeded() {
  const db = await getDb()
  const exists = await db.collection('users').findOne({ email: 'admin@iskcon.org' })
  if (!exists) {
    const { v4: uuidv4 } = await import('uuid')
    await db.collection('users').insertOne({
      id: uuidv4(),
      name: 'ISKCON Admin',
      email: 'admin@iskcon.org',
      mobile: '9999999999',
      password: await hashPassword('admin123'),
      role: 'admin',
      createdAt: new Date(),
    })
  }
}
