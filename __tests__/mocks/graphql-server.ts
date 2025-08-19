import { Express, Request, Response } from 'express'
import { graphql, buildSchema } from 'graphql'

// Define a test schema
const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }
  
  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: String!
  }
  
  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
    hello(name: String): String!
  }
  
  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createPost(input: CreatePostInput!): Post!
  }
  
  input CreateUserInput {
    name: String!
    email: String!
  }
  
  input UpdateUserInput {
    name: String
    email: String
  }
  
  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }
`)

// Mock data
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
]

const posts = [
  {
    id: '1',
    title: 'First Post',
    content: 'This is my first post',
    authorId: '1',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'Another great post',
    authorId: '2',
    createdAt: new Date().toISOString()
  },
]

// Define root resolver
const rootValue = {
  // Query resolvers
  users: () => users.map(u => ({
    ...u,
    posts: () => posts.filter(p => p.authorId === u.id).map(p => ({
      ...p,
      author: () => users.find(user => user.id === p.authorId)
    }))
  })),
  user: ({ id }: { id: string }) => {
    const user = users.find(u => u.id === id)
    if (!user) return null
    return {
      ...user,
      posts: () => posts.filter(p => p.authorId === user.id).map(p => ({
        ...p,
        author: () => users.find(u => u.id === p.authorId)
      }))
    }
  },
  posts: () => posts.map(p => ({
    ...p,
    author: () => users.find(u => u.id === p.authorId)
  })),
  post: ({ id }: { id: string }) => {
    const post = posts.find(p => p.id === id)
    if (!post) return null
    return {
      ...post,
      author: () => users.find(u => u.id === post.authorId)
    }
  },
  hello: ({ name }: { name?: string }) => `Hello ${name || 'World'}!`,

  // Mutation resolvers
  createUser: ({ input }: { input: any }) => {
    const newUser = {
      id: String(users.length + 1),
      ...input
    }
    users.push(newUser)
    return {
      ...newUser,
      posts: () => []
    }
  },

  updateUser: ({ id, input }: { id: string, input: any }) => {
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) throw new Error('User not found')

    users[userIndex] = { ...users[userIndex], ...input }
    const updatedUser = users[userIndex]
    return {
      ...updatedUser,
      posts: () => posts.filter(p => p.authorId === updatedUser.id).map(p => ({
        ...p,
        author: () => users.find(u => u.id === p.authorId)
      }))
    }
  },

  deleteUser: ({ id }: { id: string }) => {
    const userIndex = users.findIndex(u => u.id === id)
    if (userIndex === -1) return false

    users.splice(userIndex, 1)
    return true
  },

  createPost: ({ input }: { input: any }) => {
    const newPost = {
      id: String(posts.length + 1),
      ...input,
      createdAt: new Date().toISOString()
    }
    posts.push(newPost)
    return {
      ...newPost,
      author: () => users.find(u => u.id === newPost.authorId)
    }
  },
}

export async function createGraphQLServer(app: Express) {
  // Add GraphQL endpoint
  app.post('/graphql', async (req: Request, res: Response) => {
    const { query, variables, operationName } = req.body

    try {
      const result = await graphql({
        schema,
        source: query,
        rootValue,
        contextValue: {
          token: req.headers.authorization,
          headers: req.headers
        },
        variableValues: variables,
        operationName
      })

      res.json(result)
    } catch (error) {
      res.status(500).json({
        errors: [{
          message: error instanceof Error ? error.message : 'Internal server error'
        }]
      })
    }
  })

  // Add GraphQL introspection endpoint (for the introspect tool)
  app.get('/graphql', (req: Request, res: Response) => {
    res.json({ message: 'GraphQL endpoint is running. Use POST for queries.' })
  })
}
