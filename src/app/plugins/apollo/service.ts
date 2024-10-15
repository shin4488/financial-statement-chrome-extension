import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';

export default class ApolloClientService {
  static client: ApolloClient<NormalizedCacheObject> | null = null;
  constructor() {
    if (ApolloClientService.client === null) {
      ApolloClientService.client = this.create();
    }
  }

  create(): ApolloClient<NormalizedCacheObject> {
    return new ApolloClient({
      uri: 'https://investee.info/api/graphql',
      cache: new InMemoryCache(),
    });
  }

  async query<
    Query,
    QueryVariables extends OperationVariables,
    TVariables extends QueryVariables = QueryVariables,
  >(document: TypedDocumentNode, variables?: TVariables) {
    if (ApolloClientService.client === null) {
      ApolloClientService.client = this.create();
    }

    const result = await ApolloClientService.client.query<Query, QueryVariables>({
      query: document,
      variables: variables,
    });
    if (result.error !== undefined) {
      throw Error(result.error.message);
    }

    return result;
  }
}
