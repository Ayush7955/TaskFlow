'use strict';

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const depthLimit = require('graphql-depth-limit');
const typeDefs = require('./typeDefs/schema');
const resolvers = require('./resolvers');
const { buildContext } = require('./context');

/**
 * Create and start Apollo Server 4, return Express middleware.
 * @returns {Promise<Function>} Express middleware to mount at /graphql
 */
async function createGraphQLMiddleware() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [depthLimit(10)],
    formatError: (formattedError, error) => {
      // Hide internal server errors in production
      if (process.env.NODE_ENV === 'production' && formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } };
      }
      return formattedError;
    },
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [
      {
        async requestDidStart() {
          return {
            async didEncounterErrors({ errors }) {
              errors.forEach((err) => {
                if (err.originalError) {
                  require('../config/logger').error({ err }, 'GraphQL error');
                }
              });
            },
          };
        },
      },
    ],
  });

  await server.start();

  return expressMiddleware(server, {
    context: buildContext,
  });
}

module.exports = createGraphQLMiddleware;

