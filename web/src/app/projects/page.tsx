import { Metadata } from 'next'
import { projects, getCategories } from '@/app/projects/data'
import { ProjectsPageClient } from '@/app/projects/_components/projects-page-client'
import { ui } from '@/i18n/en'

export const metadata: Metadata = {
  title: 'Projects',
  description: ui.projects.description,
}

export default function ProjectsPage() {
  const categories = getCategories()

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <ProjectsPageClient projects={projects} categories={categories} />
    </main>
  )
}
