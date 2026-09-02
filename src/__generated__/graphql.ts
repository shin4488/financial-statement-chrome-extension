/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type FinancialReportsQueryVariables = Exact<{
  stockCodes?: Array<string> | string | null | undefined;
}>;

export type FinancialReportsQuery = {
  financialReports: Array<{
    id: string;
    stockCode: string | null;
    companyName: string | null;
    fiscalYearStartDate: string;
    fiscalYearEndDate: string;
    accountingStandard: string;
    consolidationType: string;
    balanceSheet: {
      renderable: boolean;
      note: string | null;
      bars: Array<{
        label: string;
        segments: Array<{
          key: string;
          label: string;
          amount: number;
          signedAmount: number;
          ratio: number | null;
          colorRole: string;
          tooltipLabel: string | null;
        }>;
      }>;
    };
    profitLoss: {
      renderable: boolean;
      note: string | null;
      bars: Array<{
        label: string;
        segments: Array<{
          key: string;
          label: string;
          amount: number;
          signedAmount: number;
          ratio: number | null;
          colorRole: string;
          tooltipLabel: string | null;
        }>;
      }>;
    };
    cashFlow: {
      renderable: boolean;
      note: string | null;
      steps: Array<{ key: string; label: string; amount: number; kind: string; colorRole: string }>;
    };
  }>;
};

export const FinancialReportsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'FinancialReports' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'stockCodes' } },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NonNullType',
              type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'financialReports' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'limit' },
                value: { kind: 'IntValue', value: '100' },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'offset' },
                value: { kind: 'IntValue', value: '0' },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'stockCodes' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'stockCodes' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'stockCode' } },
                { kind: 'Field', name: { kind: 'Name', value: 'companyName' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalYearStartDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'fiscalYearEndDate' } },
                { kind: 'Field', name: { kind: 'Name', value: 'accountingStandard' } },
                { kind: 'Field', name: { kind: 'Name', value: 'consolidationType' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'balanceSheet' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'renderable' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'bars' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'segments' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'signedAmount' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ratio' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'colorRole' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'tooltipLabel' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'profitLoss' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'renderable' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'bars' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'segments' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'signedAmount' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'ratio' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'colorRole' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'tooltipLabel' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'cashFlow' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'renderable' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'note' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'steps' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'label' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'colorRole' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FinancialReportsQuery, FinancialReportsQueryVariables>;
