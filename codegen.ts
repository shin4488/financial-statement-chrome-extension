import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // financialReportsが本番未デプロイの間は本番introspectionでは型生成できないため、
  // ローカルdocker（financial-statementリポジトリのappserver）のschemaを指す。
  // 生成物は src/__generated__/ にコミットするため、build/CIでは再生成不要
  schema: 'http://localhost:20000/graphql',
  documents: ['./**/*.graphql'],
  generates: {
    './src/__generated__/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
      config: {
        // Moneyは円単位の金額をJSON数値のまま返すスカラ（未指定だとanyになる）
        scalars: { Money: 'number' },
      },
    },
  },
  ignoreNoDocuments: false,
};

export default config;
