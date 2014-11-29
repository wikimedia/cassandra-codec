"use strict";
var bignum = require('bignum');

var codec = {};

function makeMasks(n) {
    var masks = [null];
    var hex = 'ff';
    for (var i = 1; i <= n; i++) {
        masks.push(bignum(hex, 16));
        hex += 'ff';
    }
    return masks;
}
var masks = makeMasks(9);

/**
 * Encode a JS Number to a varint using the
 * java.math.BigInteger(n).toByteArray() format.
 *
 * @param {number} n, the Number to encode
 * @return {Buffer}
 */
codec.encodeVarInt = function(n) {
    /*jshint bitwise: false*/
    var res;
    var bn, bnBits;
    var bytes = [];
    if (n >= -2147483648 && n < 2147483648) {
        // Fast path for 32-bit ints
        var b;
        do {
            b = n & 0xff;
            bytes.push(b);
            n >>= 8;
        } while ((n !== 0 && n !== -1) || (b & 0x80) !== (n & 0x80));
        if (n < 0) {
            // Set sign bit
            bytes[bytes.length - 1] = b | 0x80;
        }

        return new Buffer(bytes.reverse());
    } else if (n < 0) {
        // bignum can only do bitwise arithmetic on unsigned ints
        bn = bignum(-1 * (n + 1));
        var mask = masks[Math.floor(bn.bitLength() / 8 + 1)];
        // Invert the bits
        res = bn.xor(mask).toBuffer();
        // Set sign bit
        res[0] = 0x80 | res[0];
        return res;
    } else {
        bnBits = bignum(n).toBuffer();
        if (bnBits[0] === 0x80) {
            // prepend a null byte
            res = new Buffer(bnBits.length + 1);
            res[0] = 0;
            bnBits.copy(res, 1, 0);
            return res;
        } else {
            return bnBits;
        }
    }
};

function makeSubs(n) {
    var subs = [null];
    for (var i = 1; i <= n; i++) {
        subs.push(bignum(1).shiftLeft(i*8));
    }
    return subs;
}
var subs = makeSubs(9);

/**
 * Decode a buffer holding a varint using the
 * java.math.BigInteger(n).toByteArray() format to a JavaScript Number.
 *
 * @param {Buffer} bytes
 * @return {Number}
 */
codec.decodeVarInt =  function (bytes) {
    /*jshint bitwise: false*/

    var isNeg = false;
    if (bytes[0] & 0x80) {
        isNeg = true;
    }

    var n, i;
    if (bytes.length <= 4) {
        // Fast path for small ints
        n = 0;
        for (i = 0; i < bytes.length; i++) {
            n <<= 8;
            n |= bytes[i];
        }

        if (isNeg) {
            // Switch n to unsigned interpretation
            n >>>= 0;
            if (bytes.length === 4) {
                return bignum(n)
                    .sub(subs[bytes.length]).toNumber();
            } else {
                // Each part needs to fit into 32 bits
                return n - (1 << bytes.length * 8);
            }
        } else {
            return n;
        }
    }

    n = bignum(bytes.toString('hex'), 16);
    if (isNeg) {
        return n.sub(subs[bytes.length]).toNumber();
    } else {
        return n.toNumber();
    }
};

module.exports = codec;
