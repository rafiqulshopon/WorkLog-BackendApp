Welcome to the WorkLog Backend project. This repository contains the backend code for the WorkLog application, a tool designed to track employees' work time based on projects and tasks.

## Table of Contents

- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Development Server](#running-the-development-server)
- [Running Migrations](#running-migrations)
- [Seeding the Database](#seeding-the-database)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

## Introduction

WorkLog is a comprehensive tool designed to help companies track their employees' work time effectively. This repository contains the backend code built with Nest.js, Prisma, and PostgreSQL.

## Technologies Used

- **Nest.js**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Prisma**: A next-generation ORM for TypeScript and JavaScript.
- **PostgreSQL**: A powerful, open-source object-relational database system.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (v20 or later)
- npm (v6 or later) or Yarn (v1.22 or later)
- PostgreSQL (v16 or later)

## Installation

To get started with the project, follow these steps:

1. **Clone the repository**:
    ```bash
    git clone https://github.com/rafiqulshopon/WorkLog-BackendApp
    cd WorkLog-BackendApp
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

## Database Setup

1. **Create a PostgreSQL database**:
    ```sql
    CREATE DATABASE worklog;
    ```

2. **Configure the database connection**:
   - Rename the `.env.example` file to `.env`.
   - Update the `DATABASE_URL` in the `.env` file with your PostgreSQL connection string:
     ```env
     DATABASE_URL="postgresql://user:password@localhost:5432/worklog"
     ```

## Running the Development Server

To start the development server, run the following command:

```bash
npm run start:dev
```

This will start the server on `http://localhost:3000`.

## Running Migrations

To set up the database schema, run the following command:

```bash
npx prisma migrate dev
```

This command will apply any pending migrations and generate the Prisma Client.

## Seeding the Database

To seed the database with initial data, run the following command:

```bash
npm run seed
```

## Running Tests

To run the tests, use the following commands:

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Contributing

We welcome contributions to improve WorkLog. If you have any suggestions or bug reports, please open an issue or submit a pull request.

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Push your changes to your fork.
5. Open a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
