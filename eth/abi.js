/**
 * @template T
 * @param {T} defaultValue
 * @returns {(e: T | undefined) => T} defaultValueSetter
 */
const createDefaultValueSetter = (defaultValue) => ((e) => e || defaultValue)

const defaultValueString = createDefaultValueSetter("")
const defaultValueBytes = createDefaultValueSetter("0x")

const WORD_SIZE_IN_BYTES = 32;

/**
 * Converts a hex string to a Uint8Array of bytes.
 * @param {string} hex - The hex string to convert.
 * @returns {Uint8Array} - The byte array.
 */
const hexToBytes = (hex) => {
  // Ensure even number of characters
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return bytes;
}

// Reads 'length' bytes from hexData starting at 'byteOffset'
const readBytes = (hexData, byteOffset, length) => {
  const hexStart = byteOffset * 2;
  const hexEnd = hexStart + (length * 2);
  return hexData.slice(hexStart, hexEnd);
}


const parseUint256 = (hexData, byteOffset) => {
  const wordHex = readBytes(hexData, byteOffset, WORD_SIZE_IN_BYTES);
  return BigInt('0x' + wordHex);
}

// Helper to decode a dynamic offset. Offsets are always stored as uint256
const parseOffset = (hexData, byteOffset) => {
  // This is just reading a uint256, but we interpret it as a byte offset (BigInt).
  return parseUint256(hexData, byteOffset);
}

const parseAddress = (hexData, byteOffset) => {
  const wordHex = readBytes(hexData, byteOffset, WORD_SIZE_IN_BYTES);
  // Address is the rightmost 20 bytes (40 hex chars) of the 32-byte word
  return '0x' + wordHex.slice(64 - 40);
}

const parseUTF8String = (hexData, byteOffset) => {
  const bytesHex = parseDynamicBytes(hexData, byteOffset).slice(2); // strip '0x'
  const byteArray = hexToBytes(bytesHex);
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(new Uint8Array(byteArray));
}

// Parse a single dynamic bytes or string item located at `startBytes`.
// Format: first 32 bytes is length, then data padded to multiples of 32.
const parseDynamicBytes = (hexData, byteOffset) => {
  const lengthHex = readBytes(hexData, byteOffset, WORD_SIZE_IN_BYTES);
  const byteLength = BigInt(`0x${lengthHex}`);
  const dataStart = byteOffset + WORD_SIZE_IN_BYTES;
  const dataHex = readBytes(hexData, dataStart, Number(byteLength));
  return '0x' + dataHex;
}

const parseDynamicArrayOfDynamic = (dataHex, offsetBytes, elementParser) => {
  // this is an array of pointers (ie offsets) to where each dynamically sized element is
  const offsets = parseDynamicArray(
    dataHex,
    offsetBytes,
    parseOffset
  );

  const elements = offsets.map(offset => {
    const elemStart = offsetBytes + WORD_SIZE_IN_BYTES + Number(offset);
    const elemLength = Number(parseUint256(dataHex, elemStart));
    
    if (elemLength === 0) return undefined
  
    const elementDataHex = readBytes(dataHex, elemStart, elemLength + WORD_SIZE_IN_BYTES);
    const parsedBytes = elementParser(elementDataHex, 0)
    return parsedBytes
  })

  return elements;
}

// Helper to parse a dynamic array of simple (static-size) elements, e.g. address[] or uint256[]
// elementParser is a function that reads one element from the hexString given a word index
const parseDynamicArray = (hexString, offsetBytes, elementParser) => {
  // The first 32 bytes at offsetBytes is the length of the array (uint256).
  const lengthHex = readBytes(hexString, offsetBytes, WORD_SIZE_IN_BYTES);
  const arrayLength = BigInt(`0x${lengthHex}`);

  const array = [];
  // Each element takes one 32-byte word in the ABI encoding (for addresses or uint256).
  for (let i = 0; i < Number(arrayLength); i++) {
    const elementOffsetBytes =
      offsetBytes + WORD_SIZE_IN_BYTES + (i * WORD_SIZE_IN_BYTES);
    array.push(elementParser(hexString, elementOffsetBytes));
  }
  return array;
}

const parseProposalCreatedData = (dataHex) => {
  if (dataHex.startsWith('0x')) {
    dataHex = dataHex.slice(2);
  }

  // if its a dynamic length data type, this will be the offset to the start of the data
  // else the word will be the encoded data expected
  // Note: offsets are in bytes relative to the start of dataHex (after 0x).
  // The start of the *dynamic* area is also the start of dataHex (because the entire event data is contiguous).
  // So if an offset is "X", that means the dynamic data begins at `X` bytes from the 0th byte of dataHex.
  // n.b. The offset of nested dynamic length types are *not* absolute reference to start of dataHex

  const proposalId = parseUint256(dataHex, 0);
  const proposer = parseAddress(dataHex, WORD_SIZE_IN_BYTES);
  const targetsOffset = parseOffset(dataHex, WORD_SIZE_IN_BYTES * 2);
  const valuesOffset = parseOffset(dataHex, WORD_SIZE_IN_BYTES * 3);
  const signaturesOffset = parseOffset(dataHex, WORD_SIZE_IN_BYTES * 4);
  const calldatasOffset = parseOffset(dataHex, WORD_SIZE_IN_BYTES * 5);
  const startBlock = parseUint256(dataHex, WORD_SIZE_IN_BYTES * 6);
  const endBlock = parseUint256(dataHex, WORD_SIZE_IN_BYTES * 7);
  const descriptionOffset = parseOffset(dataHex, WORD_SIZE_IN_BYTES * 8);

  // Parse targets (address[])
  const targets = parseDynamicArray(
    dataHex,
    Number(targetsOffset),
    parseAddress
  );

  // Parse values (uint256[])
  const values = parseDynamicArray(
    dataHex,
    Number(valuesOffset),
    parseUint256
  );

  // Parse signatures (string[])
  const signatures = parseDynamicArrayOfDynamic(
    dataHex,
    Number(signaturesOffset),
    parseUTF8String
  ).map(defaultValueString);

  // Parse calldatas (bytes[])
  const calldatas = parseDynamicArrayOfDynamic(
    dataHex,
    Number(calldatasOffset),
    parseDynamicBytes
  ).map(defaultValueBytes);

  // Parse description (string)
  const description = parseUTF8String(dataHex, Number(descriptionOffset));

  return {
    proposalId,
    proposer,
    targets,
    values,
    signatures,
    calldatas,
    startBlock,
    endBlock,
    description
  };
}

const validateFuncSig = (funcSig) => {
  if (funcSig.length !== 10) throw new Error("func sig wrong length")
}

const validateBytes32 = (bytes32) => {
  if (bytes32.length !== 66) throw new Error("bytes 32 wrong length")
  if (bytes32.substring(0, 2) !== "0x") throw new Error("bytes32 missing 0x at start")
}

const validateAddress = (addr) => {
  if (addr.length !== 42) throw new Error("address wrong length")
  if (addr.substring(0, 2) !== "0x") throw new Error("address missing 0x at start")
}

/**
 * @param {String} funcSig 
 * @param {String} bytes32 
 * @returns {String}
 */
const encodeFuncSigAndBytes32 = (funcSig, bytes32) => {
  validateFuncSig(funcSig)
  validateBytes32(bytes32)

  return funcSig + bytes32.substring(2)
}

/**
 * @param {String} funcSig 
 * @param {String} bytes32 
 * @param {String} address 
 * @returns {String}
 */
const encodeFuncSigAndBytes32AndAddress = (funcSig, bytes32, address) => {
  validateFuncSig(funcSig)
  validateBytes32(bytes32)
  validateAddress(address)

  return funcSig + bytes32.substring(2) + address.substring(2).padStart(64, "0")
}

/**
 * @param {String} funcSig 
 * @param {String} bytes32 
 * @param {String} address 
 * @returns {String}
 */
const encodeFuncSigAndAddressAndBytes32 = (funcSig, address, bytes32) => {
  validateFuncSig(funcSig)
  validateAddress(address)
  validateBytes32(bytes32)

  return funcSig + address.substring(2).padStart(64, "0") + bytes32.substring(2)
}


export {
  encodeFuncSigAndBytes32,
  encodeFuncSigAndBytes32AndAddress,
  encodeFuncSigAndAddressAndBytes32,
  parseProposalCreatedData,
  parseDynamicArray,
  parseDynamicArrayOfDynamic,
  parseDynamicBytes,
  parseOffset,
  parseUTF8String,
}
