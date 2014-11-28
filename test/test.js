var assert = require('assert');
var jnencoder = require('../index');
jnencoder = new jnencoder();

var t = Math.pow(2,24); // t = 2^24 i=-2*24
for (var i = -t; i < t; i++) {
    // display some progress
    if (i % 100000 === 0) {
        console.log(i);
    }
    assert.equal(i, jnencoder.decodeVarInt(jnencoder.encodeVarInt(i)));
}

var i = Math.pow(2,62);
assert.equal(i, jnencoder.decodeVarInt(jnencoder.encodeVarInt(i)));
