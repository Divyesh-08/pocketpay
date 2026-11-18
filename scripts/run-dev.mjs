import { spawn } from 'node:child_process';

const mobile = process.argv.includes('--mobile');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const jobs = [
  ['API', ['run', 'dev', '--prefix', 'server']],
  ['Web', ['run', mobile ? 'dev:mobile' : 'dev', '--prefix', 'client']]
];
const children = jobs.map(([name, args]) => {
  console.log(`Starting ${name}...`);
  const child = spawn(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} stopped with code ${code}`);
      for (const other of children) if (other !== child) other.kill();
      process.exitCode = code;
    }
  });
  return child;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
  });
}
