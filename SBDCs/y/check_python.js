import { spawnSync } from 'child_process';
const res = spawnSync('python3', ['--version'], { encoding: 'utf8' });
console.log(res.stdout || res.stderr);
