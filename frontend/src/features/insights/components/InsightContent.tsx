import {
  Fragment,
  type ReactNode,
} from 'react'


type InsightContentProps = {
  content: string
  compact?: boolean
}


type ContentBlock =
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'unordered-list'
      items: string[]
    }
  | {
      type: 'ordered-list'
      items: string[]
    }


function renderInlineMarkdown(
  text: string,
  keyPrefix: string,
): ReactNode[] {
  const parts =
    text.split(
      /(\*\*[^*]+\*\*)/g,
    )

  return parts
    .filter(Boolean)
    .map(
      (
        part,
        index,
      ) => {
        const key =
          `${keyPrefix}-${index}`

        if (
          part.startsWith(
            '**',
          ) &&
          part.endsWith(
            '**',
          ) &&
          part.length > 4
        ) {
          return (
            <strong
              key={key}
              className="font-semibold text-slate-950"
            >
              {part.slice(
                2,
                -2,
              )}
            </strong>
          )
        }

        return (
          <Fragment
            key={key}
          >
            {part}
          </Fragment>
        )
      },
    )
}


function normalizeContent(
  content: string,
) {
  // Split inline numbered lists without matching decimal values.
  return content
    .replace(
      /\r\n/g,
      '\n',
    )
    .replace(
      /(\s)(\d+)\.\s+/g,
      '\n$2. ',
    )
    .replace(
      /\n{3,}/g,
      '\n\n',
    )
    .trim()
}


function parseContent(
  content: string,
): ContentBlock[] {
  const lines =
    normalizeContent(
      content,
    ).split('\n')

  const blocks:
    ContentBlock[] = []

  let paragraphLines:
    string[] = []

  let unorderedItems:
    string[] = []

  let orderedItems:
    string[] = []


  function flushParagraph() {
    if (
      paragraphLines.length ===
      0
    ) {
      return
    }

    blocks.push({
      type:
        'paragraph',

      text:
        paragraphLines
          .join(' ')
          .trim(),
    })

    paragraphLines = []
  }


  function flushUnordered() {
    if (
      unorderedItems.length ===
      0
    ) {
      return
    }

    blocks.push({
      type:
        'unordered-list',

      items:
        unorderedItems,
    })

    unorderedItems = []
  }


  function flushOrdered() {
    if (
      orderedItems.length ===
      0
    ) {
      return
    }

    blocks.push({
      type:
        'ordered-list',

      items:
        orderedItems,
    })

    orderedItems = []
  }


  function flushLists() {
    flushUnordered()
    flushOrdered()
  }


  lines.forEach(
    (rawLine) => {
      const line =
        rawLine.trim()

      if (!line) {
        flushParagraph()
        flushLists()

        return
      }


      const orderedMatch =
        line.match(
          /^\d+\.\s+(.+)$/,
        )

      if (orderedMatch) {
        flushParagraph()
        flushUnordered()

        orderedItems.push(
          orderedMatch[1],
        )

        return
      }


      const unorderedMatch =
        line.match(
          /^[-*]\s+(.+)$/,
        )

      if (unorderedMatch) {
        flushParagraph()
        flushOrdered()

        unorderedItems.push(
          unorderedMatch[1],
        )

        return
      }


      flushLists()

      paragraphLines.push(
        line,
      )
    },
  )


  flushParagraph()
  flushLists()

  return blocks
}


type ListContentProps = {
  items: string[]
  ordered: boolean
  compact: boolean
  blockIndex: number
}


function ListContent({
  items,
  ordered,
  compact,
  blockIndex,
}: ListContentProps) {
  const ListTag =
    ordered
      ? 'ol'
      : 'ul'

  return (
    <ListTag
      className={
        compact
          ? 'space-y-2'
          : 'space-y-3'
      }
    >
      {items.map(
        (
          item,
          itemIndex,
        ) => (
          <li
            key={`${blockIndex}-${itemIndex}`}
            className="flex items-start gap-3"
          >
            {ordered ? (
              <span
                className="
                  mt-0.5
                  flex
                  size-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-brand-50
                  text-xs
                  font-semibold
                  text-brand-700
                "
              >
                {itemIndex + 1}
              </span>
            ) : (
              <span
                className="
                  mt-2.5
                  size-1.5
                  shrink-0
                  rounded-full
                  bg-brand-500
                "
              />
            )}

            <span className="min-w-0">
              {renderInlineMarkdown(
                item,
                `list-${blockIndex}-${itemIndex}`,
              )}
            </span>
          </li>
        ),
      )}
    </ListTag>
  )
}


export function InsightContent({
  content,
  compact = false,
}: InsightContentProps) {
  const blocks =
    parseContent(
      content,
    )


  if (
    blocks.length === 0
  ) {
    return null
  }


  return (
    <div
      className={
        compact
          ? 'space-y-3 text-sm leading-6 text-slate-600'
          : 'space-y-5 text-[15px] leading-7 text-slate-700'
      }
    >
      {blocks.map(
        (
          block,
          blockIndex,
        ) => {
          if (
            block.type ===
            'ordered-list'
          ) {
            return (
              <ListContent
                key={`ordered-${blockIndex}`}
                items={
                  block.items
                }
                ordered
                compact={
                  compact
                }
                blockIndex={
                  blockIndex
                }
              />
            )
          }


          if (
            block.type ===
            'unordered-list'
          ) {
            return (
              <ListContent
                key={`unordered-${blockIndex}`}
                items={
                  block.items
                }
                ordered={false}
                compact={
                  compact
                }
                blockIndex={
                  blockIndex
                }
              />
            )
          }


          return (
            <p
              key={`paragraph-${blockIndex}`}
              className="max-w-5xl"
            >
              {renderInlineMarkdown(
                block.text,
                `paragraph-${blockIndex}`,
              )}
            </p>
          )
        },
      )}
    </div>
  )
}