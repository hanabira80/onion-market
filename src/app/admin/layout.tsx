import { redirect } from "next/navigation"

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
    redirect("/login")
  }

  if (count > 0 && student?.role !== "admin") {
    redirect("/")
  }

  const record = student ? await getStudentById(student.studentId) : null

  return (
    <>
      {student ? (
        <SiteHeader student={student} points={record?.pointsBalance ?? 0} />
      ) : null}
      {student?.role === "admin" ? <AdminNav /> : null}
      {children}
    </>
  )
}
