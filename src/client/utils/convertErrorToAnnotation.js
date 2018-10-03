/* @flow */

export type Error = {|
  loc?: [number, number],
  line?: number,
  column?: number,
  message: string,
|};

export type Annotation = {|
  startLineNumber: number,
  endLineNumber: number,
  startColumn: number,
  endColumn: number,
  message: string,
  severity: number,
  source: string,
|};

export default function convertErrorToAnnotation(error: Error): Annotation {
  let loc = error.loc || [0, 0];

  if (Number.isFinite(error.line) && Number.isFinite(error.column)) {
    loc = [error.line || 0, error.column || 0];
  }

  return {
    startLineNumber: loc[0],
    endLineNumber: loc[0],
    startColumn: loc[1],
    endColumn: loc[1],
    message: error.message,
    severity: 4,
    source: 'Device',
  };
}
