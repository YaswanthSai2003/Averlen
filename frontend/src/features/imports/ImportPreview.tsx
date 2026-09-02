import {
  useMemo,
  useState,
} from 'react'

import type {
  ColumnMappingRequest,
  CsvPreviewResponse,
} from '../../api/imports'

import type {
  PropertySummary,
} from '../../api/properties'

import {
  ColumnMappingPanel,
} from './components/ColumnMappingPanel'

import {
  CsvPreviewTable,
} from './components/CsvPreviewTable'

import {
  PropertyIdReference,
} from './components/PropertyIdReference'

import {
  createInitialMapping,
  type MappingKey,
} from './utils/columnMapping'


type ImportPreviewProps = {
  preview:
    CsvPreviewResponse

  properties:
    PropertySummary[]

  processing:
    boolean

  errorMessage?:
    string |
    null

  onBack:
    () => void

  onProcess:
    (
      mapping:
        ColumnMappingRequest,
    ) => Promise<void>
}


export function ImportPreview({
  preview,
  properties,
  processing,
  errorMessage,
  onBack,
  onProcess,
}: ImportPreviewProps) {
  const initialMapping =
    useMemo(
      () =>
        createInitialMapping(
          preview,
        ),
      [
        preview,
      ],
    )


  const [
    mapping,
    setMapping,
  ] =
    useState<
      ColumnMappingRequest
    >(
      () =>
        initialMapping,
    )


  function updateMapping(
    key:
      MappingKey,
    value:
      string,
  ) {
    setMapping(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    )
  }


  async function handleProcess() {
    await onProcess(
      mapping,
    )
  }


  return (
    <div className="grid gap-6">
      <CsvPreviewTable
        preview={
          preview
        }
      />

      <ColumnMappingPanel
        preview={
          preview
        }
        mapping={
          mapping
        }
        initialMapping={
          initialMapping
        }
        processing={
          processing
        }
        errorMessage={
          errorMessage
        }
        onChange={
          updateMapping
        }
        onBack={
          onBack
        }
        onProcess={
          handleProcess
        }
      />

      <PropertyIdReference
        properties={
          properties
        }
      />
    </div>
  )
}