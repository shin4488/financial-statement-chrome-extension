/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
  'query GetCompanyFinancialStatementsByCodes($stockCodes: [String!]) {\n  companyFinancialStatements(offset: 0, limit: 100, stockCodes: $stockCodes) {\n    fiscalYearStartDate\n    fiscalYearEndDate\n    filingDate\n    stockCode\n    companyJapaneseName\n    hasConsolidatedFinancialStatement\n    consolidatedInductoryCode\n    nonConsolidatedInductoryCode\n    balanceSheet {\n      amount {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n      ratio {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n    }\n    profitLoss {\n      amount {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n      ratio {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n    }\n    cashFlow {\n      startingCash\n      operatingActivitiesCashFlow\n      investingActivitiesCashFlow\n      financingActivitiesCashFlow\n      endingCash\n    }\n  }\n}':
    types.GetCompanyFinancialStatementsByCodesDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query GetCompanyFinancialStatementsByCodes($stockCodes: [String!]) {\n  companyFinancialStatements(offset: 0, limit: 100, stockCodes: $stockCodes) {\n    fiscalYearStartDate\n    fiscalYearEndDate\n    filingDate\n    stockCode\n    companyJapaneseName\n    hasConsolidatedFinancialStatement\n    consolidatedInductoryCode\n    nonConsolidatedInductoryCode\n    balanceSheet {\n      amount {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n      ratio {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n    }\n    profitLoss {\n      amount {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n      ratio {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n    }\n    cashFlow {\n      startingCash\n      operatingActivitiesCashFlow\n      investingActivitiesCashFlow\n      financingActivitiesCashFlow\n      endingCash\n    }\n  }\n}',
): (typeof documents)['query GetCompanyFinancialStatementsByCodes($stockCodes: [String!]) {\n  companyFinancialStatements(offset: 0, limit: 100, stockCodes: $stockCodes) {\n    fiscalYearStartDate\n    fiscalYearEndDate\n    filingDate\n    stockCode\n    companyJapaneseName\n    hasConsolidatedFinancialStatement\n    consolidatedInductoryCode\n    nonConsolidatedInductoryCode\n    balanceSheet {\n      amount {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n      ratio {\n        currentAsset\n        propertyPlantAndEquipment\n        intangibleAsset\n        investmentAndOtherAsset\n        currentLiability\n        noncurrentLiability\n        netAsset\n      }\n    }\n    profitLoss {\n      amount {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n      ratio {\n        netSales\n        originalCost\n        sellingGeneralExpense\n        operatingIncome\n      }\n    }\n    cashFlow {\n      startingCash\n      operatingActivitiesCashFlow\n      investingActivitiesCashFlow\n      financingActivitiesCashFlow\n      endingCash\n    }\n  }\n}'];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
