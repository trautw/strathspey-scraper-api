import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache: new InMemoryCache(),
});

const GET_BOOKS = gql`
  query GetBooks($refresh: Boolean) {
    books(refresh: $refresh) {
      title
      price
    }
  }
`;

const BookList = () => {
  const { loading, error, data, refetch } = useQuery(GET_BOOKS, {
    variables: { refresh: false },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={() => refetch({ refresh: true })}>Refresh</button>
      <ul>
        {data.books.map((book: any, index: number) => (
          <li key={index}>
            <strong>{book.title}</strong> – {book.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

const App = () => (
  <ApolloProvider client={client}>
    <div className="App">
      <h1>📚 Book Scraper</h1>
      <BookList />
    </div>
  </ApolloProvider>
);

export default App;

