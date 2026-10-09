import { ProjectDetailPage } from "@/components/site/project-detail-page"

export const dynamic = "force-dynamic"

export default async function ProjectDetailRoute({
  params,
}: {
  params: Promise<{
    projectId: string
  }>
}) {
  const { projectId } = await params

  return <ProjectDetailPage projectId={projectId} />
}
