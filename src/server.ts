// src/server.ts
import express from 'express';
import { scrapePerson, Person, Dance, scrapeDance, scrapeFormation, Formation, scrape, Scrape } from './scraper';
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

  type Link {
    domain: String!
    id: String!
    description: String
    relation: String
  }

  type Scrape {
    scrapeType: String!
    id: String!
    name: String!
    extraInfo: String
    props: [KeyValue]
    links: [Link]
  }

  type Query {
    dance(id: String, refresh: Boolean): Scrape
  }

  type Query {
    person(id: String, refresh: Boolean): Scrape
  }

  type Query {
    formation(id: String, refresh: Boolean): Scrape
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    dance: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("Dance", args.id, args.refresh || false);
    },
    person: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("Person", args.id, args.refresh || false);
    },
    formation: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("Formation", args.id, args.refresh || false);
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
