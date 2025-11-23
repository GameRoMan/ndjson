import { Writable } from "node:stream";

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
    return this.body.join("");
  }
}

export default ConcatStream;
