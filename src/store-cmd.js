import { NETWORK, PMLL_ANCHOR } from './constants.js';
import { as0x } from './hash.js';

/**
 * Print-only HITL invoke. This module never signs and never sends.
 * A human reviews the 32-byte id + commitment, then pastes the command.
 */
export function storeCommand({
  id,
  commitment,
  contractId = PMLL_ANCHOR.contractId,
  source = 'admin',
  network = 'pubnet',
  rpc = NETWORK.rpc,
  passphrase = NETWORK.passphrase,
} = {}) {
  if (contractId !== PMLL_ANCHOR.contractId) {
    throw new Error(`unknown contract id ${contractId}. Use ${PMLL_ANCHOR.contractId}.`);
  }
  const idHex = as0x(id);
  const commitHex = as0x(commitment);
  const cmd = [
    'stellar contract invoke \\',
    `  --id ${contractId} \\`,
    `  --source-account ${source} \\`,
    `  --rpc-url ${rpc} \\`,
    `  --network-passphrase "${passphrase}" \\`,
    `  --network ${network} \\`,
    '  --send yes \\',
    '  -- \\',
    '  store \\',
    `  --id ${idHex} \\`,
    `  --commitment ${commitHex}`,
  ].join('\n');
  return {
    method: 'store',
    contractId,
    id: idHex,
    commitment: commitHex,
    sends: false,
    humanMustSign: true,
    command: cmd,
  };
}

export function getCommand(id, { contractId = PMLL_ANCHOR.contractId, network = 'pubnet' } = {}) {
  const idHex = as0x(id);
  return {
    method: 'get',
    contractId,
    id: idHex,
    command: [
      'stellar contract invoke \\',
      `  --id ${contractId} \\`,
      `  --network ${network} \\`,
      '  --send no \\',
      '  -- \\',
      '  get \\',
      `  --id ${idHex}`,
    ].join('\n'),
  };
}
