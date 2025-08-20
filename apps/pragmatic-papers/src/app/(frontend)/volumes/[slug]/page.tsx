import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache, Fragment } from 'react'

import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import RichText from '@/components/RichText'
import { formatDateTime } from '@/utilities/formatDateTime'
import { ArticleCard } from '@/components/ArticleCard'
import { toRoman } from '@/utilities/toRoman'
import { Squiggle } from '@/components/ui/squiggle'

export async function generateStaticParams(): Promise<{ slug: string | null | undefined }[]> {
  const payload = await getPayload({ config: configPromise })
  const volumes = await payload.find({
    collection: 'volumes',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = volumes.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

interface Args {
  params: Promise<{
    slug?: string
  }>
}

const queryVolumeBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'volumes',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
  })

  return result.docs?.[0] || null
})

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const volume = await queryVolumeBySlug({ slug })

  return generateMeta({ doc: volume })
}

export default async function VolumePage({
  params: paramsPromise,
}: Args): Promise<React.ReactNode> {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/volumes/' + slug
  const volume = await queryVolumeBySlug({ slug })

  if (!volume) return <PayloadRedirects url={url} />

  const { title, publishedAt, editorsNote, articles, introduction } = volume
  if (articles?.filter((article) => typeof article === 'number')?.length ?? 0 > 0) {
    console.error('Fetching volume with unfetched articles', slug)
  }
  const actualArticles = articles?.filter((article) => typeof article !== 'number')

  return (
    <div className="pb-16 max-w-3xl px-4 mx-auto">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container">
        <div className="text-center">
          <div className="flex flex-col justify-center items-center text-xs leading-tight">
            <div className="flex">
              <h1 className="font-mono">{`Volume ${toRoman(Number(volume.volumeNumber))}`}</h1>
            </div>
            {publishedAt && (
              <div className="font-mono">
                <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
              </div>
            )}
          </div>
        </div>

        {title && (
          <div className="w-full my-8">
            <h1 className="font-sans text-4xl text-center font-bold tracking-normal">{title}</h1>
          </div>
        )}

        {introduction && (
          <div className="w-full">
            <RichText
              className="font-serif font-light text-md tracking-tight leading-relaxed"
              enableGutter={false}
              data={introduction}
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {actualArticles?.map((article) => (
              <ArticleCard key={article.id} doc={article} relationTo="articles" />
            ))}
          </div>
        </div>

        {editorsNote && (
          <Fragment>
            <Squiggle className="mx-auto" />
            <div className="w-full">
              <h2 className="font-sans leading-tight text-4xl font-bold m-8 text-center">
                Editor's Note
              </h2>
              <RichText
                className="font-serif text-md tracking-tight font-normal leading-relaxed"
                enableGutter={false}
                data={editorsNote}
              />
            </div>
          </Fragment>
        )}
      </div>
    </div>
  )
}
