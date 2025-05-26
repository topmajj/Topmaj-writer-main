import { redirect } from "next/navigation"

export default function NewDocumentPage() {
  // Redirect to templates page
  redirect("/dashboard/templates")
}
