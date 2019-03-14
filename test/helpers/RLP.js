const { keccak256, bufferToHex } = require('ethereumjs-util');

function getRLP (func, ...args) {
  func = func.replace(' ', '');
  // const fName = getName(func);
  const fArgs = getArgs(func);
  if (fArgs.length !== args.length) {
    throw String('Arguments mismatch');
  }
  let result = bufferToHex(keccak256(func)).slice(0, 10);

  for (let i = 0; i < fArgs.length; i++) {
    result += decodeArg(fArgs[i], args[i]).replace('0x', '');
  }
  return result.toLowerCase();
}

// function getName (func) {
//   return func.slice(0, func.indexOf('('));
// }

function getArgs (args) {
  return args.slice(args.indexOf('(') + 1, args.indexOf(')')).split(',');
}

function decodeArg (type, arg) {
  if (type.startsWith('uint')) {
    if (isNaN(arg)) {
      throw String('uint argument is not are number');
    }
    if (type.length > 'uint'.length) {
      const pow = type.slice('uint'.length);
      if (isNaN(pow)) {
        throw String('invalid argument ' + type);
      }
      if (arg > 2 ** pow) {
        throw String('Value out of range');
      }
    }

    return arg.toString(16).padStart(64, 0);
  } else if (type === 'address') {
    return arg.toString(16).replace('0x', '').padStart(64, 0);
  } else {
    throw String('Not supported type, or not implemented yet');
  }
}

module.exports = {
  getRLP,
};
