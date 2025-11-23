import { Writable } from "node:stream";

function stringConcat(parts: string[]): string {
  let strings: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    strings.push(p);
  }

  return strings.join("");
}

class ConcatStream extends Writable {
  private body: string[];

  constructor(callback: (data: string) => unknown) {
    super();

    Writable.call(this, { objectMode: true });

    this.on("finish", function (this: ConcatStream): void {
      callback(this.getBody());
    });
    this.body = [];
  }

  override _write(chunk: string, _encoding: never, callback: () => void): void {
    this.body.push(chunk);
    callback();
  }

  getBody(): string {
    return stringConcat(this.body);
  }
}

export default ConcatStream;
