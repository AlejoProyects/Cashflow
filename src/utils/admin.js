export const SUPERADMIN_EMAIL = 'alejo.0514.1998@gmail.com'

export function isSuperAdmin(user) {
  return user?.email === SUPERADMIN_EMAIL
}
