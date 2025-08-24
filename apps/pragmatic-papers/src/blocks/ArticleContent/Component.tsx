import type { ArticleBodyContent as ArticleBodyContentBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
  index?: number
} & ArticleBodyContentBlockProps

export const ArticleBodyContentBlock: React.FC<Props> = ({
  className,
  articleBodyContent: content,
  index,
}) => {
  if (!content) return null
  return (
    <div className={cn('my-4 w-full', className)} key={index}>
      <RichText enableGutter={false} className="font-serif" data={content} />
    </div>
  )
}
