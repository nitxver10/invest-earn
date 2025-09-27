module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.db'
    },
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    },
    useNullAsDefault: true
  }
};