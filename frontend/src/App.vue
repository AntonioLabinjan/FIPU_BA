<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const SEPOLIA_CHAIN_ID = '0xaa36a7'
const SEPOLIA_CHAIN_NUMBER = 11155111

const account = ref('')
const chainId = ref('')
const recipient = ref('')
const amount = ref('')
const transactionHash = ref('')
const walletError = ref('')
const isSending = ref(false)

const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined
const isConnected = computed(() => Boolean(account.value))
const isOnSepolia = computed(() => chainId.value.toLowerCase() === SEPOLIA_CHAIN_ID)
const networkName = computed(() => {
  if (!chainId.value) return 'Not connected'
  return isOnSepolia.value ? 'Sepolia' : `Unsupported network (${chainId.value})`
})

function displayError(error) {
  if (error?.code === 4001) return 'The wallet request was rejected.'
  return error?.message || 'Something went wrong. Please try again.'
}

function handleAccountsChanged(accounts) {
  account.value = accounts[0] || ''
  transactionHash.value = ''
}

function handleChainChanged(nextChainId) {
  chainId.value = nextChainId
}

async function refreshWallet() {
  if (!ethereum) return

  const [accounts, currentChainId] = await Promise.all([
    ethereum.request({ method: 'eth_accounts' }),
    ethereum.request({ method: 'eth_chainId' }),
  ])
  handleAccountsChanged(accounts)
  handleChainChanged(currentChainId)
}

onMounted(async () => {
  if (!ethereum) return

  ethereum.on?.('accountsChanged', handleAccountsChanged)
  ethereum.on?.('chainChanged', handleChainChanged)

  try {
    await refreshWallet()
  } catch (error) {
    walletError.value = displayError(error)
  }
})

onUnmounted(() => {
  ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
  ethereum?.removeListener?.('chainChanged', handleChainChanged)
})

async function connectWallet() {
  walletError.value = ''
  transactionHash.value = ''

  if (!ethereum) {
    walletError.value = 'MetaMask was not detected. Install the MetaMask browser extension and try again.'
    return
  }

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    handleAccountsChanged(accounts)
    chainId.value = await ethereum.request({ method: 'eth_chainId' })
  } catch (error) {
    walletError.value = displayError(error)
  }
}

async function switchToSepolia() {
  walletError.value = ''

  if (!ethereum) {
    walletError.value = 'MetaMask was not detected. Install the MetaMask browser extension and try again.'
    return
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    })
  } catch (error) {
    if (error?.code !== 4902) {
      walletError.value = displayError(error)
      return
    }

    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEPOLIA_CHAIN_ID,
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      })
    } catch (addError) {
      walletError.value = displayError(addError)
    }
  }
}

function parseAmountToWei(value) {
  const normalizedAmount = value.trim()
  if (!/^\d+(?:\.\d{0,18})?$/.test(normalizedAmount)) {
    throw new Error('Enter a valid ETH amount with up to 18 decimal places.')
  }

  const [whole, fraction = ''] = normalizedAmount.split('.')
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
  if (wei <= 0n) throw new Error('The amount must be greater than zero.')
  return `0x${wei.toString(16)}`
}

async function sendTransaction() {
  walletError.value = ''
  transactionHash.value = ''

  if (!ethereum || !account.value) {
    walletError.value = 'Connect your wallet before sending ETH.'
    return
  }
  if (!isOnSepolia.value) {
    walletError.value = 'Switch to Sepolia before sending ETH.'
    return
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.value.trim())) {
    walletError.value = 'Enter a valid recipient wallet address.'
    return
  }

  let value
  try {
    value = parseAmountToWei(amount.value)
  } catch (error) {
    walletError.value = displayError(error)
    return
  }

  isSending.value = true
  try {
    transactionHash.value = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: account.value,
        to: recipient.value.trim(),
        value,
      }],
    })
  } catch (error) {
    walletError.value = displayError(error)
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="wallet-card" aria-labelledby="page-title">
      <div class="brand-mark" aria-hidden="true">B</div>
      <p class="eyebrow">BOXCHAIN WALLET</p>
      <h1 id="page-title">Your wallet, connected.</h1>
      <p class="intro">Connect MetaMask to send Sepolia ETH to another wallet.</p>

      <div class="connection-panel">
        <div class="connection-details">
          <span class="status-dot" :class="{ connected: isConnected }" aria-hidden="true"></span>
          <div>
            <p class="detail-label">Wallet</p>
            <p class="detail-value">{{ isConnected ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected' }}</p>
          </div>
        </div>
        <div class="network-detail">
          <p class="detail-label">Network</p>
          <p class="detail-value">{{ networkName }}</p>
        </div>
      </div>

      <button
        v-if="!isConnected"
        class="button button-primary connect-button"
        type="button"
        @click="connectWallet"
      >
        Connect MetaMask
      </button>
      <button
        v-else-if="!isOnSepolia"
        class="button button-primary connect-button"
        type="button"
        @click="switchToSepolia"
      >
        Switch to Sepolia
      </button>

      <form v-if="isConnected" class="send-form" @submit.prevent="sendTransaction">
        <div class="section-heading">
          <h2>Send ETH</h2>
          <span class="network-tag">SEPOLIA</span>
        </div>

        <label for="recipient">Recipient address</label>
        <input
          id="recipient"
          v-model="recipient"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="0x..."
          required
        />

        <label for="amount">Amount</label>
        <div class="amount-input">
          <input
            id="amount"
            v-model="amount"
            inputmode="decimal"
            placeholder="0.00"
            required
          />
          <span>ETH</span>
        </div>

        <button
          class="button button-primary send-button"
          type="submit"
          :disabled="!isOnSepolia || isSending"
        >
          {{ isSending ? 'Confirm in MetaMask...' : 'Review and send' }}
        </button>
      </form>

      <p v-if="walletError" class="feedback feedback-error" role="alert">{{ walletError }}</p>
      <div v-if="transactionHash" class="feedback feedback-success" role="status">
        <p>Transaction submitted successfully.</p>
        <a
          :href="`https://sepolia.etherscan.io/tx/${transactionHash}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          View transaction
        </a>
      </div>

      <p class="security-note">Transactions are signed in MetaMask. Never share your recovery phrase or private keys.</p>
    </section>
  </main>
</template>
