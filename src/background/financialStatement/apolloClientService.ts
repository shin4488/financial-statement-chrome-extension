import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  type OperationVariables,
  type TypedDocumentNode,
} from '@apollo/client';
import apiEndpoints from './apiEndpoints.json';

export default class ApolloClientService {
  static client: ApolloClient | null = null;
  constructor() {
    if (ApolloClientService.client === null) {
      ApolloClientService.client = this.create();
    }
  }

  create(): ApolloClient {
    return new ApolloClient({
      link: new HttpLink({
        // 開発ビルドは、本番へデプロイしていないバックエンドの変更を使って拡張の動作を確かめられるよう、ローカルdockerのバックエンド（financial-statementリポジトリ）に接続する
        uri:
          import.meta.env.MODE === 'development'
            ? apiEndpoints.development
            : apiEndpoints.production,
      }),
      cache: new InMemoryCache(),
    });
  }

  // 既定のerrorPolicy（none）では、GraphQL・通信のエラーは例外として呼び出し元へ伝わる
  async query<TData, TVariables extends OperationVariables>(
    document: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
  ) {
    if (ApolloClientService.client === null) {
      ApolloClientService.client = this.create();
    }

    return ApolloClientService.client.query<TData, TVariables>({ query: document, variables });
  }
}
