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
      formatError: (formattedError) => {
        const originalError = formattedError.extensions
          ?.originalError as Record<string, unknown> | null;
        const messages = originalError?.message;
        return {
          message: Array.isArray(messages)
            ? messages.join('; ')
            : formattedError.message,
          statusCode: (originalError?.statusCode as number) ?? 500,
        };
      },
    }),
  ],
})
export class GraphqlModule {}
