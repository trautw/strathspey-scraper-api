// src/server.ts
import express from 'express';
import { scrapePerson, Person, Dance, scrapeDance, scrapeFormation, Formation, scrape, Scrape, searchDance } from './scraper';
import { ApolloServer } from 'apollo-server-express';
import { gql } from 'graphql-tag';

const app = express();
const PORT = 3000;

// GraphQL schema
const typeDefs = gql`
  type KeyValue {
    key: String!
    value: [String]
    links: [Link]
  }

  type Link {
    domain: String!
    id: String!
    description: String
    relation: String
  }

  type Row {
    columns: [KeyValue]
  }

  type Table {
    name: String
    rows: [Row]
  }

  type Scrape {
    scrapeType: String!
    id: String!
    name: String!
    extraInfo: String
    props: [KeyValue]
    tables: [Table]
  }

  type Query {
    dance(id: String, refresh: Boolean): Scrape
  }

  type Query {
    person(id: String, refresh: Boolean): Scrape
  }

  type Query {
    tune(id: String, refresh: Boolean): Scrape
  }

  type Query {
    formation(id: String, refresh: Boolean): Scrape
  }
  type Query {
    list(id: String, refresh: Boolean): Scrape
  }
  type Query {
    publication(id: String, refresh: Boolean): Scrape
  }
  type Query {
    searchdance(author: String, refresh: Boolean): Scrape
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
    tune: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("Tune", args.id, args.refresh || false);
    },
    list: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("List", args.id, args.refresh || false);
    },
    publication: async (_: any, args: { id: string, refresh?: boolean }): Promise<Scrape> => {
      return scrape("Publication", args.id, args.refresh || false);
    },
    searchdance: async (_: any, args: { author: string, refresh?: boolean }): Promise<Scrape> => {
      return searchDance("SearchDance", args.author, args.refresh || false);
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
