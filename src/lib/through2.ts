import { Transform, type TransformOptions } from "node:stream";

const throughObj = (function (construct) {
  return (
    options: TransformOptions | undefined,
    transform: (obj, _, callback) => unknown
  ) => {
    return construct(options, transform);
  };
})(function (
  options: TransformOptions | undefined,
  transform: (obj, _, callback) => unknown
): Transform {
  const t2 = new Transform(
    Object.assign({ objectMode: true, highWaterMark: 16 }, options)
  );

  t2._transform = transform;

  return t2;
});

export { throughObj };
