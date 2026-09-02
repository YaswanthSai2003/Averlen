import {
  FileSpreadsheet,
} from 'lucide-react'

import type {
  CsvPreviewResponse,
} from '../../../api/imports'

import {
  Card,
} from '../../../components/ui'


type CsvPreviewTableProps = {
  preview:
    CsvPreviewResponse
}


function formatPreviewValue(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—'
  }

  if (
    typeof value ===
    'object'
  ) {
    try {
      return JSON.stringify(
        value,
      )
    } catch {
      return String(
        value,
      )
    }
  }

  return String(
    value,
  )
}


export function CsvPreviewTable({
  preview,
}: CsvPreviewTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FileSpreadsheet
              size={19}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">
              Preview uploaded
              file
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {
                preview.filename
              }
            </p>
          </div>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {preview.columns.map(
                (
                  column,
                ) => (
                  <th
                    key={
                      column
                    }
                    className="
                      whitespace-nowrap
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-slate-500
                    "
                  >
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {preview.preview_rows.map(
              (
                row,
                rowIndex,
              ) => (
                <tr
                  key={
                    rowIndex
                  }
                  className="border-b border-slate-100 last:border-b-0"
                >
                  {preview.columns.map(
                    (
                      column,
                    ) => (
                      <td
                        key={
                          column
                        }
                        className="
                          max-w-64
                          whitespace-nowrap
                          px-4
                          py-3
                          text-sm
                          text-slate-700
                        "
                      >
                        {formatPreviewValue(
                          row[
                            column
                          ],
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}