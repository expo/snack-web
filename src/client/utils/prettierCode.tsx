export default async function prettierCode(code: string): Promise<string> {
  // @ts-ignore
  const prettier = await import('prettier/standalone');

  // @ts-ignore
  const plugins = [await import('prettier/parser-babylon')];

  const { default: config } = await import('../configs/prettier.json');

  return prettier.format(code, {
    parser: 'babylon',
    plugins,
    ...config,
  });
}
