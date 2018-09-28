/* tslint:disable:no-bitwise */

export const uuidRegex = /^\s*([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})\s*$/i;

export function parseUuid(text: string): Uuid {
  const match: RegExpExecArray = uuidRegex.exec(text);
  if (match == null) {
    throw new Error('Invalid UUID');
  }

  const bytes: number[] = (match[1] + match[2] + match[3] + match[4] + match[5])
        .split(/(..)/g)
        .filter((s: string) => s.length === 2)
        .map((s: string) => parseInt(s, 16));

  return new Uuid(bytes);
}

/**
 *  Generate a Version 4(Random) UUID
 *  UUID specifies that certain bits always have specific fixed values depending on the scheme used to generate the UUID
 *  We generate Uint8Array comprised of random bytes. Then we edit the bytes[6] and bytes[8] to have it to standard with Version 4 (Random).
 */
export function generateUuid(): Uuid {
  const bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array;
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return new Uuid(Array.from(bytes));
}

export class Uuid {
  private readonly bytes: ReadonlyArray<number>;

  constructor(bytes: ReadonlyArray<number>) {
    if (bytes.length !== 16) {
      throw new Error('Invalid UUID: Incorrect byte count');
    }

    this.bytes = bytes.map((b: number) => b & 0xff);
  }

  public toString(): string {
    return this.bytes.map((b: number) => b.toString(16))
            .map((s: string) => (`0${s}`).substr(-2))
            .join('')
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }
}
