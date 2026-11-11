import { notFound } from 'next/navigation'
import { HayatApp } from '@/components/hayat/HayatApp'

const sections = ['home','chat','documents','records','care','wellness','challenges','map','passport','family','providers','settings','about','impact','sos','referral','clinic-path'] as const
export const dynamicParams = false
export function generateStaticParams() { return sections.map((section) => ({ section })) }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section as (typeof sections)[number])) notFound()
  return <HayatApp section={section} />
}
