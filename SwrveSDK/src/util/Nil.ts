
export function isNil(variable: any): boolean {
  return (variable === undefined || variable === null);
}

export function noOp(...args: any[]) {
  return Function();
}
