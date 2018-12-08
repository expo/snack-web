declare module 'recast' {
  type PrintResult = { code: string };

  export const print = (ast: any) => PrintResult;

  export const parse = (
    code: string,
    options: {
      parser: { parse: (code: string) => any };
    }
  ) => PrintResult;

  export const types = {
    visit(
      ast: any,
      visitor: {
        [key: string]: (path: any) => void;
      }
    ): void;,
  };
}
