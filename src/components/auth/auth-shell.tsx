import { AuthPanel } from "@/components/auth/auth-panel"
import { getStudentCount } from "@/lib/roster"

type AuthShellProps = {
  title: string
  description: string
  children: React.ReactNode
}

export async function AuthShell({ title, description, children }: AuthShellProps) {
  const count = await getStudentCount()

  return (
    <AuthPanel title={title} description={description} count={count}>
      {children}
    </AuthPanel>
  )
}
