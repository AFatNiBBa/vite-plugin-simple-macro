
/** The names of frontend frameworks that can be used with TanStack Start */
export type Framework = "react" | "solid" | string & {};

// Defines the signature of the macro
declare global {

  /**
   * Macro that wraps a function so that it can be invoked from both the client and the server, but will only be executed on the server.
   * The generated code is compatible with TanStack Start
   * @param f The function to wrap
   */
  function __server<P extends readonly unknown[], R>(f: (...args: P) => R): (...args: P) => Promise<Awaited<R>>;

  /**
   * Macro that invokes a function on the server directly
   * @param clojure List of identifiers that should be captured from the client during the execution of {@link f}
   * @param f The function to invoke
   */
  function __server<R>(clojure: readonly unknown[], f: () => R): Promise<Awaited<R>>;
}

// Makes Babel's parent retrieval type-safe
declare module "@babel/traverse" {
  interface NodePath<T> {
    findParent<N extends Node>(callback: (path: NodePath) => path is NodePath<N>): NodePath<N> | null;
  }
}