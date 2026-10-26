import { redirect } from "next/navigation"

import { WelcomeFrame } from "@/components/auth/welcome-frame"
import { AdminNav } from "@/components/layout/admin-nav"
import { SiteHeader } from "@/components/layout/site-header"
import { getCurrentStudent } from "@/lib/auth"
import { getStudentById, getStudentCount } from "@/lib/roster"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const count = await getStudentCount()
  const student = await getCurrentStudent()

  if (count > 0 && !student) {
    redirect("/logout")
  }

  if (count > 0 && student?.role !== "admin") {
    redirect("/")
  }

  const record = student?.kind === "student" ? await getStudentById(student.studentId) : null
  const isMaster = student?.kind === "teacher" && student.adminLevel === "master"

  return (
    <>
      {student ? (
        <>
          <SiteHeader
            showWelcome={student.role === "admin"}
            student={student}
            points={student.kind === "student" ? (record?.pointsBalance ?? 0) : undefined}
          />
          {student.role === "admin" ? <WelcomeFrame /> : null}
        </>
      ) : null}
      {student?.role === "admin" ? <AdminNav showStaff={isMaster} /> : null}
      {children}
    </>
  )
}
