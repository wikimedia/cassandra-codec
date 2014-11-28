"use strict";
var bignum = require('bignum');

var encoder = function(){};

encoder.prototype.encodeVarInt = function(n) {
    /*jshint bitwise: false*/
    var res;
    var bn, bnBits;
    if (n >= 2147483648 && n < 2147483648) {
        // Fast path for 32-bit ints
        var bytes = [];
        var b;
        do {
            b = n & 0xff;
            bytes.push(b);
            n = n >> 8;
        } while ((n !== 0 && n !== -1) || b === 0x80);

        if (n === -1) {
            bytes.push(0x80);
        }
        return new Buffer(bytes.reverse());
    } else if (n < 0) {
        bn = bignum(-1 * (n + 1));
        var mask = new Buffer(Math.floor(bn.bitLength() / 8) + 1);
        mask.fill(0xff);
        // Invert the bits
        bnBits = bn.xor(bignum.fromBuffer(mask)).toBuffer();
        res = new Buffer(bnBits.length + 1);
        res[0] = 0x80;
        bnBits.copy(res, 1, 0);
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

encoder.prototype.decodeVarInt =  function (bytes) {
    /*jshint bitwise: false*/
    //console.log(bytes.length, bytes.toString('hex'));

    var isNeg = false;
    if (bytes[0] === 0x80) {
        isNeg = true;
        bytes = bytes.slice(1);
    }

    var n;
    if (bytes.length <= 3 || !isNeg && bytes.length <= 4) {
        // Fast path for small ints
        n = 0;
        for (var i = 0; i < bytes.length; i++) {
            n = n << 8;
            n = n | bytes[i];
        }

        if (isNeg) {
            // This needs to fit into 32 bits, hence the <= 3 limit above
            return n - (1 << bytes.length * 8);
        } else {
            return n;
        }
    }

    n = bignum.fromBuffer(bytes, { endian: 'big', size: 'auto' });
    if (isNeg) {
        var mask = new Buffer(bytes.length);
        mask.fill(0xff);
        return -1 * n.xor(bignum.fromBuffer(mask, { endian: 'big', size: 'auto' }))
                .toNumber() - 1;
    } else {
        return n.toNumber();
    }
};

module.exports = encoder;
