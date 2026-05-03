export const bondingCurveMarketAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'minTokensOut', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'buy',
    outputs: [{ internalType: 'uint256', name: 'tokensOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'quoteIn', type: 'uint256' }],
    name: 'quoteBuy',
    outputs: [
      { internalType: 'uint256', name: 'tokensOut', type: 'uint256' },
      { internalType: 'uint256', name: 'fee', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenAmount', type: 'uint256' }],
    name: 'quoteSell',
    outputs: [
      { internalType: 'uint256', name: 'quoteOut', type: 'uint256' },
      { internalType: 'uint256', name: 'fee', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;
