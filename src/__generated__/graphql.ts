/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** 円単位の金額。Int32の範囲を超え得るがJSON上は数値のまま返す */
  Money: { input: number; output: number };
};

export enum CashFlowSign {
  Negative = 'NEGATIVE',
  Positive = 'POSITIVE',
}

export type FinancialReportsQueryVariables = Exact<{
  stockCodes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;

export type FinancialReportsQuery = {
  __typename?: 'Query';
  financialReports: Array<{
    __typename?: 'FinancialReport';
    id: string;
    stockCode?: string | null;
    companyName?: string | null;
    fiscalYearStartDate: string;
    fiscalYearEndDate: string;
    accountingStandard: string;
    consolidationType: string;
    balanceSheet: {
      __typename?: 'StackChart';
      renderable: boolean;
      note?: string | null;
      bars: Array<{
        __typename?: 'StackBar';
        label: string;
        segments: Array<{
          __typename?: 'Segment';
          key: string;
          label: string;
          amount: number;
          signedAmount: number;
          ratio?: number | null;
          colorRole: string;
          tooltipLabel?: string | null;
        }>;
      }>;
    };
    profitLoss: {
      __typename?: 'StackChart';
      renderable: boolean;
      note?: string | null;
      bars: Array<{
        __typename?: 'StackBar';
        label: string;
        segments: Array<{
          __typename?: 'Segment';
          key: string;
          label: string;
          amount: number;
          signedAmount: number;
          ratio?: number | null;
          colorRole: string;
          tooltipLabel?: string | null;
        }>;
      }>;
    };
    cashFlow: {
      __typename?: 'WaterfallChart';
      renderable: boolean;
      note?: string | null;
      steps: Array<{
        __typename?: 'WaterfallStep';
        key: string;
        label: string;
        amount: number;
        kind: string;
        colorRole: string;
      }>;
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
