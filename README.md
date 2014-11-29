# Cassandra / Java number encoding and decoding

## Usage:

```bash
npm install cassandra-codec
```

### `#encodeVarInt(i: int): Buffer`

Encodes a JavaScript `Number` into a `Buffer`, using the same format as
`java.math.BigInteger`'s `toByteArray()` method.

### `#decodeVarInt(i: int): Buffer`

Decodes a `Buffer` holding a Varint in `java.math.BigInteger`'s
`toByteArray()` format into a JavaScript `Number`.

## License
MIT.
