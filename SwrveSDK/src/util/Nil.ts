
export function isNil(variable: any): boolean {
  return (variable === undefined || variable === null);
}

export function isPresent(variable: any): boolean {
  return !isNil(variable);
}

export function noOp(...args: any[]) {
  return Function();
}
