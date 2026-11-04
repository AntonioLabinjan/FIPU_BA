<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { BrowserProvider, Contract, ContractFactory, formatUnits, getAddress, isAddress } from 'ethers'
import moduleArtifact from './generated/BoxChainModulArtifact.js'

const SEPOLIA_CHAIN_ID = 11155111
const MODULE_ADDRESS_STORAGE_KEY = 'boxchain.moduleAddress'
const configuredModuleAddress = (import.meta.env.VITE_BOXCHAIN_MODULE_ADDRESS || '').trim()
const moduleAddress = ref(configuredModuleAddress)
const MODULE_ABI = [
  'function boxToken() view returns (address)',
  'function isRegistered(address boxer) view returns (bool)',
  'function isCareerActive(address boxer) view returns (bool)',
  'function registerBoxer()',
  'function reportMatch(uint256 matchId, address opponent, uint8 result)',
  'function recoverWallet(address newWallet)',
  'function getMatchStatus(uint256 matchId) view returns (bool exists, bool completed, address boxer1, address boxer2, uint8 result1, uint8 result2)',
]
const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
]
const RESULTS = [
  { label: 'Win', value: 0 },
  { label: 'Loss', value: 1 },
  { label: 'Draw', value: 2 },
]

const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined
const account = ref('')
const chainId = ref(0)
const registered = ref(false)
const careerActive = ref(false)
const balance = ref('0')
const tokenSymbol = ref('BOX')
const tokenName = ref('BoxToken')
const walletError = ref('')
const successMessage = ref('')
const transactionHash = ref('')
const matchId = ref('')
const opponent = ref('')
const result = ref(0)
const recoveryAddress = ref('')
const lookupMatchId = ref('')
const matchStatus = ref(null)
const isBusy = ref(false)
const isRefreshing = ref(false)
const deployedModuleAddress = ref('')

const isConnected = computed(() => Boolean(account.value))
const isOnSepolia = computed(() => chainId.value === SEPOLIA_CHAIN_ID)
const hasModuleAddress = computed(() => isAddress(moduleAddress.value))
const canReadContracts = computed(() => isConnected.value && isOnSepolia.value && hasModuleAddress.value)
const networkName = computed(() => {
  if (!chainId.value) return 'Not connected'
  return isOnSepolia.value ? 'Sepolia' : `Unsupported network (${chainId.value})`
})
const formattedBalance = computed(() => `${balance.value} ${tokenSymbol.value}`)

function displayError(error) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    return 'The wallet request was rejected.'
  }
  return error?.reason || error?.shortMessage || error?.message || 'Something went wrong. Please try again.'
}

function clearProfile() {
  registered.value = false
  careerActive.value = false
  balance.value = '0'
  matchStatus.value = null
}

function getReadProvider() {
  if (!ethereum) throw new Error('MetaMask was not detected. Install MetaMask and try again.')
  return new BrowserProvider(ethereum)
}

async function refreshProfile() {
  if (!canReadContracts.value) {
    clearProfile()
    return
  }

  isRefreshing.value = true
  try {
    const provider = getReadProvider()
    const module = new Contract(getAddress(moduleAddress.value), MODULE_ABI, provider)
    const tokenAddress = await module.boxToken()
    const token = new Contract(tokenAddress, TOKEN_ABI, provider)
    const [isBoxer, isActive, rawBalance, name, symbol, decimals] = await Promise.all([
      module.isRegistered(account.value),
      module.isCareerActive(account.value),
      token.balanceOf(account.value),
      token.name(),
      token.symbol(),
      token.decimals(),
    ])

    registered.value = isBoxer
    careerActive.value = isActive
    balance.value = formatUnits(rawBalance, decimals)
    tokenName.value = name
    tokenSymbol.value = symbol
  } catch (error) {
    clearProfile()
    walletError.value = `Unable to read BoxChain contracts: ${displayError(error)}`
  } finally {
    isRefreshing.value = false
  }
}

async function refreshWallet() {
  if (!ethereum) return

  try {
    const [accounts, currentChainId] = await Promise.all([
      ethereum.request({ method: 'eth_accounts' }),
      ethereum.request({ method: 'eth_chainId' }),
    ])
    account.value = accounts[0] || ''
    chainId.value = Number.parseInt(currentChainId, 16)
    await refreshProfile()
  } catch (error) {
    walletError.value = displayError(error)
  }
}

function handleAccountsChanged(accounts) {
  account.value = accounts[0] || ''
  transactionHash.value = ''
  successMessage.value = ''
  walletError.value = ''
  void refreshWallet()
}

function handleChainChanged() {
  transactionHash.value = ''
  successMessage.value = ''
  walletError.value = ''
  void refreshWallet()
}

onMounted(async () => {
  if (!configuredModuleAddress) {
    try {
      const savedAddress = window.localStorage.getItem(MODULE_ADDRESS_STORAGE_KEY) || ''
      if (savedAddress && isAddress(savedAddress)) {
        moduleAddress.value = getAddress(savedAddress)
        deployedModuleAddress.value = moduleAddress.value
      }
    } catch (error) {
      walletError.value = `Unable to load the saved module address: ${displayError(error)}`
    }
  }

  if (!ethereum) return
  ethereum.on?.('accountsChanged', handleAccountsChanged)
  ethereum.on?.('chainChanged', handleChainChanged)
  await refreshWallet()
})

onUnmounted(() => {
  ethereum?.removeListener?.('accountsChanged', handleAccountsChanged)
  ethereum?.removeListener?.('chainChanged', handleChainChanged)
})

async function connectWallet() {
  walletError.value = ''
  successMessage.value = ''

  if (!ethereum) {
    walletError.value = 'MetaMask was not detected. Install MetaMask and try again.'
    return
  }

  try {
    await ethereum.request({ method: 'eth_requestAccounts' })
    await refreshWallet()
  } catch (error) {
    walletError.value = displayError(error)
  }
}

async function deployModule() {
  walletError.value = ''
  successMessage.value = ''
  transactionHash.value = ''

  if (!ethereum || !isConnected.value) {
    walletError.value = 'Connect MetaMask before deploying BoxChain.'
    return
  }
  if (!isOnSepolia.value) {
    walletError.value = 'Switch to Sepolia before deploying BoxChain.'
    return
  }
  if (hasModuleAddress.value) {
    walletError.value = 'A BoxChain module address is already configured.'
    return
  }

  isBusy.value = true
  try {
    const provider = getReadProvider()
    const signer = await provider.getSigner()
    const factory = new ContractFactory(moduleArtifact.abi, moduleArtifact.bytecode, signer)
    const deployedModule = await factory.deploy()
    const deploymentTransaction = deployedModule.deploymentTransaction()
    if (!deploymentTransaction) throw new Error('The deployment transaction was not created.')

    transactionHash.value = deploymentTransaction.hash
    const receipt = await deploymentTransaction.wait()
    if (!receipt || receipt.status !== 1) {
      throw new Error('The deployment transaction was not confirmed successfully.')
    }

    const address = getAddress(await deployedModule.getAddress())
    moduleAddress.value = address
    deployedModuleAddress.value = address
    await refreshProfile()
    successMessage.value = 'BoxChain module and token deployed successfully.'
    try {
      window.localStorage.setItem(MODULE_ADDRESS_STORAGE_KEY, address)
    } catch (error) {
      walletError.value = `Deployment succeeded, but the address could not be saved in this browser: ${displayError(error)}`
    }
  } catch (error) {
    walletError.value = displayError(error)
  } finally {
    isBusy.value = false
  }
}

async function switchToSepolia() {
  walletError.value = ''
  if (!ethereum) {
    walletError.value = 'MetaMask was not detected. Install MetaMask and try again.'
    return
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
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
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      })
    } catch (addError) {
      walletError.value = displayError(addError)
    }
  }
}

async function submitTransaction(sendTransaction, onConfirmed) {
  walletError.value = ''
  successMessage.value = ''
  transactionHash.value = ''

  if (!canReadContracts.value) {
    walletError.value = 'Connect MetaMask on Sepolia and configure the BoxChain module address.'
    return false
  }

  isBusy.value = true
  try {
    const provider = getReadProvider()
    const signer = await provider.getSigner()
    const module = new Contract(getAddress(moduleAddress.value), MODULE_ABI, signer)
    const transaction = await sendTransaction(module)
    transactionHash.value = transaction.hash
    const receipt = await transaction.wait()
    if (!receipt || receipt.status !== 1) {
      throw new Error('The transaction was not confirmed successfully.')
    }

    await refreshProfile()
    successMessage.value = await onConfirmed()
    return true
  } catch (error) {
    walletError.value = displayError(error)
    return false
  } finally {
    isBusy.value = false
  }
}

async function registerBoxer() {
  await submitTransaction(
    (module) => module.registerBoxer(),
    () => 'Registration confirmed. Your career starts with 50 BOX.',
  )
}

async function reportMatch() {
  walletError.value = ''
  const normalizedOpponent = opponent.value.trim()
  if (!/^\d+$/.test(matchId.value.trim())) {
    walletError.value = 'Enter a match ID using digits only.'
    return
  }
  if (!isAddress(normalizedOpponent)) {
    walletError.value = 'Enter a valid opponent wallet address.'
    return
  }
  if (getAddress(normalizedOpponent) === getAddress(account.value)) {
    walletError.value = 'Choose a different wallet as your opponent.'
    return
  }

  const id = BigInt(matchId.value.trim())
  const selectedResult = Number(result.value)
  const submitted = await submitTransaction(
    (module) => module.reportMatch(id, getAddress(normalizedOpponent), selectedResult),
    async () => {
      const provider = getReadProvider()
      const module = new Contract(getAddress(moduleAddress.value), MODULE_ABI, provider)
      const status = await module.getMatchStatus(id)
      matchStatus.value = {
        id: id.toString(),
        exists: status.exists,
        completed: status.completed,
        boxer1: status.boxer1,
        boxer2: status.boxer2,
        result1: RESULTS[Number(status.result1)]?.label,
        result2: RESULTS[Number(status.result2)]?.label,
      }
      lookupMatchId.value = id.toString()
      return status.completed
        ? 'Match confirmed. BOX balances and career status have been updated.'
        : 'Your report is confirmed on-chain. The opponent must submit the matching result.'
    },
  )
  if (submitted) {
    opponent.value = ''
    matchId.value = ''
  }
}

async function recoverWallet() {
  const normalizedAddress = recoveryAddress.value.trim()
  if (!isAddress(normalizedAddress)) {
    walletError.value = 'Enter a valid destination wallet address.'
    return
  }
  if (getAddress(normalizedAddress) === getAddress(account.value)) {
    walletError.value = 'Choose a different wallet for recovery.'
    return
  }

  const submitted = await submitTransaction(
    (module) => module.recoverWallet(getAddress(normalizedAddress)),
    () => 'Wallet recovery confirmed. Connect the new wallet to continue.',
  )
  if (submitted) recoveryAddress.value = ''
}

async function lookupMatch() {
  walletError.value = ''
  successMessage.value = ''
  if (!/^\d+$/.test(lookupMatchId.value.trim())) {
    walletError.value = 'Enter a match ID using digits only.'
    return
  }
  if (!canReadContracts.value) {
    walletError.value = 'Connect MetaMask on Sepolia and configure the BoxChain module address.'
    return
  }

  try {
    const provider = getReadProvider()
    const module = new Contract(getAddress(moduleAddress.value), MODULE_ABI, provider)
    const id = BigInt(lookupMatchId.value.trim())
    const status = await module.getMatchStatus(id)
    matchStatus.value = {
      id: id.toString(),
      exists: status.exists,
      completed: status.completed,
      boxer1: status.boxer1,
      boxer2: status.boxer2,
      result1: RESULTS[Number(status.result1)]?.label,
      result2: RESULTS[Number(status.result2)]?.label,
    }
  } catch (error) {
    walletError.value = displayError(error)
  }
}
</script>

<template>
  <main class="page-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="BoxChain home">
        <span class="brand-mark" aria-hidden="true">B</span>
        <span>BoxChain</span>
      </a>
      <span class="network-pill" :class="{ 'network-pill-active': isOnSepolia }">
        <span class="network-dot" aria-hidden="true"></span>
        {{ networkName }}
      </span>
      <button
        v-if="!isConnected"
        class="button button-dark connect-button"
        type="button"
        @click="connectWallet"
      >
        Connect wallet
      </button>
      <button
        v-else-if="!isOnSepolia"
        class="button button-dark connect-button"
        type="button"
        @click="switchToSepolia"
      >
        Switch to Sepolia
      </button>
      <a
        v-else
        class="account-chip"
        :href="`https://sepolia.etherscan.io/address/${account}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ account.slice(0, 6) }}...{{ account.slice(-4) }}
        <span aria-hidden="true">↗</span>
      </a>
    </header>

    <section class="hero">
      <div>
        <p class="eyebrow">YOUR CAREER, ON-CHAIN</p>
        <h1>Every match<br />counts.</h1>
        <p class="hero-copy">
          Track your boxing career, report results together, and let every confirmed match update your BOX score.
        </p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <span class="hero-ring ring-one"></span>
        <span class="hero-ring ring-two"></span>
        <span class="hero-ring ring-three"></span>
        <span class="hero-glove">B</span>
        <span class="hero-star">✳</span>
      </div>
    </section>

    <section v-if="!hasModuleAddress" class="notice notice-warning" role="status">
      <strong>No module deployed yet</strong>
      <span>Connect MetaMask on Sepolia to deploy BoxChainModul. The connected wallet will pay Sepolia gas fees.</span>
    </section>

    <section v-if="!isConnected" class="welcome-card">
      <div class="welcome-icon" aria-hidden="true">↗</div>
      <div>
        <h2>{{ hasModuleAddress ? 'Connect to your career' : 'Connect to deploy BoxChain' }}</h2>
        <p>
          {{ hasModuleAddress
            ? 'Connect MetaMask on Sepolia to register, view your BOX score, or report a match.'
            : 'Connect MetaMask on Sepolia. You will review and approve the deployment transaction in your wallet.' }}
        </p>
      </div>
      <button class="button button-primary" type="button" @click="connectWallet">Connect MetaMask</button>
    </section>

    <template v-else>
      <section v-if="!isOnSepolia" class="notice notice-warning" role="status">
        <span>BoxChain is available on Sepolia. Switch networks to continue.</span>
        <button class="button button-small button-dark" type="button" @click="switchToSepolia">Switch network</button>
      </section>

      <section v-else-if="!hasModuleAddress" class="action-card deploy-card">
        <div class="action-icon" aria-hidden="true">01</div>
        <div class="action-copy">
          <p class="eyebrow">SEPOLIA DEPLOYMENT</p>
          <h2>Deploy BoxChain contracts</h2>
          <p>
            This deploys BoxChainModul and its BoxToken from your connected wallet. Review the network and gas estimate
            in MetaMask before approving.
          </p>
        </div>
        <button class="button button-primary" type="button" :disabled="isBusy" @click="deployModule">
          {{ isBusy ? 'Confirm in wallet…' : 'Deploy contracts' }}
        </button>
      </section>

      <section v-else class="dashboard">
        <div class="overview-grid">
          <article class="score-card">
            <div class="score-card-top">
              <span class="card-label">YOUR BOX SCORE</span>
              <span v-if="isRefreshing" class="subtle-label">Refreshing…</span>
              <button v-else class="text-button" type="button" @click="refreshProfile">Refresh</button>
            </div>
            <p class="score-value">{{ registered ? formattedBalance : '—' }}</p>
            <div class="score-card-bottom">
              <span>{{ registered ? tokenName : 'Register to start your career' }}</span>
              <span v-if="registered" class="career-status" :class="{ inactive: !careerActive }">
                <span class="status-dot" aria-hidden="true"></span>
                {{ careerActive ? 'Career active' : 'Career complete' }}
              </span>
            </div>
          </article>
          <article class="wallet-card">
            <span class="card-label">CONNECTED WALLET</span>
            <p class="wallet-address">{{ account }}</p>
            <a :href="`https://sepolia.etherscan.io/address/${account}`" target="_blank" rel="noopener noreferrer">
              View on Etherscan <span aria-hidden="true">↗</span>
            </a>
          </article>
        </div>

        <section v-if="!registered" class="action-card register-card">
          <div class="action-icon" aria-hidden="true">01</div>
          <div class="action-copy">
            <p class="eyebrow">START HERE</p>
            <h2>Register as a boxer</h2>
            <p>Registration creates your on-chain career and awards your initial 50 BOX score.</p>
          </div>
          <button class="button button-primary" type="button" :disabled="isBusy" @click="registerBoxer">
            {{ isBusy ? 'Confirm in wallet…' : 'Register boxer' }}
          </button>
        </section>

        <template v-else>
          <section v-if="careerActive" class="action-card match-card">
            <div class="action-copy">
              <p class="eyebrow">MATCH REPORT</p>
              <h2>Report a result</h2>
              <p>Both boxers must report matching outcomes before score changes are applied.</p>
            </div>
            <form class="match-form" @submit.prevent="reportMatch">
              <div class="form-field">
                <label for="match-id">Match ID</label>
                <input id="match-id" v-model="matchId" inputmode="numeric" placeholder="e.g. 1042" required />
              </div>
              <div class="form-field form-field-wide">
                <label for="opponent">Opponent wallet</label>
                <input
                  id="opponent"
                v-model="opponent"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="0x..."
                required
              />
            </div>
            <div class="form-field">
              <label for="result">Your result</label>
              <select id="result" v-model.number="result">
                <option v-for="matchResult in RESULTS" :key="matchResult.value" :value="matchResult.value">
                  {{ matchResult.label }}
                </option>
              </select>
            </div>
            <button class="button button-primary form-submit" type="submit" :disabled="isBusy">
              {{ isBusy ? 'Confirm in wallet…' : 'Submit match report' }}
            </button>
          </form>
          </section>
          <section v-else class="notice notice-muted">
            Your career has ended because your BOX score reached zero. You can still recover your wallet.
          </section>

          <div class="secondary-grid">
            <section class="action-card compact-card">
              <div class="action-copy">
                <p class="eyebrow">MATCH STATUS</p>
                <h2>Check a match</h2>
                <p>See whether both participants have submitted their reports.</p>
              </div>
              <form class="inline-form" @submit.prevent="lookupMatch">
                <label class="sr-only" for="lookup-id">Match ID to check</label>
                <input id="lookup-id" v-model="lookupMatchId" inputmode="numeric" placeholder="Match ID" required />
                <button class="button button-dark" type="submit">Check</button>
              </form>
              <div v-if="matchStatus" class="match-status" role="status">
                <template v-if="matchStatus.exists">
                  <strong>{{ matchStatus.completed ? 'Match confirmed' : 'Waiting for opponent' }}</strong>
                  <span>{{ matchStatus.boxer1.slice(0, 6) }}… reported {{ matchStatus.result1 }}</span>
                  <span v-if="matchStatus.completed">{{ matchStatus.boxer2.slice(0, 6) }}… reported {{ matchStatus.result2 }}</span>
                </template>
                <strong v-else>No report found for match {{ matchStatus.id }}.</strong>
              </div>
            </section>

            <section class="action-card compact-card recovery-card">
              <div class="action-copy">
                <p class="eyebrow">WALLET RECOVERY</p>
                <h2>Move your career</h2>
                <p>Authorize from this wallet to move your registration and BOX balance.</p>
              </div>
              <form class="inline-form" @submit.prevent="recoverWallet">
                <label class="sr-only" for="recovery-address">New wallet address</label>
                <input
                  id="recovery-address"
                  v-model="recoveryAddress"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  placeholder="New wallet address"
                  required
                />
                <button class="button button-dark" type="submit" :disabled="isBusy">
                  {{ isBusy ? 'Confirm…' : 'Recover' }}
                </button>
              </form>
            </section>
          </div>
        </template>
      </section>
    </template>

    <p v-if="walletError" class="feedback feedback-error" role="alert">{{ walletError }}</p>
    <div v-if="successMessage" class="feedback feedback-success" role="status">
      <p>{{ successMessage }}</p>
      <p v-if="deployedModuleAddress" class="deployed-address">
        Module address:
        <a
          :href="`https://sepolia.etherscan.io/address/${deployedModuleAddress}`"
          target="_blank"
          rel="noopener noreferrer"
        >{{ deployedModuleAddress }} <span aria-hidden="true">↗</span></a>
      </p>
      <p v-if="deployedModuleAddress" class="deployment-instructions">
        It is saved in this browser. To use it in another browser, add
        <code>VITE_BOXCHAIN_MODULE_ADDRESS={{ deployedModuleAddress }}</code>
        to <code>frontend/.env.local</code> and restart Vite.
      </p>
      <a
        v-if="transactionHash"
        :href="`https://sepolia.etherscan.io/tx/${transactionHash}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        View transaction <span aria-hidden="true">↗</span>
      </a>
    </div>
    <div v-else-if="transactionHash" class="feedback feedback-success" role="status">
      <p>Transaction confirmed.</p>
      <a :href="`https://sepolia.etherscan.io/tx/${transactionHash}`" target="_blank" rel="noopener noreferrer">
        View transaction <span aria-hidden="true">↗</span>
      </a>
    </div>

    <footer class="page-footer">
      <span>BOXCHAIN · SEPOLIA</span>
      <span>Transactions are signed in your wallet. Never share your recovery phrase or private keys.</span>
    </footer>
  </main>
</template>
