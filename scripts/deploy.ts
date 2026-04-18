import { spawnSync } from 'node:child_process'

const ENVIRONMENTS = ['staging', 'production'] as const
type Environment = (typeof ENVIRONMENTS)[number]

const env = process.argv[2] as Environment
if (!(ENVIRONMENTS as readonly string[]).includes(env)) {
  console.error(`Usage: pnpm deploy <${ENVIRONMENTS.join('|')}>`)
  process.exit(1)
}

function run(args: string[]): void {
  console.log(`\n$ pnpm ${args.join(' ')}`)
  const result = spawnSync('pnpm', args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(['--dir', 'infrastructure', `tf:${env}:init`])
run(['--dir', 'infrastructure', `tf:${env}:plan`])
run(['--dir', 'infrastructure', `tf:${env}:apply`])
run(['site:build'])
run([`site:deploy:${env}`])
