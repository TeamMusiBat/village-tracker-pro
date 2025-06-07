declare module 'express-mysql-session' {
  import { Store } from 'express-session';
  
  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    schema?: {
      tableName: string;
      columnNames: {
        session_id: string;
        expires: string;
        data: string;
      }
    };
    createDatabaseTable?: boolean;
    connectionLimit?: number;
    expiration?: number;
    clearExpired?: boolean;
    checkExpirationInterval?: number;
    endConnectionOnClose?: boolean;
  }
  
  interface MySQLStore extends Store {
    new(options: MySQLStoreOptions): MySQLStore;
    close(): void;
  }
  
  function MySQLStoreFactory(session: any): {
    new(options: MySQLStoreOptions): MySQLStore;
  };
  
  export = MySQLStoreFactory;
}