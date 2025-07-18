// src/server.ts
import express from 'express';
import { scrapeBooks, Book, scrapePerson, Person } from './scraper';
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'graphql-tag';

const app = express();
const PORT = 3000;

// GraphQL schema
const typeDefs = gql`
  type KeyValue {
    key: String!
    value: [String]!
  }

  type Dance {
    id: String!
    name: String!
    props: [KeyValue]
  }

  type Person {
    id: String!
    name: String!
    props: [KeyValue]
  }

  type Query {
    dance(id: String, refresh: Boolean): Dance
  }

  type Query {
    person(id: String, refresh: Boolean): Person
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    person: async (_: any, args: { id: string, refresh?: boolean }): Promise<Person> => {
      return scrapePerson(args.id, args.refresh || false);
    },
  },
};

// Create Apollo Server
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();
