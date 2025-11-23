function serializer() {
  const stack: unknown[] = [];
  const keys: string[] = [];

  const cycleReplacer = function (_key: unknown, value: unknown): string {
    if (stack[0] === value) return "[Circular ~]";
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]";
  };

  return function (this: unknown, key: string, value: unknown): unknown {
    if (stack.length > 0) {
      const thisPos = stack.indexOf(this);
      if (~thisPos) {
        stack.splice(thisPos + 1);
      } else stack.push(this);
      if (~thisPos) {
        keys.splice(thisPos, Infinity, key);
      } else {
        keys.push(key);
      }
      if (~stack.indexOf(value)) {
        value = cycleReplacer.call(this, key, value);
      }
    } else {
      stack.push(value);
    }

    return value;
  };
}

function stringify(obj: unknown): string {
  return JSON.stringify(obj, serializer());
}

export default stringify;
export { serializer as getSerialize };
