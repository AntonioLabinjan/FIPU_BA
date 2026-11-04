import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDirectory, '../..')
const artifactPath = resolve(
  projectRoot,
  'artifacts/contracts/BoxChainModul.sol/BoxChainModul.json',
)
const outputDirectory = resolve(scriptDirectory, '../src/generated')
const outputPath = resolve(outputDirectory, 'BoxChainModulArtifact.js')
const artifact = JSON.parse(await readFile(artifactPath, 'utf8'))

await mkdir(outputDirectory, { recursive: true })
await writeFile(
  outputPath,
  `export default ${JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode })}\n`,
)
console.log(`Generated frontend deployment artifact at ${outputPath}`)
