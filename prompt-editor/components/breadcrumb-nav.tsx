"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BreadcrumbNav() {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = [{ name: "home", href: "/" }]

    let currentPath = ""
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Convert segment to readable name
      let name = segment
      if (segment === "prompts") name = "prompts"
      else if (segment === "editor") name = "editor"
      else name = segment.replace(/-/g, " ")

      breadcrumbs.push({
        name,
        href: currentPath,
        isLast: index === segments.length - 1,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <nav className="flex items-center space-x-1 text-sm text-slate-600 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="w-3 h-3 mx-1 text-slate-400" />}
          {crumb.isLast ? (
            <span className="text-slate-900 font-medium">{crumb.name}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-slate-900 transition-colors">
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
