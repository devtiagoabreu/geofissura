import { auth } from "./auth"

export async function getSession() {
  const session = await auth()
  const role = session?.user?.role
  const clienteId = session?.user?.clienteId
  const isSuper = role === "SUPER"
  return { session, clienteId, role, isSuper }
}
