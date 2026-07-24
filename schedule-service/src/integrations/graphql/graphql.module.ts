import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      formatError: (formattedError) => ({
        message: formattedError.message,
        statusCode:
          (formattedError.extensions?.originalError as Record<string, unknown>)
            ?.statusCode ?? 500,
      }),
    }),
  ],
})
export class GraphqlModule {}
