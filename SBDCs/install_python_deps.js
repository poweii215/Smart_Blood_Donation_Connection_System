import { spawnSync } from 'child_process';
const res = spawnSync('pip3', ['install', 'fastapi', 'uvicorn', 'python-jose[cryptography]', 'passlib[bcrypt]', 'pydantic'], { encoding: 'utf8' });
console.log(res.stdout || res.stderr);
