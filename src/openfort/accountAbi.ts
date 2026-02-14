export const openfortAccountAbi = [
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'payable',
    inputs: [
      { name: '_target', type: 'address' },
      { name: '_value', type: 'uint256' },
      { name: '_calldata', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeBatch',
    stateMutability: 'payable',
    inputs: [
      { name: '_target', type: 'address[]' },
      { name: '_value', type: 'uint256[]' },
      { name: '_calldata', type: 'bytes[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'initialize',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: '_key',
        type: 'tuple',
        components: [
          {
            name: 'pubKey',
            type: 'tuple',
            components: [
              { name: 'x', type: 'bytes32' },
              { name: 'y', type: 'bytes32' },
            ],
          },
          { name: 'eoaAddress', type: 'address' },
          { name: 'keyType', type: 'uint8' },
        ],
      },
      {
        name: '_spendTokenInfo',
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'limit', type: 'uint256' },
        ],
      },
      { name: '_allowedSelectors', type: 'bytes4[]' },
      { name: '_hash', type: 'bytes32' },
      { name: '_signature', type: 'bytes' },
      { name: '_validUntil', type: 'uint256' },
      { name: '_nonce', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'registerSessionKey',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: '_key',
        type: 'tuple',
        components: [
          {
            name: 'pubKey',
            type: 'tuple',
            components: [
              { name: 'x', type: 'bytes32' },
              { name: 'y', type: 'bytes32' },
            ],
          },
          { name: 'eoaAddress', type: 'address' },
          { name: 'keyType', type: 'uint8' },
        ],
      },
      { name: '_validUntil', type: 'uint48' },
      { name: '_validAfter', type: 'uint48' },
      { name: '_limit', type: 'uint48' },
      { name: '_whitelisting', type: 'bool' },
      { name: '_contractAddress', type: 'address' },
      {
        name: '_spendTokenInfo',
        type: 'tuple',
        components: [
          { name: 'token', type: 'address' },
          { name: 'limit', type: 'uint256' },
        ],
      },
      { name: '_allowedSelectors', type: 'bytes4[]' },
      { name: '_ethLimit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

