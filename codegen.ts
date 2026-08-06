import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // 公開済み拡張が実際に会話する本番APIのschemaを正とする（未デプロイの変更が型に混ざるのを防ぐ）。
  // 生成物は src/__generated__/ にコミットするため、build/CIでは再生成不要
  schema: 'https://investee.info/api/graphql',
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
